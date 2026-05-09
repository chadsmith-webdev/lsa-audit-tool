-- =============================================================================
-- Client Portal Migration
-- Local Search Ally — lsa-audit-tool
-- =============================================================================
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query)
-- Safe to run on existing data — does not drop or alter existing columns.
-- =============================================================================


-- ---------------------------------------------------------------------------
-- 1. PROFILES TABLE
--    One row per auth user. Created automatically via trigger on signup.
--    is_admin = true for Chad only (set manually after first login).
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  email         text not null,
  business_name text,
  is_admin      boolean not null default false,
  created_at    timestamptz not null default now()
);

-- Auto-create a profile row whenever a new user signs in via magic link
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ---------------------------------------------------------------------------
-- 2. INVITED EMAILS TABLE
--    You add rows here to grant access. Login form rejects any email
--    not in this list. is_admin emails bypass the check (always allowed).
-- ---------------------------------------------------------------------------

create table if not exists public.invited_emails (
  id          uuid primary key default gen_random_uuid(),
  email       text not null unique,
  label       text,                    -- optional: client business name for your reference
  invited_at  timestamptz not null default now()
);

-- Seed your own email so you can always log in
-- Replace with your actual email address
insert into public.invited_emails (email, label)
values ('chad@localsearchally.com', 'Chad Smith — Admin')
on conflict (email) do nothing;


-- ---------------------------------------------------------------------------
-- 3. ROW LEVEL SECURITY — PROFILES
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;

-- Users can read and update their own profile only
create policy "profiles: own row read"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: own row update"
  on public.profiles for update
  using (auth.uid() = id);

-- Admins can read all profiles
create policy "profiles: admin read all"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );


-- ---------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY — AUDITS
--    Users see only their own rows.
--    Admins see all rows.
-- ---------------------------------------------------------------------------

alter table public.audits enable row level security;

create policy "audits: own rows"
  on public.audits for all
  using (auth.uid() = user_id);

create policy "audits: admin all"
  on public.audits for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );


-- ---------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY — GRID SCANS
-- ---------------------------------------------------------------------------

alter table public.grid_scans enable row level security;

create policy "grid_scans: own rows"
  on public.grid_scans for all
  using (auth.uid() = user_id);

create policy "grid_scans: admin all"
  on public.grid_scans for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );


-- ---------------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY — GRID RESULTS
--    No user_id column on grid_results — access controlled via grid_scans.
-- ---------------------------------------------------------------------------

alter table public.grid_results enable row level security;

create policy "grid_results: via scan ownership"
  on public.grid_results for all
  using (
    exists (
      select 1 from public.grid_scans gs
      where gs.id = grid_results.scan_id
        and (
          gs.user_id = auth.uid()
          or exists (
            select 1 from public.profiles p
            where p.id = auth.uid() and p.is_admin = true
          )
        )
    )
  );


-- ---------------------------------------------------------------------------
-- 7. INVITED EMAILS — RLS
--    Only admins can read/write the invite list.
-- ---------------------------------------------------------------------------

alter table public.invited_emails enable row level security;

create policy "invited_emails: admin only"
  on public.invited_emails for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );


-- ---------------------------------------------------------------------------
-- 8. GRANT SERVICE ROLE BYPASS
--    API routes use the service role key which bypasses RLS by default.
--    This is intentional — server-side routes enforce auth themselves.
-- ---------------------------------------------------------------------------
-- No action needed. Supabase service role bypasses RLS automatically.


-- =============================================================================
-- AFTER RUNNING THIS MIGRATION:
--
-- 1. Log in to the app with your email (chad@localsearchally.com)
-- 2. In Supabase SQL editor, run:
--      update public.profiles set is_admin = true where email = 'chad@localsearchally.com';
-- 3. That's it — you now have admin access and the portal is locked to
--    invited emails only.
-- =============================================================================
