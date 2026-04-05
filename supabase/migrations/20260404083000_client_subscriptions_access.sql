begin;

alter table public.client_subscriptions
  add constraint client_subscriptions_status_check
  check (status in ('active', 'expired', 'paused'));

create unique index if not exists client_subscriptions_client_id_uidx
  on public.client_subscriptions (client_id);

create index if not exists client_subscriptions_trainer_id_idx
  on public.client_subscriptions (trainer_id);

create index if not exists client_subscriptions_status_end_date_idx
  on public.client_subscriptions (status, end_date);

create index if not exists client_subscriptions_trainer_status_end_date_idx
  on public.client_subscriptions (trainer_id, status, end_date);

create or replace function public.is_client_owner(p_client_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.clients c
    where c.id = p_client_id
      and c.user_id = auth.uid()
  );
$$;

create or replace function public.is_client_trainer(p_client_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.clients c
    where c.id = p_client_id
      and c.trainer_id = auth.uid()
  );
$$;

create or replace function public.has_active_subscription(p_client_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.client_subscriptions cs
    where cs.client_id = p_client_id
      and cs.status = 'active'
      and cs.end_date > now()
  );
$$;

revoke all on function public.is_client_owner(uuid) from public;
revoke all on function public.is_client_trainer(uuid) from public;
revoke all on function public.has_active_subscription(uuid) from public;
grant execute on function public.is_client_owner(uuid) to authenticated;
grant execute on function public.is_client_trainer(uuid) to authenticated;
grant execute on function public.has_active_subscription(uuid) to authenticated;

create or replace function public.sync_client_subscription_trainer_id()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_trainer_id uuid;
begin
  select c.trainer_id
  into v_trainer_id
  from public.clients c
  where c.id = new.client_id;

  if v_trainer_id is null then
    raise exception 'No se encontro trainer para el client_id %', new.client_id;
  end if;

  new.trainer_id := v_trainer_id;
  return new;
end;
$$;

create or replace function public.sync_client_subscription_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.end_date is null then
    raise exception 'client_subscriptions.end_date no puede ser null';
  end if;

  if new.end_date <= now() then
    new.status := 'expired';
  elsif new.status = 'expired' or new.status is null then
    new.status := 'active';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_sync_client_subscription_trainer_id on public.client_subscriptions;
create trigger trg_sync_client_subscription_trainer_id
before insert or update of client_id, trainer_id
on public.client_subscriptions
for each row
execute function public.sync_client_subscription_trainer_id();

drop trigger if exists trg_sync_client_subscription_status on public.client_subscriptions;
create trigger trg_sync_client_subscription_status
before insert or update of end_date, status
on public.client_subscriptions
for each row
execute function public.sync_client_subscription_status();

create or replace function public.expire_client_subscriptions()
returns void
language sql
security definer
set search_path = public
as $$
  update public.client_subscriptions
  set status = 'expired'
  where status <> 'expired'
    and end_date <= now();
$$;

create or replace function public.activate_client_subscription(
  p_client_id uuid,
  p_days integer
)
returns public.client_subscriptions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_client public.clients%rowtype;
  v_existing public.client_subscriptions%rowtype;
  v_start_at timestamptz;
  v_end_at timestamptz;
  v_result public.client_subscriptions;
