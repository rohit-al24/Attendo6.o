-- Migration: add user_id to students and populate from auth.users by email
-- Non-destructive and idempotent: safe to run multiple times

-- 1) Add column if not present
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS user_id uuid;

-- 2) Populate user_id by matching student email to auth.users.email (case-insensitive)
WITH matches AS (
  SELECT s.id AS student_id, u.id AS auth_id
  FROM public.students s
  JOIN auth.users u ON lower(s.email) = lower(u.email)
  WHERE s.user_id IS NULL
)
UPDATE public.students s
SET user_id = m.auth_id
FROM matches m
WHERE s.id = m.student_id;

-- 3) Add index for fast lookups by user_id
CREATE INDEX IF NOT EXISTS idx_students_user_id ON public.students(user_id);


CREATE TABLE IF NOT EXISTS public.Results (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  b INTEGER,
  roll_number VARCHAR(20) NOT NULL,
  names VARCHAR(100) NOT NULL,
  internal FLOAT,
  c1_a_cqi FLOAT,
  c2_a_cqi FLOAT,
  pt_1 FLOAT,
  pt_2 FLOAT,
  ssa_1 FLOAT,
  ssa_2 FLOAT,
  cia_1 FLOAT,
  cia_2 FLOAT,
  formative_1 FLOAT,
  formative_2 FLOAT,
  b_cqi_i FLOAT,
  b_cqi_ii FLOAT,
  ese_marks FLOAT
);

INSERT INTO public.Results (b, roll_number, names, internal, c1_a_cqi, c2_a_cqi, pt_1, pt_2, ssa_1, ssa_2, cia_1, cia_2, formative_1, formative_2, b_cqi_i, b_cqi_ii, ese_marks) VALUES
(1, 'EEE001', 'AAMEENA BEGAM K', 85, 0, 0, 0, 1.84, 0, 1.9, 0, 0, 0, 0, 0, 0, 0),
(2, 'EEE002', 'ABINASH P', 65, 0, 0, 0, 1.12, 0, 1.4, 0, 0, 0, 0, 0, 0, 0, 0),
(3, 'EEE003', 'ALAGU RAMAN A', 68, 0, 0, 0, 1.08, 0, 1.4, 0, 0, 0, 0, 0, 0, 0, 0),
(4, 'EEE004', 'ANUSUYA A', 79, 0, 0, 0, 1.68, 0, 1.9, 0, 0, 0, 0, 0, 0, 0, 0),
(5, 'EEE005', 'ARSHATH M', 68, 0, 0, 0, 0.8, 0, 1.2, 0, 0, 0, 0, 0, 0, 0, 0);
