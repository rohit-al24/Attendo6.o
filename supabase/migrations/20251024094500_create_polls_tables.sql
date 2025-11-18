-- Migration: create polls, poll_options, poll_votes tables
-- Migration: create polls, poll_options, poll_votes tables

-- Ensure gen_random_uuid() is available. This requires the pgcrypto extension.
create extension if not exists pgcrypto;

-- Polls: stores a poll created by an advisor for a specific class
create table if not exists public.polls (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  class_id uuid not null,
  created_by_faculty_id uuid,
  is_open boolean default true,
  published boolean default false,
  created_at timestamptz default now(),
  -- optional FK to faculty (set null if faculty row removed)
  constraint polls_created_by_faculty_fkey foreign key (created_by_faculty_id) references public.faculty(id) on delete set null,
  -- FK to classes enforced by application/db elsewhere; keep as uuid to match classes.id
  constraint polls_class_id_not_null_check check (class_id is not null)
);

-- Options for each poll. Label should be unique per poll to avoid duplicate options.
create table if not exists public.poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  label text not null,
  created_at timestamptz default now(),
  constraint poll_options_unique_per_poll unique (poll_id, label)
);

-- Votes cast by students. student_id references students.id so votes are tied to the students table.
create table if not exists public.poll_votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  option_id uuid not null references public.poll_options(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  created_at timestamptz default now(),
  constraint poll_vote_unique unique (poll_id, student_id)
);

-- Indexes to speed up common lookups
create index if not exists idx_polls_class_id on public.polls(class_id);
create index if not exists idx_poll_options_poll_id on public.poll_options(poll_id);
create index if not exists idx_poll_votes_poll_id on public.poll_votes(poll_id);
create index if not exists idx_poll_votes_student_id on public.poll_votes(student_id);

-- Create or replace view: list polls with option counts (optional, can be removed)
create or replace view public.poll_summary as
select
  p.id as poll_id,
  p.title,
  p.class_id,
  p.is_open,
  p.published,
  p.created_at,
  coalesce(sum(case when pv.option_id is not null then 1 else 0 end),0) as total_votes
from public.polls p
left join public.poll_votes pv on pv.poll_id = p.id
group by p.id;
