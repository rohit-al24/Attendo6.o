-- Student account setup helpers
-- 1) Add optional columns on students
alter table public.students add column if not exists password text;
alter table public.students add column if not exists account_verified boolean default false;
alter table public.students add column if not exists verified_at timestamptz;

-- 2) Function to lookup student by email (via profiles->students->classes)
create or replace function public.lookup_student_by_email(p_email text)
returns table(
  id uuid,
  full_name text,
  roll_number text,
  email text,
  department text,
  year int,
  section text
)
language sql
security definer
set search_path = public
as $$
  select s.id,
         s.full_name,
         s.roll_number,
         s.email,
         c.department,
         c.year,
         c.section
  from public.students s
  left join public.classes c on c.id = s.class_id
  where lower(s.email) = lower(p_email)
  limit 1;
$$;

revoke all on function public.lookup_student_by_email(text) from public;
grant execute on function public.lookup_student_by_email(text) to anon, authenticated;

-- 3) Function to set password and mark verified
create or replace function public.student_set_password(p_email text, p_password_hash text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.students
    set password = p_password_hash,
        account_verified = true,
        verified_at = now()
    where lower(email) = lower(p_email);
  return found;
end;
$$;

revoke all on function public.student_set_password(text, text) from public;
grant execute on function public.student_set_password(text, text) to anon, authenticated;

-- 4) Alternate lookup by roll number (exact, case-insensitive)
create or replace function public.lookup_student_by_roll(p_roll text)
returns table(
  id uuid,
  full_name text,
  roll_number text,
  email text,
  department text,
  year int,
  section text
)
language sql
security definer
set search_path = public
as $$
  select s.id,
         s.full_name,
         s.roll_number,
         null::text as email,
         c.department,
         c.year,
         c.section
  from public.students s
  join public.classes c on c.id = s.class_id
  where lower(s.roll_number) = lower(p_roll)
  limit 1;
$$;

revoke all on function public.lookup_student_by_roll(text) from public;
grant execute on function public.lookup_student_by_roll(text) to anon, authenticated;

-- 5) Set password by student id
create or replace function public.student_set_password_by_id(p_student_id uuid, p_password_hash text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.students
    set password = p_password_hash,
        account_verified = true,
        verified_at = now()
    where id = p_student_id;

  return found;
end;
$$;

revoke all on function public.student_set_password_by_id(uuid, text) from public;
grant execute on function public.student_set_password_by_id(uuid, text) to anon, authenticated;
