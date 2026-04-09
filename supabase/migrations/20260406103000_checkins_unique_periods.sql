with ranked_daily as (
  select
    id,
    row_number() over (
      partition by client_id, (timezone('America/Santiago', created_at))::date
      order by created_at desc, id desc
    ) as rn
  from public.checkins
  where type = 'daily'
),
ranked_weekly as (
  select
    id,
    row_number() over (
      partition by client_id, date_trunc('week', timezone('America/Santiago', created_at))::date
      order by created_at desc, id desc
    ) as rn
  from public.checkins
  where type = 'weekly'
)
delete from public.checkins
where id in (
  select id from ranked_daily where rn > 1
  union all
  select id from ranked_weekly where rn > 1
);

create unique index if not exists checkins_daily_once_per_local_day_idx
on public.checkins (
  client_id,
  ((timezone('America/Santiago', created_at))::date)
)
where type = 'daily';

create unique index if not exists checkins_weekly_once_per_local_week_idx
on public.checkins (
  client_id,
  (date_trunc('week', timezone('America/Santiago', created_at))::date)
)
where type = 'weekly';
