# CurateKin — Backend Foundation Plan

A planning document only. Nothing in this file has been built, run, or applied — every table, policy, and column below is a proposal for review, not a description of what exists today. Where this document describes *today's* real behavior, that's called out explicitly and is based on reading the actual application code, not assumption.

## Where things stand today (for context, not as a target)

Right now, almost everything lives on one table: `profiles`. It holds a creator's identity (`display_name`, `username`, `bio`, `avatar_url`, `city`), their application data (`primary_platform`, `primary_handle`, `primary_followers`, `niches`, `content_language`, `bio`, `instagram_handle`, `instagram_verified`), their review state (`status`: pending/approved/rejected), and — already, today, as real existing columns — `upi_id` and `pan_number`. Signup collects application data into Supabase Auth's `user_metadata`, and a confirmation page copies a known set of fields from that metadata into a `profiles` row once the email is confirmed. Admin review reads and writes directly against `profiles.status`, gated by a hardcoded list of admin emails checked in the page itself, not by a database-level rule. There is no `creator_applications`, `admin_notes`, `creator_payout_details`, `affiliate_links`, or `creator_analytics_daily` table today — this document is about building toward that, not describing it.

One confirmed fact worth stating plainly: `brands_worked_with` is **not** a real column on `profiles` today. It's collected in the signup form and rides in `user_metadata`, but nothing writes it into the database. This document does not assume it exists anywhere.

---

## 1. `creator_applications`

**Purpose:** the record of a single application — what someone submitted, and what happened to it during review. Separating this from `profiles` means `profiles` can stay a clean "who is this creator" table, while this table holds the messier, review-specific detail and its full history.

**Columns:**
| Column | Type | Notes |
|---|---|---|
| `id` | uuid, primary key | |
| `user_id` | uuid, references `auth.users(id)` | Who applied. Not `profiles(id)` — an application can exist before a profile row does, since today's flow already creates the profile at the same moment the application is "submitted" via email confirmation. |
| `display_name` | text | Copied from signup metadata. |
| `phone` | text | Copied from signup metadata. |
| `primary_platform` | text | |
| `primary_handle` | text | |
| `primary_followers` | text | Matches the existing follower-range format used today (a labeled bucket like "10,000–50,000", not a raw number). |
| `secondary_platform` | text, nullable | |
| `secondary_handle` | text, nullable | |
| `secondary_followers` | text, nullable | |
| `engagement_rate` | text, nullable | |
| `niches` | text[] | |
| `content_language` | text | |
| `content_style` | text | What's currently called `bio` in `profiles` — renamed here for clarity, since on an applications table "bio" is ambiguous with a public-facing bio. |
| `instagram_handle` | text, nullable | |
| `instagram_verified` | boolean, default false | Reflects manual review, not OAuth — the current signup flow deliberately doesn't gate on automated Instagram verification. |
| `referral_code` | text, nullable | |
| `source` | text, nullable | How they heard about CurateKin. |
| `status` | text, default `'pending'` | `pending` / `approved` / `rejected`. Same three values used by `profiles.status` today — keep them identical so the admin UI's logic doesn't need to branch on two different vocabularies. |
| `submitted_at` | timestamptz, default now() | When the application was created. |
| `reviewed_at` | timestamptz, nullable | Set when status changes away from pending. |
| `reviewed_by` | uuid, nullable, references `auth.users(id)` | Which admin made the call. Today's admin check is a single hardcoded email, so this would always be the same one value in practice — still worth capturing now, since it costs nothing and pays off the moment a second admin exists. |

**Relationships:** one row per application, `user_id` → `auth.users`. In practice one creator will usually have exactly one application (today's flow doesn't support re-applying after rejection), but the schema doesn't need to *enforce* one-to-one — a unique constraint on `user_id` would block a legitimate future "reapply after rejection" flow.

