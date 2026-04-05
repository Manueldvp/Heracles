begin;

alter table public.profiles
  add column if not exists username text,
  add column if not exists is_public boolean not null default true,
  add column if not exists whatsapp_number text;

alter table public.profiles
  drop constraint if exists profiles_username_format_check;

alter table public.profiles
  add constraint profiles_username_format_check
  check (
    username is null
    or username ~ '^[a-z0-9](?:[a-z0-9_]{1,28}[a-z0-9])?$'
  );

create unique index if not exists profiles_username_uidx
  on public.profiles (lower(username))
  where username is not null;

create or replace function public.get_public_trainer_profile(
  p_username text
)
returns table (
  id uuid,
  username text,
  full_name text,
  avatar_url text,
  bio text,
  specialty text,
  certifications text[],
  whatsapp_number text,
  total_clients bigint,
  active_clients bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with trainer as (
    select
      p.id,
      p.username,
      p.full_name,
      p.avatar_url,
      p.bio,
      p.specialty,
      p.certifications,
      p.whatsapp_number
    from public.profiles p
    where p.role = 'trainer'
      and p.is_public = true
      and p.username is not null
      and lower(p.username) = lower(trim(p_username))
    limit 1
  )
  select
    t.id,
    t.username,
    t.full_name,
    t.avatar_url,
    t.bio,
    t.specialty,
    coalesce(t.certifications, '{}'::text[]) as certifications,
    t.whatsapp_number,
    (
      select count(*)
      from public.clients c
      where c.trainer_id = t.id
    ) as total_clients,
    (
      select count(*)
      from public.clients c
      join public.client_subscriptions cs on cs.client_id = c.id
      where c.trainer_id = t.id
        and cs.status = 'active'
        and cs.end_date > now()
    ) as active_clients
  from trainer t;
$$;

create or replace function public.get_public_trainer_profile_by_id(
  p_trainer_id uuid
)
returns table (
  id uuid,
  username text,
  full_name text,
  avatar_url text,
  bio text,
  specialty text,
  certifications text[],
  whatsapp_number text,
  total_clients bigint,
  active_clients bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with trainer as (
    select
      p.id,
      p.username,
      p.full_name,
      p.avatar_url,
      p.bio,
      p.specialty,
      p.certifications,
      p.whatsapp_number
    from public.profiles p
    where p.role = 'trainer'
      and p.is_public = true
      and p.id = p_trainer_id
    limit 1
  )
  select
    t.id,
    t.username,
    t.full_name,
    t.avatar_url,
    t.bio,
    t.specialty,
    coalesce(t.certifications, '{}'::text[]) as certifications,
    t.whatsapp_number,
    (
      select count(*)
      from public.clients c
      where c.trainer_id = t.id
    ) as total_clients,
    (
      select count(*)
      from public.clients c
      join public.client_subscriptions cs on cs.client_id = c.id
      where c.trainer_id = t.id
        and cs.status = 'active'
        and cs.end_date > now()
    ) as active_clients
  from trainer t;
$$;

create or replace function public.apply_to_public_trainer(
  p_trainer_id uuid,
  p_full_name text,
  p_email text,
  p_goal text default null
)
returns table (
  action text,
  client_id uuid,
  invite_token uuid,
  invite_token_expires_at timestamptz,
  email text,
  message text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_trainer public.profiles%rowtype;
  v_user_id uuid;
  v_client_id uuid;
  v_email text;
  v_name text;
  v_goal text;
  v_invite_token uuid;
  v_invite_token_expires_at timestamptz;
begin
  if p_trainer_id is null then
    raise exception 'Entrenador no valido';
  end if;

  v_email := lower(trim(coalesce(p_email, '')));
  v_name := trim(coalesce(p_full_name, ''));
  v_goal := case lower(trim(coalesce(p_goal, '')))
    when 'muscle_gain' then 'muscle_gain'
    when 'fat_loss' then 'fat_loss'
    when 'maintenance' then 'maintenance'
    when 'strength' then 'strength'
    when 'endurance' then 'endurance'
    when 'general' then 'general'
    else 'general'
  end;

  if v_name = '' then
    raise exception 'Debes ingresar tu nombre.';
  end if;

  if v_email = '' or v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'Debes ingresar un email valido.';
  end if;

  select *
  into v_trainer
  from public.profiles p
  where p.id = p_trainer_id
    and p.role = 'trainer'
    and p.is_public = true;

  if not found then
    raise exception 'Este entrenador no esta disponible en este momento.';
  end if;

  select public.get_user_id_by_email(v_email)
  into v_user_id;

  select c.id
  into v_client_id
  from public.clients c
  where c.trainer_id = p_trainer_id
    and (
      c.email = v_email
      or (v_user_id is not null and c.user_id = v_user_id)
    )
  limit 1;

  if found then
    raise exception 'Este cliente ya esta registrado con este entrenador.' using errcode = '23505';
  end if;

  if v_user_id is not null then
    insert into public.clients (
      trainer_id,
      user_id,
      full_name,
      email,
      goal,
      level,
      onboarding_completed,
      status,
      invite_token,
      invite_token_expires_at
    )
    values (
      p_trainer_id,
      v_user_id,
      v_name,
      v_email,
      v_goal,
      'beginner',
      false,
      'active',
      null,
      null
    )
    returning id
    into v_client_id;

    return query
    select
      'linked-existing-user'::text,
      v_client_id,
      null::uuid,
      null::timestamptz,
      v_email,
      format(
        'Tu solicitud para entrenar con %s fue registrada. Como ya tienes cuenta, el acceso quedo vinculado de inmediato.',
        coalesce(v_trainer.full_name, 'este entrenador')
      );

    return;
  end if;

  v_invite_token := gen_random_uuid();
  v_invite_token_expires_at := now() + interval '7 days';

  insert into public.clients (
    trainer_id,
    full_name,
    email,
    goal,
    level,
    onboarding_completed,
    status,
    invite_token,
    invite_token_expires_at
  )
  values (
    p_trainer_id,
    v_name,
    v_email,
    v_goal,
    'beginner',
    false,
    'pending',
    v_invite_token,
    v_invite_token_expires_at
  )
  returning id
  into v_client_id;

  return query
  select
    'created-pending-invite'::text,
    v_client_id,
    v_invite_token,
    v_invite_token_expires_at,
    v_email,
    format(
      'Recibimos tu solicitud para entrenar con %s. Revisa tu correo para completar el acceso.',
      coalesce(v_trainer.full_name, 'este entrenador')
    );

exception
  when unique_violation then
    raise exception 'Este cliente ya esta registrado con este entrenador.' using errcode = '23505';
end;
$$;

revoke all on function public.get_public_trainer_profile(text) from public;
revoke all on function public.get_public_trainer_profile_by_id(uuid) from public;
revoke all on function public.apply_to_public_trainer(uuid, text, text, text) from public;

grant execute on function public.get_public_trainer_profile(text) to anon, authenticated;
grant execute on function public.get_public_trainer_profile_by_id(uuid) to anon, authenticated;
grant execute on function public.apply_to_public_trainer(uuid, text, text, text) to anon, authenticated;

commit;
