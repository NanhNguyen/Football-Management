const fs = require('fs');

const envLocal = fs.readFileSync('/Users/namanhnguyen/Nanh/IT/Football Management/frontend/.env.local', 'utf-8');
const envUrl = envLocal.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const envKey = envLocal.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)[1].trim();

async function inspect() {
  const headers = {
    'apikey': envKey,
    'Authorization': `Bearer ${envKey}`,
    'Content-Type': 'application/json'
  };

  const res = await fetch(`${envUrl}/rest/v1/tran_dau?select=id,vong,trang_thai,doi_nha_id,doi_khach_id,ty_doi_nha,ty_doi_khach`, {
    method: 'GET',
    headers
  });
  
  if (res.ok) {
    const data = await res.json();
    const koMatches = data.filter(m => !m.vong.startsWith('Vòng bảng'));
    console.log('Knockout matches in DB:', koMatches);
  } else {
    console.error('Error:', await res.text());
  }
}

inspect();
