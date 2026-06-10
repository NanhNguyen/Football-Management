const fs = require('fs');
const path = require('path');

// Read environment variables
const envLocal = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf-8');
const envUrl = envLocal.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const envKey = envLocal.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)[1].trim();

const headers = {
  'apikey': envKey,
  'Authorization': `Bearer ${envKey}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=minimal'
};

// Generative lists for Vietnamese names
const hoList = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý'];
const demList = ['Văn', 'Minh', 'Đức', 'Quang', 'Hữu', 'Công', 'Tiến', 'Xuân', 'Thành', 'Anh', 'Ngọc', 'Tấn', 'Duy', 'Quốc', 'Hoàng'];
const tenList = ['Hải', 'Hậu', 'Phượng', 'Linh', 'Lâm', 'Dũng', 'Toàn', 'Đức', 'Trường', 'Quyết', 'Mạnh', 'Đạt', 'Thanh', 'Hùng', 'Vương', 'Sơn', 'Tùng', 'Nam', 'Phong', 'Khánh', 'Hoàng', 'Bình', 'Tuấn', 'Việt'];

function randomName(usedNames) {
  let name = '';
  do {
    const ho = hoList[Math.floor(Math.random() * hoList.length)];
    const dem = demList[Math.floor(Math.random() * demList.length)];
    const ten = tenList[Math.floor(Math.random() * tenList.length)];
    name = `${ho} ${dem} ${ten}`;
  } while (usedNames.has(name));
  usedNames.add(name);
  return name;
}

async function seedPlayers() {
  console.log('Fetching teams list from database...');
  const res = await fetch(`${envUrl}/rest/v1/doi_bong?select=id,ten`, {
    method: 'GET',
    headers
  });

  if (!res.ok) {
    console.error('Failed to fetch teams:', await res.text());
    process.exit(1);
  }

  const teams = await res.json();
  console.log(`Found ${teams.length} teams. Clearing existing players (cau_thu)...`);

  // Delete existing players
  const deleteRes = await fetch(`${envUrl}/rest/v1/cau_thu?id=not.eq.dummy`, {
    method: 'DELETE',
    headers
  });
  if (!deleteRes.ok) {
    console.error('Failed to clear players:', await deleteRes.text());
  } else {
    console.log('Cleared existing players successfully.');
  }

  const playersToInsert = [];
  const usedNames = new Set();

  // Positions configurations
  const positions = [
    { vi_tri: 'Thủ môn', soAoRanges: [1, 23, 30] },
    { vi_tri: 'Hậu vệ', soAoRanges: [2, 3, 4, 5, 12, 15, 21] },
    { vi_tri: 'Hậu vệ', soAoRanges: [2, 3, 4, 5, 12, 15, 21] },
    { vi_tri: 'Tiền vệ', soAoRanges: [6, 8, 14, 16, 17, 19, 22] },
    { vi_tri: 'Tiền vệ', soAoRanges: [6, 8, 14, 16, 17, 19, 22] },
    { vi_tri: 'Tiền đạo', soAoRanges: [7, 9, 10, 11, 18, 20, 99] },
    { vi_tri: 'Tiền đạo', soAoRanges: [7, 9, 10, 11, 18, 20, 99] },
    { vi_tri: 'Dự bị - Thủ môn', soAoRanges: [88, 91] },
    { vi_tri: 'Dự bị - Hậu vệ', soAoRanges: [13, 24, 25] },
    { vi_tri: 'Dự bị - Tiền vệ', soAoRanges: [18, 26, 27] },
    { vi_tri: 'Dự bị - Tiền đạo', soAoRanges: [28, 29, 90] }
  ];

  teams.forEach((team) => {
    const teamUsedSoAo = new Set();
    positions.forEach((pos, idx) => {
      // Find a unique jersey number
      let soAo;
      do {
        soAo = pos.soAoRanges[Math.floor(Math.random() * pos.soAoRanges.length)];
      } while (teamUsedSoAo.has(soAo));
      teamUsedSoAo.add(soAo);

      const name = randomName(usedNames);
      
      // Random goals (0 to 5) to make statistics instantly populated and demoable
      const goals = Math.floor(Math.random() * 6);

      playersToInsert.push({
        id: `player-${team.id}-${idx + 1}`,
        doi_id: team.id,
        ten: name,
        so_ao: soAo,
        vi_tri: pos.vi_tri,
        ban_thang: goals
      });
    });
  });

  console.log(`Inserting ${playersToInsert.length} players into 'cau_thu' table...`);

  // Insert in chunks of 50 to avoid any body limit or timeouts
  const chunkSize = 50;
  for (let i = 0; i < playersToInsert.length; i += chunkSize) {
    const chunk = playersToInsert.slice(i, i + chunkSize);
    const insertRes = await fetch(`${envUrl}/rest/v1/cau_thu`, {
      method: 'POST',
      headers,
      body: JSON.stringify(chunk)
    });

    if (!insertRes.ok) {
      console.error(`Error inserting chunk starting at ${i}:`, await insertRes.text());
    } else {
      console.log(`Inserted chunk ${i / chunkSize + 1}/${Math.ceil(playersToInsert.length / chunkSize)}`);
    }
  }

  console.log('Seeding players completed successfully!');
}

seedPlayers();
