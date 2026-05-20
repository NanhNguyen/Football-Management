const URL = 'https://mjbwdzgccxpahlkoksex.supabase.co/rest/v1';
const KEY = 'sb_publishable_626NQt7MhaX9abfCpCoEZw_G6gVioj1';

// Real substitute players - grouped by team suffix for uniqueness
const SUB_TEMPLATES = [
  { suffix: 'sub1', soAo: 91, viTri: 'Thủ môn',   names: ['Nguyễn Văn An',    'Marcus Webb',       'Luís Fonseca',      'Burak Demir',       'Jordan Smith',      'Daan Hoek',         'Théo Martin',       'Javier Ruiz',       'Carlos Mendes',     'Giovanni Rossi',    'Rui Costa',         'Leon Braun',        'Iker Vega',         'Stefan Mancini',    'Rafael Neves']},
  { suffix: 'sub2', soAo: 92, viTri: 'Tiền vệ',    names: ['Trần Minh Khoa',   'Jack Morrison',     'Diogo Carvalho',    'Mert Yıldız',       'Liam Parker',       'Cas Bremer',        'Julien Dubois',     'Marcos García',     'Pedro Alves',       'Marco Ferrari',     'Ricardo Gomes',     'Max Schulz',        'Alejandro López',   'Marco Ricci',       'Hugo Ferreira']},
  { suffix: 'sub3', soAo: 93, viTri: 'Hậu vệ',     names: ['Lê Quốc Hùng',    'Tom Bradley',       'André Santos',      'Ömer Kaya',         'Connor Walsh',      'Bram de Vries',     'Pierre Lambert',    'Diego Fernández',   'Tiago Sousa',       'Luca Bianchi',      'Bruno Tavares',     'Felix Wagner',      'Pablo Morales',     'Luca Romano',       'Diogo Pinto']},
];

async function headers(extra = {}) {
  return {
    'apikey': KEY,
    'Authorization': `Bearer ${KEY}`,
    'Content-Type': 'application/json',
    ...extra,
  };
}

async function main() {
  // 1. Fetch all teams
  const res = await fetch(`${URL}/doi_bong?select=id,ten&order=ten`, {
    headers: await headers(),
  });
  const teams = await res.json();
  console.log(`Found ${teams.length} teams`);

  for (let i = 0; i < teams.length; i++) {
    const team = teams[i];
    const players = SUB_TEMPLATES.map(tmpl => ({
      id: `${tmpl.suffix}-${team.id}`,
      ten: tmpl.names[i] || `Dự bị ${tmpl.soAo - 90} (${team.ten})`,
      so_ao: tmpl.soAo,
      doi_id: team.id,
      vi_tri: tmpl.viTri,
      ban_thang: 0,
    }));

    const upRes = await fetch(`${URL}/cau_thu`, {
      method: 'POST',
      headers: await headers({ 'Prefer': 'resolution=merge-duplicates,return=minimal' }),
      body: JSON.stringify(players),
    });

    if (upRes.ok || upRes.status === 201) {
      console.log(`✅ ${team.ten}: Upserted ${players.map(p => p.ten).join(', ')}`);
    } else {
      const err = await upRes.text();
      console.error(`❌ ${team.ten}: ${err}`);
    }
  }
  console.log('\nDone!');
}

main().catch(console.error);
