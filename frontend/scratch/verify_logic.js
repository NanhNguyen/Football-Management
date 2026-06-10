const fs = require('fs');
const path = require('path');

const envLocal = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf-8');
const envUrl = envLocal.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const envKey = envLocal.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)[1].trim();

const headers = {
  'apikey': envKey,
  'Authorization': `Bearer ${envKey}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
};

async function runTest() {
  console.log("=== STARTING CARD LOGIC VERIFICATION ===");
  
  // 1. Create a dummy match for testing
  const matchId = `test-match-${Date.now()}`;
  console.log(`Creating dummy match: ${matchId}`);
  const matchRes = await fetch(`${envUrl}/rest/v1/tran_dau`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      id: matchId,
      doi_nha_id: 'team-1',
      doi_khach_id: 'team-2',
      vong: 'Test Round',
      trang_thai: 'DANG_DIEN_RA',
      ty_doi_nha: 0,
      ty_doi_khach: 0,
      phut: 10
    })
  });
  
  if (!matchRes.ok) {
    console.error("Failed to create match:", await matchRes.text());
    return;
  }
  
  // 2. Fetch the player list of team-1 to get a valid player id
  console.log("Fetching players of team-1...");
  const playersRes = await fetch(`${envUrl}/rest/v1/cau_thu?doi_id=eq.team-1&limit=1`, {
    method: 'GET',
    headers
  });
  
  if (!playersRes.ok) {
    console.error("Failed to get players:", await playersRes.text());
    return;
  }
  
  const players = await playersRes.json();
  if (players.length === 0) {
    console.error("No players found in team-1 to test with!");
    return;
  }
  const player = players[0];
  console.log(`Using player: ${player.ten} (ID: ${player.id})`);

  // Define helper function to simulate client-side handleActionSelect
  async function simulateAddCard(subType) {
    console.log(`\nSimulating issuing a ${subType} card...`);
    
    // Check existing events for this match
    const eventsRes = await fetch(`${envUrl}/rest/v1/su_kien?tran_dau_id=eq.${matchId}`, {
      method: 'GET',
      headers
    });
    
    if (!eventsRes.ok) {
       console.error("Failed to fetch events");
       return;
    }
    const currentEvents = await eventsRes.json();
    
    let isSecondYellow = false;
    let eventType = subType === 'yellow' ? 'THE_VANG' : subType === 'red' ? 'THE_DO' : 'CARD';
    let typeLabel = subType === 'yellow' ? 'Phạt thẻ vàng 🟨' : subType === 'red' ? 'Phạt thẻ đỏ 🟥' : 'Án phạt';
    
    if (subType === 'yellow') {
      const yellowCount = currentEvents.filter(ev => ev.loai === 'THE_VANG' && ev.cau_thu_id === player.id).length;
      console.log(`Current yellow cards count for player: ${yellowCount}`);
      if (yellowCount >= 1) {
        isSecondYellow = true;
      }
    }
    
    // Simulate database inserts
    if (isSecondYellow) {
      console.log("DETECTED SECOND YELLOW CARD! Adding yellow + automated red card.");
      
      const resYellow = await fetch(`${envUrl}/rest/v1/su_kien`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          id: `event-${Date.now()}-yellow`,
          tran_dau_id: matchId,
          doi_id: 'team-1',
          cau_thu_id: player.id,
          loai: 'THE_VANG',
          phut: 15,
          mo_ta: `${player.ten} (Phạt thẻ vàng 🟨)`
        })
      });
      
      const resRed = await fetch(`${envUrl}/rest/v1/su_kien`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          id: `event-${Date.now()}-red`,
          tran_dau_id: matchId,
          doi_id: 'team-1',
          cau_thu_id: player.id,
          loai: 'THE_DO',
          phut: 15,
          mo_ta: `${player.ten} (Thẻ đỏ gián tiếp - 2 thẻ vàng) 🟥`
        })
      });
      
      if (resYellow.ok && resRed.ok) {
        console.log("Success: Both yellow and red card events inserted!");
      } else {
        console.error("Failed to insert events:", await resYellow.text(), await resRed.text());
      }
    } else {
      console.log(`Adding single ${subType} card...`);
      const resSingle = await fetch(`${envUrl}/rest/v1/su_kien`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          id: `event-${Date.now()}-single`,
          tran_dau_id: matchId,
          doi_id: 'team-1',
          cau_thu_id: player.id,
          loai: eventType,
          phut: 10,
          mo_ta: `${player.ten} (${typeLabel})`
        })
      });
      
      if (resSingle.ok) {
        console.log(`Success: Single ${subType} card event inserted!`);
      } else {
        console.error("Failed to insert event:", await resSingle.text());
      }
    }
  }

  // First card: Yellow
  await simulateAddCard('yellow');
  
  // Second card: Yellow (should trigger automated Red)
  await simulateAddCard('yellow');

  // Verify the resulting events in the database
  console.log("\nVerifying final events in the database...");
  const finalEventsRes = await fetch(`${envUrl}/rest/v1/su_kien?tran_dau_id=eq.${matchId}`, {
    method: 'GET',
    headers
  });
  const finalEvents = await finalEventsRes.json();
  console.log("Final Event Log in DB for this match:");
  console.log(JSON.stringify(finalEvents, null, 2));
  
  // Assertions
  const yellowEvents = finalEvents.filter(e => e.loai === 'THE_VANG');
  const redEvents = finalEvents.filter(e => e.loai === 'THE_DO');
  
  if (yellowEvents.length === 2 && redEvents.length === 1) {
    console.log("\n✅ VERIFICATION PASSED: 2 Yellow Cards and 1 Red Card found!");
  } else {
    console.error("\n❌ VERIFICATION FAILED: Expected 2 Yellows and 1 Red.");
  }

  // Cleanup
  console.log("\nCleaning up test data...");
  await fetch(`${envUrl}/rest/v1/su_kien?tran_dau_id=eq.${matchId}`, {
    method: 'DELETE',
    headers
  });
  await fetch(`${envUrl}/rest/v1/tran_dau?id=eq.${matchId}`, {
    method: 'DELETE',
    headers
  });
  console.log("Cleanup finished.");
}

runTest();
