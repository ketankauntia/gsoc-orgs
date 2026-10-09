-- Accounts carried over from the previous auth provider. Their profiles,
-- claims and posts are migrated under the old user id (scripts/migrate-from-supabase.ts),
-- so verified content stays public. At first sign-in with the same verified
-- email, ensure_profile moves everything to the new Neon Auth user id.

create table private.legacy_accounts (
  legacy_user_id uuid primary key,
  email public.citext not null unique,
  migrated_at timestamptz not null default now(),
  relinked_to uuid,
  relinked_at timestamptz
);

-- Re-keying a profile must carry its claims along.
alter table public.participations drop constraint participations_user_id_fkey;
alter table public.participations
  add constraint participations_user_id_fkey foreign key (user_id) references public.profiles(user_id) on delete cascade on update cascade;

create or replace function private.relink_legacy_account(p_user uuid, p_verified_email text)
returns void language plpgsql set search_path = '' as $$
declare legacy private.legacy_accounts;
begin
  if p_verified_email is null or exists (select 1 from public.profiles where user_id = p_user) then return; end if;
  select * into legacy from private.legacy_accounts where email = p_verified_email::public.citext and relinked_to is null for update;
  if legacy.legacy_user_id is null or not exists (select 1 from public.profiles where user_id = legacy.legacy_user_id) then return; end if;
  update public.profiles set user_id = p_user where user_id = legacy.legacy_user_id;
  update public.posts set created_by = p_user where created_by = legacy.legacy_user_id;
  update public.proposals set file_uploaded_by = p_user where file_uploaded_by = legacy.legacy_user_id;
  update private.legacy_accounts set relinked_to = p_user, relinked_at = now() where legacy_user_id = legacy.legacy_user_id;
  perform private.audit(p_user, 'relink_legacy_account', 'profile', p_user, null, jsonb_build_object('legacy_user_id', legacy.legacy_user_id), null);
end;
$$;

drop function public.ensure_profile(uuid, text);

-- p_verified_email: the account's email only when the provider verified it.
create function public.ensure_profile(p_user uuid, p_display_name text, p_verified_email text)
returns public.profiles language plpgsql security definer set search_path = '' as $$
declare result public.profiles;
begin
  if p_user is null then raise exception 'Sign in first'; end if;
  perform private.relink_legacy_account(p_user, p_verified_email);
  insert into public.profiles(user_id, display_name)
  values (p_user, left(coalesce(nullif(btrim(p_display_name), ''), 'GSoC contributor'), 80))
  on conflict (user_id) do nothing;
  select * into result from public.profiles where user_id = p_user;
  return result;
end;
$$;

revoke execute on function public.ensure_profile(uuid, text, text) from public;
revoke execute on function private.relink_legacy_account(uuid, text) from public;
revoke all on private.legacy_accounts from public;
