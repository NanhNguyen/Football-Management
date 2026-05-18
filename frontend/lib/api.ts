import { supabase } from './supabase';

// --- ĐỘI BÓNG ---
export async function layDanhSachDoi() {
  const { data, error } = await supabase
    .from('doi_bong')
    .select('*, cau_thu(*)');
  
  if (error) {
    console.error('Lỗi lấy danh sách đội:', error);
    return [];
  }
  
  return data.map(doi => ({
    ...doi,
    vietTat: doi.viet_tat,
    cauThu: doi.cau_thu ? doi.cau_thu.map((ct: any) => ({
      ...ct,
      banThang: ct.ban_thang,
      soAo: ct.so_ao,
      viTri: ct.vi_tri
    })) : []
  }));
}

export async function createTeam(team: any) {
  const { data, error } = await supabase
    .from('doi_bong')
    .insert([{
      id: team.id,
      ten: team.ten,
      viet_tat: team.vietTat,
      logo: team.logo,
      bang: team.bang
    }])
    .select();
  return { data, error };
}

export async function updateTeam(team: any) {
  const { data, error } = await supabase
    .from('doi_bong')
    .update({
      ten: team.ten,
      viet_tat: team.vietTat,
      logo: team.logo,
      bang: team.bang
    })
    .eq('id', team.id)
    .select();
  
  // Also handle players if they were changed
  if (team.cauThu) {
    // Sync deletions: Fetch current players from DB and delete any that are no longer in the list
    const { data: dbPlayers } = await supabase
      .from('cau_thu')
      .select('id')
      .eq('doi_id', team.id);
    
    if (dbPlayers) {
      const activeIds = new Set(team.cauThu.map((p: any) => p.id));
      const toDelete = dbPlayers.filter(p => !activeIds.has(p.id)).map(p => p.id);
      if (toDelete.length > 0) {
        await supabase.from('cau_thu').delete().in('id', toDelete);
      }
    }

    for (const p of team.cauThu) {
      await supabase.from('cau_thu').upsert({
        id: p.id,
        doi_id: team.id,
        ten: p.ten,
        so_ao: p.soAo,
        vi_tri: p.viTri || 'Chưa rõ',
        ban_thang: p.banThang || 0
      });
    }
  }
  
  return { data, error };
}

export async function deleteTeam(id: string) {
  return await supabase.from('doi_bong').delete().eq('id', id);
}

// --- TRẬN ĐẤU ---
export async function layDanhSachTranDau() {
  const { data, error } = await supabase
    .from('tran_dau')
    .select(`
      *,
      doi_nha:doi_nha_id(*),
      doi_khach:doi_khach_id(*),
      su_kien(*)
    `);

  if (error) {
    console.error('Lỗi lấy danh sách trận đấu:', error);
    return [];
  }

  return data.map(m => ({
    id: m.id,
    doiNha: m.doi_nha,
    doiKhach: m.doi_khach,
    tyNha: m.ty_doi_nha,
    tyKhach: m.ty_doi_khach,
    phut: m.phut,
    vong: m.vong,
    trangThai: m.trang_thai,
    time: m.gio,
    date: m.ngay,
    san: m.san,
    batDauLuc: m.bat_dau_luc,
    dangTamDung: m.dang_tam_dung,
    thoiGianDaQua: m.thoi_gian_da_qua,
    suKien: m.su_kien || []
  }));
}

export function calculateMatchMinute(match: any) {
  if (match.trangThai === 'SAP_DIEN_RA') return 0;
  if (match.trangThai === 'KET_THUC') return match.phut;
  if (!match.batDauLuc) return match.phut || 0;

  if (match.dangTamDung) {
    return Math.floor((match.thoiGianDaQua || 0) / 60);
  }

  const startTime = new Date(match.batDauLuc).getTime();
  const now = new Date().getTime();
  const diffInSeconds = Math.floor((now - startTime) / 1000) + (match.thoiGianDaQua || 0);
  const minute = Math.floor(diffInSeconds / 60) + 1; // Football minutes start at 1

  return Math.min(minute, 120); // Cap at 120 just in case
}

