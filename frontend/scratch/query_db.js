const supabaseUrl = 'https://mjbwdzgccxpahlkoksex.supabase.co';
const supabaseKey = 'sb_publishable_626NQt7MhaX9abfCpCoEZw_G6gVioj1';

async function fetchRest(endpoint) {
  const res = await fetch(`${supabaseUrl}/rest/v1/${endpoint}`, {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`
    }
  });
  if (!res.ok) throw new Error(`HTTP error ${res.status}: ${await res.text()}`);
  return await res.json();
}

async function checkData() {
  try {
    const tId = 'giai-1779436046105';
    const teams = await fetchRest(`doi_bong?select=id,ten&giai_dau_id=eq.${tId}`);
    console.log(`Tournament teams count: ${teams.length}`);
    for (const team of teams) {
      const players = await fetchRest(`cau_thu?select=id,ten,so_ao,vi_tri&doi_id=eq.${team.id}`);
      console.log(`Team ${team.ten} has ${players.length} players`);
    }
  } catch (err) {
    console.error(err);
  }
}

checkData();
