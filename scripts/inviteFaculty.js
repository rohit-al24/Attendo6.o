// Invite a faculty member by email via the Edge Function
// Usage (PowerShell):
//   node scripts/inviteFaculty.js faculty@example.com "Full Name" "Department" [redirectTo]
// Env required:
//   INVITE_FUNCTION_URL  -> https://<project>.functions.supabase.co/invite-faculty
//   ADMIN_TOKEN          -> pre-shared token configured for the function

const [,, email, full_name, department, redirectTo] = process.argv;

if (!email || !full_name || !department) {
  console.error("Usage: node scripts/inviteFaculty.js <email> <full_name> <department>");
  process.exit(1);
}

const url = process.env.INVITE_FUNCTION_URL;
const adminToken = process.env.ADMIN_TOKEN;

if (!url || !adminToken) {
  console.error("Please set INVITE_FUNCTION_URL and ADMIN_TOKEN environment variables.");
  process.exit(1);
}

async function main() {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-admin-token': adminToken,
    },
    body: JSON.stringify({ email, full_name, department, redirectTo })
  });
  const body = await res.text();
  if (!res.ok) {
    console.error("Invite failed:", res.status, body);
    process.exit(1);
  }
  try {
    const json = JSON.parse(body);
    if (json.manual_link) {
      console.log("Email rate-limited. Share this invite link manually:\n", json.manual_link);
    } else {
      console.log("Invite sent:", json);
    }
  } catch {
    console.log("Invite response:", body);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