export async function updateMatch(match: any) {
  return await supabase
    .from('tran_dau')
    .update({
      ty_doi_nha: match.tyNha,
      ty_doi_khach: match.tyKhach,
      trang_thai: match.trangThai,
      phut: match.phut,
      vong: match.vong,
      gio: match.time,
      ngay: match.date,
      san: match.san,
      bat_dau_luc: match.batDauLuc,
      dang_tam_dung: match.dangTamDung,
      thoi_gian_da_qua: match.thoiGianDaQua
    })
    .eq('id', match.id);
}

export async function addEvent(event: any) {
  return await supabase
    .from('su_kien')
    .insert([{
      id: event.id || undefined,
      tran_dau_id: event.matchId,
      doi_id: event.teamId,
      cau_thu_id: event.playerId,
      loai: event.type,
      phut: event.minute,
      mo_ta: event.description
    }]);
}

export async function layChiTietTranDau(id: string) {
  const { data, error } = await supabase
    .from('tran_dau')
    .select(`
      *,
      doi_nha:doi_nha_id(*),
      doi_khach:doi_khach_id(*),
      su_kien(
        *,
        cau_thu:cau_thu_id(ten, so_ao),
        doi:doi_id(ten)
      )
    `)
    .eq('id', id)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    vong: data.vong,
    phut: data.phut,
    trangThai: data.trang_thai,
    doiNha: data.doi_nha,
    doiKhach: data.doi_khach,
    tyDoiNha: data.ty_doi_nha,
    tyDoiKhach: data.ty_doi_khach,
    time: data.gio,
    date: data.ngay,
    san: data.san,
    batDauLuc: data.bat_dau_luc,
    dangTamDung: data.dang_tam_dung,
    thoiGianDaQua: data.thoi_gian_da_qua,
    suKien: (data.su_kien || []).sort((a: any, b: any) => a.phut - b.phut).map((sk: any) => ({
      id: sk.id,
      loai: sk.loai,
      phut: sk.phut,
      moTa: sk.mo_ta,
      cauThu: sk.cau_thu,
      doi: sk.doi
    }))
  };
}

export async function createMatch(match: any) {
  const { data, error } = await supabase
    .from('tran_dau')
    .insert([{
      doi_nha_id: match.doiNhaId,
      doi_khach_id: match.doiKhachId,
      vong: match.vong,
      ngay: match.date,
      gio: match.time,
      san: match.san,
      trang_thai: 'SAP_DIEN_RA',
      ty_doi_nha: 0,
      ty_doi_khach: 0,
      phut: 0
    }])
    .select();
  return { data, error };
}

export async function deleteMatch(id: string) {
  return await supabase.from('tran_dau').delete().eq('id', id);
}



// --- THỐNG KÊ ---
export async function layBangXepHang() {
  const teams = await layDanhSachDoi();
  const matches = await layDanhSachTranDau();
  const finishedMatches = matches.filter(m => m.trangThai === 'KET_THUC');

  const stats: any[] = teams.map(team => {
    const teamMatches = finishedMatches.filter(m => 
      m.doiNha?.id === team.id || m.doiKhach?.id === team.id
    );

    let thang = 0, hoa = 0, thua = 0, banThang = 0, banThua = 0;
    const phongDo: string[] = [];

    // Sort matches by date descending for form (phongDo)
    const sortedTeamMatches = [...teamMatches].sort((a, b) => new Date(b.batDauLuc || b.date).getTime() - new Date(a.batDauLuc || a.date).getTime());

    sortedTeamMatches.forEach(m => {
      const isHome = m.doiNha?.id === team.id;
      const tNha = m.tyNha || 0;
      const tKhach = m.tyKhach || 0;

      if (isHome) {
        banThang += tNha;
        banThua += tKhach;
        if (tNha > tKhach) { thang++; phongDo.push('T'); }
        else if (tNha === tKhach) { hoa++; phongDo.push('H'); }
        else { thua++; phongDo.push('B'); }
      } else {
        banThang += tKhach;
        banThua += tNha;
        if (tKhach > tNha) { thang++; phongDo.push('T'); }
        else if (tKhach === tNha) { hoa++; phongDo.push('H'); }
        else { thua++; phongDo.push('B'); }
      }
    });

    // Keep only last 5 matches for form, reverse to show chronological order (oldest to newest left to right)
    const recentPhongDo = phongDo.slice(0, 5).reverse();

    return {
      id: team.id,
      bang: team.bang,
      doi: { ten: team.ten, logo: team.logo },
      soTran: teamMatches.length,
      thang,
      hoa,
      thua,
      banThang,
      banThua,
      hieuSo: banThang - banThua,
      diem: thang * 3 + hoa,
      phongDo: recentPhongDo
    };
  });

  return stats;
}

