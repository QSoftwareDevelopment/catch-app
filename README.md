# Catch

Catch gives businesses a phone number their customers can text to book, buy, and get
quotes. It is sold by sector — HVAC, restaurants, real estate and others — and each
sector gets a different feature set and a different price.

This repository is the mobile app, built with Expo (React Native) so one codebase runs on
iOS and Android.

## Status

**Slice 1 of 5 — auth and business onboarding.** Landing, signup with sector capture,
login, password reset, and a session that survives app restarts. The screen behind the
auth wall is a placeholder.

Roadmap, in build order:

1. ✅ Auth and business onboarding
2. ⬜ Sector feature registry — what each sector actually gets
3. ⬜ Messaging — numbers, inbound and outbound SMS, conversation threads
4. ⬜ Catalog — products and services per business
5. ⬜ Billing — sector-based plans, Stripe, entitlement gating

Design spec: [`docs/superpowers/specs/2026-07-31-catch-auth-onboarding-design.md`](docs/superpowers/specs/2026-07-31-catch-auth-onboarding-design.md)

## Setup

### 1. Install

```bash
npm install
```

### 2. Create a Supabase project

At [supabase.com](https://supabase.com), then open **SQL Editor → New query**, paste all of
[`supabase/migrations/0001_businesses.sql`](supabase/migrations/0001_businesses.sql) and
run it. This creates the `businesses` table, its row-level security policies, and the
trigger that creates a business row on signup.

Skipping this step is the single most likely setup mistake. Signup will appear to work and
Home will show a red banner saying the business record is missing.

### 3. Configure environment

```bash
cp .env.example .env
```

Fill in the project URL and anon key from **Project Settings → Data API**. Both are safe
in a client bundle — the anon key is designed to be public, and row-level security is what
protects the data.

Metro inlines these at build time, so **restart the dev server after editing `.env`**.

### 4. Run

```bash
npm start           # then press i for iOS, a for Android
npm run ios
npm run android
```

## Email confirmation

Confirmation is on by default in Supabase, so a new account must click an emailed link
before it can log in. That is the intended production behaviour and the app has a screen
for it.

To turn it off while testing, go to **Authentication → Sign In / Providers → Email** and
disable "Confirm email". Signup then lands the user straight on Home. The signup trigger
works either way.

## Layout

```
app/                      Routes only — every file here is a screen
  _layout.tsx             Auth wall: routes on session state
  (auth)/                 Signed-out screens
  (app)/                  Signed-in screens
src/
  auth/                   AuthProvider, session state, error mapping
  lib/                    Supabase client, secure session storage, DB types
  sectors/                Sector list — the axis the product pivots on
  ui/                     Button, TextField, Screen, SectorPicker, FormBanner
  validation/             Pure form validation
  theme/                  Design tokens
supabase/migrations/      SQL — run these against your project
__tests__/                Screen tests (kept out of app/, which is routes only)
```

## Adding a sector

Sector drives feature gating and pricing, so the app and the database must agree. Both
must change together:

1. Add the id to `SECTOR_IDS` and an entry to `SECTORS` in `src/sectors/sectors.ts`.
2. Write a migration widening the `businesses_sector_check` constraint **and** the
   `handle_new_user` trigger's guard.

A test asserts the two lists match and fails until both are done.

## Checks

```bash
npm test           # 49 tests
npm run typecheck
```

Both run clean, and the app bundles for iOS and Android.