begin
  if auth.uid() is null then
    raise exception 'Debes iniciar sesion.';
  end if;

  if p_days is null or p_days <= 0 then
    raise exception 'p_days debe ser mayor que 0';
  end if;

  select *
  into v_client
  from public.clients c
  where c.id = p_client_id
    and c.trainer_id = auth.uid();

  if not found then
    raise exception 'No autorizado para activar esta suscripcion';
  end if;

  select *
  into v_existing
  from public.client_subscriptions cs
  where cs.client_id = p_client_id;

  if found and v_existing.status = 'active' and v_existing.end_date > now() then
    v_start_at := coalesce(v_existing.start_date::timestamptz, now());
    v_end_at := v_existing.end_date::timestamptz + make_interval(days => p_days);
  else
    v_start_at := now();
    v_end_at := now() + make_interval(days => p_days);
  end if;

  insert into public.client_subscriptions (
    client_id,
    trainer_id,
    start_date,
    end_date,
    status
  )
  values (
    p_client_id,
    v_client.trainer_id,
    v_start_at,
    v_end_at,
    'active'
  )
  on conflict (client_id)
  do update set
    trainer_id = excluded.trainer_id,
    start_date = excluded.start_date,
    end_date = excluded.end_date,
    status = 'active'
  returning *
  into v_result;

  return v_result;
end;
$$;

create or replace function public.renew_client_subscription(
  p_client_id uuid,
  p_days integer
)
returns public.client_subscriptions
language plpgsql
security definer
set search_path = public
as $$
begin
  return public.activate_client_subscription(p_client_id, p_days);
end;
$$;

create or replace function public.cancel_client_subscription(
  p_client_id uuid
)
returns public.client_subscriptions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_client public.clients%rowtype;
  v_result public.client_subscriptions;
begin
  if auth.uid() is null then
    raise exception 'Debes iniciar sesion.';
  end if;

  select *
  into v_client
  from public.clients c
  where c.id = p_client_id
    and c.trainer_id = auth.uid();

  if not found then
    raise exception 'No autorizado para pausar esta suscripcion';
  end if;

  update public.client_subscriptions
  set status = 'paused'
  where client_id = p_client_id
  returning *
  into v_result;

  if v_result.id is null then
    raise exception 'No existe una suscripcion para este cliente';
  end if;

  return v_result;
end;
$$;

revoke all on function public.activate_client_subscription(uuid, integer) from public;
revoke all on function public.renew_client_subscription(uuid, integer) from public;
revoke all on function public.cancel_client_subscription(uuid) from public;
grant execute on function public.activate_client_subscription(uuid, integer) to authenticated;
grant execute on function public.renew_client_subscription(uuid, integer) to authenticated;
grant execute on function public.cancel_client_subscription(uuid) to authenticated;

alter table public.client_subscriptions enable row level security;
alter table public.client_subscriptions force row level security;

alter table public.clients enable row level security;
alter table public.clients force row level security;

alter table public.routines enable row level security;
alter table public.routines force row level security;

alter table public.nutrition_plans enable row level security;
alter table public.nutrition_plans force row level security;

alter table public.checkins enable row level security;
alter table public.checkins force row level security;

alter table public.exercise_logs enable row level security;
alter table public.exercise_logs force row level security;

drop policy if exists trainer_select_own_client_subscriptions on public.client_subscriptions;
drop policy if exists trainer_insert_own_client_subscriptions on public.client_subscriptions;
drop policy if exists trainer_update_own_client_subscriptions on public.client_subscriptions;
drop policy if exists trainer_delete_own_client_subscriptions on public.client_subscriptions;
drop policy if exists client_select_own_subscription on public.client_subscriptions;

drop policy if exists trainer_manage_own_clients on public.clients;
drop policy if exists client_select_own_client on public.clients;
drop policy if exists client_update_own_client on public.clients;
drop policy if exists trainer_own_clients on public.clients;
drop policy if exists client_see_own on public.clients;
drop policy if exists clients_update_own on public.clients;
drop policy if exists public_read_by_invite_token on public.clients;
drop policy if exists read_by_invite_token on public.clients;

drop policy if exists trainer_manage_own_active_client_routines on public.routines;
drop policy if exists client_read_own_active_routines on public.routines;
drop policy if exists trainer_own_routines on public.routines;
drop policy if exists client_see_own_routines on public.routines;
drop policy if exists client_set_active_routine on public.routines;

