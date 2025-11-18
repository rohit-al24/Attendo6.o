# Faculty Registration Page

This folder contains a simple faculty registration page with email authentication using Supabase.

## Files
- `index.html`: Registration form UI
- `style.css`: Page styling
- `script.js`: Handles registration and Supabase email auth

## Setup
1. Replace `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `script.js` with your Supabase project credentials.
2. Open `index.html` in your browser.
3. Fill the form and register.

## Features
- Faculty registration with name, email, and password
- Email verification via Supabase
- Minimal styling for clean UI

## Automatic role & faculty record assignment

The script attempts to create a faculty details row and assign a `faculty` role after successful sign-up. By default it tries to insert into two tables:

- `faculty_details` — stores faculty profile info (columns used: `user_id`, `name`, `email`, `guid`, `created_at`)
- `user_roles` — stores user role mappings (columns used: `user_id`, `role`, `guid`, `assigned_at`)

If these tables don't exist or your Row Level Security (RLS) policies prevent client-side inserts, the insert will fail. For production you should prefer a server-side approach (trigger or Edge Function) to set roles.

Example SQL trigger (recommended) — run in your Supabase SQL editor to auto-populate profile/roles when an auth user is created:

```sql
create table if not exists faculty_details (
	id uuid primary key default gen_random_uuid(),
	user_id uuid,
	name text,
	email text,
	guid text,
	created_at timestamptz default now()
);

create table if not exists user_roles (
	id uuid primary key default gen_random_uuid(),
	user_id uuid,
	role text,
	guid text,
	assigned_at timestamptz default now()
);

-- function that inserts into faculty tables when a new auth.user row appears
create or replace function public.handle_new_user()
returns trigger as $$
begin
	insert into faculty_details (user_id, email, name, guid) values (new.id, new.email, new.raw_user_meta->>'name', new.raw_user_meta->>'guid');
	insert into user_roles (user_id, role, guid) values (new.id, 'faculty', new.raw_user_meta->>'guid');
	return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_insert
after insert on auth.users
for each row execute procedure public.handle_new_user();
```

Notes:
- If you run the client-side inserts, make sure your RLS policies allow them (e.g., allow inserts only for authenticated users or via a limited Edge Function).
- The SQL example uses `raw_user_meta` (Supabase's stored metadata) — depending on your Supabase version you may need to adapt the column names.

If you want, I can:

- Update the script to use your real table names and columns if you share them.
- Add a small Edge Function that performs the inserts using the service role key (safer than client-side inserts).
