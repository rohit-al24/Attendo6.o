// @ts-nocheck
// deno-lint-ignore-file
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const APP_URL = Deno.env.get("APP_URL") || "https://localhost:5173"; // fallback for dev
const ADMIN_TOKEN = Deno.env.get("ADMIN_TOKEN");

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars");
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    // Simple auth: expect a pre-shared admin token header
    if (!ADMIN_TOKEN || req.headers.get("x-admin-token") !== ADMIN_TOKEN) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }
    const { email, full_name, department, redirectTo } = await req.json();

    if (!email || !full_name || !department) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
    }

  const inviteRedirect = redirectTo || `${APP_URL}/faculty-create/`;

    // 1) Store invite metadata for post-signup mapping
    const { error: inviteErr } = await supabase
      .from("faculty_invites")
      .insert({ email, full_name, department, status: "pending" });
    if (inviteErr) {
      return new Response(JSON.stringify({ error: inviteErr.message }), { status: 400 });
    }

    // 2) Send Supabase Auth invite email (user sets password)
    const { error: inviteEmailErr } = await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: inviteRedirect,
    });
    if (inviteEmailErr) {
      const msg = inviteEmailErr.message?.toLowerCase() || "";
      const isRateLimit = inviteEmailErr.status === 429 || msg.includes("rate limit");
      if (isRateLimit) {
        // Fallback: generate an invite link without sending email so admin can share manually
        const { data: linkData, error: linkErr } = await supabase.auth.admin.generateLink({
          type: "invite",
          email,
          options: { redirectTo: inviteRedirect },
        } as any);
        if (linkErr || !linkData?.properties?.action_link) {
          return new Response(JSON.stringify({ error: inviteEmailErr.message }), { status: 429 });
        }
        return new Response(
          JSON.stringify({ ok: true, note: "Email rate limited; share link manually.", manual_link: linkData.properties.action_link }),
          { status: 200 }
        );
      }
      return new Response(JSON.stringify({ error: inviteEmailErr.message }), { status: 400 });
    }

    return new Response(JSON.stringify({ ok: true, sent: true }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500 });
  }
});
