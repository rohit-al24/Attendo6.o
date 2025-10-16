-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'faculty', 'student');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create classes table
CREATE TABLE public.classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year int NOT NULL CHECK (year BETWEEN 1 AND 4),
  department text NOT NULL,
  section text NOT NULL,
  class_name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (year, department, section)
);

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

-- Create students table
CREATE TABLE public.students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  roll_number text UNIQUE NOT NULL,
  full_name text NOT NULL,
  class_id uuid REFERENCES public.classes(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Create faculty table
CREATE TABLE public.faculty (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  department text,
  is_class_advisor boolean DEFAULT false,
  advisor_class_id uuid REFERENCES public.classes(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.faculty ENABLE ROW LEVEL SECURITY;

-- Create timetable table
CREATE TABLE public.timetable (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
  day_of_week int NOT NULL CHECK (day_of_week BETWEEN 1 AND 6),
  period_number int NOT NULL CHECK (period_number BETWEEN 1 AND 7),
  subject text NOT NULL,
  faculty_id uuid REFERENCES public.faculty(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (class_id, day_of_week, period_number)
);

ALTER TABLE public.timetable ENABLE ROW LEVEL SECURITY;

-- Create attendance_records table
CREATE TABLE public.attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  class_id uuid REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
  faculty_id uuid REFERENCES public.faculty(id) ON DELETE SET NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  period_number int NOT NULL CHECK (period_number BETWEEN 1 AND 7),
  status text NOT NULL CHECK (status IN ('present', 'absent', 'leave', 'onduty')),
  subject text,
  marked_by uuid REFERENCES public.faculty(id) ON DELETE SET NULL,
  marked_at timestamptz DEFAULT now(),
  modified_at timestamptz,
  modified_by uuid REFERENCES public.faculty(id) ON DELETE SET NULL,
  UNIQUE (student_id, date, period_number)
);

ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

-- Create advisor_substitutions table
CREATE TABLE public.advisor_substitutions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
  original_advisor_id uuid REFERENCES public.faculty(id) ON DELETE CASCADE NOT NULL,
  substitute_advisor_id uuid REFERENCES public.faculty(id) ON DELETE CASCADE NOT NULL,
  from_date date NOT NULL,
  to_date date NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.advisor_substitutions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for classes
CREATE POLICY "Anyone authenticated can view classes"
  ON public.classes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage classes"
  ON public.classes FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for students
CREATE POLICY "Students can view their own data"
  ON public.students FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'faculty'));

CREATE POLICY "Admins can manage students"
  ON public.students FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for faculty
CREATE POLICY "Faculty can view all faculty"
  ON public.faculty FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage faculty"
  ON public.faculty FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for timetable
CREATE POLICY "Anyone authenticated can view timetable"
  ON public.timetable FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Faculty can manage their class timetable"
  ON public.timetable FOR ALL
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    EXISTS (
      SELECT 1 FROM public.faculty 
      WHERE user_id = auth.uid() AND advisor_class_id = timetable.class_id
    )
  );

-- RLS Policies for attendance_records
CREATE POLICY "Students can view their own attendance"
  ON public.attendance_records FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.students WHERE id = student_id AND user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'faculty')
  );

CREATE POLICY "Faculty can mark attendance"
  ON public.attendance_records FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'faculty') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Faculty and admins can update attendance"
  ON public.attendance_records FOR UPDATE
  USING (public.has_role(auth.uid(), 'faculty') OR public.has_role(auth.uid(), 'admin'));

-- RLS Policies for advisor_substitutions
CREATE POLICY "Anyone authenticated can view substitutions"
  ON public.advisor_substitutions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage substitutions"
  ON public.advisor_substitutions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_timetable_updated_at
  BEFORE UPDATE ON public.timetable
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();