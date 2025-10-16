/*
  # Seed Timetable Data

  ## Purpose
  Creates a comprehensive timetable for all classes with 7 periods each for Monday through Friday.
  Saturday is left blank for faculty to customize later.

  ## Timetable Structure
  - Days: Monday (1) through Saturday (6)
  - Periods: 1-7 for each day
  - Monday-Friday: Fully scheduled
  - Saturday: Empty (to be filled by class advisors)

  ## Class Timetables

  ### 3rd Year CSE A
  Subjects: Database Management Systems, Software Engineering, Operating Systems, Computer Networks, Web Technologies

  ### 3rd Year CSE B
  Subjects: Database Management Systems, Software Engineering, Operating Systems, Compiler Design, Machine Learning

  ### 2nd Year CSE A
  Subjects: Data Structures, Object Oriented Programming, Digital Electronics, Discrete Mathematics, Computer Organization

  ## Period Timings (for reference)
  - Period 1: 09:00 - 10:00
  - Period 2: 10:00 - 11:00
  - Period 3: 11:00 - 12:00
  - Period 4: 12:00 - 01:00
  - LUNCH BREAK
  - Period 5: 02:00 - 03:00
  - Period 6: 03:00 - 04:00
  - Period 7: 04:00 - 05:00
*/

DO $$
DECLARE
  class_3a_id uuid;
  class_3b_id uuid;
  class_2a_id uuid;
  faculty1_id uuid;
  faculty2_id uuid;
  faculty3_id uuid;
  faculty4_id uuid;
  faculty5_id uuid;
