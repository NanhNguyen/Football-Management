const fs = require('fs');
const path = require('path');

const envLocal = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf-8');
const envUrl = envLocal.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const envKey = envLocal.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)[1].trim();

const headers = {
  'apikey': envKey,
  'Authorization': `Bearer ${envKey}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=minimal'
};

const teamsData = [
  // Bảng A
  { ten: 'Bayern Munich', viet_tat: 'BAY', logo: '🇩🇪', bang: 'A' },
  { ten: 'Manchester United', viet_tat: 'MUN', logo: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', bang: 'A' },
  { ten: 'FC Copenhagen', viet_tat: 'COP', logo: '🇩🇰', bang: 'A' },
  { ten: 'Galatasaray', viet_tat: 'GAL', logo: '🇹🇷', bang: 'A' },
  // Bảng B
  { ten: 'Arsenal', viet_tat: 'ARS', logo: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', bang: 'B' },
  { ten: 'PSV Eindhoven', viet_tat: 'PSV', logo: '🇳🇱', bang: 'B' },
  { ten: 'RC Lens', viet_tat: 'RCL', logo: '🇫🇷', bang: 'B' },
  { ten: 'Sevilla', viet_tat: 'SEV', logo: '🇪🇸', bang: 'B' },
  // Bảng C
  { ten: 'Real Madrid', viet_tat: 'RMA', logo: '🇪🇸', bang: 'C' },
  { ten: 'Napoli', viet_tat: 'NAP', logo: '🇮🇹', bang: 'C' },
  { ten: 'SC Braga', viet_tat: 'BRA', logo: '🇵🇹', bang: 'C' },
  { ten: 'Union Berlin', viet_tat: 'UNB', logo: '🇩🇪', bang: 'C' },
  // Bảng D
  { ten: 'Real Sociedad', viet_tat: 'RSO', logo: '🇪🇸', bang: 'D' },
  { ten: 'Inter Milan', viet_tat: 'INT', logo: '🇮🇹', bang: 'D' },
  { ten: 'Benfica', viet_tat: 'BEN', logo: '🇵🇹', bang: 'D' },
  { ten: 'RB Salzburg', viet_tat: 'SAL', logo: '🇦🇹', bang: 'D' },
  // Bảng E
  { ten: 'Atletico Madrid', viet_tat: 'ATM', logo: '🇪🇸', bang: 'E' },
  { ten: 'Lazio', viet_tat: 'LAZ', logo: '🇮🇹', bang: 'E' },
  { ten: 'Feyenoord', viet_tat: 'FEY', logo: '🇳🇱', bang: 'E' },
  { ten: 'Celtic', viet_tat: 'CEL', logo: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', bang: 'E' },
  // Bảng F
  { ten: 'Dortmund', viet_tat: 'DOR', logo: '🇩🇪', bang: 'F' },
  { ten: 'Paris Saint-Germain', viet_tat: 'PSG', logo: '🇫🇷', bang: 'F' },
  { ten: 'AC Milan', viet_tat: 'MIL', logo: '🇮🇹', bang: 'F' },
  { ten: 'Newcastle United', viet_tat: 'NEW', logo: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', bang: 'F' },
  // Bảng G
  { ten: 'Manchester City', viet_tat: 'MCI', logo: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', bang: 'G' },
  { ten: 'RB Leipzig', viet_tat: 'RBL', logo: '🇩🇪', bang: 'G' },
  { ten: 'Young Boys', viet_tat: 'YBO', logo: '🇨🇭', bang: 'G' },
  { ten: 'Crvena Zvezda', viet_tat: 'CRV', logo: '🇷🇸', bang: 'G' },
  // Bảng H
  { ten: 'Barcelona', viet_tat: 'BAR', logo: '🇪🇸', bang: 'H' },
  { ten: 'FC Porto', viet_tat: 'POR', logo: '🇵🇹', bang: 'H' },
  { ten: 'Shakhtar Donetsk', viet_tat: 'SHA', logo: '🇺🇦', bang: 'H' },
  { ten: 'Royal Antwerp', viet_tat: 'ANT', logo: '🇧🇪', bang: 'H' },
];

async function deleteData(table) {
  const res = await fetch(`${envUrl}/rest/v1/${table}?id=not.eq.dummy`, {
    method: 'DELETE',
    headers
  });
  if (!res.ok) console.error(`Error deleting ${table}:`, await res.text());
}

async function insertData(table, data) {
  const res = await fetch(`${envUrl}/rest/v1/${table}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data)
  });
  if (!res.ok) console.error(`Error inserting ${table}:`, await res.text());
}

