const fs = require('fs');
const path = require('path');

const envLocal = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf8');
const envUrl = envLocal.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const envKey = envLocal.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)[1].trim();

async function run() {
  for (const table of ['doi_bong', 'tran_dau', 'cau_thu', 'su_kien']) {
    try {
      const res = await fetch(`${envUrl}/rest/v1/${table}?limit=1`, {
        headers: {
          'apikey': envKey,
          'Authorization': `Bearer ${envKey}`
        }
      });
      const data = await res.json();
      console.log(`Table ${table} keys:`, data && data.length > 0 ? Object.keys(data[0]) : 'Empty table');
    } catch (err) {
      console.error(`Error querying ${table}:`, err.message);
    }
  }
}

run();