drop policy if exists trainer_manage_own_active_client_nutrition on public.nutrition_plans;
drop policy if exists client_read_own_active_nutrition on public.nutrition_plans;
drop policy if exists trainer_own_nutrition on public.nutrition_plans;
drop policy if exists client_see_own_nutrition on public.nutrition_plans;
drop policy if exists client_set_active_nutrition on public.nutrition_plans;

drop policy if exists trainer_read_own_active_client_checkins on public.checkins;
drop policy if exists trainer_manage_own_active_client_checkins on public.checkins;
drop policy if exists client_read_own_active_checkins on public.checkins;
drop policy if exists client_insert_own_active_checkins on public.checkins;
drop policy if exists client_update_own_active_checkins on public.checkins;
drop policy if exists client_delete_own_active_checkins on public.checkins;
drop policy if exists trainer_own_checkins on public.checkins;
drop policy if exists client_see_own_checkins on public.checkins;
drop policy if exists client_insert_checkin on public.checkins;

drop policy if exists trainer_read_own_active_client_exercise_logs on public.exercise_logs;
drop policy if exists trainer_manage_own_active_client_exercise_logs on public.exercise_logs;
drop policy if exists client_read_own_active_exercise_logs on public.exercise_logs;
drop policy if exists client_insert_own_active_exercise_logs on public.exercise_logs;
drop policy if exists client_update_own_active_exercise_logs on public.exercise_logs;
drop policy if exists client_delete_own_active_exercise_logs on public.exercise_logs;
drop policy if exists clients_delete_own_logs on public.exercise_logs;
drop policy if exists clients_insert_own_logs on public.exercise_logs;
drop policy if exists clients_read_own_logs on public.exercise_logs;
drop policy if exists trainers_read_logs on public.exercise_logs;

create policy trainer_select_own_client_subscriptions
on public.client_subscriptions
for select
to authenticated
using (
  trainer_id = auth.uid()
  and exists (
    select 1
    from public.clients c
    where c.id = client_id
      and c.trainer_id = auth.uid()
  )
);

create policy trainer_insert_own_client_subscriptions
on public.client_subscriptions
for insert
to authenticated
with check (
  trainer_id = auth.uid()
  and exists (
    select 1
    from public.clients c
    where c.id = client_id
      and c.trainer_id = auth.uid()
  )
);

create policy trainer_update_own_client_subscriptions
on public.client_subscriptions
for update
to authenticated
using (
  trainer_id = auth.uid()
  and exists (
    select 1
    from public.clients c
    where c.id = client_id
      and c.trainer_id = auth.uid()
  )
)
with check (
  trainer_id = auth.uid()
  and exists (
    select 1
    from public.clients c
    where c.id = client_id
      and c.trainer_id = auth.uid()
  )
);

create policy trainer_delete_own_client_subscriptions
on public.client_subscriptions
for delete
to authenticated
using (
  trainer_id = auth.uid()
  and exists (
    select 1
    from public.clients c
    where c.id = client_id
      and c.trainer_id = auth.uid()
  )
);

create policy client_select_own_subscription
on public.client_subscriptions
for select
to authenticated
using (
  exists (
    select 1
    from public.clients c
    where c.id = client_id
      and c.user_id = auth.uid()
  )
);

create policy trainer_manage_own_clients
on public.clients
for all
to authenticated
using (trainer_id = auth.uid())
with check (trainer_id = auth.uid());

create policy client_select_own_client
on public.clients
for select
to authenticated
using (user_id = auth.uid());

create policy client_update_own_client
on public.clients
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy trainer_manage_own_active_client_routines
on public.routines
for all
to authenticated
using (
  public.has_active_subscription(client_id)
  and public.is_client_trainer(client_id)
)
with check (
  public.has_active_subscription(client_id)
  and public.is_client_trainer(client_id)
);

create policy client_read_own_active_routines
on public.routines
for select
to authenticated
using (
  public.has_active_subscription(client_id)
  and public.is_client_owner(client_id)
);

