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
    // This is a simplified approach: delete all and re-insert or use upsert
    // For now, let's assume players are managed separately or using upsert
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
    suKien: m.su_kien || []
  }));
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
      san: match.san
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

    teamMatches.forEach(m => {
      const isHome = m.doiNha?.id === team.id;
      const tNha = m.tyNha || 0;
      const tKhach = m.tyKhach || 0;

      if (isHome) {
        banThang += tNha;
        banThua += tKhach;
        if (tNha > tKhach) thang++;
        else if (tNha === tKhach) hoa++;
        else thua++;
      } else {
        banThang += tKhach;
        banThua += tNha;
        if (tKhach > tNha) thang++;
        else if (tKhach === tNha) hoa++;
        else thua++;
      }
    });

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
      diem: thang * 3 + hoa
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
