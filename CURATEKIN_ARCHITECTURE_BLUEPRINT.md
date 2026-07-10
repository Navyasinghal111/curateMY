# CurateKin — Architecture Blueprint

A product and technical architecture reference for turning CurateKin into a premium, taste-first creator affiliate platform for India. This is a planning document, not an implementation — it describes where the product should go and how the pieces fit together, grounded in what's actually built today.

---

## 1. Product vision

CurateKin is a premium creator affiliate platform. The core loop is simple: a creator curates products they genuinely use, a shopper browses the creator's public storefront and clicks through to buy from the real product source (Amazon, Nykaa, Myntra, a brand's own site — never a CurateKin-hosted checkout), and the creator earns a commission.

The product should feel closer to a well-edited magazine than a marketplace. Concretely, that means:

- **Taste over volume.** A creator's storefront is a curated collection, not a catalog. Product counts and follower numbers exist, but they're not the headline.
- **Editorial, not transactional.** The visual language leans serif display type, generous whitespace, ink/cream/gold tones — the aesthetic already established in the rebuilt signup flow and the storefront. New pages should match this, not revert to generic SaaS dashboard styling.
- **Trust over hype.** Copy avoids "earn money fast," leaderboards, streaks, or urgency mechanics. The existing signup copy ("Curate with your taste and build relationships with brands") is the right register — keep extending it.
- **No automation-heavy positioning.** CurateKin doesn't pitch itself as a tool that auto-generates content or auto-populates stores at scale. A human curates; the platform gets out of the way.

This is the explicit contrast with ShopMy and Wishlink, which lean into affiliate-hustle, growth-hack, high-volume positioning. CurateKin's bet is that a smaller number of genuinely trusted creators, presented well, outperforms that on a per-shopper trust basis.

---

## 2. Product worlds

The app splits into four worlds. Most of the first three already exist; the fourth is intentionally early.

**Public world** — anyone can reach these with no account:
- Homepage (`/`)
- Creator discovery (`/creators`)
- Public creator storefronts (`/[username]`)
- Product redirect (`/r/[productId]`)

**Creator world** — behind a Supabase-authenticated session, gated by application status:
- Application (`/signup/creator`)
- Email confirmation (`/signup/confirm`)
- Pending approval (`/pending`)
- Dashboard / My Shop (`/dashboard`)
- Analytics (`/dashboard/analytics`)
- Earnings (`/dashboard/earnings`)
- Settings (`/dashboard/settings`)
- Forward-looking stubs already present in the dashboard nav but not yet built out: Links, Gifting & Codes, Opportunities, Chat, Latest

**Admin world** — internal only, gated by a hardcoded email allowlist:
- Creator review queue, approval/rejection, internal notes, quality control (`/admin`)

**Future brand world** — barely started today. A brand lead-capture form exists (`/signup` → "For Brands" → writes to `brand_inquiries`), and the dashboard nav already reserves space for "Gifting & Codes" and "Opportunities," but there is no real brand account, brand dashboard, or campaign system yet. This is Phase 6 territory.

---

## 3. User roles

| Role | Description | Current state |
|---|---|---|
| Anonymous visitor | No account. Browses homepage, discovery, storefronts. | Fully supported. |
| Shopper | Has an account (`role: 'shopper'` in `profiles`). Intended to follow creators, save picks, build a wishlist. | Account creation works today; follow/save/wishlist features are not yet built. |
| Creator applicant | Mid-application or awaiting review (`status: 'pending'`). No dashboard access. | Fully supported — this is the flow rebuilt this session. |
| Approved creator | `status: 'approved'`. Has dashboard access and a live public storefront. | Fully supported. |
| Admin | Gated by a hardcoded email allowlist (`ADMIN_EMAILS` in `app/admin/page.tsx`), checked client-side against the logged-in user's email. | Works, but is a single-founder-scale mechanism — see Security Model for the hardening note. |
| Future brand user | Not a real authenticated role today. A brand's only touchpoint is submitting a lead form that lands in `brand_inquiries`. | Not built. Phase 6. |

