-- =============================================================================
-- GBP Connections Migration
-- Local Search Ally — lsa-audit-tool
-- =============================================================================
-- Stores per-user Google Business Profile OAuth connections.
-- Refresh tokens are sensitive — table is service-role only (no anon read).
-- =============================================================================

create table if not exists public.gbp_connections (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  google_email    text not null,
  refresh_token   text not null,
  access_token    text,
  token_expires_at timestamptz,
  scope           text not null,
  account_id      text,                 -- selected GBP account (e.g. "accounts/123")
  location_id     text,                 -- selected location (e.g. "locations/456")
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (user_id)
);

create index if not exists gbp_connections_user_idx
  on public.gbp_connections (user_id);

-- RLS: deny everything to anon. Service role bypasses RLS so server code works.
alter table public.gbp_connections enable row level security;

-- Users can read their own connection record (no token fields exposed via select policy).
-- We keep this restrictive: route handlers use service role and never expose tokens.
drop policy if exists "gbp_connections_self_read" on public.gbp_connections;
create policy "gbp_connections_self_read"
  on public.gbp_connections
  for select
  using (auth.uid() = user_id);

-- updated_at maintenance
create or replace function public.gbp_connections_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists gbp_connections_updated_at on public.gbp_connections;
create trigger gbp_connections_updated_at
  before update on public.gbp_connections
  for each row execute procedure public.gbp_connections_set_updated_at();