BEGIN
  SELECT id INTO class_3a_id FROM public.classes WHERE year = 3 AND section = 'A' AND department = 'Computer Science';
  SELECT id INTO class_3b_id FROM public.classes WHERE year = 3 AND section = 'B' AND department = 'Computer Science';
  SELECT id INTO class_2a_id FROM public.classes WHERE year = 2 AND section = 'A' AND department = 'Computer Science';

  SELECT id INTO faculty1_id FROM public.faculty WHERE email = 'sarah.johnson@college.edu';
  SELECT id INTO faculty2_id FROM public.faculty WHERE email = 'michael.chen@college.edu';
  SELECT id INTO faculty3_id FROM public.faculty WHERE email = 'emily.davis@college.edu';
  SELECT id INTO faculty4_id FROM public.faculty WHERE email = 'robert.wilson@college.edu';
  SELECT id INTO faculty5_id FROM public.faculty WHERE email = 'lisa.anderson@college.edu';

  IF class_3a_id IS NOT NULL THEN
    INSERT INTO public.timetable (class_id, day_of_week, period_number, subject, faculty_id) VALUES
      (class_3a_id, 1, 1, 'Database Management Systems', faculty1_id),
      (class_3a_id, 1, 2, 'Software Engineering', faculty3_id),
      (class_3a_id, 1, 3, 'Operating Systems', faculty4_id),
      (class_3a_id, 1, 4, 'Computer Networks', faculty5_id),
      (class_3a_id, 1, 5, 'Web Technologies', faculty2_id),
      (class_3a_id, 1, 6, 'Database Management Systems Lab', faculty1_id),
      (class_3a_id, 1, 7, 'Database Management Systems Lab', faculty1_id),
      
      (class_3a_id, 2, 1, 'Operating Systems', faculty4_id),
      (class_3a_id, 2, 2, 'Web Technologies', faculty2_id),
      (class_3a_id, 2, 3, 'Database Management Systems', faculty1_id),
      (class_3a_id, 2, 4, 'Software Engineering', faculty3_id),
      (class_3a_id, 2, 5, 'Computer Networks', faculty5_id),
      (class_3a_id, 2, 6, 'Web Technologies Lab', faculty2_id),
      (class_3a_id, 2, 7, 'Web Technologies Lab', faculty2_id),
      
      (class_3a_id, 3, 1, 'Software Engineering', faculty3_id),
      (class_3a_id, 3, 2, 'Computer Networks', faculty5_id),
      (class_3a_id, 3, 3, 'Web Technologies', faculty2_id),
      (class_3a_id, 3, 4, 'Database Management Systems', faculty1_id),
      (class_3a_id, 3, 5, 'Operating Systems', faculty4_id),
      (class_3a_id, 3, 6, 'Software Engineering Lab', faculty3_id),
      (class_3a_id, 3, 7, 'Software Engineering Lab', faculty3_id),
      
      (class_3a_id, 4, 1, 'Web Technologies', faculty2_id),
      (class_3a_id, 4, 2, 'Database Management Systems', faculty1_id),
      (class_3a_id, 4, 3, 'Software Engineering', faculty3_id),
      (class_3a_id, 4, 4, 'Operating Systems', faculty4_id),
      (class_3a_id, 4, 5, 'Computer Networks', faculty5_id),
      (class_3a_id, 4, 6, 'Operating Systems Lab', faculty4_id),
      (class_3a_id, 4, 7, 'Operating Systems Lab', faculty4_id),
      
      (class_3a_id, 5, 1, 'Computer Networks', faculty5_id),
      (class_3a_id, 5, 2, 'Operating Systems', faculty4_id),
      (class_3a_id, 5, 3, 'Database Management Systems', faculty1_id),
      (class_3a_id, 5, 4, 'Web Technologies', faculty2_id),
      (class_3a_id, 5, 5, 'Software Engineering', faculty3_id),
      (class_3a_id, 5, 6, 'Computer Networks Lab', faculty5_id),
      (class_3a_id, 5, 7, 'Computer Networks Lab', faculty5_id)
    ON CONFLICT (class_id, day_of_week, period_number) DO NOTHING;
  END IF;

  IF class_3b_id IS NOT NULL THEN
    INSERT INTO public.timetable (class_id, day_of_week, period_number, subject, faculty_id) VALUES
      (class_3b_id, 1, 1, 'Compiler Design', faculty4_id),
      (class_3b_id, 1, 2, 'Database Management Systems', faculty1_id),
      (class_3b_id, 1, 3, 'Machine Learning', faculty5_id),
      (class_3b_id, 1, 4, 'Software Engineering', faculty3_id),
      (class_3b_id, 1, 5, 'Operating Systems', faculty2_id),
      (class_3b_id, 1, 6, 'Machine Learning Lab', faculty5_id),
      (class_3b_id, 1, 7, 'Machine Learning Lab', faculty5_id),
      
      (class_3b_id, 2, 1, 'Software Engineering', faculty3_id),
      (class_3b_id, 2, 2, 'Operating Systems', faculty2_id),
      (class_3b_id, 2, 3, 'Compiler Design', faculty4_id),
      (class_3b_id, 2, 4, 'Machine Learning', faculty5_id),
      (class_3b_id, 2, 5, 'Database Management Systems', faculty1_id),
      (class_3b_id, 2, 6, 'Compiler Design Lab', faculty4_id),
      (class_3b_id, 2, 7, 'Compiler Design Lab', faculty4_id),
      
      (class_3b_id, 3, 1, 'Machine Learning', faculty5_id),
      (class_3b_id, 3, 2, 'Compiler Design', faculty4_id),
      (class_3b_id, 3, 3, 'Operating Systems', faculty2_id),
      (class_3b_id, 3, 4, 'Database Management Systems', faculty1_id),
      (class_3b_id, 3, 5, 'Software Engineering', faculty3_id),
      (class_3b_id, 3, 6, 'Database Management Systems Lab', faculty1_id),
      (class_3b_id, 3, 7, 'Database Management Systems Lab', faculty1_id),
      
      (class_3b_id, 4, 1, 'Operating Systems', faculty2_id),
      (class_3b_id, 4, 2, 'Machine Learning', faculty5_id),
      (class_3b_id, 4, 3, 'Software Engineering', faculty3_id),
      (class_3b_id, 4, 4, 'Compiler Design', faculty4_id),
      (class_3b_id, 4, 5, 'Database Management Systems', faculty1_id),
      (class_3b_id, 4, 6, 'Software Engineering Lab', faculty3_id),
      (class_3b_id, 4, 7, 'Software Engineering Lab', faculty3_id),
      
      (class_3b_id, 5, 1, 'Database Management Systems', faculty1_id),
      (class_3b_id, 5, 2, 'Software Engineering', faculty3_id),
      (class_3b_id, 5, 3, 'Machine Learning', faculty5_id),
      (class_3b_id, 5, 4, 'Operating Systems', faculty2_id),
      (class_3b_id, 5, 5, 'Compiler Design', faculty4_id),
      (class_3b_id, 5, 6, 'Operating Systems Lab', faculty2_id),
      (class_3b_id, 5, 7, 'Operating Systems Lab', faculty2_id)
    ON CONFLICT (class_id, day_of_week, period_number) DO NOTHING;
  END IF;

  IF class_2a_id IS NOT NULL THEN
    INSERT INTO public.timetable (class_id, day_of_week, period_number, subject, faculty_id) VALUES
      (class_2a_id, 1, 1, 'Data Structures', faculty2_id),
      (class_2a_id, 1, 2, 'Object Oriented Programming', faculty1_id),
      (class_2a_id, 1, 3, 'Digital Electronics', faculty3_id),
      (class_2a_id, 1, 4, 'Discrete Mathematics', faculty4_id),
      (class_2a_id, 1, 5, 'Computer Organization', faculty5_id),
      (class_2a_id, 1, 6, 'Data Structures Lab', faculty2_id),
      (class_2a_id, 1, 7, 'Data Structures Lab', faculty2_id),
      
      (class_2a_id, 2, 1, 'Object Oriented Programming', faculty1_id),
      (class_2a_id, 2, 2, 'Computer Organization', faculty5_id),
      (class_2a_id, 2, 3, 'Data Structures', faculty2_id),
      (class_2a_id, 2, 4, 'Digital Electronics', faculty3_id),
      (class_2a_id, 2, 5, 'Discrete Mathematics', faculty4_id),
      (class_2a_id, 2, 6, 'OOP Lab', faculty1_id),
      (class_2a_id, 2, 7, 'OOP Lab', faculty1_id),
      
      (class_2a_id, 3, 1, 'Digital Electronics', faculty3_id),
      (class_2a_id, 3, 2, 'Data Structures', faculty2_id),
      (class_2a_id, 3, 3, 'Computer Organization', faculty5_id),
      (class_2a_id, 3, 4, 'Object Oriented Programming', faculty1_id),
      (class_2a_id, 3, 5, 'Discrete Mathematics', faculty4_id),
      (class_2a_id, 3, 6, 'Digital Electronics Lab', faculty3_id),
      (class_2a_id, 3, 7, 'Digital Electronics Lab', faculty3_id),
      
      (class_2a_id, 4, 1, 'Discrete Mathematics', faculty4_id),
      (class_2a_id, 4, 2, 'Digital Electronics', faculty3_id),
      (class_2a_id, 4, 3, 'Object Oriented Programming', faculty1_id),
      (class_2a_id, 4, 4, 'Data Structures', faculty2_id),
      (class_2a_id, 4, 5, 'Computer Organization', faculty5_id),
      (class_2a_id, 4, 6, 'Computer Organization Lab', faculty5_id),
      (class_2a_id, 4, 7, 'Computer Organization Lab', faculty5_id),
      
      (class_2a_id, 5, 1, 'Computer Organization', faculty5_id),
      (class_2a_id, 5, 2, 'Discrete Mathematics', faculty4_id),
      (class_2a_id, 5, 3, 'Data Structures', faculty2_id),
      (class_2a_id, 5, 4, 'Digital Electronics', faculty3_id),
      (class_2a_id, 5, 5, 'Object Oriented Programming', faculty1_id),
      (class_2a_id, 5, 6, 'Discrete Mathematics Tutorial', faculty4_id),
      (class_2a_id, 5, 7, 'Discrete Mathematics Tutorial', faculty4_id)
    ON CONFLICT (class_id, day_of_week, period_number) DO NOTHING;
  END IF;

  RAISE NOTICE 'Timetable seeded successfully for all classes (Monday-Friday)';
  RAISE NOTICE 'Saturday (day 6) is left blank for faculty customization';
END $$;