-- Core Classes and Core Attendance
-- 1) Create core_classes table
CREATE TABLE IF NOT EXISTS public.core_classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  department text,
  year int,
  section text,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.core_classes ENABLE ROW LEVEL SECURITY;

-- RLS: Authenticated can read, admins manage
DROP POLICY IF EXISTS "Anyone authenticated can view core classes" ON public.core_classes;
CREATE POLICY "Anyone authenticated can view core classes"
  ON public.core_classes FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins can manage core classes" ON public.core_classes;
CREATE POLICY "Admins can manage core classes"
  ON public.core_classes FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));



-- 3) Create core_attendance_records similar to attendance_records
CREATE TABLE IF NOT EXISTS public.core_attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  core_class_id uuid NOT NULL REFERENCES public.core_classes(id) ON DELETE CASCADE,
  faculty_id uuid REFERENCES public.faculty(id) ON DELETE SET NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  period_number int NOT NULL CHECK (period_number BETWEEN 1 AND 7),
  status text NOT NULL CHECK (status IN ('present','absent','leave','onduty')),
  subject text,
  marked_by uuid REFERENCES public.faculty(id) ON DELETE SET NULL,
  marked_at timestamptz DEFAULT now(),
  modified_at timestamptz,
  modified_by uuid REFERENCES public.faculty(id) ON DELETE SET NULL,
  UNIQUE(student_id, core_class_id, date, period_number)
);

ALTER TABLE public.core_attendance_records ENABLE ROW LEVEL SECURITY;

-- RLS policies similar to attendance_records
DROP POLICY IF EXISTS "Students/faculty/admins can view core attendance" ON public.core_attendance_records;
CREATE POLICY "Students/faculty/admins can view core attendance"
  ON public.core_attendance_records FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.students s WHERE s.id = student_id AND (s.user_id = auth.uid()))
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'faculty')
  );

DROP POLICY IF EXISTS "Faculty/admin can insert core attendance" ON public.core_attendance_records;
CREATE POLICY "Faculty/admin can insert core attendance"
  ON public.core_attendance_records FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'faculty') OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Faculty/admin can update core attendance" ON public.core_attendance_records;
CREATE POLICY "Faculty/admin can update core attendance"
  ON public.core_attendance_records FOR UPDATE
  USING (public.has_role(auth.uid(), 'faculty') OR public.has_role(auth.uid(), 'admin'));

-- 4) Helper function to upsert core attendance for a list of students
-- Pass rows as JSONB array: [{"student_id":"...","status":"present"}, ...]
CREATE OR REPLACE FUNCTION public.upsert_core_attendance(
  p_core_class_id uuid,
  p_faculty_id uuid,
  p_date date,
  p_period int,
  p_subject text,
  p_rows jsonb
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  r jsonb;
  v_student uuid;
  v_status text;
BEGIN
  FOR r IN SELECT * FROM jsonb_array_elements(p_rows)
  LOOP
    v_student := (r->>'student_id')::uuid;
    v_status := (r->>'status');
    INSERT INTO public.core_attendance_records(
      student_id, core_class_id, faculty_id, date, period_number, status, subject, marked_by
    ) VALUES (
      v_student, p_core_class_id, p_faculty_id, p_date, p_period, v_status, p_subject, p_faculty_id
    )
    ON CONFLICT (student_id, core_class_id, date, period_number)
    DO UPDATE SET status = EXCLUDED.status, modified_at = now(), modified_by = p_faculty_id, subject = EXCLUDED.subject;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.upsert_core_attendance(uuid, uuid, date, int, text, jsonb) FROM public;
GRANT EXECUTE ON FUNCTION public.upsert_core_attendance(uuid, uuid, date, int, text, jsonb) TO authenticated;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_core_attendance_class_date
  ON public.core_attendance_records(core_class_id, date);
CREATE INDEX IF NOT EXISTS idx_core_attendance_student
  ON public.core_attendance_records(student_id);
