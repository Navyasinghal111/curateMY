# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## What this is

CurateKin — a creator storefront platform (ShopMy-style). Creators curate products, get a public storefront at `/<username>`, and shoppers click through to buy. Solo non-technical founder project; read `schema.md.txt` in the repo root first — it's a running session log (progress, decisions, open issues, known past bugs) kept across Claude Code sessions, not a database schema despite the filename.

## Commands

```
npm run dev      # start dev server (localhost:3000)
npm run build    # production build
npm run start    # run production build
npm run lint     # eslint
```

No test suite exists. Verify changes by running `npm run dev` and exercising the flow in-browser (see the `verify` skill).

## Next.js version warning

This project pins a Next.js version with breaking changes vs. training data. **Before touching routing, proxy/middleware, or config, read the matching guide in `node_modules/next/dist/docs/`.** One confirmed difference already in this codebase:

- `middleware.ts` is renamed to **`proxy.ts`**, exporting a `proxy` function (not `middleware`). See `proxy.ts` at the repo root.

Don't assume other Next.js APIs match what you know — check the docs directory when in doubt.

## Architecture

**Stack:** Next.js App Router (TypeScript), Supabase (Postgres + Auth), Tailwind v4, Resend (email). No ORM — all data access is direct `supabase.from(...)` calls scattered across page/route files.

**Supabase client pattern** — two different clients depending on context, both reading `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`:
- Client Components: `createClient()` from `lib/supabase.ts` (`createBrowserClient`).
- Server Components / Route Handlers: `createServerClient` from `@supabase/ssr` constructed inline with `cookies()` from `next/headers` (repeated per-file, e.g. `app/[username]/page.tsx`, `app/r/[productId]/route.ts`) — there is no shared server-client helper.

**Known tables** (inferred from query call sites, no formal schema file exists — grep `.from(` before assuming a table/column name is right):
- `profiles` — creator accounts. Key columns: `id`, `username`, `display_name` (not `full_name`), `bio`, `avatar_url`, `city`, `instagram_handle`, `instagram_verified`, `primary_platform`, `primary_followers`, `status` (`'approved'` gates visibility everywhere).
- `storefront_products` — a creator's curated products. Key columns: `id`, `creator_id`, `title`, `brand`, `price`, `image_url`, `product_url`, `category`, `active`, `created_at`.
- `clicks` — written by the redirect route (`app/r/[productId]/route.ts`).
- `product_clicks` — read by `app/dashboard/analytics/page.tsx`. This is a **different table name** than the one the redirect route writes to — check both before assuming click tracking is wired end to end.
- `brand_inquiries` — brand signup form (`app/signup/page.tsx`).

**Creator approval gate:** new creators land in a non-`'approved'` status and get redirected to `/pending` (checked in `app/dashboard/layout.tsx`). Admin approval happens in `app/admin/page.tsx`. Any query serving public pages filters `.eq('status', 'approved')` — replicate this when adding new public-facing reads.

**Buy-link redirect:** `/r/[productId]` (`app/r/[productId]/route.ts`) looks up `product_url` from `storefront_products`, best-effort logs a click, then 302s the shopper to the real product. This is the monetization-critical path — a previous session found and fixed a bug where it pointed at the wrong table/column, silently sending every shopper back to the homepage. Treat this route as sensitive to break.

**Product auto-fill scraper:** `app/api/product/preview/route.ts` (and a near-duplicate at `app/api/auth/instagram/product/preview/route.ts`) scrapes a pasted product URL for title/brand/price/image. It cascades through multiple fetch strategies — ScraperAPI (needs `SCRAPER_API_KEY`, tried twice: plain then JS-rendered) → direct fetch with a spoofed User-Agent → an allorigins.win CORS proxy fallback — with site-specific regex extractors for Amazon/Flipkart/Myntra and generic `og:title`/`<title>` fallbacks for everything else. If adding a new supported site, add a domain-specific branch inside `extract()` rather than relying on the generic fallback.

**Instagram OAuth:** `app/api/auth/instagram/{route,callback,deauthorize,delete}.ts` implement the Instagram Business Basic OAuth flow (`INSTAGRAM_APP_ID`, `INSTAGRAM_APP_SECRET`, `NEXT_PUBLIC_BASE_URL`). `email/approve/route.ts` sends approval emails via Resend (`RESEND_API_KEY`).

**Site-wide access gate:** `proxy.ts` has a `SITE_LIVE` flag. When `false`, all traffic except an allowlist (`/dashboard`, `/admin`, `/login`, `/signup`, `/api/*`, etc.) is redirected to `/under-construction` unless the visitor has a `ck_access` cookie or passes `?key=<ACCESS_KEY>`. Currently `true` (site is public) — check this flag first if a page "isn't loading" for an external visitor.

**Duplicate/dead pages to watch for:** there is a documented history of duplicate pages diverging silently (e.g. a since-deleted second "Atelier"-branded product page at the same route as `app/dashboard/products/page.tsx`). Before editing a dashboard page, confirm via `app/dashboard/layout.tsx`'s `NAV` array which route is actually linked from the UI — an unlinked duplicate file elsewhere may look like the right one to edit but isn't reachable.

**Env vars** (`.env.local`, not committed): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `RESEND_API_KEY`, plus (used in code, not currently in `.env.local`) `SCRAPER_API_KEY`, `INSTAGRAM_APP_ID`, `INSTAGRAM_APP_SECRET`, `NEXT_PUBLIC_BASE_URL`. Supabase's newer "Publishable/Secret" key naming is not used here — this codebase expects the legacy anon/service_role key scheme.

## Working notes carried over from previous sessions

- Read the actual file/table before writing new code — several past bugs were wrong table/column-name guesses that silently broke a flow (wrong redirect table, `full_name` vs `display_name`, etc.).
- Test locally with `npm run dev` before the user pushes to the live site.
- Inline styles (JS objects) are the dominant styling approach in page components, not Tailwind classes, despite Tailwind being configured — match existing file conventions rather than introducing a new styling approach in one file.
