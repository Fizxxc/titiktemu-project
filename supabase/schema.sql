-- =========================================================
-- EXTENSIONS
-- =========================================================
create extension if not exists pgcrypto with schema extensions;

-- =========================================================
-- TYPES (safe create)
-- =========================================================
do $$
begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid=t.typnamespace
                 where t.typname='app_role' and n.nspname='public') then
    create type public.app_role as enum ('user', 'admin');
  end if;

  if not exists (select 1 from pg_type t join pg_namespace n on n.oid=t.typnamespace
                 where t.typname='order_status' and n.nspname='public') then
    create type public.order_status as enum ('pending_payment', 'paid_review', 'processing', 'done', 'rejected');
  end if;

  if not exists (select 1 from pg_type t join pg_namespace n on n.oid=t.typnamespace
                 where t.typname='coupon_type' and n.nspname='public') then
    create type public.coupon_type as enum ('percent', 'fixed');
  end if;
end
$$;

-- =========================================================
-- FUNCTIONS
-- =========================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =========================================================
-- PROFILES
-- =========================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role public.app_role not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

-- create profile automatically when user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name',''),
    'user'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

-- trigger di auth.users bisa gagal kalau environment membatasi
do $$
begin
  begin
    drop trigger if exists on_auth_user_created on auth.users;
    create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();
  exception
    when insufficient_privilege then
      -- kalau tidak punya hak, skip (buat profile bisa dilakukan dari aplikasi)
      raise notice 'Skipping trigger on auth.users due to insufficient privileges.';
  end;
end
$$;

-- =========================================================
-- SERVICES
-- =========================================================
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  description text not null,
  price int not null check (price >= 0),
  cover_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists services_set_updated_at on public.services;
create trigger services_set_updated_at
before update on public.services
for each row execute procedure public.set_updated_at();

-- =========================================================
-- COUPONS
-- =========================================================
create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  type public.coupon_type not null,
  value int not null check (value > 0),
  min_order int not null default 0 check (min_order >= 0),
  max_discount int,
  starts_at timestamptz,
  ends_at timestamptz,
  usage_limit int,
  used_count int not null default 0 check (used_count >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists coupons_set_updated_at on public.coupons;
create trigger coupons_set_updated_at
before update on public.coupons
for each row execute procedure public.set_updated_at();

-- =========================================================
-- ORDERS + ITEMS
-- =========================================================
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  status public.order_status not null default 'pending_payment',

  subtotal int not null check (subtotal >= 0),
  discount int not null default 0 check (discount >= 0),
  total int not null check (total >= 0),

  coupon_code text,
  notes text,

  payment_proof_url text,
  payment_proof_path text,  -- ✅ tambahan untuk bukti bayar (storage private)
  invoice_number text unique,
  invoice_pdf_url text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
before update on public.orders
for each row execute procedure public.set_updated_at();

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  service_id uuid not null references public.services(id),
  title text not null,
  qty int not null default 1 check (qty > 0),
  price int not null check (price >= 0),
  created_at timestamptz not null default now()
);

-- =========================================================
-- LIVE CHAT
-- =========================================================
create table if not exists public.chat_rooms (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id)
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.chat_rooms(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  message text not null,
  created_at timestamptz not null default now()
);

-- =========================================================
-- ADMIN HELPER
-- =========================================================
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = uid and p.role = 'admin'
  );
$$;

-- =========================================================
-- ENABLE RLS
-- =========================================================
alter table public.profiles enable row level security;
alter table public.services enable row level security;
alter table public.coupons enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.chat_rooms enable row level security;
alter table public.chat_messages enable row level security;

-- =========================================================
-- POLICIES (drop + recreate)
-- =========================================================

-- PROFILES
drop policy if exists profiles_select_own_or_admin on public.profiles;
create policy profiles_select_own_or_admin
on public.profiles for select
using (auth.uid() = id or public.is_admin(auth.uid()));

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- SERVICES
drop policy if exists services_public_read_active on public.services;
create policy services_public_read_active
on public.services for select
using (is_active = true or public.is_admin(auth.uid()));

drop policy if exists services_admin_insert on public.services;
create policy services_admin_insert
on public.services for insert
with check (public.is_admin(auth.uid()));

drop policy if exists services_admin_update on public.services;
create policy services_admin_update
on public.services for update
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists services_admin_delete on public.services;
create policy services_admin_delete
on public.services for delete
using (public.is_admin(auth.uid()));

-- COUPONS
drop policy if exists coupons_public_read_active on public.coupons;
create policy coupons_public_read_active
on public.coupons for select
using (is_active = true or public.is_admin(auth.uid()));

drop policy if exists coupons_admin_insert on public.coupons;
create policy coupons_admin_insert
on public.coupons for insert
with check (public.is_admin(auth.uid()));

drop policy if exists coupons_admin_update on public.coupons;
create policy coupons_admin_update
on public.coupons for update
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists coupons_admin_delete on public.coupons;
create policy coupons_admin_delete
on public.coupons for delete
using (public.is_admin(auth.uid()));

-- ORDERS
drop policy if exists orders_select_own_or_admin on public.orders;
create policy orders_select_own_or_admin
on public.orders for select
using (auth.uid() = user_id or public.is_admin(auth.uid()));

drop policy if exists orders_insert_own on public.orders;
create policy orders_insert_own
on public.orders for insert
with check (auth.uid() = user_id);

drop policy if exists orders_update_admin_only on public.orders;
create policy orders_update_admin_only
on public.orders for update
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- ORDER ITEMS
drop policy if exists items_select_own_or_admin on public.order_items;
create policy items_select_own_or_admin
on public.order_items for select
using (
  exists (
    select 1 from public.orders o
    where o.id = order_id and (o.user_id = auth.uid() or public.is_admin(auth.uid()))
  )
);

drop policy if exists items_insert_own on public.order_items;
create policy items_insert_own
on public.order_items for insert
with check (
  exists (
    select 1 from public.orders o
    where o.id = order_id and o.user_id = auth.uid()
  )
);

-- CHAT ROOMS
drop policy if exists rooms_select_own_or_admin on public.chat_rooms;
create policy rooms_select_own_or_admin
on public.chat_rooms for select
using (auth.uid() = user_id or public.is_admin(auth.uid()));

drop policy if exists rooms_insert_own on public.chat_rooms;
create policy rooms_insert_own
on public.chat_rooms for insert
with check (auth.uid() = user_id);

-- CHAT MESSAGES
drop policy if exists messages_select_room_member_or_admin on public.chat_messages;
create policy messages_select_room_member_or_admin
on public.chat_messages for select
using (
  public.is_admin(auth.uid()) or
  exists(select 1 from public.chat_rooms r where r.id = room_id and r.user_id = auth.uid())
);

drop policy if exists messages_insert_room_member_or_admin on public.chat_messages;
create policy messages_insert_room_member_or_admin
on public.chat_messages for insert
with check (
  auth.uid() = sender_id and (
    public.is_admin(auth.uid()) or
    exists(select 1 from public.chat_rooms r where r.id = room_id and r.user_id = auth.uid())
  )
);

-- =========================================================
-- INDEXES
-- =========================================================
create index if not exists idx_services_active on public.services(is_active);
create index if not exists idx_orders_user_id on public.orders(user_id);
create index if not exists idx_order_items_order on public.order_items(order_id);
create index if not exists idx_chat_messages_room on public.chat_messages(room_id);
