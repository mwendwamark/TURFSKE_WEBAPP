# TurfsKE — Project Guide (Next.js + Supabase build)

## What TurfsKE (this build) is

A two-sided web marketplace for football pitch bookings in Kenya, connecting **players** (who discover and book) with **managers** (who list and manage venues), with a platform commission taken automatically on every paid booking. Built solo by Mark Mwendwa Nthei ("Nthei"), a JKUAT BBIT student and founder of Banah Tech.

Core problems this solves:
1. **Double-booking** — two players should never be able to reserve the same pitch for overlapping times. Solved at the database level, not app logic (see §5).
2. **Discovery without word-of-mouth** — players currently have to know a venue's manager personally. This gives them a central place to search, filter, and book.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4 |
| Backend / DB | Supabase (Postgres 17), project ref `qvbkqgsvagfutwznrlzw`, region eu-west-1 |
| Auth | Supabase Auth (`auth.users` + `public.profiles`) |
| Payments | Paystack — M-Pesa STK push + Subaccounts for automatic commission split (not Safaricom Daraja directly) |
| Location/search | PostGIS extension (Supabase built-in) for nearest-venue queries |
| Scheduled jobs | Supabase Edge Functions / `pg_cron` (for booking-expiry, notification triggers) |
| Hosting | Vercel (`turfske.vercel.app`), auto-deploy on push |

> Note for coding agents: this project runs a recent Next.js version with API/convention changes since older training data — check `node_modules/next/dist/docs/` or the installed version's own docs before assuming App Router APIs, and heed any deprecation warnings.

## Vocabulary (use these terms consistently in code, tables, and UI copy)

- **Pitch** — one single playing area (a 5-a-side court, one football field). This was informally called a "task" early in planning — that term should not appear anywhere in code or schema.
- **Venue** — the physical location/compound that holds one or more pitches. Coordinates live on the venue, not the pitch, since pitches at the same venue share a location.

## User & role model

One identity table, not three separate systems — because Supabase Auth only provides one `auth.users`, and a shared `profiles` table with role-gated extension tables is what actually *enforces* strict role separation (a player cannot become a manager, neither can become admin), rather than weakening it.

**`public.profiles`** (currently exists — mirrors `auth.users`)
- `id` (uuid, FK → `auth.users.id`)
- `role` (text — **currently constrained to `'player'`/`'manager'` only; admin handling still an open decision, see §8**)
- `full_name`, `phone_number`, `created_at`
- RLS enabled

**`player_profiles`** (not yet created) — 1:1 with profiles where role = player
- `user_id` (FK), `latitude`, `longitude` (or PostGIS `geography(Point)`), `default_location_label`

**`manager_profiles`** (not yet created) — 1:1 with profiles where role = manager
- `user_id` (FK), `business_name`, `paystack_subaccount_code`, `payout_phone`, `verified`

Admin has no extension table — gated purely by `role = 'admin'` in RLS policies.

**Manager "types" are not stored.** A manager naturally owns 1+ venues, each with 1+ pitches — "single pitch/single location" vs "many pitches/many locations" is just `COUNT(venues)`/`COUNT(pitches)` for that manager, derived at query time, not a schema field. The add-venue and add-pitch flows are identical for every manager regardless of scale.

## Core schema (planned — not yet migrated except `profiles`)

| Table | Purpose |
|---|---|
| `profiles` | ✅ exists — base identity + role |
| `player_profiles` | Player-specific fields (location) |
| `manager_profiles` | Manager-specific fields (Paystack subaccount, payout info) |
| `venues` | Physical location a manager owns — name, address, lat/lng |
| `pitches` | Individual playing area within a venue — name, sport type, size, price/hour, status |
| `amenities` | Fixed list of amenity types (floodlights, parking, changing rooms, etc.) |
| `venue_amenities` | Junction table (many-to-many, venue-level unless a specific amenity proves pitch-level) |
| `bookings` | Reservation — player, pitch, time range, status, amount |
| `payments` | Payment record — Paystack reference, amount, platform fee, manager payout amount, status |

## Booking flow & double-booking prevention

Booking = **payment-backed**, not a word-of-mouth "please hold this for me" request — that's the only way to actually guarantee no double-booking.

The actual guarantee is a **Postgres `EXCLUDE` constraint** (via the `btree_gist` extension) on `bookings`, rejecting overlapping time ranges for the same pitch at the database level — this holds even under concurrent requests, unlike an application-level "check then insert."

Flow:
1. Player selects pitch + time → row inserted as `pending_payment` (this itself reserves the slot via the constraint)
2. Paystack M-Pesa STK push initiated
3. Webhook confirms payment → status → `confirmed`, manager notified
4. Unpaid holds expire after ~5–10 min via scheduled job → slot freed

**Approval is automatic**, triggered by payment success — the manager is notified, not asked to approve.

## Payments & platform commission

- Paystack **Subaccounts**, one per manager (`manager_profiles.paystack_subaccount_code`), created at manager onboarding.
- Each booking transaction is initialized with the manager's subaccount code + a percentage split (**exact percentage still to be finalized — 5% was the initial figure discussed, confirm before building the payment initiation code**).
- Paystack settles the split automatically — no manual fund movement on Nthei's part.
- Subaccounts must be Kenya-registered to match Paystack's own-country settlement requirement.
- Split ratio locks at transaction time — changing the commission rate later only affects new bookings.

## Location & search

PostGIS is a toggle in Supabase (Database → Extensions), not custom code. Venue coordinates should use `geography(Point, 4326)` once added, enabling indexed nearest-venue queries (`ORDER BY location <-> player_location`) instead of application-side Haversine math.

## Player dashboard (planned)

Lightweight, not complex: upcoming bookings, past bookings, receipts. Optionally later: saved/favorite venues.

## Current status (update this section as work progresses)

**Done:**
- Supabase project live (`qvbkqgsvagfutwznrlzw`)
- `profiles` table created, RLS enabled
- Signup/login/signout working for player and manager roles
- Forgot-password flow implemented, **not yet tested**

**Open decisions:**
- How admin access is handled — add `'admin'` to the `profiles.role` check constraint and manually set one row, vs. keeping admin entirely outside `profiles` via a hardcoded check. Not yet decided.
- Exact commission percentage for the Paystack split.
- Whether any amenities need to be pitch-level rather than venue-level.

**Not started:** `player_profiles`, `manager_profiles`, `venues`, `pitches`, `amenities`, `venue_amenities`, `bookings` (incl. the `EXCLUDE` constraint), `payments`, PostGIS enablement, Paystack integration, notifications, both dashboards, search/filtering UI.

## Guidance for coding agents (OpenCode, Claude Code, etc.)

- This is a **solo** project — no "do not touch" list carried over from the old Rails project applies here. Nothing in this repo is off-limits by team convention; treat `AGENTS.md`'s Next.js version warning as the only standing caution.
- Every new table needs an RLS policy before being considered done — players see only their own rows, managers see only their own venues/pitches/bookings, admin sees all.
- Don't introduce the word "task" for the pitch entity anywhere — see vocabulary section.
- Match the naming already established here (`venues`, `pitches`, not `turf_venues`/`turves` from the old Rails schema — that naming belongs to the unrelated group project).
- When in doubt about a schema or flow decision, check this file's "Open decisions" section before inventing an answer — flag it back to Nthei rather than assuming.