// Student Account Setup
// Uses Supabase to look up a student by email, show details, then set a password
// SECURITY: Ensure your RLS policies allow:
//  - SELECT on students where email = input email
//  - UPDATE password for that row only (and only when not verified yet)
// Never store plaintext passwords. This sample hashes the password in the browser (SHA-256)
// and stores it in the `password` column. Prefer a dedicated `password_hash` with server-side hashing.

// --- CONFIG ---
const SUPABASE_URL = "https://gczoakupibhzaeplstzh.supabase.co"; // your project URL
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdjem9ha3VwaWJoemFlcGxzdHpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzMzg2MjksImV4cCI6MjA3NTkxNDYyOX0.h7QgriGMdnahI-g5mz7xCOkjCSGCN9QV5HR7bKtEXCA"; // anon key
const PASSWORD_COLUMN = "password"; // change to 'password_hash' if you have that

// --- SUPABASE CLIENT ---
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- ELEMENTS ---
const intro = document.getElementById('intro');
const setupContainer = document.getElementById('setupContainer');
const getStarted = document.getElementById('getStarted');
const steps = Array.from(document.querySelectorAll('.step'));
const message = document.getElementById('message');
const diag = document.getElementById('diag');
let currentStudent = null; // cached selection

function setStep(n){
  steps.forEach(s => s.classList.toggle('active', s.dataset.step === String(n)));
  document.querySelectorAll('.step-pane').forEach(p => p.classList.add('hidden'));
  document.querySelector(`.step-pane[data-step="${n}"]`).classList.remove('hidden');
}

function showMessage(text, type='error'){
  message.className = `message ${type}`;
  message.textContent = text;
}

function logDiag(obj){
  diag.textContent = typeof obj === 'string' ? obj : JSON.stringify(obj, null, 2);
}

// --- INTRO TOGGLE ---
function showSetup(){
  intro?.classList.add('hidden');
  setupContainer?.classList.remove('hidden');
  setTimeout(()=>window.scrollTo({top:0,behavior:'smooth'}),0);
}
getStarted?.addEventListener('click', showSetup);
// Allow deep-linking to show setup directly
if (location.hash === '#setup' || new URLSearchParams(location.search).get('showSetup') === '1'){
  showSetup();
}

// --- EMAIL LOOKUP ---
const emailForm = document.getElementById('emailForm');
const emailInput = document.getElementById('email');
const emailHint = document.getElementById('emailHint');

autoLower(emailInput);

emailForm.addEventListener('submit', async (e)=>{
  e.preventDefault();
  showMessage('');
  emailHint.textContent = '';
  const email = emailInput.value.trim().toLowerCase();
  if(!email){
    showMessage('Please enter your email.');
    return;
  }

  steps[0].classList.add('active');
  try{
    // Use security-definer RPC to look up student by email
  const { data, error } = await supabase.rpc('lookup_student_by_email', { p_email: email });

    if(error){
      logDiag(error);
      showMessage('Lookup failed. Please try again later.');
      return;
    }
    if(!data || (Array.isArray(data) && data.length === 0)){
      // Offer roll-number fallback
      document.getElementById('rollAlt').classList.remove('hidden');
      showMessage('No student record found for that email. You can try searching by roll number below.');
      return;
    }

    // RPC returns a single row or null; unify to object
    const row = Array.isArray(data) ? data[0] : data;
    currentStudent = row;
    // fill details
    document.getElementById('detailName').textContent = row.full_name ?? '-';
    document.getElementById('detailRoll').textContent = row.roll_number ?? '-';
    document.getElementById('detailEmail').textContent = row.email ?? email;
    document.getElementById('detailDept').textContent = row.department ?? '-';
    document.getElementById('detailYearSec').textContent = `${row.year ?? '-'} / ${row.section ?? '-'}`;

    // account_verified is only available after we added column; we won't rely on it here

  setStep(2);
  showSetup();
  }catch(err){
    logDiag(err);
    showMessage('Unexpected error.');
  }
});

