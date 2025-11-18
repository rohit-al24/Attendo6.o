// Supabase project configuration
const SUPABASE_URL = "https://gczoakupibhzaeplstzh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdjem9ha3VwaWJoemFlcGxzdHpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzMzg2MjksImV4cCI6MjA3NTkxNDYyOX0.h7QgriGMdnahI-g5mz7xCOkjCSGCN9QV5HR7bKtEXCA";

const form = document.getElementById('resetForm');
const message = document.getElementById('message');
const tokenMessage = document.getElementById('tokenMessage');

function getToken() {
  // 1. Try access_token in hash
  const hashToken = window.location.hash.match(/access_token=([^&]+)/)?.[1];
  if (hashToken) return hashToken;
  // 2. Try confirmation param in query string (for custom redirect)
  const urlParams = new URLSearchParams(window.location.search);
  const confirmationUrl = urlParams.get('confirmation');
  if (confirmationUrl) {
    // Decode the confirmation URL if it's URL-encoded
    const decoded = decodeURIComponent(confirmationUrl);
    // Try to extract token=... from the decoded URL
    const match = decoded.match(/token=([^&]+)/);
    if (match) return match[1];
    // If confirmation param itself is a token, use it directly
    if (/^[A-Za-z0-9-_\.]+$/.test(confirmationUrl)) return confirmationUrl;
  }
  // No valid token found
  return null;
}

function showTokenStatus() {
  const token = getToken();
  if (!token) {
    tokenMessage.textContent = 'No valid password reset token found in the URL. Please use the link sent to your email.';
    tokenMessage.style.color = '#ef4444';
    form.querySelector('button[type="submit"]').disabled = true;
  } else {
    tokenMessage.textContent = '';
    form.querySelector('button[type="submit"]').disabled = false;
  }
}

showTokenStatus();

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  message.textContent = '';
  const password = document.getElementById('password').value;
  const confirm = document.getElementById('confirm').value;
  if (!password || !confirm) {
    message.textContent = 'Please fill all fields.';
    return;
  }
  if (password !== confirm) {
    message.textContent = 'Passwords do not match.';
    return;
  }
  // Get token from hash or query param
  const token = getToken();
  if (!token) {
    message.textContent = 'Invalid or missing token.';
    return;
  }
  // Call Supabase REST API to update password
  try {
    const res = await fetch('https://gczoakupibhzaeplstzh.supabase.co/auth/v1/user', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({ password })
    });
    const result = await res.json();
    if (res.ok) {
      message.style.color = '#22c55e';
      message.textContent = 'Password reset successful! You can now log in.';
      form.reset();
    } else {
      message.textContent = result.error_description || result.error || 'Reset failed.';
    }
  } catch (err) {
    message.textContent = 'Unexpected error: ' + err.message;
  }
});
