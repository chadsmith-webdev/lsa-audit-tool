-- =============================================================================
-- Rename plan tier 'agency' → 'multi_location'
-- =============================================================================
-- Run in Supabase SQL editor. Safe to run multiple times.
-- The pricing tier was renamed from "Agency" to "Multi-Location" since the
-- product is positioned for operators, not marketing agencies.
-- =============================================================================

-- Drop the old check constraint, migrate existing rows, then re-add it.
alter table public.subscriptions
  drop constraint if exists subscriptions_plan_check;

update public.subscriptions
   set plan = 'multi_location'
 where plan = 'agency';

alter table public.subscriptions
  add constraint subscriptions_plan_check
    check (plan in ('free', 'pro', 'multi_location'));
