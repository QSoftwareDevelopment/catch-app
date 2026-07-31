-- Read-only introspection of the existing TextBot schema.
--
-- Run this in the Supabase SQL editor and send back all five result sets. Nothing here
-- writes, locks, or alters anything — it is safe to run against production.
--
-- Needed because migration 0001 assumed an empty project and this one is not: it already
-- has businesses, profiles, conversations, messages, orders, bookings, contacts and leads,
-- with a live Twilio number on the single business row.

-- 1. Columns of the tables Catch touches -------------------------------------
select table_name, column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name in ('businesses', 'profiles')
order by table_name, ordinal_position;

-- 2. Constraints — is profiles.user_id already unique? -----------------------
-- Decides whether one-user-one-business can be enforced on the existing table or
-- whether duplicates must be resolved first.
select
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  string_agg(kcu.column_name, ', ' order by kcu.ordinal_position) as columns
from information_schema.table_constraints tc
left join information_schema.key_column_usage kcu
  on kcu.constraint_name = tc.constraint_name
 and kcu.table_schema = tc.table_schema
where tc.table_schema = 'public'
  and tc.table_name in ('businesses', 'profiles')
group by tc.table_name, tc.constraint_name, tc.constraint_type
order by tc.table_name, tc.constraint_type;

-- 3. Existing RLS policies ---------------------------------------------------
-- New policies must not contradict these, or TextBot's own access breaks.
select tablename, policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('businesses', 'profiles')
order by tablename, policyname;

-- 4. Triggers on auth.users --------------------------------------------------
-- URGENT: if on_auth_user_created is listed, migration 0001 partially installed and
-- EVERY signup on this project currently fails, because the trigger inserts into
-- businesses (owner_id, name, sector) — columns that do not exist. It is an AFTER
-- INSERT trigger, so the failure rolls back the whole account creation.
--
-- If it appears below, run this immediately:
--   drop trigger if exists on_auth_user_created on auth.users;
select tgname, tgenabled, pg_get_triggerdef(oid) as definition
from pg_trigger
where tgrelid = 'auth.users'::regclass
  and not tgisinternal;

-- 5. The existing data -------------------------------------------------------
-- One business row exists. Its sector has to be set by hand during the migration,
-- since sector cannot be inferred from a name or a phone number.
select b.id, b.name, b.twilio_number, b.timezone, b.created_at
from public.businesses b;

select p.id, p.user_id, p.business_id, p.full_name, p.role
from public.profiles p;
