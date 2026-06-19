global.WebSocket = class {};

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load env variables
const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const supabaseUrl = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const supabaseAnonKey = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)[1].trim();

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log('--- TEAMS ---');
  const { data: teams, error: teamsErr } = await supabase
    .from('doi_bong')
    .select('id, ten, bang');
  if (teamsErr) {
    console.error('Error fetching teams:', teamsErr);
    return;
  }
  
  for (const t of teams) {
    const { count, error: countErr } = await supabase
      .from('cau_thu')
      .select('*', { count: 'exact', head: true })
      .eq('doi_id', t.id);
    console.log(`Team: ${t.ten} (${t.id}) - Group: ${t.bang} - Player Count: ${count}`);
  }

  const usaTeam = teams.find(t => t.ten.toLowerCase() === 'usa');
  if (usaTeam) {
    console.log('\n--- USA PLAYERS ---');
    const { data: players, error: playersErr } = await supabase
      .from('cau_thu')
      .select('id, ten, so_ao, vi_tri')
      .eq('doi_id', usaTeam.id);
    if (playersErr) {
      console.error(playersErr);
    } else {
      players.forEach(p => {
        console.log(`[${p.so_ao}] ${p.ten} - ${p.vi_tri}`);
      });
    }
  } else {
    console.log('\nUSA team not found in DB');
  }
}

run();
