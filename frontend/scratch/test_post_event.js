async function run() {
  const payload = {
    matchId: 'tran-live', // dummy or existing match ID
    teamId: 'doi-1',
    playerId: 'player-1',
    type: 'GOAL_NORMAL',
    eventMinute: 90, // let's try number
    description: 'Test event'
  };

  const res = await fetch('http://127.0.0.1:3001/api/match-events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  console.log('Status:', res.status);
  console.log('Body:', await res.json());
}

run().catch(console.error);