**Who can insert/read/update/delete:**
- **Insert:** the authenticated applicant, for their own `user_id`, and only once per submission (the app layer decides when to insert, at email-confirm time, same as today).
- **Read:** the applicant can read their own row. Admin can read all rows.
- **Update:** only admin can update `status`, `reviewed_at`, `reviewed_by`. The applicant should not be able to edit their application after submission in this version — if "edit and resubmit" becomes a feature later, that's a deliberate product decision, not a default.
- **Delete:** nobody, by default. Rejected applications are a real record of what happened, not clutter to clean up. If GDPR-style deletion requests ever matter, that's handled explicitly later, not via open delete access.

**Sensitive data:** phone number is the main one here — not public, but not as sensitive as payout details. No PAN/UPI on this table, ever (see `creator_payout_details`).

**Indexes:** `user_id` (lookups and the uniqueness question above), `status` (the admin queue is filtered by status constantly), and a composite on `(status, submitted_at)` if the admin list is ever sorted by submission date within a status filter, which it already is today.

**RLS requirements:** row-level policy so `user_id = auth.uid()` for the applicant's own read; a separate admin-only policy (see Admin Security below) for full read/update access; no policy granting update to the applicant; no delete policy for anyone by default.

---

## 2. `admin_notes`

**Purpose:** exactly what the admin page's current "Review notes" section is a placeholder for — private commentary an admin leaves while reviewing, that persists across sessions instead of being lost the moment the browser tab closes.

**Columns:**
| Column | Type | Notes |
|---|---|---|
| `id` | uuid, primary key | |
| `subject_id` | uuid | The creator/application being annotated. |
| `subject_type` | text | Either `'profile'` or `'application'` — see the note below on why this needs deciding. |
| `admin_id` | uuid, references `auth.users(id)` | Who wrote it. |
| `note` | text | |
| `created_at` | timestamptz, default now() | |

**A decision this table can't avoid:** should notes attach to `profiles.id` or to `creator_applications.id`? If `creator_applications` ships, a note is really about a specific *application*, not the person forever — but if `creator_applications` doesn't ship (or ships later), notes need somewhere to attach today. The `subject_type` column above is one way to stay flexible, but it's a real design choice, not a detail — see Founder Decisions below.

**Relationships:** many notes to one subject (a creator or application can accumulate multiple notes over time as different things are noticed during review).

**Who can insert/read/update/delete:**
- **Insert:** admin only.
- **Read:** admin only. Never the creator being reviewed, never the public.
- **Update:** admin only, and only their own notes — one admin editing another admin's note is a trust problem the moment there's more than one admin.
- **Delete:** admin only, own notes only. Consider soft-delete (an `is_deleted` flag) instead of hard delete if notes ever need to survive an audit trail requirement — not needed for a solo founder today, worth remembering if the team grows.

**Sensitive data:** the notes themselves could contain anything an admin types — including, potentially, things they shouldn't write down (e.g. it's not hard to imagine an admin typing something they'd regret if a creator ever saw it). This table is why "admin-only, no exceptions" matters more than usual.

**Indexes:** `subject_id` (every read is "give me all notes for this creator"), `admin_id` if notes are ever filtered by author.

**RLS requirements:** the entire table should have a single policy shape — readable and writable only when the requesting user matches the admin check (see Admin Security). No public policy of any kind, not even a narrowed one. This is the one table on this whole list where "no policy for anyone else" isn't a compromise, it's the entire point.

---

## 3. `creator_payout_details`

**Purpose:** isolate PAN and UPI — the two most sensitive pieces of data CurateKin will ever hold — onto a table so narrow and so locked down that a mistake anywhere else in the codebase can't leak them.

**Columns:**
| Column | Type | Notes |
|---|---|---|
| `creator_id` | uuid, primary key, references `profiles(id)` | One row per approved creator. |
| `upi_id` | text, nullable | |
| `pan_number` | text, nullable | |
| `pan_verified` | boolean, default false | |
| `collected_at` | timestamptz, nullable | Set when the creator fills this in — always *after* approval, never at signup. |
| `updated_at` | timestamptz, default now() | |

