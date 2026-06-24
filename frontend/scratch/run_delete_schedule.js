const fs = require('fs');
const path = require('path');

const envLocal = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf8');
const envUrl = envLocal.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const envKey = envLocal.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)[1].trim();

const headers = {
  'apikey': envKey,
  'Authorization': `Bearer ${envKey}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
};

async function deleteSchedule() {
  const tourneyId = 'giai-thien-khoi-cup-2024';
  console.log(`🧹 Fetching matches for tournament: ${tourneyId}`);
  
  const res = await fetch(`${envUrl}/rest/v1/tran_dau?giai_dau_id=eq.${tourneyId}&select=id`, {
    headers
  });
  
  if (!res.ok) {
    console.error('Failed to fetch matches:', await res.text());
    return;
  }
  
  const matches = await res.json();
  console.log(`Found ${matches.length} matches.`);
  if (matches.length === 0) {
    console.log('No matches to delete.');
    return;
  }
  
  const matchIds = matches.map(m => m.id);
  
  console.log('Deleting events for these matches...');
  // Since we delete events, we chunk it or just do it in one request if not too big
  const delEventsRes = await fetch(`${envUrl}/rest/v1/su_kien?tran_dau_id=in.(${matchIds.join(',')})`, {
    method: 'DELETE',
    headers
  });
  
  if (!delEventsRes.ok) {
    console.error('Failed to delete events:', await delEventsRes.text());
    return;
  }
  
  console.log('Deleting matches...');
  const delMatchesRes = await fetch(`${envUrl}/rest/v1/tran_dau?id=in.(${matchIds.join(',')})`, {
    method: 'DELETE',
    headers
  });
  
  if (!delMatchesRes.ok) {
    console.error('Failed to delete matches:', await delMatchesRes.text());
    return;
  }
  
  console.log('Successfully deleted all matches and events for the tournament!');
}

deleteSchedule();
