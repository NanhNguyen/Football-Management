const fs = require('fs');
const path = require('path');

const envLocal = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf-8');
const envUrl = envLocal.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const envKey = envLocal.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)[1].trim();

const email = "testadmin@sparta.com";
const password = "password123";

async function signUp() {
  const res = await fetch(`${envUrl}/auth/v1/signup`, {
    method: 'POST',
    headers: {
      'apikey': envKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email,
      password
    })
  });

  const data = await res.json();
  if (res.ok) {
    console.log("Signup success:", JSON.stringify(data, null, 2));
  } else {
    console.error("Signup failed:", data);
  }
}

signUp();