// Roll number alternative
const rollInput = document.getElementById('roll');
const rollBtn = document.getElementById('rollBtn');
if (rollBtn){
  rollBtn.addEventListener('click', async ()=>{
    showMessage('');
    const roll = (rollInput?.value || '').trim();
    if(!roll){ showMessage('Enter a roll number.'); return; }
    try{
      const { data, error } = await supabase.rpc('lookup_student_by_roll', { p_roll: roll });
      if(error){ logDiag(error); showMessage('Lookup failed.'); return; }
      if(!data || (Array.isArray(data) && data.length === 0)){ showMessage('No student record for that roll number.'); return; }
      const row = Array.isArray(data) ? data[0] : data;
      currentStudent = row;
      document.getElementById('detailName').textContent = row.full_name ?? '-';
      document.getElementById('detailRoll').textContent = row.roll_number ?? '-';
      document.getElementById('detailEmail').textContent = row.email ?? emailInput.value;
      document.getElementById('detailDept').textContent = row.department ?? '-';
      document.getElementById('detailYearSec').textContent = `${row.year ?? '-'} / ${row.section ?? '-'}`;
  setStep(2);
  showSetup();
    }catch(err){ logDiag(err); showMessage('Unexpected error.'); }
  });
}

// --- VERIFY DETAILS ---
const verifyPane = document.getElementById('verifyPane');
const confirmDetails = document.getElementById('confirmDetails');
const toPassword = document.getElementById('toPassword');

confirmDetails.addEventListener('change',()=>{
  toPassword.disabled = !confirmDetails.checked;
});

toPassword.addEventListener('click', ()=>{
  setStep(3);
});

// --- PASSWORD SETUP ---
const passwordForm = document.getElementById('passwordForm');
const password = document.getElementById('password');
const confirm = document.getElementById('confirm');
const strength = document.getElementById('strength');

// toggle visibility
for (const btn of document.querySelectorAll('.icon-btn')){
  btn.addEventListener('click', ()=>{
    const target = btn.getAttribute('data-toggle');
    const input = document.getElementById(target);
    input.type = input.type === 'password' ? 'text' : 'password';
  });
}

password.addEventListener('input', ()=>{
  strength.textContent = scorePassword(password.value);
});

passwordForm.addEventListener('submit', async (e)=>{
  e.preventDefault();
  showMessage('');
  if(!currentStudent){
    showMessage('No student selected. Please start from email lookup.');
    setStep(1);
    return;
  }
  const pwd = password.value.trim();
  const pwd2 = confirm.value.trim();
  if(!pwd || !pwd2){
    showMessage('Please fill both password fields.');
    return;
  }
  if(pwd !== pwd2){
    showMessage('Passwords do not match.');
    return;
  }
  if(pwd.length < 8){
    showMessage('Use at least 8 characters.');
    return;
  }

  try{
    // Store the password as-is (plaintext) per request
    const plain = pwd;
    // Use RPC to set password (SECURITY DEFINER)
    let data, error;
    if (currentStudent?.email){
      ({ data, error } = await supabase.rpc('student_set_password', {
        p_email: currentStudent.email,
        p_password_hash: plain
      }));
    } else if (currentStudent?.id){
      ({ data, error } = await supabase.rpc('student_set_password_by_id', {
        p_student_id: currentStudent.id,
        p_password_hash: plain
      }));
    }

    if(error || data !== true){
      logDiag(error || data);
      showMessage('Save failed. If this persists, contact support.');
      return;
    }

    showMessage('Password saved. Your account is verified—welcome!', 'success');
    passwordForm.reset();
  }catch(err){
    logDiag(err);
    showMessage('Unexpected error during save.');
  }
});

// --- HELPERS ---
function autoLower(input){
  input.addEventListener('blur', ()=>{ input.value = input.value.trim().toLowerCase(); });
}

async function sha256(str){
  const data = new TextEncoder().encode(str);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b=>b.toString(16).padStart(2,'0')).join('');
}

function scorePassword(p){
  let score = 0;
  if (p.length >= 8) score++;
  if (/[A-Z]/.test(p)) score++;
  if (/[a-z]/.test(p)) score++;
  if (/[0-9]/.test(p)) score++;
  if (/[^A-Za-z0-9]/.test(p)) score++;
  const labels = ['Too weak','Weak','Fair','Good','Strong'];
  return `Strength: ${labels[Math.min(score, 4)]}`;
}
