-- Catch — slice 1: businesses and the signup trigger.
--
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query), or with the
-- Supabase CLI via `supabase db push`. It is idempotent enough to re-run safely.

-- ---------------------------------------------------------------------------
-- businesses
-- ---------------------------------------------------------------------------
-- One row per business. `owner_id` is unique, which is what enforces the current
-- one-user-one-business rule at the database level rather than by convention. Moving to
-- team seats later means dropping this constraint and adding a membership table — the
-- business rows themselves would not need to move.

create table if not exists public.businesses (
  id         uuid        primary key default gen_random_uuid(),
  owner_id   uuid        not null unique references auth.users (id) on delete cascade,
  name       text        not null check (char_length(trim(name)) between 1 and 120),
  sector     text        not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- The sector list mirrors SECTOR_IDS in src/sectors/sectors.ts. A test asserts the two
-- stay in sync; widening one without the other fails that test.
alter table public.businesses drop constraint if exists businesses_sector_check;
alter table public.businesses add constraint businesses_sector_check check (
  sector in (
    'hvac',
    'plumbing',
    'electrical',
    'restaurant',
    'real_estate',
    'auto_repair',
    'salon_spa',
    'fitness'
  )
);

create index if not exists businesses_owner_id_idx on public.businesses (owner_id);

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists businesses_touch_updated_at on public.businesses;
create trigger businesses_touch_updated_at
  before update on public.businesses
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------
-- An owner reads and updates only their own row. There is deliberately no insert policy
-- and no delete policy: rows are created solely by the signup trigger below, which runs
-- as security definer, so `owner_id` cannot be forged by a client. Account deletion
-- cascades from auth.users.

alter table public.businesses enable row level security;

drop policy if exists "Owners read their own business" on public.businesses;
create policy "Owners read their own business"
  on public.businesses
  for select
  to authenticated
  using (auth.uid() = owner_id);

drop policy if exists "Owners update their own business" on public.businesses;
create policy "Owners update their own business"
  on public.businesses
  for update
  to authenticated
  using (auth.uid() = owner_id)
  -- The WITH CHECK clause is what stops an owner reassigning their row to someone else.
  with check (auth.uid() = owner_id);

-- ---------------------------------------------------------------------------
-- Signup trigger
-- ---------------------------------------------------------------------------
-- With email confirmation enabled there is no session immediately after signUp, so the
-- client cannot insert the business row itself. The app passes business name and sector
-- as user metadata and this trigger creates the row server-side. The upshot is that an
-- account can never exist without its business, in either confirmation mode.
--
-- Metadata is user-supplied and therefore untrusted. An absent or invalid sector raises
-- rather than defaulting to something plausible: a business silently filed under the
-- wrong sector would be served the wrong features and billed the wrong amount, which is
-- far worse than a failed signup.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
-- Empty search_path: a security definer function must not resolve unqualified names
-- against a caller-controlled path.
set search_path = ''
as $$
declare
  v_name   text;
  v_sector text;
begin
  v_name   := trim(coalesce(new.raw_user_meta_data ->> 'business_name', ''));
  v_sector := coalesce(new.raw_user_meta_data ->> 'sector', '');

  if v_name = '' then
    raise exception 'business_name is required to create an account';
  end if;

  if v_sector not in (
    'hvac', 'plumbing', 'electrical', 'restaurant',
    'real_estate', 'auto_repair', 'salon_spa', 'fitness'
  ) then
    raise exception 'sector "%" is not a recognised sector', v_sector;
  end if;

  insert into public.businesses (owner_id, name, sector)
  values (new.id, v_name, v_sector)
  -- Supabase can re-fire this on repeat signups for an existing unconfirmed address.
  on conflict (owner_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