async function seed() {
  console.log('Clearing existing data...');
  await deleteData('su_kien');
  await deleteData('tran_dau');
  await deleteData('cau_thu');
  await deleteData('doi_bong');

  console.log('Inserting 32 teams...');
  const teamsToInsert = teamsData.map((t, i) => ({
    id: `team-${i+1}`,
    ...t
  }));

  await insertData('doi_bong', teamsToInsert);

  const groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const matchesToInsert = [];
  let matchIdCounter = 1;

  for (const group of groups) {
    const groupTeams = teamsToInsert.filter(t => t.bang === group);
    const matchPairs = [
      [groupTeams[0], groupTeams[1], 'Lượt 1'],
      [groupTeams[2], groupTeams[3], 'Lượt 1'],
      [groupTeams[0], groupTeams[2], 'Lượt 2'],
      [groupTeams[1], groupTeams[3], 'Lượt 2'],
      [groupTeams[0], groupTeams[3], 'Lượt 3'],
      [groupTeams[1], groupTeams[2], 'Lượt 3'],
    ];

    for (const pair of matchPairs) {
      matchesToInsert.push({
        id: `match-${matchIdCounter++}`,
        doi_nha_id: pair[0].id,
        doi_khach_id: pair[1].id,
        vong: `Vòng bảng - ${pair[2]}`,
        trang_thai: 'SAP_DIEN_RA',
        ty_doi_nha: 0,
        ty_doi_khach: 0,
        phut: 0,
        ngay: '',
        gio: '',
        san: 'Chưa xếp sân',
      });
    }
  }

  console.log(`Inserting ${matchesToInsert.length} matches...`);
  await insertData('tran_dau', matchesToInsert);

  // --- Knockout Stage ---
  const knockoutMatches = [];
  
  // Vòng 1/8 (8 matches)
  for (let i = 1; i <= 8; i++) {
    knockoutMatches.push({
      id: `match-k16-${i}`,
      vong: 'Vòng 1/8',
      trang_thai: 'SAP_DIEN_RA',
      ty_doi_nha: 0,
      ty_doi_khach: 0,
      phut: 0,
      ngay: 'TBD',
      gio: 'TBD',
      san: 'Chưa xếp sân',
    });
  }

  // Tứ kết (4 matches)
  for (let i = 1; i <= 4; i++) {
    knockoutMatches.push({
      id: `match-tk-${i}`,
      vong: 'Tứ kết',
      trang_thai: 'SAP_DIEN_RA',
      ty_doi_nha: 0,
      ty_doi_khach: 0,
      phut: 0,
      ngay: 'TBD',
      gio: 'TBD',
      san: 'Chưa xếp sân',
    });
  }

  // Bán kết (2 matches)
  for (let i = 1; i <= 2; i++) {
    knockoutMatches.push({
      id: `match-bk-${i}`,
      vong: 'Bán kết',
      trang_thai: 'SAP_DIEN_RA',
      ty_doi_nha: 0,
      ty_doi_khach: 0,
      phut: 0,
      ngay: 'TBD',
      gio: 'TBD',
      san: 'Chưa xếp sân',
    });
  }

  // Chung kết (1 match)
  knockoutMatches.push({
    id: `match-ck-1`,
    vong: 'Chung kết',
    trang_thai: 'SAP_DIEN_RA',
    ty_doi_nha: 0,
    ty_doi_khach: 0,
    phut: 0,
    ngay: 'TBD',
    gio: 'TBD',
    san: 'Chưa xếp sân',
  });

  console.log(`Inserting ${knockoutMatches.length} knockout matches...`);
  await insertData('tran_dau', knockoutMatches);

  console.log('Database seeded successfully with 32 teams, Group Stage and Knockout placeholders!');
}

seed();