create policy trainer_manage_own_active_client_nutrition
on public.nutrition_plans
for all
to authenticated
using (
  public.has_active_subscription(client_id)
  and public.is_client_trainer(client_id)
)
with check (
  public.has_active_subscription(client_id)
  and public.is_client_trainer(client_id)
);

create policy client_read_own_active_nutrition
on public.nutrition_plans
for select
to authenticated
using (
  public.has_active_subscription(client_id)
  and public.is_client_owner(client_id)
);

create policy trainer_manage_own_active_client_checkins
on public.checkins
for all
to authenticated
using (
  public.has_active_subscription(client_id)
  and public.is_client_trainer(client_id)
)
with check (
  public.has_active_subscription(client_id)
  and public.is_client_trainer(client_id)
);

create policy client_read_own_active_checkins
on public.checkins
for select
to authenticated
using (
  public.has_active_subscription(client_id)
  and public.is_client_owner(client_id)
);

create policy client_insert_own_active_checkins
on public.checkins
for insert
to authenticated
with check (
  public.has_active_subscription(client_id)
  and public.is_client_owner(client_id)
);

create policy client_update_own_active_checkins
on public.checkins
for update
to authenticated
using (
  public.has_active_subscription(client_id)
  and public.is_client_owner(client_id)
)
with check (
  public.has_active_subscription(client_id)
  and public.is_client_owner(client_id)
);

create policy client_delete_own_active_checkins
on public.checkins
for delete
to authenticated
using (
  public.has_active_subscription(client_id)
  and public.is_client_owner(client_id)
);

create policy trainer_manage_own_active_client_exercise_logs
on public.exercise_logs
for all
to authenticated
using (
  public.has_active_subscription(client_id)
  and public.is_client_trainer(client_id)
)
with check (
  public.has_active_subscription(client_id)
  and public.is_client_trainer(client_id)
);

create policy client_read_own_active_exercise_logs
on public.exercise_logs
for select
to authenticated
using (
  public.has_active_subscription(client_id)
  and public.is_client_owner(client_id)
);

create policy client_insert_own_active_exercise_logs
on public.exercise_logs
for insert
to authenticated
with check (
  public.has_active_subscription(client_id)
  and public.is_client_owner(client_id)
);

create policy client_update_own_active_exercise_logs
on public.exercise_logs
for update
to authenticated
using (
  public.has_active_subscription(client_id)
  and public.is_client_owner(client_id)
)
with check (
  public.has_active_subscription(client_id)
  and public.is_client_owner(client_id)
);

create policy client_delete_own_active_exercise_logs
on public.exercise_logs
for delete
to authenticated
using (
  public.has_active_subscription(client_id)
  and public.is_client_owner(client_id)
);

commit;

-- Consultas utiles para el dashboard del trainer:
-- Clientes activos:
-- select c.*, cs.status, cs.end_date
-- from public.clients c
-- join public.client_subscriptions cs on cs.client_id = c.id
-- where c.trainer_id = auth.uid()
--   and cs.status = 'active'
--   and cs.end_date > now()
-- order by cs.end_date asc;

-- Clientes expirados o pausados:
-- select c.*, cs.status, cs.end_date
-- from public.clients c
-- left join public.client_subscriptions cs on cs.client_id = c.id
-- where c.trainer_id = auth.uid()
--   and (
--     cs.id is null
--     or cs.status in ('expired', 'paused')
--     or cs.end_date <= now()
--   )
-- order by cs.end_date asc nulls first;

-- Clientes por vencer en 3 dias:
-- select c.*, cs.status, cs.end_date
-- from public.clients c
-- join public.client_subscriptions cs on cs.client_id = c.id
-- where c.trainer_id = auth.uid()
--   and cs.status = 'active'
--   and cs.end_date > now()
--   and cs.end_date <= now() + interval '3 days'
-- order by cs.end_date asc;
