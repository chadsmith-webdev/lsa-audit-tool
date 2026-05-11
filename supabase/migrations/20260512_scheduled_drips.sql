-- Track scheduled Resend drip emails so they can be cancelled when a lead
-- converts (starts a trial / becomes active). Without this, the 6 follow-up
-- emails fire even after someone has already signed up, which is annoying
-- and contradicts the message of each drip.

create table if not exists public.scheduled_drips (
  id                bigserial primary key,
  email             text not null,
  audit_id          uuid references public.audits (id) on delete set null,
  resend_id         text not null,
  subject           text,
  scheduled_at      timestamptz not null,
  cancelled_at      timestamptz,
  created_at        timestamptz not null default now()
);

create index if not exists scheduled_drips_email_idx
  on public.scheduled_drips (email)
  where cancelled_at is null;

create index if not exists scheduled_drips_scheduled_at_idx
  on public.scheduled_drips (scheduled_at)
  where cancelled_at is null;

-- Service-role only — RLS denies all by default. Server routes use the
-- service-role client (getSupabase) which bypasses RLS.
alter table public.scheduled_drips enable row level security;
