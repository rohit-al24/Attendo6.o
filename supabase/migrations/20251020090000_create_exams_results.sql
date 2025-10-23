-- Create exams and results tables to support exam listing and marks publishing
-- Safe, idempotent creation

-- Enable extension if needed
create extension if not exists pgcrypto;

-- Exams master
create table if not exists public.results_exams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid null,
  created_at timestamp with time zone default now()
);

-- Exams mapped to classes with max marks
create table if not exists public.results_exam_classes (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.results_exams(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  max_marks int not null default 100,
  unique (exam_id, class_id)
);

-- Assessments (per exam + class + subject + date)
create table if not exists public.results_assessments (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid references public.results_exams(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  title text not null,
  assessment_type text null,
  subject text null,
  max_marks int not null default 100,
  assessed_on date null,
  created_by_faculty_id uuid null references public.faculty(id) on delete set null,
  created_at timestamp with time zone default now()
);

-- Marks per student for an assessment
create table if not exists public.results_marks (
  assessment_id uuid not null references public.results_assessments(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  marks_obtained numeric not null,
  primary key (assessment_id, student_id)
);

-- Indexes
create index if not exists idx_results_exam_classes_exam on public.results_exam_classes(exam_id);
create index if not exists idx_results_assessments_exam on public.results_assessments(exam_id);
create index if not exists idx_results_assessments_class on public.results_assessments(class_id);
create index if not exists idx_results_marks_student on public.results_marks(student_id);

-- RLS: keep permissive for dev; tighten later
alter table public.results_exams enable row level security;
alter table public.results_exam_classes enable row level security;
alter table public.results_assessments enable row level security;
alter table public.results_marks enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'results_exams' and policyname = 'All can select exams') then
    create policy "All can select exams" on public.results_exams for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'results_exam_classes' and policyname = 'All can select exam classes') then
    create policy "All can select exam classes" on public.results_exam_classes for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'results_assessments' and policyname = 'All can select assessments') then
    create policy "All can select assessments" on public.results_assessments for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'results_marks' and policyname = 'All can select marks') then
    create policy "All can select marks" on public.results_marks for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'results_assessments' and policyname = 'Faculty can insert assessments') then
    create policy "Faculty can insert assessments" on public.results_assessments for insert with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'results_marks' and policyname = 'Faculty can upsert marks') then
    create policy "Faculty can upsert marks" on public.results_marks for insert with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'results_marks' and policyname = 'Faculty can update marks') then
    create policy "Faculty can update marks" on public.results_marks for update using (true) with check (true);
  end if;
end $$;
