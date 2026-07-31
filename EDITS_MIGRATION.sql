-- CurateKin Edits
-- Run this once in Supabase SQL Editor before publishing the Edits UI.
-- An Edit is a creator-owned collection of existing storefront products.

begin;

create table if not exists public.creator_edits (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 120),
  cover_image_url text,
  status text not null default 'draft'
    check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

create table if not exists public.creator_edit_products (
  edit_id uuid not null references public.creator_edits(id) on delete cascade,
  product_id uuid not null references public.storefront_products(id) on delete cascade,
  position integer not null default 0 check (position >= 0),
  primary key (edit_id, product_id),
  unique (edit_id, position)
);

create index if not exists creator_edits_creator_status_idx
  on public.creator_edits (creator_id, status, created_at desc);

create index if not exists creator_edit_products_edit_position_idx
  on public.creator_edit_products (edit_id, position);

alter table public.creator_edits enable row level security;
alter table public.creator_edit_products enable row level security;

drop policy if exists "public can read published edits" on public.creator_edits;
drop policy if exists "creators can read own edits" on public.creator_edits;
drop policy if exists "creators can create own edits" on public.creator_edits;
drop policy if exists "creators can update own edits" on public.creator_edits;
drop policy if exists "creators can delete own edits" on public.creator_edits;
drop policy if exists "public can read products in published edits" on public.creator_edit_products;
drop policy if exists "creators can read own edit products" on public.creator_edit_products;
drop policy if exists "creators can add own products to edits" on public.creator_edit_products;
drop policy if exists "creators can update own edit products" on public.creator_edit_products;
drop policy if exists "creators can remove own edit products" on public.creator_edit_products;

create policy "public can read published edits"
  on public.creator_edits for select
  using (status = 'published');

create policy "creators can read own edits"
  on public.creator_edits for select
  using (auth.uid() = creator_id);

create policy "creators can create own edits"
  on public.creator_edits for insert
  with check (auth.uid() = creator_id);

create policy "creators can update own edits"
  on public.creator_edits for update
  using (auth.uid() = creator_id)
  with check (auth.uid() = creator_id);

create policy "creators can delete own edits"
  on public.creator_edits for delete
  using (auth.uid() = creator_id);

create policy "public can read products in published edits"
  on public.creator_edit_products for select
  using (
    exists (
      select 1 from public.creator_edits edit
      where edit.id = edit_id and edit.status = 'published'
    )
  );

create policy "creators can read own edit products"
  on public.creator_edit_products for select
  using (
    exists (
      select 1 from public.creator_edits edit
      where edit.id = edit_id and edit.creator_id = auth.uid()
    )
  );

create policy "creators can add own products to edits"
  on public.creator_edit_products for insert
  with check (
    exists (
      select 1 from public.creator_edits edit
      where edit.id = edit_id and edit.creator_id = auth.uid()
    )
    and exists (
      select 1 from public.storefront_products product
      where product.id = product_id and product.creator_id = auth.uid()
    )
  );

create policy "creators can update own edit products"
  on public.creator_edit_products for update
  using (
    exists (
      select 1 from public.creator_edits edit
      where edit.id = edit_id and edit.creator_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.creator_edits edit
      where edit.id = edit_id and edit.creator_id = auth.uid()
    )
    and exists (
      select 1 from public.storefront_products product
      where product.id = product_id and product.creator_id = auth.uid()
    )
  );

create policy "creators can remove own edit products"
  on public.creator_edit_products for delete
  using (
    exists (
      select 1 from public.creator_edits edit
      where edit.id = edit_id and edit.creator_id = auth.uid()
    )
  );

commit;
