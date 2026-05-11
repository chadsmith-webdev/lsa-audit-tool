-- =============================================================================
-- Subscriptions Migration
-- Local Search Ally — lsa-audit-tool
-- =============================================================================
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query)
-- Adds: subscriptions table for PayPal-backed Pro / Agency plans.
-- Safe to run on existing data.
-- =============================================================================


-- ---------------------------------------------------------------------------
-- 1. SUBSCRIPTIONS TABLE
--    One row per user. Tracks PayPal subscription lifecycle.
--    Plan & status drive Pro-Tool gating across the app.
-- ---------------------------------------------------------------------------

create table if not exists public.subscriptions (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid not null unique references auth.users (id) on delete cascade,
  paypal_subscription_id   text unique,
  plan                     text not null default 'free'
                             check (plan in ('free', 'pro', 'agency')),
  billing                  text not null default 'monthly'
                             check (billing in ('monthly', 'annual')),
  status                   text not null default 'inactive'
                             check (status in (
                               'inactive',     -- free tier or never subscribed
                               'trialing',     -- in 14-day trial window
                               'active',       -- paying
                               'past_due',     -- payment failure, in grace
                               'cancelled',    -- user cancelled, still has access until period_end
                               'expired'       -- access has ended
                             )),
  trial_ends_at            timestamptz,
  current_period_end       timestamptz,
  early_adopter            boolean not null default false,
  cancelled_at             timestamptz,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create index if not exists subscriptions_user_id_idx on public.subscriptions (user_id);
create index if not exists subscriptions_status_idx on public.subscriptions (status);
create index if not exists subscriptions_paypal_id_idx on public.subscriptions (paypal_subscription_id);

-- Keep updated_at fresh
create or replace function public.touch_subscription_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists subscriptions_touch_updated_at on public.subscriptions;
create trigger subscriptions_touch_updated_at
  before update on public.subscriptions
  for each row execute function public.touch_subscription_updated_at();


-- ---------------------------------------------------------------------------
-- 2. RLS POLICIES
--    Users can read their own subscription row.
--    Writes go through service-role (server routes), never the client.
-- ---------------------------------------------------------------------------

alter table public.subscriptions enable row level security;

drop policy if exists "subscriptions_self_read" on public.subscriptions;
create policy "subscriptions_self_read"
  on public.subscriptions
  for select
  using (auth.uid() = user_id);

-- No insert/update/delete policy for authenticated role
-- → service_role bypasses RLS for webhook + trial-start routes


-- ---------------------------------------------------------------------------
-- 3. PAYPAL EVENTS AUDIT LOG
--    Every webhook event gets logged for reconciliation + debugging.
--    Idempotency: same event_id is recorded only once.
-- ---------------------------------------------------------------------------

create table if not exists public.paypal_events (
  id              uuid primary key default gen_random_uuid(),
  event_id        text unique not null,
  event_type      text not null,
  resource_id     text,
  raw             jsonb not null,
  processed_at    timestamptz,
  error           text,
  created_at      timestamptz not null default now()
);

create index if not exists paypal_events_event_type_idx on public.paypal_events (event_type);
create index if not exists paypal_events_resource_id_idx on public.paypal_events (resource_id);

alter table public.paypal_events enable row level security;

-- No public access; service_role only


-- ---------------------------------------------------------------------------
-- 4. BACKFILL: ensure every existing user has a free-tier subscription row
-- ---------------------------------------------------------------------------

insert into public.subscriptions (user_id, plan, status)
select id, 'free', 'inactive'
from auth.users
on conflict (user_id) do nothing;


-- ---------------------------------------------------------------------------
-- 5. AUTO-CREATE SUBSCRIPTION ROW FOR NEW SIGNUPS
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user_subscription()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.subscriptions (user_id, plan, status)
  values (new.id, 'free', 'inactive')
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_subscription on auth.users;
create trigger on_auth_user_created_subscription
  after insert on auth.users
  for each row execute function public.handle_new_user_subscription();
