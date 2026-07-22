-- ============================================================
-- PRICE REFRESH MIGRATION
-- Run once in Supabase SQL Editor before deploying the refresh code.
-- Adds tracking metadata to the existing public.storefront_products
-- table. Existing price values are preserved.
-- ============================================================

begin;

alter table public.storefront_products
  add column if not exists price_current text,
  add column if not exists price_original text,
  add column if not exists price_checked_at timestamptz,
  add column if not exists price_status text not null default 'unknown';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'storefront_products_price_status_check'
      and conrelid = 'public.storefront_products'::regclass
  ) then
    alter table public.storefront_products
      add constraint storefront_products_price_status_check
      check (price_status in ('unknown', 'manual', 'fresh', 'failed'));
  end if;
end $$;

update public.storefront_products
set price_current = price
where price_current is null
  and price is not null
  and price <> '';

create index if not exists storefront_products_price_checked_at_idx
  on public.storefront_products (price_checked_at nulls first);

commit;

-- Verification:
-- select id, price, price_current, price_original, price_checked_at, price_status
-- from public.storefront_products
-- order by created_at desc
-- limit 20;

-- Rollback (destructive; do not run after live refresh data exists):
-- alter table public.storefront_products
--   drop constraint if exists storefront_products_price_status_check,
--   drop column if exists price_current,
--   drop column if exists price_original,
--   drop column if exists price_checked_at,
--   drop column if exists price_status;
