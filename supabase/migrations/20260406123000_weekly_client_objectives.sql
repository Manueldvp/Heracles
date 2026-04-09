create table if not exists public.weekly_client_objectives (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  week_start date not null,
  title text not null,
  metric text not null check (metric in ('workouts', 'daily_checkins', 'weekly_checkin', 'weekly_weight')),
  target_value integer not null default 1 check (target_value >= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists weekly_client_objectives_client_week_idx
on public.weekly_client_objectives (client_id, week_start desc);

create index if not exists weekly_client_objectives_trainer_week_idx
on public.weekly_client_objectives (trainer_id, week_start desc);

drop trigger if exists set_weekly_client_objectives_updated_at on public.weekly_client_objectives;
create trigger set_weekly_client_objectives_updated_at
before update on public.weekly_client_objectives
for each row execute function public.set_updated_at();

alter table public.weekly_client_objectives enable row level security;
alter table public.weekly_client_objectives force row level security;

drop policy if exists trainer_manage_own_active_client_weekly_objectives on public.weekly_client_objectives;
create policy trainer_manage_own_active_client_weekly_objectives
on public.weekly_client_objectives
for all
to authenticated
using (
  public.has_active_subscription(client_id)
  and public.is_client_trainer(client_id)
)
with check (
  public.has_active_subscription(client_id)
  and public.is_client_trainer(client_id)
  and trainer_id = auth.uid()
);

drop policy if exists client_read_own_active_weekly_objectives on public.weekly_client_objectives;
create policy client_read_own_active_weekly_objectives
on public.weekly_client_objectives
for select
to authenticated
using (
  public.has_active_subscription(client_id)
  and public.is_client_owner(client_id)
);
