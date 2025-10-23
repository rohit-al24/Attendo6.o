// This script supports both access_token in hash and confirmation param in query string
const form = document.getElementById('resetForm');
const message = document.getElementById('message');

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
  }
  // Demo: inject mock token if none found
  return 'MOCK_DEMO_TOKEN_1234567890';
}

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
  console.log('Extracted token:', token);
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
