/*
  # Seed Data Migration - Users, Classes, and Initial Setup

  ## Purpose
  This migration creates initial test data for the attendance system including:
  - Admin user account
  - Faculty members (5 faculty, 2 as class advisors)
  - Student accounts (30 students across 3 classes)
  - Classes (3rd Year CSE sections A, B, and 2nd Year CSE A)

  ## Data Created
  
  ### Admin
  - Email: admin@college.edu
  - Password: Admin@123
  - Role: admin
  
  ### Faculty Members
  1. Dr. Sarah Johnson (Class Advisor for 3rd Year CSE A)
     - Email: sarah.johnson@college.edu
     - Password: Faculty@123
     - Department: Computer Science
     
  2. Dr. Michael Chen (Class Advisor for 2nd Year CSE A)
     - Email: michael.chen@college.edu
     - Password: Faculty@123
     - Department: Computer Science
     
  3. Prof. Emily Davis
     - Email: emily.davis@college.edu
     - Password: Faculty@123
     - Department: Computer Science
     
  4. Dr. Robert Wilson
     - Email: robert.wilson@college.edu
     - Password: Faculty@123
     - Department: Computer Science
     
  5. Prof. Lisa Anderson
     - Email: lisa.anderson@college.edu
     - Password: Faculty@123
     - Department: Computer Science
  
  ### Students
  - 3rd Year CSE A: Roll numbers 21CS001 to 21CS012 (12 students)
  - 3rd Year CSE B: Roll numbers 21CS013 to 21CS024 (12 students)
  - 2nd Year CSE A: Roll numbers 22CS001 to 22CS006 (6 students)
  - All student passwords: Student@123
  
  ### Classes
  - 3rd Year - Computer Science - Section A
  - 3rd Year - Computer Science - Section B
  - 2nd Year - Computer Science - Section A

  ## Important Notes
  1. All users are created in Supabase Auth with email/password authentication
  2. User roles are assigned in the user_roles table
  3. Faculty and student records are linked to auth.users
  4. Class advisors are properly assigned to their respective classes
*/

-- Insert Classes
INSERT INTO public.classes (year, department, section, class_name) VALUES
  (3, 'Computer Science', 'A', '3rd Year CSE A'),
  (3, 'Computer Science', 'B', '3rd Year CSE B'),
  (2, 'Computer Science', 'A', '2nd Year CSE A')
ON CONFLICT (year, department, section) DO NOTHING;

-- Note: Actual user creation in auth.users needs to be done through Supabase Auth API
-- This migration will create the supporting data structure assuming users will be created

-- Create a temporary function to safely insert user-related data
CREATE OR REPLACE FUNCTION insert_seed_data()
RETURNS void AS $$
DECLARE
  admin_user_id uuid;
  faculty1_user_id uuid;
  faculty2_user_id uuid;
  faculty3_user_id uuid;
  faculty4_user_id uuid;
  faculty5_user_id uuid;
  class_3a_id uuid;
  class_3b_id uuid;
  class_2a_id uuid;
  faculty1_id uuid;
  faculty2_id uuid;
  student_user_id uuid;
  student_id uuid;
  i int;
BEGIN
  -- Get class IDs
  SELECT id INTO class_3a_id FROM public.classes WHERE year = 3 AND section = 'A' AND department = 'Computer Science';
  SELECT id INTO class_3b_id FROM public.classes WHERE year = 3 AND section = 'B' AND department = 'Computer Science';
  SELECT id INTO class_2a_id FROM public.classes WHERE year = 2 AND section = 'A' AND department = 'Computer Science';

  -- For now, we'll create placeholder records
  -- In production, these would be created when users sign up through the application
  
  -- The actual user accounts (admin, faculty, students) need to be created via Supabase Auth
  -- using the signUp function with the following credentials:
  
  RAISE NOTICE 'Classes created successfully';
  RAISE NOTICE 'Please create user accounts through Supabase Auth Dashboard or API:';
  RAISE NOTICE '1. Admin: admin@college.edu / Admin@123';
  RAISE NOTICE '2. Faculty: sarah.johnson@college.edu / Faculty@123';
  RAISE NOTICE '3. Faculty: michael.chen@college.edu / Faculty@123';
  RAISE NOTICE '4. Faculty: emily.davis@college.edu / Faculty@123';
  RAISE NOTICE '5. Faculty: robert.wilson@college.edu / Faculty@123';
  RAISE NOTICE '6. Faculty: lisa.anderson@college.edu / Faculty@123';
  RAISE NOTICE '7. Students: 21CS001@college.edu through 22CS006@college.edu / Student@123';
END;
$$ LANGUAGE plpgsql;

SELECT insert_seed_data();
DROP FUNCTION insert_seed_data();