**Never collected during signup.** This is already true in the live code today — the creator signup form hardcodes `upi_id: null, pan_number: null` regardless of what's in metadata, and `/signup/confirm` does the same. This table doesn't change that; it gives that already-correct behavior a proper home once payout collection actually gets wired up (currently Dashboard → Settings has the UI for this but writes to `profiles.upi_id`/`profiles.pan_number` — those columns already exist on `profiles` today, this table is the proposed destination for a future migration, not a description of where the data lives right now).

**Relationships:** one-to-one with `profiles`, only for creators who have reached `status = 'approved'`. There's no reason a pending or rejected applicant should ever have a row here — the app layer should enforce that a row can only be created once `profiles.status = 'approved'`.

**Who can insert/read/update/delete:**
- **Insert/Update:** only the creator themselves (`auth.uid() = creator_id`), and only if their own `profiles.status = 'approved'`. Admin can also update — e.g. flipping `pan_verified` — but should not be able to *see* the raw PAN/UPI values unless there's a specific, deliberate reason (see the founder-decision note below).
- **Read:** the creator, for their own row. Admin read access to this table should be treated as a separate, more scrutinized decision than admin read access to everything else — not a blanket "admin can see everything" default.
- **Delete:** the creator, for their own data (a legitimate "remove my payout info" request), or admin in a support context. Never public, never automatic.

**Sensitive data:** this entire table *is* sensitive data. No column on it is safe to expose broadly, ever.

**Indexes:** none beyond the primary key — this table will never be large or queried by anything except "give me this one creator's payout info."

**RLS requirements:** the tightest policy on this whole list. `SELECT`/`UPDATE`/`INSERT` restricted to `auth.uid() = creator_id`. If admin needs any access at all, it should be a narrow, explicitly-justified policy — not the same broad admin-can-read-everything pattern used elsewhere, because the blast radius of a mistake here is categorically worse than anywhere else on this list.

**Founder decision this table forces:** should admin be able to see a creator's PAN/UPI at all, ever — for support/dispute purposes — or should that data be genuinely admin-blind, with payout processing handled by a separate, audited path? This is not an engineering call.

---

## 4. `affiliate_links`

**Purpose:** the bridge between "a creator added a product" and "CurateKin actually earns commission on a click." Today, `/r/[productId]` redirects a shopper straight to the real product URL with no commission tracking wrapper — this table is what a future affiliate-network integration (e.g. Cuelinks) would use to know which wrapped URL to send someone to instead, and to preserve which creator/product drove that click for later payout.

**Columns:**
| Column | Type | Notes |
|---|---|---|
| `id` | uuid, primary key | |
| `product_id` | uuid, references `storefront_products(id)` | |
| `original_url` | text | What the creator actually pasted in — today's `storefront_products.product_url`. |
| `tracking_url` | text, nullable | The wrapped, commission-trackable version. Nullable because wrapping may happen asynchronously (a product can exist and be clickable before it's been wrapped). |
| `provider` | text, nullable | e.g. `'cuelinks'`. Nullable until a provider is actually chosen. |
| `provider_link_id` | text, nullable | Whatever identifier the provider uses to reconcile a click back to CurateKin's records. |
| `status` | text, default `'unwrapped'` | `unwrapped` / `wrapped` / `wrap_failed` — some product URLs won't have affiliate coverage from every provider, and that needs a visible state, not a silent failure. |
| `last_click_at` | timestamptz, nullable | |
| `created_at` | timestamptz, default now() | |

**Relationships:** one-to-one with `storefront_products` in the simplest version (each product has at most one active wrapped link). If multiple providers are ever supported simultaneously, this becomes one-to-many — worth deciding before building, not after.

**Who can insert/read/update/delete:**
- **Insert/Update:** server-side only — e.g. a background job or API route that calls the affiliate provider's wrapping API when a product is added. Never directly from the client, since `provider_link_id` and the exact wrapping logic are implementation details a creator or shopper has no reason to touch.
- **Read:** the redirect route (`/r/[productId]`, server-side) needs to resolve `tracking_url` for a given product. The owning creator could reasonably see their own products' `status` (is my product's link generating commission or not?) but doesn't need to see `provider_link_id` or other internal plumbing.
- **Delete:** admin only, for cleanup (e.g. a product was removed and its link should stop being tracked).

