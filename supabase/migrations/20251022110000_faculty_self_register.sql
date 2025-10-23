-- Self-service faculty mapping without any server code
-- Creates a security definer RPC the invited user can call from the browser

create or replace function public.faculty_self_register(p_full_name text, p_department text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_email text;
begin
  if v_uid is null then
    raise exception 'Unauthorized';
  end if;

  -- fetch email from auth.users
  select email into v_email from auth.users where id = v_uid;

  -- Insert if missing (does not require a unique constraint)
  insert into public.faculty(user_id, email, full_name, department)
  select v_uid, v_email, p_full_name, p_department
  where not exists (
    select 1 from public.faculty f where f.user_id = v_uid
  );

  -- Ensure latest values
  update public.faculty
     set email = v_email,
         full_name = p_full_name,
         department = p_department
   where user_id = v_uid;

  -- ensure role exists (without relying on PK/unique constraint)
  insert into public.user_roles(user_id, role)
  select v_uid, 'faculty'
  where not exists (
    select 1 from public.user_roles ur where ur.user_id = v_uid and ur.role = 'faculty'
  );

  -- If invites table exists, mark accepted; support either `status` or `invite_status` column
  begin
    perform 1 from pg_catalog.pg_class c
      join pg_catalog.pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relname = 'faculty_invites' and c.relkind = 'r';
    if found then
      -- Try with column name `status`
      begin
        update public.faculty_invites set status = 'accepted', accepted_at = now()
         where lower(email) = lower(v_email) and status = 'pending';
      exception when undefined_column then
        -- Fallback to `invite_status`
        begin
          update public.faculty_invites set invite_status = 'accepted', accepted_at = now()
           where lower(email) = lower(v_email) and invite_status = 'pending';
        exception when others then null; end;
      end;
    end if;
  exception when undefined_table then
    null; -- ignore if invites table truly doesn't exist
  end;
end;
$$;

-- Allow authenticated users to call the function
revoke all on function public.faculty_self_register(text, text) from public;
grant execute on function public.faculty_self_register(text, text) to authenticated;
