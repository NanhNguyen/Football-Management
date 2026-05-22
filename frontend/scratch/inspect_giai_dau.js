const fs = require('fs');
const path = require('path');

const envLocal = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf-8');
const envUrl = envLocal.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const envKey = envLocal.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)[1].trim();

const headers = {
  'apikey': envKey,
  'Authorization': `Bearer ${envKey}`,
  'Content-Type': 'application/json'
};

async function inspect() {
  const res = await fetch(`${envUrl}/rest/v1/giai_dau?limit=1`, {
    method: 'GET',
    headers
  });
  if (res.ok) {
    const data = await res.json();
    console.log("SCHEMA GIAI DAU ROWS:");
    console.log(JSON.stringify(data, null, 2));
  } else {
    console.error("Error inspecting table:", await res.text());
  }
}

inspect();
