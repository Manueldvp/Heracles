alter table public.profiles
add column if not exists assistant_character text not null default 'male';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_assistant_character_check'
  ) then
    alter table public.profiles
    add constraint profiles_assistant_character_check
    check (assistant_character in ('male', 'female'));
  end if;
end
$$;
