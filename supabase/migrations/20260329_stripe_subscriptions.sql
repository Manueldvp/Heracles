alter table public.subscriptions
  add column if not exists ai_limit integer,
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text;

alter table public.subscriptions
  drop constraint if exists subscriptions_plan_type_check;

alter table public.subscriptions
  add constraint subscriptions_plan_type_check
  check (plan_type in ('free', 'pro', 'studio', 'premium'));

update public.subscriptions
set
  plan_type = case when plan_type = 'premium' then 'pro' else plan_type end,
  client_limit = case
    when plan_type = 'studio' then 50
    when plan_type in ('pro', 'premium') then 20
    else 5
  end,
  ai_limit = case
    when plan_type = 'studio' then null
    when plan_type in ('pro', 'premium') then 50
    else 3
  end;
