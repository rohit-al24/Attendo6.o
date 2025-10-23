// @ts-nocheck
// deno-lint-ignore-file
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Set these from your Supabase project
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  const { name, email, department, password } = await req.json();
  if (!name || !email || !department || !password) {
    return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400 });
  }
  // 1. Create user in Supabase Auth
  const { data: userData, error: userError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: name }
  });
  if (userError || !userData?.user) {
    return new Response(JSON.stringify({ error: userError?.message || "User creation failed" }), { status: 400 });
  }
  const userId = userData.user.id;
  // 2. Insert into faculty table
  const { error: facultyError } = await supabase.from("faculty").insert({
    user_id: userId,
    email,
    full_name: name,
    department
  });
  if (facultyError) {
    return new Response(JSON.stringify({ error: facultyError.message }), { status: 400 });
  }
  // 3. Assign faculty role
  await supabase.from("user_roles").insert({ user_id: userId, role: "faculty" });
  return new Response(JSON.stringify({ success: true }), { status: 200 });
});
