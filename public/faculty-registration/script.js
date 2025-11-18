const SUPABASE_URL = "https://gczoakupibhzaeplstzh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdjem9ha3VwaWJoemFlcGxzdHpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzMzg2MjksImV4cCI6MjA3NTkxNDYyOX0.h7QgriGMdnahI-g5mz7xCOkjCSGCN9QV5HR7bKtEXCA";

// Create a Supabase client instance. Use a different variable name
// to avoid shadowing the global `supabase` from the UMD bundle.
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// GUID generator: use crypto.randomUUID() when available, otherwise fallback
function generateGuid() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback UUID v4 generator
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const form = document.getElementById('registration-form');
const submitBtn = form.querySelector('button[type="submit"]');
const messageDiv = document.getElementById('message');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  messageDiv.textContent = '';
  messageDiv.style.color = '';
  submitBtn.disabled = true;
  const name = form.name.value.trim();
  const email = form.email.value.trim();
  const password = form.password.value;

  if (!name || !email || !password) {
    messageDiv.style.color = '#e11d48'; // red
    messageDiv.textContent = 'Please fill all fields.';
    submitBtn.disabled = false;
    return;
  }

  try {
    // create a guid for this faculty user and persist locally
    const guid = generateGuid();
    // include guid in user metadata so it is available in user record
    const { user, error } = await supabaseClient.auth.signUp({
      email,
      password
    }, {
      data: { name, guid }
    });
    // save to localStorage for client-side reference (optional)
    try {
      localStorage.setItem('faculty_guid', guid);
    } catch (e) {
      // ignore storage errors (e.g., privacy mode)
      console.warn('Could not persist guid to localStorage', e);
    }
    if (error) {
      messageDiv.style.color = '#e11d48'; // red
      messageDiv.textContent = error.message;
    } else {
      messageDiv.style.color = '#059669'; // green
      messageDiv.textContent = 'Registration successful! Please check your email to verify.';
      form.reset();
    }
      // Attempt to create faculty details and assign role in DB
      // Note: this will only succeed if your Supabase policies allow inserts from the client.
      (async () => {
        try {
          const userId = user?.id ?? null;
          await assignFacultyRecord(userId, name, email, guid);
        } catch (e) {
          console.warn('Could not create faculty record automatically:', e);
        }
      })();
  } catch (err) {
    messageDiv.style.color = '#e11d48'; // red
    messageDiv.textContent = 'Registration failed.';
  }
  submitBtn.disabled = false;
});

  // Insert related faculty details and role into your database tables.
  // Adjust table names/columns to match your schema.
  async function assignFacultyRecord(userId, name, email, guid) {
    // Configure the table names here
    const FACULTY_TABLE = 'faculty_details';
    const ROLES_TABLE = 'user_roles';

    // Build the payloads
    const facultyPayload = {
      user_id: userId,
      name,
      email,
      guid,
      created_at: new Date().toISOString(),
    };

    const rolePayload = {
      user_id: userId,
      role: 'faculty',
      guid,
      assigned_at: new Date().toISOString(),
    };

    // Try inserting into faculty table
    try {
      const { data: fdata, error: ferr } = await supabaseClient
        .from(FACULTY_TABLE)
        .insert([facultyPayload]);
      if (ferr) {
        // Log and continue — errors here are usually policy-related
        console.warn('faculty insert error', ferr.message || ferr);
      }
    } catch (e) {
      console.warn('faculty insert failed', e);
    }

    // Try upserting role
    try {
      const { data: rdata, error: rerr } = await supabaseClient
        .from(ROLES_TABLE)
        .upsert([rolePayload], { onConflict: ['user_id'] });
      if (rerr) {
        console.warn('role upsert error', rerr.message || rerr);
      }
    } catch (e) {
      console.warn('role upsert failed', e);
    }
  }