---

## 4. Public vs private data boundaries

This is the boundary that matters most for trust. Get it wrong once — a leaked phone number, a visible PAN — and the "premium, trustworthy" positioning is gone.

**Public-safe** (only for creators where `status = 'approved'`):
- Display name, username, bio, avatar
- Public storefront products: title, brand, image, price text, category, description
- Instagram handle (the handle itself, not verification internals) and a rounded/approximate follower count, if shown at all

**Must never be public, under any query path:**
- Email
- Phone
- PAN
- UPI ID
- Admin notes on an application
- Application review details (who reviewed it, when, why)
- Any data belonging to a pending or rejected applicant — a creator who hasn't been approved should be completely invisible to public queries, not just "hidden in the UI"
- Raw earnings figures
- Event-level, individually-identifiable analytics (aggregate counts are fine; a raw log tying a specific shopper to a specific click is not something to expose, even internally, beyond what's needed for fraud/quality review)

The practical rule: every public-facing query must filter `status = 'approved'` at the query level (already the pattern in `app/[username]/page.tsx` and `app/creators/CreatorsClient.tsx` — keep replicating it), and sensitive fields should live in tables that public/anon Supabase roles have no read grant on at all, rather than relying on the frontend to simply not `select()` them.

---

## 5. Database architecture

Two tables below (`profiles`, `storefront_products`) are real and live today. `events` is real and live as of this session. The rest are recommended additions — described here as the target shape, not as something already built.

### `profiles` *(exists today)*
**Purpose:** Identity and public-facing creator/shopper data, plus — currently — everything else about a creator (application answers, payout details, agreements). This table has grown to do too much; see the split recommendations below.

**Important fields today:** `id` (matches `auth.users.id`), `role` (`creator`/`shopper`), `status` (`pending`/`approved`/`rejected`), `display_name`, `username`, `bio`, `avatar_url`, `city`, `phone`, `instagram_handle`, `instagram_verified`, `primary_platform`, `primary_handle`, `primary_followers`, `niches`, `content_language`, `upi_id`, `pan_number`, `agreed_tos`, `agreed_affiliate`, `created_at`. Note: there is deliberately no `email` column — email lives only in Supabase Auth, to avoid a second place it could leak from.

**Who reads:** Public/anon can read a narrow public-safe subset, filtered to `status = 'approved'`. A creator can read their own full row. Admin can read all rows.
**Who writes:** A creator can write their own row (RLS: `auth.uid() = id`). Admin can update `status` (approve/reject). Nothing else should write here.

**Recommended direction:** keep `profiles` as the *identity and public-facing* table only. Move payout fields (`upi_id`, `pan_number`) into `creator_payout_details`, and move raw application intake into `creator_applications`, so a table that's partly public-readable never has PAN/UPI columns sitting on it — even behind RLS. Defense in depth: one fewer place a misconfigured policy could expose sensitive data.

### `creator_applications` *(recommended new table)*
**Purpose:** The application itself — everything a creator submits before approval, including data that should never need to touch a public-readable table.

**Important fields:** `id`, `user_id` (→ `profiles.id`), `niche_description`, `content_style_notes`, `platforms_submitted` (jsonb), `follower_range`, `instagram_verified_at`, `status` (`pending`/`approved`/`rejected`), `submitted_at`, `reviewed_at`, `reviewed_by`.

**Who reads:** The applicant can read their own application. Admin can read all.
**Who writes:** The applicant can insert/update their own application while `status = 'pending'`. Only admin can change `status`.

### `storefront_products` *(exists today)*
**Purpose:** A creator's curated product picks — the core public-facing content of the platform.

**Important fields today:** `id`, `creator_id`, `title`, `brand`, `price`, `image_url`, `product_url`, `category`, `description`, `active`, `wishlisted`, `created_at`.

**Who reads:** Public/anon can read rows where `active = true` and the owning creator has `status = 'approved'`. The owning creator can read all their own rows (including inactive ones).
**Who writes:** Only the owning creator (`auth.uid() = creator_id`). Admin should have read access for quality control, write access only if moderation requires taking a listing down.

### `events` *(exists today, built this session)*
**Purpose:** Fully anonymous product-usage analytics — the "is anyone actually using this" table.

**Fields:** `id`, `event_type` (text), `creator_id` (nullable, → `profiles.id`), `product_id` (nullable, → `storefront_products.id`), `metadata` (jsonb — never personal data), `created_at`.

**Who reads:** Only admin (checked via the same email allowlist that gates `/admin`, expressed in RLS as `auth.jwt() ->> 'email' in (...)`).
**Who writes:** Anyone — anon and authenticated — can insert. No update or delete policy exists for any role, so both are denied by default under RLS. This is intentionally a write-only-from-the-app, read-only-by-admin table.

**Note on consolidation:** two older tables already exist and overlap with this one's purpose — `clicks` (written by the `/r/[productId]` redirect route) and `product_clicks` (read by `/dashboard/analytics`, joined against `storefront_products`). It's not fully clear from the code alone whether these two are actually kept in sync with each other. `events` (with `event_type = 'redirect_click'`) is the intended long-term replacement for both. Retiring `clicks` and `product_clicks` in favor of `events` is a concrete Phase 1/4 task, not just a suggestion — see Build Phases.

### `creator_payout_details` *(recommended new table)*
**Purpose:** UPI ID and PAN, isolated from every other table so it can be locked down independently.

**Important fields:** `creator_id` (→ `profiles.id`, primary key), `upi_id`, `pan_number`, `pan_verified`, `updated_at`.

**Who reads:** Only the owning creator and admin. No other role, no exceptions.
**Who writes:** Only the owning creator (from Dashboard → Settings), admin for verification flags.

### `affiliate_links` *(recommended new table)*
**Purpose:** Tracks the mapping between a raw product URL and its wrapped, commission-trackable version (e.g., a Cuelinks-wrapped link), once affiliate network integration exists.

**Important fields:** `id`, `product_id` (→ `storefront_products.id`), `raw_url`, `wrapped_url`, `network` (e.g. `'cuelinks'`), `tracking_id`, `created_at`.

**Who reads:** The redirect route (server-side) needs read access to resolve the wrapped URL. Admin can read all for reconciliation.
**Who writes:** Server-side only (e.g., a job that wraps new product URLs on creation), never directly from the client.

### `creator_analytics_daily` *(recommended new table)*
**Purpose:** A daily rollup of `events` per creator, so the dashboard can show trends without scanning raw event rows on every page load.

**Important fields:** `creator_id`, `date`, `storefront_views`, `redirect_clicks`, `products_added`, computed nightly or on-demand from `events`.

**Who reads:** The owning creator (their own rows only), admin (all rows).
**Who writes:** Server-side aggregation only — never client-writable.

### `admin_notes` *(recommended new table)*
**Purpose:** Internal-only commentary on an application or creator, kept fully separate from any table a creator or the public can ever read.

**Important fields:** `id`, `subject_id` (→ `profiles.id` or `creator_applications.id`), `admin_id`, `note`, `created_at`.

**Who reads:** Admin only.
**Who writes:** Admin only.

---

## 6. Security model

The guiding principle: **RLS should make the "wrong" query impossible, not just unlikely.** The frontend should never be the only thing standing between a private field and a public request.

- **Public read access** is narrow and explicit: `profiles` and `storefront_products` are readable by `anon` only through policies that filter on `status = 'approved'` / `active = true`. No public policy should ever grant a blanket `SELECT *`.
- **Creators own their data.** Every creator-writable table uses `auth.uid() = <owner column>` as the write policy. A creator can never read or write another creator's rows, application, payout details, or analytics.
- **Admin access is centralized and reviewable.** Admin RLS policies check the requesting user's JWT email against the same allowlist that already gates the `/admin` page client-side (`ADMIN_EMAILS`). This is the "reuse whatever check already gates `/admin`" pattern established when the `events` table was built — apply it consistently to every admin-only table going forward. As the team grows beyond one founder, this should move from a hardcoded email list to a proper `is_admin` flag or role table so adding/removing admins doesn't require a code change and a redeploy.
- **PAN and UPI are structurally isolated.** They live in `creator_payout_details`, not `profiles`, specifically so that a bug or overly-permissive policy on the (partially public) `profiles` table can never leak them. This is the single highest-consequence rule in this document — treat any PR touching payout fields with the same scrutiny as the profiles-table RLS fix from earlier this project's history.
- **Events stay anonymous by construction.** `metadata` on the `events` table must never contain email, name, phone, or any other personal identifier — this is already the convention documented directly in `lib/logEvent.ts`. `creator_id`/`product_id` are just UUIDs; on their own they don't identify a shopper, only which creator/product was involved.

---

## 7. Authentication and approval flow

This flow is real and live as of this session's rebuild of `/signup/creator`.

1. **Creator applies** at `/signup/creator` — a three-step flow (Apply → Platforms → Content). Instagram verification happens via real OAuth during the Platforms step and is required, not optional, before the application can be submitted.
2. **Real signup fires** — `supabase.auth.signUp()` is called with all collected fields riding along as auth `user_metadata` (since there's no session yet to write to `profiles` under RLS).
3. **Email confirmation is required.** Supabase sends a confirmation link pointing at `/signup/confirm`.
4. **On confirmation,** `/signup/confirm` creates the `profiles` row (today) with `status: 'pending'`, pulling the fields back out of `user_metadata`. Under the recommended table split, this step would instead create a `creator_applications` row, keeping `profiles` reserved for identity fields only.
5. **Admin reviews** the pending queue at `/admin`, gated by the email allowlist. Admin can approve or reject, optionally leaving an internal note (today: informally; recommended: via `admin_notes`).
6. **Approved creator gets dashboard access.** `app/dashboard/layout.tsx` checks `status === 'approved'` on every dashboard route; anything less redirects to `/pending`.
7. **Payout details are collected later, only when needed** — not at signup. This is a deliberate product decision made this session: UPI/PAN collection was removed from the signup flow entirely and now happens post-approval, from Dashboard → Settings, right before a creator would actually need to be paid. Signup should ask for the minimum needed to evaluate someone's taste and reach, not everything the business might eventually need.

---

## 8. Analytics model

Seven events are wired today, all through a single shared `logEvent` helper (`lib/logEvent.ts`) that fires anonymous, fire-and-forget inserts into `events`:

| Event | Fires when | What it measures |
|---|---|---|
| `homepage_visit` | Homepage loads | Top-of-funnel reach |
| `signup_start` | Either signup page loads (`{type: 'shopper'}` or `{type: 'creator'}`) | Intent to join |
| `signup_complete` | Real `auth.signUp()` succeeds | Signup actually completed, not abandoned |
| `email_confirmed` | Confirmation link is successfully clicked | The account is real and verified |
| `storefront_view` | A creator's public storefront page loads | Discovery / demand for that creator |
| `redirect_click` | A shopper clicks through to buy (`/r/[productId]`) | The actual monetizable action |
| `dashboard_product_add` | A creator successfully adds a product | Creator-side engagement and retention |

The point of this list is that it traces one connected loop — visit → apply → confirm → (time passes, review happens) → get discovered → get clicked through → keep curating — rather than a grab-bag of vanity counters. A metric only belongs on this list if it answers a real question about whether the core loop is working: is anyone finding the site, does the application process lose people, are approved creators actually getting discovered, is discovery converting into the action that actually generates commission, and are creators sticking around to keep their storefront current. Things like raw session counts, time-on-page, or scroll depth deliberately aren't part of this — they don't answer any of those questions.

---

## 9. Affiliate tracking model

**Today:** `/r/[productId]` looks up the product's `product_url` from `storefront_products`, logs the click (currently to `clicks`, and as of this session also to `events` as `redirect_click`), and 302-redirects the shopper straight to the real product page. This proves the click happened and which product/creator it was for, but CurateKin isn't yet earning commission on it — there's no affiliate network wrapping the outbound link.

**Future — Cuelinks (or a similar Indian affiliate aggregator) integration:** rather than negotiating individual affiliate deals per brand, wrap the stored `product_url` with a Cuelinks tracking link, either at the moment a creator adds the product or at redirect time. This is what the recommended `affiliate_links` table exists for — it holds the mapping from raw URL to wrapped URL so the redirect route can resolve the *correct, trackable* destination instead of the raw one.

**Creator attribution must survive the wrap.** Whatever tracking parameter or sub-ID scheme Cuelinks uses needs to encode which creator (and ideally which product click) drove the traffic, so that when a commission comes back from Cuelinks, it can be matched back to the right creator's `creator_payout_details` for payout. Losing that linkage would silently break the entire "creator earns 80%" promise the product already makes in its own copy — this is not a detail to defer casually.

---

## 10. Page architecture list

### Homepage (`/`)
- **Purpose:** First impression of the brand and the core pitch — creator taste, shopper discovery.
- **User:** Anonymous visitor primarily; also the entry point for existing users navigating back.
- **Functional flow:** Land, understand the pitch (creator side + shopper side), see a real founding-creator spotlight, choose a path (apply, browse, log in).
- **Technical flow:** Client component (`app/page.tsx`); fetches one real featured creator + their active products directly from Supabase on mount; fires `homepage_visit` on load.
- **Data:** Reads `profiles` (one approved creator) and `storefront_products` (their active items). Writes one `events` row.
- **Design direction:** Editorial, serif-forward, the tone-setting page for the whole site — should stay ahead of, not behind, the newer signup/storefront design work.

### Signup role selection (`/signup`)
- **Purpose:** Route a visitor to the right path — shopper account, creator application, or brand inquiry.
- **User:** Anonymous visitor deciding what they are.
- **Functional flow:** Pick a role card; shopper and brand render inline forms in the same modal, creator redirects out to the dedicated application flow.
- **Technical flow:** Client component; shopper path calls real `auth.signUp()`; brand path inserts into `brand_inquiries` (no auth involved — pure lead capture).
- **Data:** Writes to `auth.users` + `profiles` (shopper) or `brand_inquiries` (brand). Fires `signup_start` on modal mount, `signup_complete` on a real shopper signup succeeding.
- **Design direction:** Should read as a considered choice, not a generic three-tile pricing-page pattern — this is the first fork in someone's relationship with the brand.

### Creator application (`/signup/creator`)
- **Purpose:** Collect what's needed to evaluate a creator applicant's taste, reach, and authenticity.
- **User:** Prospective creator.
- **Functional flow:** Three steps — Apply (identity + credentials), Platforms (required real Instagram verification + reach), Content (niche, style, language). Each step's Next button stays disabled until that step is genuinely complete.
- **Technical flow:** Client component; real `auth.signUp()`; real Instagram OAuth via `/api/auth/instagram`, with the connection state persisted across the redirect via `sessionStorage` so in-progress answers survive leaving the page.
- **Data:** Writes to `auth.users` with the full application riding along as `user_metadata` (no `profiles` row yet — no session exists to satisfy RLS). Fires `signup_start` on load, `signup_complete` once signup succeeds.
- **Design direction:** This is the flow this session rebuilt to be premium/editorial — the reference point for what "matches the new direction" means elsewhere in the app.

### Email confirmation (`/signup/confirm`)
- **Purpose:** Turn a confirmed email into a real profile row.
- **User:** Anyone who just clicked a confirmation link (shopper or creator).
- **Functional flow:** Silent — confirm, create the profile, route to the right "you're in" state.
- **Technical flow:** Client component; reads the now-authenticated user's `user_metadata`, inserts `profiles` if it doesn't exist yet (idempotent — safe if the link is clicked twice), distinguishes creator vs shopper.
- **Data:** Writes one `profiles` row. Fires `email_confirmed`, with `creator_id` set only when the resolved role is `creator`.
- **Design direction:** Minimal, reassuring, fast — this page's whole job is to get out of the way.

### Pending approval (`/pending`)
- **Purpose:** Hold an applicant who's confirmed their email but isn't approved yet.
- **User:** Applicant with `status: 'pending'`.
- **Functional flow:** Explain what's happening and roughly how long review takes; no dashboard access is granted from here.
- **Technical flow:** Redirect target from `app/dashboard/layout.tsx`'s status check.
- **Data:** Read-only, no writes.
- **Design direction:** Calm, not anxious — this is a waiting room, it shouldn't feel like an error state.

### Public creator storefront (`/[username]`)
- **Purpose:** The actual shoppable page — a creator's curated collection.
- **User:** Shopper, or anyone with the link.
- **Functional flow:** Browse by category, search, click through to buy.
- **Technical flow:** Server component fetches the creator (`status = 'approved'` filter) and their active products; awaits a `storefront_view` log before rendering (awaited, not fire-and-forget, since a serverless function can terminate right after the response is sent).
- **Data:** Reads `profiles` + `storefront_products`. Writes one `events` row per view.
- **Design direction:** Currently uses its own visual system (burgundy/cream, `StorefrontClient.tsx`) distinct from the newer ink/gold signup design — worth a deliberate unification pass (see Phase 3) rather than letting two design languages coexist indefinitely.

### Creator discovery (`/creators`)
- **Purpose:** Let a shopper find creators worth following, beyond the one they already have a link to.
- **User:** Shopper browsing.
- **Functional flow:** Browse/filter approved creators, click through to a storefront.
- **Technical flow:** Reads approved `profiles` rows.
- **Data:** Read-only from `profiles`.
- **Design direction:** Should feel like editorial curation of creators, mirroring how storefronts curate products — not a directory listing.

### Dashboard / My Shop (`/dashboard`)
- **Purpose:** Where an approved creator manages their storefront.
- **User:** Approved creator.
- **Functional flow:** Add/edit/remove products (with a URL auto-fill scraper for common sites), see the collection as shoppers will.
- **Technical flow:** Client component; product add/edit both guard against double-submit (the button disables itself during the request — fixed this session after a real duplicate-insert bug); successful adds fire `dashboard_product_add`.
- **Data:** Full read/write on the creator's own `storefront_products` rows.
- **Design direction:** Functional/utilitarian is fine here — this is a workspace, not a showcase — but should still feel like it belongs to the same brand as the storefront it's building.

### Dashboard analytics (`/dashboard/analytics`)
- **Purpose:** Show a creator how their storefront is performing.
- **User:** Approved creator.
- **Functional flow:** Total/weekly/daily click counts, top products by clicks.
- **Technical flow:** Currently reads from `product_clicks`, one of the two legacy click tables described in the Database Architecture section — this is the concrete next step once `events` has enough history: repoint this page at `events` (`event_type = 'redirect_click'`), ideally via the recommended `creator_analytics_daily` rollup rather than scanning raw rows.
- **Data:** Currently `product_clicks`; target state `events` / `creator_analytics_daily`.
- **Design direction:** Already reasonably on-brand (serif headers, ink/gold accents) — keep this as the pattern for other dashboard-internal stat displays.

### Dashboard earnings (`/dashboard/earnings`)
- **Purpose:** Show a creator what they've earned and when they'll be paid.
- **User:** Approved creator.
- **Functional flow (intended):** Total earned, this month, pending payout, monthly breakdown.
- **Technical flow (today):** Fully static — every number is a hardcoded ₹0, no Supabase calls at all. This is a visual placeholder, not a working feature yet.
- **Data:** None currently. Target state: reads from `affiliate_links` / a commission ledger, once Cuelinks integration exists.
- **Design direction:** The visual design is already right; it just needs real numbers behind it — this is squarely a Phase 5 task, not a redesign.

### Dashboard settings (`/dashboard/settings`)
- **Purpose:** Manage profile details and payout information.
- **User:** Approved creator.
- **Functional flow:** Edit display name, bio, avatar, and — since this session's signup rebuild — enter UPI ID and PAN here, post-approval, rather than at signup.
- **Technical flow:** Reads/writes the creator's own `profiles` row today (recommended: split payout fields to write to `creator_payout_details` instead once that table exists).
- **Data:** Own-row read/write on `profiles` (target: + `creator_payout_details`).
- **Design direction:** Should visually reinforce that payout fields are handled with extra care — this is the one place in the whole app where PAN and UPI are typed in.

### Admin review (`/admin`)
- **Purpose:** Let the founder (or future team) review, approve, or reject creator applications.
- **User:** Admin (hardcoded email allowlist).
- **Functional flow:** See pending queue, review an applicant's submitted details, approve or reject, optionally send an approval email.
- **Technical flow:** Client component gated by checking the logged-in user's email against `ADMIN_EMAILS`; updates `profiles.status`.
- **Data:** Full read on `profiles` (all statuses), write access to `status`. Recommended: extend to `creator_applications` and `admin_notes` once those exist, and eventually back the access check with RLS rather than a purely client-side gate.
- **Design direction:** Purely functional is fine — this page is never shopper- or creator-facing — but it's still worth a basic pass so review doesn't feel like an afterthought relative to the rest of the product.

### Future brand pages
- **Purpose:** Let brands run gifting programs, campaigns, and discount codes with creators, eventually self-serve.
- **User:** Future brand role — not built yet.
- **Functional flow (intended):** Brand submits a campaign brief, matches with creators, tracks performance, manages codes/gifting logistics.
- **Technical flow (today):** Only `brand_inquiries` exists — a lead-capture insert from the `/signup` brand form, reviewed manually. "Gifting & Codes" and "Opportunities" already have reserved nav slots in the dashboard, signaling intended future placement without functionality behind them yet.
- **Data:** `brand_inquiries` only, today.
- **Design direction:** Defer until Phase 6 — don't let placeholder brand UI dilute the creator/shopper experience in the meantime.

---

## 11. Build phases

**Phase 1 — Foundation, security, data model.**
Partially done: the `events` table and its RLS policies (anonymous insert-only, admin-only read, reusing the `/admin` email check) shipped this session. Remaining: split `creator_payout_details` and `creator_applications` out of `profiles`; retire `clicks` and `product_clicks` in favor of `events`; audit every existing public-facing query to confirm it filters on `status = 'approved'` / `active = true` at the query level, not just in the UI.

**Phase 2 — Premium creator application + admin review.**
The application flow (`/signup/creator`) was rebuilt this session to match the premium/editorial direction, with real Instagram verification made mandatory and payout collection deliberately deferred out of signup. Remaining: bring `/admin` up to the same design standard, add `admin_notes`, and move the admin-access check from a hardcoded client-side email list toward something RLS can enforce directly as the team grows.

**Phase 3 — Storefront polish + creator discovery.**
The storefront (`/[username]`) and discovery (`/creators`) pages work today but visually predate the newer signup design system — they currently run on a separate burgundy/cream palette. This phase unifies the visual language across public-facing pages so the whole shopper-facing experience feels like one considered product, and pushes discovery further toward "editorial curation of creators" rather than a plain directory.

**Phase 4 — Analytics and creator dashboard clarity.**
The `events` table exists and is being written to, but nothing consumes it yet beyond raw SQL queries. This phase builds the `creator_analytics_daily` rollup, repoints `/dashboard/analytics` at `events` instead of the legacy `product_clicks`, and gives the founder/admin an actual view into the data rather than hand-written queries — this was explicitly the gap identified right after the analytics table shipped.

**Phase 5 — Affiliate tracking and earnings.**
Wire up Cuelinks (or an equivalent Indian affiliate aggregator): build `affiliate_links`, wrap outbound product URLs, and preserve creator attribution end-to-end. Replace `/dashboard/earnings`'s hardcoded ₹0 stub with real numbers once commission data actually exists to show.

**Phase 6 — Brand and opportunity tools.**
Turn `brand_inquiries` from a lead-capture form into a real brand role: campaign briefs, creator matching, gifting logistics, discount codes. Build out the "Gifting & Codes" and "Opportunities" dashboard sections that already have reserved nav space but no functionality behind them.