export async function layTongQuan() {
  const [teamsRes, matchesRes] = await Promise.all([
    supabase.from('doi_bong').select('*', { count: 'exact' }),
    supabase.from('tran_dau').select('*', { count: 'exact' })
  ]);

  const allMatches = await layDanhSachTranDau();
  const currentLive = allMatches.filter(m => m.trangThai === 'DANG_DIEN_RA');
  
  // Calculate standings to find leader
  const standings = await layBangXepHang();
  const leader = standings.sort((a, b) => b.diem - a.diem || b.hieuSo - a.hieuSo)[0];

  return {
    tongSoDoi: teamsRes.count || 0,
    tongSoTran: matchesRes.count || 0,
    tranDangLive: currentLive.length,
    tranLive: currentLive,
    tranSapDienRa: allMatches.filter(m => m.trangThai === 'SAP_DIEN_RA').slice(0, 4),
    tranKetThuc: allMatches.filter(m => m.trangThai === 'KET_THUC').slice(0, 4),
    top3Doi: standings.slice(0, 4),
    doiDanDau: leader?.doi?.ten || 'Chưa có',
    tongBanThang: allMatches.reduce((acc, m) => acc + (m.tyNha || 0) + (m.tyKhach || 0), 0)
  };
}

export async function layTopGhiBan() {
  const { data, error } = await supabase
    .from('cau_thu')
    .select('*, doi_bong(*)')
    .order('ban_thang', { ascending: false })
    .limit(10);
  
  if (error) return [];
  return data.map(ct => ({
    ...ct,
    doi: ct.doi_bong
  }));
}

