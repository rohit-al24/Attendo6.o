-- Faculty invite flow: invites table + trigger to map new auth users

create table if not exists public.faculty_invites (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  full_name text not null,
  department text not null,
  status text not null default 'pending' check (status in ('pending','accepted','revoked')),
  invited_at timestamptz not null default now(),
  accepted_at timestamptz
);

-- Enable RLS, but we'll primarily use service role for writes.
alter table public.faculty_invites enable row level security;

-- Minimal policies (optional): allow no public access by default.
-- You can add admin-specific policies later if needed.

-- Trigger to map auth users to faculty on signup if they were invited
create or replace function public.handle_faculty_on_signup()
returns trigger as $$
begin
  -- Only act if an invite exists for this email
  if exists(select 1 from public.faculty_invites fi where lower(fi.email) = lower(new.email) and fi.status = 'pending') then
    -- Insert into faculty
    insert into public.faculty (user_id, email, full_name, department)
    select new.id, new.email, fi.full_name, fi.department
    from public.faculty_invites fi
    where lower(fi.email) = lower(new.email) and fi.status = 'pending'
    limit 1;

    -- Assign role
    insert into public.user_roles (user_id, role)
    values (new.id, 'faculty')
    on conflict do nothing;

    -- Mark invite accepted
    update public.faculty_invites set status = 'accepted', accepted_at = now()
    where lower(email) = lower(new.email) and status = 'pending';
  end if;
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger on auth.users
create trigger on_auth_user_created_faculty
  after insert on auth.users
  for each row execute function public.handle_faculty_on_signup();
