import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.75.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const results = {
      admin: null as any,
      faculty: [] as any[],
      students: [] as any[],
      errors: [] as any[]
    };

    const { data: classes } = await supabase.from("classes").select("*");
    const class3A = classes?.find(c => c.year === 3 && c.section === "A");
    const class3B = classes?.find(c => c.year === 3 && c.section === "B");
    const class2A = classes?.find(c => c.year === 2 && c.section === "A");

    const { data: adminUser, error: adminError } = await supabase.auth.admin.createUser({
      email: "admin@college.edu",
      password: "Admin@123",
      email_confirm: true,
      user_metadata: { full_name: "System Administrator" }
    });

    if (adminUser?.user) {
      await supabase.from("user_roles").insert({ user_id: adminUser.user.id, role: "admin" });
      await supabase.from("profiles").insert({
        id: adminUser.user.id,
        email: "admin@college.edu",
        full_name: "System Administrator"
      });
      results.admin = { email: "admin@college.edu", id: adminUser.user.id };
    }

    const facultyData = [
      { email: "sarah.johnson@college.edu", name: "Dr. Sarah Johnson", isAdvisor: true, classId: class3A?.id },
      { email: "michael.chen@college.edu", name: "Dr. Michael Chen", isAdvisor: true, classId: class2A?.id },
      { email: "emily.davis@college.edu", name: "Prof. Emily Davis", isAdvisor: false, classId: null },
      { email: "robert.wilson@college.edu", name: "Dr. Robert Wilson", isAdvisor: false, classId: null },
      { email: "lisa.anderson@college.edu", name: "Prof. Lisa Anderson", isAdvisor: false, classId: null }
    ];

    for (const fac of facultyData) {
      const { data: facultyUser } = await supabase.auth.admin.createUser({
        email: fac.email,
        password: "Faculty@123",
        email_confirm: true,
        user_metadata: { full_name: fac.name }
      });

      if (facultyUser?.user) {
        await supabase.from("user_roles").insert({ user_id: facultyUser.user.id, role: "faculty" });
        await supabase.from("profiles").insert({
          id: facultyUser.user.id,
          email: fac.email,
          full_name: fac.name
        });
        await supabase.from("faculty").insert({
          user_id: facultyUser.user.id,
          email: fac.email,
          full_name: fac.name,
          department: "Computer Science",
          is_class_advisor: fac.isAdvisor,
          advisor_class_id: fac.classId
        });
        results.faculty.push({ email: fac.email, name: fac.name });
      }
    }

    const studentsData = [
      ...Array.from({ length: 12 }, (_, i) => ({
        rollNumber: `21CS${String(i + 1).padStart(3, "0")}`,
        name: `Student ${i + 1} CSE A`,
        email: `21CS${String(i + 1).padStart(3, "0")}@college.edu`,
        classId: class3A?.id
      })),
      ...Array.from({ length: 12 }, (_, i) => ({
        rollNumber: `21CS${String(i + 13).padStart(3, "0")}`,
        name: `Student ${i + 13} CSE B`,
        email: `21CS${String(i + 13).padStart(3, "0")}@college.edu`,
        classId: class3B?.id
      })),
      ...Array.from({ length: 6 }, (_, i) => ({
        rollNumber: `22CS${String(i + 1).padStart(3, "0")}`,
        name: `Student ${i + 1} CSE 2A`,
        email: `22CS${String(i + 1).padStart(3, "0")}@college.edu`,
        classId: class2A?.id
      }))
    ];

    for (const student of studentsData) {
      const { data: studentUser } = await supabase.auth.admin.createUser({
        email: student.email,
        password: "Student@123",
        email_confirm: true,
        user_metadata: { full_name: student.name, roll_number: student.rollNumber }
      });

      if (studentUser?.user) {
        await supabase.from("user_roles").insert({ user_id: studentUser.user.id, role: "student" });
        await supabase.from("profiles").insert({
          id: studentUser.user.id,
          email: student.email,
          full_name: student.name
        });
        await supabase.from("students").insert({
          user_id: studentUser.user.id,
          roll_number: student.rollNumber,
          full_name: student.name,
          class_id: student.classId
        });
        results.students.push({ rollNumber: student.rollNumber, name: student.name });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: "Seed data created successfully",
      results
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500
    });
  }
});