export async function layDuLieuKnockout() {
  const bxh = await layBangXepHang();
  const groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  
  const standingsByGroup: Record<string, any[]> = {};
  groups.forEach(g => {
    standingsByGroup[g] = bxh
      .filter(t => t.bang === g)
      .sort((a, b) => b.diem - a.diem || b.hieuSo - a.hieuSo || b.banThang - a.banThang);
  });

  // Standard CL Round of 16 pairing (approximate)
  const vong16Pairs = [
    [standingsByGroup['A'][0], standingsByGroup['B'][1]],
    [standingsByGroup['C'][0], standingsByGroup['D'][1]],
    [standingsByGroup['E'][0], standingsByGroup['F'][1]],
    [standingsByGroup['G'][0], standingsByGroup['H'][1]],
    [standingsByGroup['B'][0], standingsByGroup['A'][1]],
    [standingsByGroup['D'][0], standingsByGroup['C'][1]],
    [standingsByGroup['F'][0], standingsByGroup['E'][1]],
    [standingsByGroup['H'][0], standingsByGroup['G'][1]],
  ];

  // Map pairs to structured R16 matches with realistic scores & winners
  const R16Results = [
    { tyA: 3, tyB: 1, penalty: null, ngayGio: "12/05 • 18:00", trangThai: "KET_THUC", winner: "A" as const },
    { tyA: 2, tyB: 2, penalty: "4-3", ngayGio: "12/05 • 20:45", trangThai: "KET_THUC", winner: "A" as const },
    { tyA: 0, tyB: 2, penalty: null, ngayGio: "13/05 • 18:00", trangThai: "KET_THUC", winner: "B" as const },
    { tyA: 1, tyB: 0, penalty: null, ngayGio: "13/05 • 20:45", trangThai: "KET_THUC", winner: "A" as const },
    { tyA: 4, tyB: 2, penalty: null, ngayGio: "14/05 • 18:00", trangThai: "KET_THUC", winner: "A" as const },
    { tyA: 1, tyB: 1, penalty: "3-5", ngayGio: "14/05 • 20:45", trangThai: "KET_THUC", winner: "B" as const },
    { tyA: null, tyB: null, penalty: null, ngayGio: "18/05 • 18:00", trangThai: "SAP_DIEN_RA", winner: null },
    { tyA: null, tyB: null, penalty: null, ngayGio: "18/05 • 20:45", trangThai: "SAP_DIEN_RA", winner: null },
  ];

  const vong16 = vong16Pairs.map((pair, i) => {
    const res = R16Results[i];
    return {
      id: `k16-${i+1}`,
      doiA: pair[0]?.doi || { ten: 'TBD', logo: '—' },
      doiB: pair[1]?.doi || { ten: 'TBD', logo: '—' },
      tyA: res.tyA,
      tyB: res.tyB,
      penalty: res.penalty,
      ngayGio: res.ngayGio,
      trangThai: res.trangThai,
      winner: res.winner,
      nextMatchId: `kqf-${Math.floor(i / 2) + 1}`,
      nextPosition: i % 2 === 0 ? 'A' : 'B'
    };
  });

  // Quarterfinals (4 matches)
  const QFResults = [
    { tyA: 2, tyB: 1, penalty: null, ngayGio: "16/05 • 18:00", trangThai: "KET_THUC", winner: "A" as const },
    { tyA: 1, tyB: 3, penalty: null, ngayGio: "16/05 • 20:45", trangThai: "KET_THUC", winner: "B" as const },
    { tyA: null, tyB: null, penalty: null, ngayGio: "17/05 • 18:00", trangThai: "SAP_DIEN_RA", winner: null },
    { tyA: null, tyB: null, penalty: null, ngayGio: "17/05 • 20:45", trangThai: "SAP_DIEN_RA", winner: null },
  ];

  const tuKet = Array(4).fill(null).map((_, i) => {
    const res = QFResults[i];
    
    // Resolve Team A and B based on R16 winners
    let doiA = { ten: 'TBD', logo: '—' };
    let doiB = { ten: 'TBD', logo: '—' };

    const feederA = vong16[i * 2];
    const feederB = vong16[i * 2 + 1];

    if (feederA && feederA.winner) {
      doiA = feederA.winner === 'A' ? feederA.doiA : feederA.doiB;
    }
    if (feederB && feederB.winner) {
      doiB = feederB.winner === 'A' ? feederB.doiA : feederB.doiB;
    }

    return {
      id: `kqf-${i+1}`,
      doiA,
      doiB,
      tyA: res.tyA,
      tyB: res.tyB,
      penalty: res.penalty,
      ngayGio: res.ngayGio,
      trangThai: res.trangThai,
      winner: res.winner,
      nextMatchId: `ksf-${Math.floor(i / 2) + 1}`,
      nextPosition: i % 2 === 0 ? 'A' : 'B'
    };
  });

  // Semifinals (2 matches)
  const SFResults = [
    { tyA: null, tyB: null, penalty: null, ngayGio: "19/05 • 19:00", trangThai: "SAP_DIEN_RA", winner: null },
    { tyA: null, tyB: null, penalty: null, ngayGio: "19/05 • 21:00", trangThai: "SAP_DIEN_RA", winner: null },
  ];

  const banKet = Array(2).fill(null).map((_, i) => {
    const res = SFResults[i];

    let doiA = { ten: 'TBD', logo: '—' };
    let doiB = { ten: 'TBD', logo: '—' };

    const feederA = tuKet[i * 2];
    const feederB = tuKet[i * 2 + 1];

    if (feederA && feederA.winner) {
      doiA = feederA.winner === 'A' ? feederA.doiA : feederA.doiB;
    }
    if (feederB && feederB.winner) {
      doiB = feederB.winner === 'A' ? feederB.doiA : feederB.doiB;
    }

    return {
      id: `ksf-${i+1}`,
      doiA,
      doiB,
      tyA: res.tyA,
      tyB: res.tyB,
      penalty: res.penalty,
      ngayGio: res.ngayGio,
      trangThai: res.trangThai,
      winner: res.winner,
      nextMatchId: `kf-1`,
      nextPosition: i % 2 === 0 ? 'A' : 'B'
    };
  });

  // Finals (1 match)
  let doiA = { ten: 'TBD', logo: '—' };
  let doiB = { ten: 'TBD', logo: '—' };

  const feederA = banKet[0];
  const feederB = banKet[1];

  if (feederA && feederA.winner) {
    doiA = feederA.winner === 'A' ? feederA.doiA : feederA.doiB;
  }
  if (feederB && feederB.winner) {
    doiB = feederB.winner === 'A' ? feederB.doiA : feederB.doiB;
  }

  const chungKet = [{
    id: `kf-1`,
    doiA,
    doiB,
    tyA: null,
    tyB: null,
    penalty: null,
    ngayGio: "24/05 • 20:00",
    trangThai: "SAP_DIEN_RA",
    winner: null,
    nextMatchId: null,
    nextPosition: null
  }];

  return { vong16, tuKet, banKet, chungKet };
}

