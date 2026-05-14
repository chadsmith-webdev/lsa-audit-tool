-- =============================================================================
-- Owner Account Migration
-- Local Search Ally — lsa-audit-tool
-- =============================================================================
-- Adds is_owner flag so the account holder can use all Pro tools without
-- going through PayPal. Rows without a paypal_subscription_id are never
-- touched by the webhook, so this flag is stable.
-- =============================================================================

alter table public.subscriptions
  add column if not exists is_owner boolean not null default false;

-- Mark Chad's account. Matches by email so this is safe to re-run.
update public.subscriptions
set
  is_owner = true,
  plan     = 'multi_location',
  status   = 'active'
where user_id = (
  select id from auth.users where email = 'smithchadlamont@gmail.com' limit 1
);
