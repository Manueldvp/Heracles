create table if not exists public.payment_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  provider text not null default 'webpay' check (provider in ('webpay')),
  plan_type text not null check (plan_type in ('pro', 'studio')),
  amount integer not null,
  buy_order text not null unique,
  session_id text not null unique,
  webpay_token text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'failed')),
  authorization_code text,
  raw_response jsonb,
  committed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payment_attempts_user_id_idx on public.payment_attempts (user_id);
create index if not exists payment_attempts_status_idx on public.payment_attempts (status);

drop trigger if exists set_payment_attempts_updated_at on public.payment_attempts;
create trigger set_payment_attempts_updated_at
before update on public.payment_attempts
for each row execute function public.set_updated_at();