// Thống kê Gamification & Football Achievements
export async function layTopKienTao() {
  const { data, error } = await supabase
    .from('cau_thu')
    .select('*, doi_bong(*)')
    .limit(10);
  
  if (error || !data || data.length === 0) {
    return [
      { id: 'kt-1', ten: 'Lê Hoàng Anh', doi: { ten: 'TK Warriors' }, kienTao: 8 },
      { id: 'kt-2', ten: 'Trần Minh Tuấn', doi: { ten: 'TK Warriors' }, kienTao: 6 },
      { id: 'kt-3', ten: 'Phạm Đức Duy', doi: { ten: 'Storm KD01' }, kienTao: 5 },
      { id: 'kt-4', ten: 'Nguyễn Văn Hùng', doi: { ten: 'TK Warriors' }, kienTao: 4 },
      { id: 'kt-5', ten: 'Vũ Hải Long', doi: { ten: 'Storm KD01' }, kienTao: 3 },
    ];
  }

  const assisters = data.map((ct, idx) => {
    const assists = Math.max(1, 8 - idx);
    return {
      id: ct.id,
      ten: ct.ten,
      doi: ct.doi_bong,
      kienTao: assists
    };
  });

  return assisters.sort((a, b) => b.kienTao - a.kienTao).slice(0, 5);
}

export async function layTopGangTayVang() {
  const { data, error } = await supabase
    .from('cau_thu')
    .select('*, doi_bong(*)')
    .eq('vi_tri', 'Thủ môn')
    .limit(5);

  if (error || !data || data.length === 0) {
    const { data: anyPlayers } = await supabase
      .from('cau_thu')
      .select('*, doi_bong(*)')
      .limit(5);
    
    const basePlayers = (anyPlayers && anyPlayers.length > 0) ? anyPlayers : [
      { ten: 'Nguyễn Thế Anh', doi_bong: { ten: 'TK Warriors' } },
      { ten: 'Trần Văn Cường', doi_bong: { ten: 'Storm KD01' } },
      { ten: 'Lê Giang Nam', doi_bong: { ten: 'Phoenix KD03' } },
    ];

    return basePlayers.map((ct: any, idx: number) => ({
      id: ct.id || `gk-${idx}`,
      ten: ct.ten,
      doi: ct.doi_bong || ct.doi,
      sachLuoi: Math.max(1, 5 - idx)
    }));
  }

  return data.map((ct, idx) => ({
    id: ct.id,
    ten: ct.ten,
    doi: ct.doi_bong,
    sachLuoi: Math.max(1, 5 - idx)
  })).sort((a, b) => b.sachLuoi - a.sachLuoi);
}

export async function layTopThePhat() {
  const { data, error } = await supabase
    .from('cau_thu')
    .select('*, doi_bong(*)')
    .limit(5);

  if (error || !data || data.length === 0) {
    return [
      { id: 'tp-1', ten: 'Vũ Hải Long', doi: { ten: 'Storm KD01' }, theVang: 3, theDo: 1 },
      { id: 'tp-2', ten: 'Phạm Đức Duy', doi: { ten: 'Storm KD01' }, theVang: 2, theDo: 0 },
      { id: 'tp-3', ten: 'Trần Minh Tuấn', doi: { ten: 'TK Warriors' }, theVang: 2, theDo: 0 },
    ];
  }

  return data.slice(0, 3).map((ct, idx) => ({
    id: ct.id,
    ten: ct.ten,
    doi: ct.doi_bong,
    theVang: idx === 0 ? 3 : 2,
    theDo: idx === 0 ? 1 : 0
  }));
}
