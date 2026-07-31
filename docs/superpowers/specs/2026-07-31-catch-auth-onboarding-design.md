# Catch — Auth & Business Onboarding

**Date:** 2026-07-31
**Status:** Approved
**Slice:** 1 of 5 (see Roadmap Context)

## Problem

Catch is a B2B SaaS product that lets businesses sell products and services over text
message. Its users are business owners across sectors — HVAC, restaurants, realtors,
and others. The product delivers a different feature set and a different price to each
sector.

Nothing exists yet. This slice builds the entry point: a landing screen, signup, login,
and a session that survives app restarts, ending with an authenticated business owner
whose sector is recorded.

## Roadmap Context

The full product decomposes into five slices, built in order. Each gets its own spec.

1. **Auth and business onboarding** — this document
2. Sector feature registry — what each sector actually gets
3. Messaging layer — phone numbers, inbound and outbound SMS, conversation threads
4. Catalog — products and services per business
5. Billing — sector-based plans, Stripe, entitlement gating

Sector is the axis every later slice pivots on, which is why it is captured at signup
rather than deferred to a settings screen.

## Decisions

| Decision | Choice | Reasoning |
|---|---|---|
| Platform | Expo (React Native) + TypeScript | One codebase for iOS and Android; strongest Supabase path |
| Navigation | Expo Router | File-based routing, route groups model the auth wall directly |
| Backend | Supabase | Postgres, auth, and RLS in one; first-class React Native SDK |
| Session storage | `expo-secure-store` | Tokens belong in the Keychain and Keystore, not `AsyncStorage` |
| Sector capture | A step within signup | Account is fully formed on creation; no half-configured state |
| Account model | One user owns one business | Simplest model that fits the current sales motion |
| Sector list | Typed config in the repo | Compile-time safety for later feature gating |
| Landing page | First screen inside the app | Marketing website is a separate project, if ever |
| Email confirmation | On | Production default; blocks junk signups |

### Note on the account model

The business lives in its own `businesses` table with a unique `owner_id`, rather than
having its fields flattened onto a user profile. This preserves the one-to-one behavior
requested while keeping a future move to team seats a join-table change instead of a
data migration. The added complexity today is zero.

## Data Model

Supabase manages `auth.users`: credentials, email confirmation, and password reset. One
application table is added.

```
businesses
  id          uuid         primary key, default gen_random_uuid()
  owner_id    uuid         not null, unique, references auth.users(id) on delete cascade
  name        text         not null, length 1..120
  sector      text         not null, check constraint mirrors the TypeScript union
  created_at  timestamptz  not null, default now()
  updated_at  timestamptz  not null, default now()
```

**Row-level security.** RLS is enabled. An owner may select and update only the row where
`owner_id = auth.uid()`. No client-side insert or delete policy exists — rows are created
exclusively by the signup trigger below, and `owner_id` is therefore unforgeable.

**Sectors.** `src/sectors/sectors.ts` defines a typed union plus display metadata (label,
icon, short description). The Postgres check constraint mirrors that union. Launch list:

HVAC · Plumbing · Electrical · Restaurant · Real Estate · Auto Repair · Salon & Spa ·
Fitness

Adding a sector is one config edit plus a one-line migration.

**Deliberately absent.** No pricing, plan, or entitlement tables. Sector is the key those
will hang off in slice 5; modeling them before the feature sets are known would be
guesswork.

## Signup Flow

Signup collects credentials, business name, and sector on one scrollable screen.

The mechanism matters. With email confirmation enabled there is no authenticated session
immediately after `signUp`, so the client cannot insert the business row itself. Instead:

1. The client calls `signUp` with business name and sector passed as user metadata.
2. A `security definer` trigger on `auth.users` insert reads that metadata and creates
   the matching `businesses` row.

This behaves identically whether or not email confirmation is enabled, and guarantees an
account can never exist without its business record — there is no half-created state for
the rest of the app to defend against.

The trigger validates sector against the same check constraint. Metadata is user-supplied
and therefore untrusted; an invalid sector fails the insert rather than being silently
coerced to a default.

## Screens

| Route | Screen | Purpose |
|---|---|---|
| `(auth)/index` | Landing | Brand, value proposition, "Get started" and "Log in" |
| `(auth)/sign-up` | Sign up | Credentials, business name, sector picker |
| `(auth)/check-email` | Check email | Post-signup confirmation state, resend link |
| `(auth)/log-in` | Log in | Email and password, link to password reset |
| `(auth)/forgot-password` | Forgot password | Request a reset email |
| `(app)/index` | Home (placeholder) | Behind the auth wall; greets by business name, shows sector, signs out |

Home exists to prove the loop end to end. It is replaced in slice 2.

## Session and Routing

An `AuthProvider` at the root holds session state and the loaded business record. The root
layout branches on that state: a session routes into `(app)`, its absence routes into
`(auth)`. While the stored session is being restored the app shows a splash state rather
than flashing the landing screen.

Sessions persist to secure storage and restore on launch, so a returning user opens
directly to Home. Token refresh runs automatically, including when the app returns to the
foreground.

## Error Handling

Validation runs client-side first — email shape, password length, required fields — so
users are not punished with a network round-trip for a typo. Errors appear inline beneath
the offending field, not as alerts.

Server errors map to plain language. "That email is already registered" rather than a raw
Supabase error code. Unrecognized errors fall back to a generic message and are logged
rather than surfaced verbatim.

Every submit control has a pending state and is disabled while a request is in flight, so
a double tap cannot create two accounts. Network failure yields a retry affordance rather
than a dead screen.

## Testing

Jest with `@testing-library/react-native`.

- Validation logic is tested directly as pure functions.
- Sector config and the check constraint are tested to stay in sync.
- Form screens are tested against a mocked Supabase client, covering the paths that
  actually bite: successful signup, duplicate email, wrong password, unconfirmed email,
  and network failure.
- Routing is tested for the three session states: absent, restoring, and present.

Device end-to-end testing (Maestro) is out of scope for this slice.

## Out of Scope

SMS and messaging, product catalog, billing and Stripe, sector-based feature gating,
social login, team seats and invitations, marketing website, push notifications.

The schema and routing are structured so none of these require a rewrite.

## Success Criteria

- A new owner can sign up, choose a sector, confirm their email, and reach Home.
- Home displays the business name and sector fetched from Postgres.
- Force-quitting and reopening the app returns the user to Home without re-authenticating.
- Signing out returns to Landing and clears the stored session.
- A user cannot read or modify another business's row, verified against RLS.
- The app builds and runs on both an iOS simulator and an Android emulator.