**Sensitive data:** none of this is personal data, but `provider_link_id` and API-integration details shouldn't be publicly readable — not because they're sensitive in the privacy sense, but because exposing them makes it trivially easy for someone to spoof or scrape CurateKin's affiliate relationships.

**Indexes:** `product_id` (every redirect-time lookup is by product), `status` (for finding products that failed to wrap and need retrying).

**RLS requirements:** no public read policy at all — the redirect route reads this server-side with the anon/service key in a route handler, not from the browser. If a creator-facing "is my link active" view is built later, that's a narrow, specific `creator_id`-scoped policy (via a join to `storefront_products.creator_id`), not a broad read grant.

**Founder decision this table forces:** which affiliate network to integrate with (Cuelinks or an alternative) is a business/vendor decision that determines the real shape of `provider`, `provider_link_id`, and how wrapping actually happens — this table's exact design is blocked on that choice, not just its implementation.

---

## 5. `creator_analytics_daily`

**Purpose:** a daily rollup per creator, so the dashboard and admin can show trends without scanning the raw `events` table (which already exists and is being written to today — see the note below) on every page load.

**Columns:**
| Column | Type | Notes |
|---|---|---|
| `creator_id` | uuid, references `profiles(id)` | |
| `date` | date | |
| `storefront_views` | integer, default 0 | Count of `events` rows where `event_type = 'storefront_view'` for that creator that day. |
| `product_clicks` | integer, default 0 | Count of `event_type = 'redirect_click'` rows for that creator that day. |
| `conversions` | integer, default 0 | Not measurable at all today — there's no purchase-confirmation signal anywhere in the system yet. This column exists as a placeholder for when `affiliate_links` starts reporting conversion events back from a provider. Until then, it should always be `0`, not estimated or guessed. |
| `earnings_estimate` | numeric, default 0 | Same caveat as `conversions` — this is a future column, not something to populate speculatively. Populating it with a guessed number before real commission data exists would directly contradict the "no earnings hype" principle already established for the rest of the product. |

Primary key: `(creator_id, date)`.

**Relationships:** aggregated from the existing `events` table (built this session, already live, already logging `storefront_view`, `redirect_click`, `homepage_visit`, `signup_start`, `signup_complete`, `email_confirmed`, and `dashboard_product_add`). This table doesn't need its own RLS-sensitive raw data — it's a derived summary.

**Who can insert/read/update/delete:**
- **Insert/Update:** a server-side aggregation job only (nightly, or computed on-demand and cached) — never client-writable, since a creator being able to write their own analytics numbers would defeat the entire point of the table.
- **Read:** the owning creator, for their own rows. Admin, for all rows.
- **Delete:** nobody, in normal operation — this is historical record, not scratch data.

**Sensitive data:** none directly, but in aggregate this reveals a creator's performance trends, which is closer to "their own business data" than "public" — should stay creator + admin only, not public, even though none of the individual numbers are personally sensitive the way phone/PAN/UPI are.

