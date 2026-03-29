create table if not exists public.onboarding_progress (
  user_id uuid primary key,
  created_client boolean not null default false,
  created_routine boolean not null default false,
  assigned_routine boolean not null default false,
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_onboarding_progress_updated_at on public.onboarding_progress;
create trigger set_onboarding_progress_updated_at
before update on public.onboarding_progress
for each row execute function public.set_updated_at();
