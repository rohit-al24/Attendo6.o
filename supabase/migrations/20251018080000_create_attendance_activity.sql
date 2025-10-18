-- Create attendance_activity table to log edits to attendance records
CREATE TABLE public.attendance_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attendance_id uuid REFERENCES public.attendance_records(id) ON DELETE SET NULL,
  changed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  changed_by_faculty_id uuid REFERENCES public.faculty(id) ON DELETE SET NULL,
  previous_status text,
  new_status text,
  change_reason text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.attendance_activity ENABLE ROW LEVEL SECURITY;

-- Optional index
CREATE INDEX idx_attendance_activity_attendance_id ON public.attendance_activity(attendance_id);