**Indexes:** the `(creator_id, date)` primary key already covers the main access pattern (a creator's own trend line). An index on `date` alone if there's ever a platform-wide "how are we doing today" admin view.

**RLS requirements:** `SELECT` restricted to `auth.uid() = creator_id` or admin. No `INSERT`/`UPDATE`/`DELETE` policy for any client role — this table is populated exclusively by trusted server-side code.

**A concrete, existing cleanup this table implies:** today there are two other, older click-tracking mechanisms — a `clicks` table written by the redirect route, and a `product_clicks` table read by the dashboard analytics page — and it isn't clear from the code alone whether they're even kept in sync with each other. Rolling out `creator_analytics_daily`, sourced from the newer `events` table, is the natural moment to retire both of the older ones rather than ending up with three overlapping click-tracking systems.

---

## Public vs. private data boundaries (recap, applied to the new tables)

**Public-safe, unchanged from today:** `profiles` fields for approved creators only (`display_name`, `username`, `bio`, `avatar_url`), and `storefront_products` fields for active products. None of the five new tables above change this boundary — they don't add anything new to what's public.

**Private, and more clearly isolated by this plan than today:**
- Application detail and review history → `creator_applications`, admin + owner only.
- Internal commentary → `admin_notes`, admin only, full stop.
- PAN/UPI → `creator_payout_details`, the narrowest policy on the list, owner + a deliberately-scoped admin decision.
- Affiliate wiring detail → `affiliate_links`, server-side only, no broad client read.
- Performance trends → `creator_analytics_daily`, owner + admin, never public.

The throughline: nothing about this plan makes anything *more* public than it is today. Every new table narrows or preserves the current boundary — several of them (`creator_payout_details` especially) meaningfully tighten it, since PAN/UPI currently sit as plain columns on `profiles`, a table that already has a public-read policy for approved creators (scoped to specific columns today, but still a table a mistake could theoretically widen).

---

## Admin security

Today: a hardcoded array of admin emails (`ADMIN_EMAILS`), checked client-side by comparing the logged-in user's email against the list, with no database-level enforcement of who counts as an admin. Every RLS policy referenced above as "admin only" needs to express that check *in SQL*, not just in the page's UI code — client-side checks are a UX convenience, not a security boundary, since a determined user could bypass the page entirely and query Supabase directly.

The practical version of this today would look like:
```sql
using (auth.jwt() ->> 'email' in ('navysirius05@gmail.com'))
```
— exactly the pattern already used for the `events` table's admin-read policy, built this session. Every new admin-only policy above should reuse this same expression, not invent a new mechanism, so there's exactly one place (the email list) that defines who's an admin.

**The founder decision this raises:** this pattern works cleanly for one admin. The moment a second person needs admin access, a hardcoded email list embedded in RLS policies across five-plus tables becomes a real maintenance risk — every policy needs updating in sync, and a missed one is a silent security gap. The more scalable version is a dedicated `is_admin` boolean (or a proper roles table) that every policy references via a single lookup, so adding an admin is one row change instead of an N-policy audit. Not urgent for a solo founder today; worth deciding *before* a second admin is added, not after.

---

## How existing auth metadata gets migrated safely

Today, `/signup/confirm` reads `user.user_metadata` and copies a specific, known set of fields into a new `profiles` row, once, at email-confirmation time. If `creator_applications` ships, the safe path is:

1. **Add the new table without touching the write path yet.** `creator_applications` can exist, empty, with its RLS policies fully in place, while `/signup/confirm` keeps working exactly as it does today. This is a zero-risk step — nothing reads from or depends on the new table yet.
2. **Dual-write, don't cut over.** Update `/signup/confirm` to insert into *both* `profiles` (as today) and `creator_applications` (new) for every new signup. This is additive — if the new insert fails, the existing `profiles` insert (and the rest of the signup flow) should not be blocked by it, mirroring how `logEvent` calls throughout this codebase already never block the flow they're attached to.
3. **Backfill historical data, once, carefully.** A one-time script (not part of the live app) copies existing `profiles` rows — for creators who already applied before this migration — into `creator_applications`, mapping `profiles.status`/`created_at`/etc. into the new shape. This is a read-then-insert operation against existing data; it should never delete or modify anything in `profiles` while doing so.
4. **Verify before relying on the new table for anything real.** Compare counts and spot-check a sample of rows between `profiles` and `creator_applications` before the admin review page, or anything else, starts reading from the new table instead of the old location.
5. **Only then, cut reads over.** Once verified, admin review can start reading from `creator_applications` instead of `profiles.status` directly. `profiles` keeps its `status` column too, at least initially, kept in sync by the same admin action (approve/reject writes to both) — removing it entirely is a later, separate, and reversible decision, not part of this migration.

The rule underneath all five steps: never make the new table the *only* copy of anything until it's been proven trustworthy against the old one. A migration that silently drops data because step 3 had a bug is far worse than a migration that takes an extra week because it ran dual-write for longer than strictly necessary.

---

## Migration order

Recommended order, based on risk and dependency — not all five tables depend on each other, so this is mostly about doing the highest-value, lowest-risk work first, and saving the parts blocked on external decisions for last:

1. **`creator_payout_details`** — first, because it's the highest-value security improvement (isolating PAN/UPI) and has the least entanglement with the live signup/review flow. Can be built and RLS-locked today without touching any existing working code path.
2. **`admin_notes`** — second, for the same reason: purely additive, zero risk to anything existing, and it immediately makes the admin page's already-built "Review notes" section actually useful instead of a labeled scratchpad.
3. **`creator_applications`** — third, and the most involved step, since it touches the live signup → confirm → admin review pipeline. Follow the dual-write-then-backfill-then-verify-then-cutover sequence above, not a single big-bang switch.
4. **`creator_analytics_daily`** — fourth. Depends on nothing new (just the already-live `events` table), but there's no urgency until `creator_applications` has settled, since this is about dashboard/admin polish, not the core review pipeline.
5. **`affiliate_links`** — last, because it's blocked on a founder decision (which affiliate network) that has nothing to do with engineering readiness. The table can be designed in detail once that choice is made, not before.

---

## Rollback risks

- **`creator_payout_details`, `admin_notes`, `creator_analytics_daily`:** low risk. None of these are read from anywhere until the app code is explicitly updated to use them — until that update ships, the table can be dropped with zero user-facing impact if something's wrong with it.
- **`affiliate_links`:** low risk in the same way, plus the redirect route's current behavior (direct redirect to the real product URL) is a safe fallback if wrapping ever fails or the table needs to be rolled back — shoppers still reach the product, CurateKin just doesn't earn commission on that click.
- **`creator_applications`:** the real risk is concentrated entirely in the *cutover* step (step 5 above), not the table's existence. If admin review starts reading from `creator_applications` before the backfill is verified, an application that failed to backfill would silently disappear from the review queue — a creator who applied would never get reviewed, with no error anywhere. This is why steps 3 and 4 (backfill, then verify) are not optional or skippable, and why `profiles.status` should keep being written to in parallel for a full transition period rather than being retired the moment the new table exists.

---

## Decisions requiring founder approval

None of the above should be built without an explicit yes on each of these — they're product and risk decisions, not implementation details:

1. **Should admin ever be able to see raw PAN/UPI values**, or should `creator_payout_details` be genuinely admin-blind with payout processing handled through a separate, audited path?
2. **Do `admin_notes` attach to `profiles` or to `creator_applications`?** (Affects whether notes need the `subject_type` flexibility column or can be simpler.)
3. **Should existing application data in `profiles` be backfilled into `creator_applications`**, or does the new table only track applications from this point forward, leaving historical creators' application detail solely in `profiles`?
4. **When (if ever) should `profiles.upi_id`/`profiles.pan_number` be removed** once `creator_payout_details` is live and trusted — or should they stay as unused, deprecated-in-place columns indefinitely?
5. **Is the current single-hardcoded-admin-email model acceptable long-term**, or should a real `is_admin` mechanism be built before RLS policies multiply across five new tables?
6. **Which affiliate network** (Cuelinks or an alternative) — this single choice determines the real shape of `affiliate_links` and can't be finalized without it.
7. **Should `clicks` and `product_clicks` be retired immediately** once `creator_analytics_daily` ships, or kept running in parallel for a transition/comparison period?
