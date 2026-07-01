import { supabase } from './supabase';

const NESTJS_API_URL = 'http://localhost:3001/api';

export async function layDanhSachTournamentTemplates() {
  try {
    const response = await fetch(`${NESTJS_API_URL}/tournament-templates`);
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
  } catch (error) {
    console.error('Lỗi lấy danh sách template giải đấu:', error);
    return [];
  }
}

export async function getTournamentRules(tournamentId: string) {
  try {
    const response = await fetch(`${NESTJS_API_URL}/tournaments/${tournamentId}/rules`);
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
  } catch (error) {
    console.error('Lỗi lấy luật giải đấu:', error);
    return null;
  }
}

export async function updateTournamentRules(tournamentId: string, rules: any) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const response = await fetch(`${NESTJS_API_URL}/tournaments/${tournamentId}/rules`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(session ? { 'Authorization': `Bearer ${session.access_token}` } : {})
      },
      body: JSON.stringify(rules),
    });
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
  } catch (error) {
    console.error('Lỗi cập nhật luật giải đấu:', error);
    return null;
  }
}

// --- GIẢI ĐẤU (WORKSPACES) ---
export async function layDanhSachGiaiDau() {
  const { data, error } = await supabase
    .from('giai_dau')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Lỗi lấy danh sách giải đấu:', error);
    return [];
  }
  return data;
}

export async function createTournament(tournament: any) {
  const { data, error } = await supabase
    .from('giai_dau')
    .insert([{
      id: tournament.id,
      ten: tournament.ten,
      mua_giai: tournament.muaGiai,
      ngay_bat_dau: tournament.ngayBatDau,
      venue_type: tournament.venue_type
    }])
    .select();
  return { data, error };
}

// --- ĐỘI BÓNG ---
export async function layDanhSachDoi(giaiDauId?: string) {
  let query = supabase
    .from('doi_bong')
    .select('*, cau_thu(*)');
  
  if (giaiDauId) {
    query = query.eq('giai_dau_id', giaiDauId);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Lỗi lấy danh sách đội:', error);
    return [];
  }
  
  return data.map(doi => ({
    ...doi,
    vietTat: doi.viet_tat,
    externalApiId: doi.external_api_id,
    logoSource: doi.logo_source,
    cauThu: doi.cau_thu ? doi.cau_thu.map((ct: any) => ({
      ...ct,
      banThang: ct.ban_thang,
      soAo: ct.so_ao,
      viTri: ct.vi_tri
    })).sort((a: any, b: any) => {
      const aIsStarter = !a.viTri?.includes('Dự bị') ? 1 : 0;
      const bIsStarter = !b.viTri?.includes('Dự bị') ? 1 : 0;
      if (aIsStarter !== bIsStarter) return bIsStarter - aIsStarter;
      return a.soAo - b.soAo;
    }) : []
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
      bang: team.bang,
      giai_dau_id: team.giaiDauId,
      external_api_id: team.externalApiId || null,
      logo_source: team.logoSource || 'DEFAULT'
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
      bang: team.bang,
      external_api_id: team.externalApiId || null,
      logo_source: team.logoSource || 'DEFAULT'
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

export async function deleteAllTeams(giaiDauId: string) {
  const { data: teams, error: fetchErr } = await supabase
    .from('doi_bong')
    .select('id')
    .eq('giai_dau_id', giaiDauId);
  
  if (fetchErr) return { error: fetchErr };
  
  if (teams && teams.length > 0) {
    const teamIds = teams.map(t => t.id);
    const { error: playersErr } = await supabase
      .from('cau_thu')
      .delete()
      .in('doi_id', teamIds);
    if (playersErr) return { error: playersErr };
  }
  
  return await supabase.from('doi_bong').delete().eq('giai_dau_id', giaiDauId);
}

// --- TRẬN ĐẤU ---
export async function layDanhSachTranDau(giaiDauId?: string) {
  let query = supabase
    .from('tran_dau')
    .select(`
      *,
      doi_nha:doi_nha_id(*, cau_thu(*)),
      doi_khach:doi_khach_id(*, cau_thu(*)),
      giai_dau:giai_dau_id(ten, rules_config),
      su_kien(
        *,
        cau_thu:cau_thu_id(id, ten, so_ao),
        doi:doi_id(id, ten)
      )
    `);

  if (giaiDauId) {
    query = query.eq('giai_dau_id', giaiDauId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Lỗi lấy danh sách trận đấu:', error);
    return [];
  }

  const parseTeam = (t: any) => {
    if (!t) return null;
    return {
      ...t,
      cauThu: (t.cau_thu || []).map((ct: any) => ({
        id: ct.id,
        ten: ct.ten,
        soAo: ct.so_ao,
        viTri: ct.vi_tri,
        banThang: ct.ban_thang
      })).sort((a: any, b: any) => {
        const aIsStarter = !a.viTri?.includes('Dự bị') ? 1 : 0;
        const bIsStarter = !b.viTri?.includes('Dự bị') ? 1 : 0;
        if (aIsStarter !== bIsStarter) return bIsStarter - aIsStarter; // Starters come first
        return a.soAo - b.soAo;
      })
    };
  };

  return data.map(m => ({
    id: m.id,
    giaiDauId: m.giai_dau_id,
    doiNha: parseTeam(m.doi_nha),
    doiKhach: parseTeam(m.doi_khach),
    tyNha: m.ty_doi_nha,
    tyKhach: m.ty_doi_khach,
    phut: m.phut,
    vong: m.vong,
    giaiDauTen: m.giai_dau?.ten,
    matchDurationMinutes: m.giai_dau?.rules_config?.matchFormat?.minutesPerHalf
      ? m.giai_dau.rules_config.matchFormat.minutesPerHalf * 2
      : 90,
    trangThai: m.trang_thai,
    time: m.gio,
    date: m.ngay,
    san: m.san,
    batDauLuc: m.bat_dau_luc,
    dangTamDung: m.dang_tam_dung,
    thoiGianDaQua: m.thoi_gian_da_qua,
    currentPeriod: m.current_period || 'HALF_1',
    half1StartTime: m.half1_start_time,
    half1EndTime: m.half1_end_time,
    half2StartTime: m.half2_start_time,
    half2EndTime: m.half2_end_time,
    suKien: (m.su_kien || []).map((sk: any) => ({
      id: sk.id,
      loai: sk.loai,
      phut: sk.phut,
      moTa: sk.mo_ta,
      cauThu: sk.cau_thu ? {
        id: sk.cau_thu.id,
        ten: sk.cau_thu.ten,
        soAo: sk.cau_thu.so_ao,
        so_ao: sk.cau_thu.so_ao
      } : null,
      doi: sk.doi,
      doiId: sk.doi_id,
      teamId: sk.doi_id,
      cauThuId: sk.cau_thu_id
    }))
  }));
}

export function getDisplayTime(match: any, matchDuration: number = 90): string {
  if (match.trangThai === 'SAP_DIEN_RA') return "0'";
  if (match.trangThai === 'KET_THUC') return "FT";

  const now = new Date().getTime();
  const halfDuration = matchDuration / 2;

  if (match.currentPeriod === 'HALF_1') {
    if (!match.half1StartTime) return "0'";
    const start = new Date(match.half1StartTime).getTime();
    const elapsedSeconds = (now - start) / 1000;
    
    if (elapsedSeconds < halfDuration * 60) {
      return `${Math.floor(elapsedSeconds / 60) + 1}'`;
    } else {
      const extraMinute = Math.floor((elapsedSeconds - halfDuration * 60) / 60) + 1;
      return `${halfDuration} + ${extraMinute}'`;
    }
  }

  if (match.currentPeriod === 'HALF_2') {
    if (!match.half2StartTime) return `${halfDuration}'`;
    const start = new Date(match.half2StartTime).getTime();
    const elapsedSeconds = ((now - start) / 1000) + (halfDuration * 60);
    
    if (elapsedSeconds < matchDuration * 60) {
      return `${Math.floor(elapsedSeconds / 60) + 1}'`;
    } else {
      const extraMinute = Math.floor((elapsedSeconds - matchDuration * 60) / 60) + 1;
      return `${matchDuration} + ${extraMinute}'`;
    }
  }

  if (match.currentPeriod === 'BREAK') {
    return "HT";
  }

  return "0'";
}

export function calculateMatchMinute(match: any, matchDuration: number = 90) {
  if (match.trangThai === 'SAP_DIEN_RA') return 0;
  if (match.trangThai === 'KET_THUC') return match.phut || matchDuration;

  const now = new Date().getTime();
  const halfDuration = matchDuration / 2;

  if (match.currentPeriod === 'HALF_1') {
    if (!match.half1StartTime) return 0;
    const start = new Date(match.half1StartTime).getTime();
    const elapsedSeconds = (now - start) / 1000;
    return Math.floor(elapsedSeconds / 60) + 1;
  }

  if (match.currentPeriod === 'HALF_2') {
    if (!match.half2StartTime) return halfDuration;
    const start = new Date(match.half2StartTime).getTime();
    const elapsedSeconds = ((now - start) / 1000) + (halfDuration * 60);
    return Math.floor(elapsedSeconds / 60) + 1;
  }

  return 0;
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

export async function startHalf1(matchId: string) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const res = await fetch(`${apiUrl}/api/matches/${matchId}/start-half1`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error("Failed to start half 1");
  return await res.json();
}

export async function endHalf1(matchId: string) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const res = await fetch(`${apiUrl}/api/matches/${matchId}/end-half1`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error("Failed to end half 1");
  return await res.json();
}

export async function startHalf2(matchId: string) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const res = await fetch(`${apiUrl}/api/matches/${matchId}/start-half2`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error("Failed to start half 2");
  return await res.json();
}

export async function endMatchPeriod(matchId: string) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const res = await fetch(`${apiUrl}/api/matches/${matchId}/end-match`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error("Failed to end match period");
  return await res.json();
}

export async function addEvent(event: any) {
  const { data: { session } } = await supabase.auth.getSession();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const res = await fetch(`${apiUrl}/api/match-events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(session ? { 'Authorization': `Bearer ${session.access_token}` } : {})
    },
    body: JSON.stringify({
      matchId: event.matchId,
      teamId: event.teamId,
      playerId: event.playerId,
      type: event.type,
      eventMinute: event.minute,
      description: event.description
    })
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message || result.error || "Failed to add event");
  return { data: result, error: null };
}

export async function quickAddPlayer(matchId: string, teamId: string, name: string, jerseyNumber: number) {
  const { data: { session } } = await supabase.auth.getSession();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const res = await fetch(`${apiUrl}/api/matches/${matchId}/teams/${teamId}/quick-add-player`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(session ? { 'Authorization': `Bearer ${session.access_token}` } : {})
    },
    body: JSON.stringify({
      name,
      jerseyNumber
    })
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message || result.error || "Failed to quick add player");
  return { data: result.player, error: null };
}

export async function updatePlayerGoals(playerId: string, increment: number) {
  const { data: ct, error } = await supabase.from('cau_thu').select('ban_thang').eq('id', playerId).single();
  if (ct) {
    const currentGoals = ct.ban_thang || 0;
    return await supabase
      .from('cau_thu')
      .update({ ban_thang: Math.max(0, currentGoals + increment) })
      .eq('id', playerId);
  }
}

export async function deleteEvent(id: string) {
  return await supabase.from('su_kien').delete().eq('id', id);
}


export async function layChiTietTranDau(id: string) {
  const { data, error } = await supabase
    .from('tran_dau')
    .select(`
      *,
      doi_nha:doi_nha_id(*, cau_thu(*)),
      doi_khach:doi_khach_id(*, cau_thu(*)),
      su_kien(
        *,
        cau_thu:cau_thu_id(id, ten, so_ao),
        doi:doi_id(id, ten)
      ),
      giai_dau:giai_dau_id(rules_config)
    `)
    .eq('id', id)
    .single();

  if (error || !data) return null;

  const parseTeam = (t: any) => {
    if (!t) return null;
    return {
      ...t,
      cauThu: (t.cau_thu || []).map((ct: any) => ({
        id: ct.id,
        ten: ct.ten,
        soAo: ct.so_ao,
        viTri: ct.vi_tri,
        banThang: ct.ban_thang
      })).sort((a: any, b: any) => {
        const aIsStarter = !a.viTri?.includes('Dự bị') ? 1 : 0;
        const bIsStarter = !b.viTri?.includes('Dự bị') ? 1 : 0;
        if (aIsStarter !== bIsStarter) return bIsStarter - aIsStarter; // Starters come first
        return a.soAo - b.soAo;
      })
    };
  };

  return {
    id: data.id,
    vong: data.vong,
    phut: data.phut,
    trangThai: data.trang_thai,
    doiNha: parseTeam(data.doi_nha),
    doiKhach: parseTeam(data.doi_khach),
    tyDoiNha: data.ty_doi_nha,
    tyDoiKhach: data.ty_doi_khach,
    matchDurationMinutes: data.giai_dau?.rules_config?.matchFormat?.minutesPerHalf
      ? data.giai_dau.rules_config.matchFormat.minutesPerHalf * 2
      : 90,
    time: data.gio,
    date: data.ngay,
    san: data.san,
    batDauLuc: data.bat_dau_luc,
    dangTamDung: data.dang_tam_dung,
    thoiGianDaQua: data.thoi_gian_da_qua,
    currentPeriod: data.current_period || 'HALF_1',
    half1StartTime: data.half1_start_time,
    half1EndTime: data.half1_end_time,
    half2StartTime: data.half2_start_time,
    half2EndTime: data.half2_end_time,
    suKien: (data.su_kien || []).sort((a: any, b: any) => a.phut - b.phut).map((sk: any) => ({
      id: sk.id,
      loai: sk.loai,
      phut: sk.phut,
      moTa: sk.mo_ta,
      cauThu: sk.cau_thu ? {
        id: sk.cau_thu.id,
        ten: sk.cau_thu.ten,
        soAo: sk.cau_thu.so_ao,
        so_ao: sk.cau_thu.so_ao
      } : null,
      doi: sk.doi,
      doiId: sk.doi_id,
      teamId: sk.doi_id,
      cauThuId: sk.cau_thu_id
    }))
  };
}

export async function createMatch(match: any) {
  const matchId = match.id || `match-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const { data, error } = await supabase
    .from('tran_dau')
    .insert([{
      id: matchId,
      doi_nha_id: match.doiNhaId,
      doi_khach_id: match.doiKhachId,
      vong: match.vong,
      ngay: match.date,
      gio: match.time,
      san: match.san,
      trang_thai: 'SAP_DIEN_RA',
      ty_doi_nha: 0,
      ty_doi_khach: 0,
      phut: 0,
      giai_dau_id: match.giaiDauId
    }])
    .select();
  return { data, error };
}

export async function deleteMatch(id: string) {
  return await supabase.from('tran_dau').delete().eq('id', id);
}



// --- THỐNG KÊ ---
export async function layBangXepHang(giaiDauId?: string, preloadedTeams?: any[], preloadedMatches?: any[]) {
  let customEvents: any[] = [];
  if (typeof window !== 'undefined' && giaiDauId) {
    const configStr = localStorage.getItem(`giai_dau_config_${giaiDauId}`);
    if (configStr) {
      try {
        const config = JSON.parse(configStr);
        customEvents = config.customEvents || [];
      } catch (e) {}
    }
  }

  const teams = preloadedTeams || await layDanhSachDoi(giaiDauId);
  const matches = preloadedMatches || await layDanhSachTranDau(giaiDauId);
  // Count only matches that are finished (strictly following FIFA regulations)
  const playedMatches = matches.filter((m: any) => m.trangThai === 'KET_THUC');

  const stats: any[] = teams.map(team => {
    const teamMatches = playedMatches.filter(m => 
      m.doiNha?.id === team.id || m.doiKhach?.id === team.id
    );

    let thang = 0, hoa = 0, thua = 0, banThang = 0, banThua = 0;
    const phongDo: string[] = [];
    const customStats: Record<string, number> = {};
    customEvents.forEach(e => customStats[e.id] = 0);
    let customPoints = 0;

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

      // Process custom events
      if (m.suKien) {
        m.suKien.forEach((ev: any) => {
          if (ev.doiId === team.id && ev.loai.startsWith('CUSTOM_')) {
            const customId = ev.loai.replace('CUSTOM_', '').toLowerCase();
            const evtConfig = customEvents.find(e => e.id.toLowerCase() === customId);
            if (evtConfig) {
              customStats[evtConfig.id] = (customStats[evtConfig.id] || 0) + 1;
              if (!evtConfig.isIndividual) {
                customPoints += (evtConfig.points || 0);
              }
            }
          }
        });
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
      diem: (thang * 3 + hoa) + customPoints,
      phongDo: recentPhongDo,
      customStats
    };
  });

  return stats;
}

export async function layTongQuan(giaiDauId?: string) {
  let teamsQuery = supabase.from('doi_bong').select('*', { count: 'exact' });
  let matchesQuery = supabase.from('tran_dau').select('*', { count: 'exact' });

  if (giaiDauId) {
    teamsQuery = teamsQuery.eq('giai_dau_id', giaiDauId);
    matchesQuery = matchesQuery.eq('giai_dau_id', giaiDauId);
  }

  const [teamsRes, matchesRes, allMatches, teamsList] = await Promise.all([
    teamsQuery,
    matchesQuery,
    layDanhSachTranDau(giaiDauId),
    layDanhSachDoi(giaiDauId)
  ]);

  const currentLive = allMatches.filter(m => m.trangThai === 'DANG_DIEN_RA');
  
  // Calculate standings to find leader
  const standings = await layBangXepHang(giaiDauId, teamsList, allMatches);
  const leader = standings.sort((a, b) => b.diem - a.diem || b.hieuSo - a.hieuSo)[0];

  return {
    tongSoDoi: teamsRes.count || 0,
    tongSoTran: matchesRes.count || 0,
    tranDangLive: currentLive.length,
    tranLive: currentLive,
    tranSapDienRa: allMatches.filter(m => m.trangThai === 'SAP_DIEN_RA').slice(0, 4),
    tranKetThuc: allMatches.filter(m => m.trangThai === 'KET_THUC').slice(0, 4),
    allMatches: allMatches,
    teamsList: teamsList,
    top3Doi: standings.slice(0, 4),
    doiDanDau: leader?.doi?.ten || 'Chưa có',
    tongBanThang: allMatches.reduce((acc, m) => acc + (m.tyNha || 0) + (m.tyKhach || 0), 0)
  };
}

export async function layTopGhiBan(giaiDauId?: string) {
  let query = supabase
    .from('cau_thu')
    .select('*, doi_bong!inner(*)');

  if (giaiDauId) {
    query = query.eq('doi_bong.giai_dau_id', giaiDauId);
  }

  const { data, error } = await query
    .order('ban_thang', { ascending: false })
    .limit(10);
  
  if (error) return [];
  return data.map(ct => ({
    ...ct,
    doi: ct.doi_bong
  }));
}

export async function layTopCustomEvents(giaiDauId?: string) {
  let customEvents: any[] = [];
  if (typeof window !== 'undefined' && giaiDauId) {
    const configStr = localStorage.getItem(`giai_dau_config_${giaiDauId}`);
    if (configStr) {
      try {
        const config = JSON.parse(configStr);
        customEvents = config.customEvents || [];
      } catch (e) {}
    }
  }

  const individualEvents = customEvents.filter(e => e.isIndividual);
  if (individualEvents.length === 0) return { eventsConfig: [], topPlayers: {} };

  const matches = await layDanhSachTranDau(giaiDauId);
  const matchIds = matches.map((m: any) => m.id);

  if (matchIds.length === 0) return { eventsConfig: individualEvents, topPlayers: {} };

  const { data: suKienData } = await supabase
    .from('su_kien')
    .select('*, cau_thu(*, doi_bong(*))')
    .in('tran_dau_id', matchIds);

  const playerStats: Record<string, any> = {};

  if (suKienData) {
    suKienData.forEach((ev: any) => {
      if (ev.cau_thu_id && ev.loai.startsWith('CUSTOM_')) {
        const customId = ev.loai.replace('CUSTOM_', '').toLowerCase();
        const evtConfig = individualEvents.find(e => e.id.toLowerCase() === customId);
        if (evtConfig) {
          if (!playerStats[evtConfig.id]) playerStats[evtConfig.id] = {};
          if (!playerStats[evtConfig.id][ev.cau_thu_id]) {
            playerStats[evtConfig.id][ev.cau_thu_id] = {
              cauThuId: ev.cau_thu_id,
              ten: ev.cau_thu?.ten || 'Không xác định',
              doi: ev.cau_thu?.doi_bong,
              count: 0
            };
          }
          playerStats[evtConfig.id][ev.cau_thu_id].count++;
        }
      }
    });
  }

  const result: Record<string, any[]> = {};
  Object.keys(playerStats).forEach(eventId => {
    result[eventId] = Object.values(playerStats[eventId])
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 3);
  });

  return { eventsConfig: individualEvents, topPlayers: result };
}

export async function layDuLieuKnockout(giaiDauId?: string) {
  const bxh = await layBangXepHang(giaiDauId);
  const groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  
  const standingsByGroup: Record<string, any[]> = {};
  groups.forEach(g => {
    standingsByGroup[g] = bxh
      .filter(t => t.bang === g)
      .sort((a, b) => b.diem - a.diem || b.hieuSo - a.hieuSo || b.banThang - a.banThang);
  });

  // Standard CL Round of 16 pairing
  const vong16Pairs = [
    [standingsByGroup['A']?.[0], standingsByGroup['B']?.[1]],
    [standingsByGroup['C']?.[0], standingsByGroup['D']?.[1]],
    [standingsByGroup['E']?.[0], standingsByGroup['F']?.[1]],
    [standingsByGroup['G']?.[0], standingsByGroup['H']?.[1]],
    [standingsByGroup['B']?.[0], standingsByGroup['A']?.[1]],
    [standingsByGroup['D']?.[0], standingsByGroup['C']?.[1]],
    [standingsByGroup['F']?.[0], standingsByGroup['E']?.[1]],
    [standingsByGroup['H']?.[0], standingsByGroup['G']?.[1]],
  ];

  const allMatches = await layDanhSachTranDau(giaiDauId);
  const tournamentId = giaiDauId || (allMatches[0]?.giaiDauId) || 'default';

  const groupMatches = allMatches.filter(m => m.vong?.startsWith('Vòng bảng') || m.vong?.toLowerCase().includes('bảng'));
  const allGroupCompleted = groupMatches.length > 0 && groupMatches.every(m => m.trangThai === 'KET_THUC');

  // Perform background DB updates/resets
  setTimeout(async () => {
    try {
      if (!allGroupCompleted) {
        // Reset all knockout matches in DB to null
        const knockoutIds = [
          `match-${tournamentId}-k16-1`, `match-${tournamentId}-k16-2`, `match-${tournamentId}-k16-3`, `match-${tournamentId}-k16-4`, `match-${tournamentId}-k16-5`, `match-${tournamentId}-k16-6`, `match-${tournamentId}-k16-7`, `match-${tournamentId}-k16-8`,
          `match-${tournamentId}-tk-1`, `match-${tournamentId}-tk-2`, `match-${tournamentId}-tk-3`, `match-${tournamentId}-tk-4`,
          `match-${tournamentId}-bk-1`, `match-${tournamentId}-bk-2`,
          `match-${tournamentId}-ck-1`
        ];
        for (const matchId of knockoutIds) {
          const dbMatch = allMatches.find(m => m.id === matchId);
          if (dbMatch && (dbMatch.doiNha?.id || dbMatch.doiKhach?.id)) {
            await supabase
              .from('tran_dau')
              .update({
                doi_nha_id: null,
                doi_khach_id: null,
                trang_thai: 'SAP_DIEN_RA',
                ty_doi_nha: 0,
                ty_doi_khach: 0,
                phut: 0,
                bat_dau_luc: null,
                dang_tam_dung: false,
                thoi_gian_da_qua: 0
              })
              .eq('id', matchId);
          }
        }
      } else {
        // Update Vòng 1/8 matches in DB if not set
        for (let i = 0; i < 8; i++) {
          const pair = vong16Pairs[i];
          const teamAId = pair[0]?.id;
          const teamBId = pair[1]?.id;
          if (teamAId && teamBId) {
            const matchId = `match-${tournamentId}-k16-${i + 1}`;
            const dbMatch = allMatches.find(m => m.id === matchId);
            if (dbMatch && (!dbMatch.doiNha?.id || !dbMatch.doiKhach?.id)) {
              await supabase
                .from('tran_dau')
                .update({
                  doi_nha_id: teamAId,
                  doi_khach_id: teamBId
                })
                .eq('id', matchId);
            }
          }
        }

        // QF matches
        const getWinnerOfMatch = (matchId: string) => {
          const m = allMatches.find(x => x.id === matchId);
          if (m && m.trangThai === 'KET_THUC') {
            return m.tyNha > m.tyKhach ? m.doiNha?.id : m.tyKhach > m.tyNha ? m.doiKhach?.id : m.doiNha?.id;
          }
          return null;
        };

        // QF 1: Winner V1/8-1 vs Winner V1/8-2
        // QF 2: Winner V1/8-3 vs Winner V1/8-4
        // QF 3: Winner V1/8-5 vs Winner V1/8-6
        // QF 4: Winner V1/8-7 vs Winner V1/8-8
        for (let i = 0; i < 4; i++) {
          const wA = getWinnerOfMatch(`match-${tournamentId}-k16-${i * 2 + 1}`);
          const wB = getWinnerOfMatch(`match-${tournamentId}-k16-${i * 2 + 2}`);
          if (wA && wB) {
            const matchId = `match-${tournamentId}-tk-${i + 1}`;
            const dbMatch = allMatches.find(m => m.id === matchId);
            if (dbMatch && (!dbMatch.doiNha?.id || !dbMatch.doiKhach?.id)) {
              await supabase
                .from('tran_dau')
                .update({
                  doi_nha_id: wA,
                  doi_khach_id: wB
                })
                .eq('id', matchId);
            }
          }
        }

        // SF 1: Winner QF-1 vs Winner QF-2
        // SF 2: Winner QF-3 vs Winner QF-4
        for (let i = 0; i < 2; i++) {
          const wA = getWinnerOfMatch(`match-${tournamentId}-tk-${i * 2 + 1}`);
          const wB = getWinnerOfMatch(`match-${tournamentId}-tk-${i * 2 + 2}`);
          if (wA && wB) {
            const matchId = `match-${tournamentId}-bk-${i + 1}`;
            const dbMatch = allMatches.find(m => m.id === matchId);
            if (dbMatch && (!dbMatch.doiNha?.id || !dbMatch.doiKhach?.id)) {
              await supabase
                .from('tran_dau')
                .update({
                  doi_nha_id: wA,
                  doi_khach_id: wB
                })
                .eq('id', matchId);
            }
          }
        }

        // Final: Winner SF-1 vs Winner SF-2
        const wA = getWinnerOfMatch(`match-${tournamentId}-bk-1`);
        const wB = getWinnerOfMatch(`match-${tournamentId}-bk-2`);
        if (wA && wB) {
          const matchId = `match-${tournamentId}-ck-1`;
          const dbMatch = allMatches.find(m => m.id === matchId);
          if (dbMatch && (!dbMatch.doiNha?.id || !dbMatch.doiKhach?.id)) {
            await supabase
              .from('tran_dau')
              .update({
                doi_nha_id: wA,
                doi_khach_id: wB
              })
              .eq('id', matchId);
          }
        }
      }
    } catch (e) {
      console.error('Error syncing knockout database teams:', e);
    }
  }, 0);

  const getMatchForTeams = (matchId: string, tA: any, tB: any, defaultTime: string) => {
    const match = allMatches.find(m => m.id === matchId);
    if (!match) {
      return {
        doiA: tA || { ten: 'TBD', logo: '—' },
        doiB: tB || { ten: 'TBD', logo: '—' },
        tyA: null, tyB: null, penalty: null, ngayGio: defaultTime, trangThai: "SAP_DIEN_RA", winner: null
      };
    }
    const doiA = match.doiNha || tA || { ten: 'TBD', logo: '—' };
    const doiB = match.doiKhach || tB || { ten: 'TBD', logo: '—' };

    const tyA = match.doiNha ? match.tyNha : null;
    const tyB = match.doiKhach ? match.tyKhach : null;
    
    let winner = null;
    if (match.trangThai === 'KET_THUC') {
       if (match.tyNha > match.tyKhach) winner = "A";
       else if (match.tyKhach > match.tyNha) winner = "B";
       else winner = "A"; // Tiebreaker fallback
    }

    const timeStr = match.date ? `${match.date.split('-').reverse().slice(0, 2).join('/')} • ${match.time?.substring(0, 5) || '18:00'}` : defaultTime;

    return {
      doiA,
      doiB,
      tyA, tyB, penalty: null, ngayGio: timeStr, trangThai: match.trangThai, winner
    };
  };

  const defaultTimes16 = ["12/05 • 18:00", "12/05 • 20:45", "13/05 • 18:00", "13/05 • 20:45", "14/05 • 18:00", "14/05 • 20:45", "18/05 • 18:00", "18/05 • 20:45"];
  
  const vong16Placeholders = [
    { A: { ten: 'Nhất Bảng A', logo: '🅰️' }, B: { ten: 'Nhì Bảng B', logo: '🅱️' } },
    { A: { ten: 'Nhất Bảng C', logo: '🅲' }, B: { ten: 'Nhì Bảng D', logo: '🅳' } },
    { A: { ten: 'Nhất Bảng E', logo: '🅴' }, B: { ten: 'Nhì Bảng F', logo: '🅵' } },
    { A: { ten: 'Nhất Bảng G', logo: '🅶' }, B: { ten: 'Nhì Bảng H', logo: '🅷' } },
    { A: { ten: 'Nhất Bảng B', logo: '🅱️' }, B: { ten: 'Nhì Bảng A', logo: '🅰️' } },
    { A: { ten: 'Nhất Bảng D', logo: '🅳' }, B: { ten: 'Nhì Bảng C', logo: '🅲' } },
    { A: { ten: 'Nhất Bảng F', logo: '🅵' }, B: { ten: 'Nhì Bảng E', logo: '🅴' } },
    { A: { ten: 'Nhất Bảng H', logo: '🅷' }, B: { ten: 'Nhì Bảng G', logo: '🅶' } },
  ];

  const vong16 = vong16Pairs.map((pair, i) => {
    const placeholder = vong16Placeholders[i];
    const tA = allGroupCompleted && pair[0] ? { id: pair[0].id, ten: pair[0].doi.ten, logo: pair[0].doi.logo } : { id: null, ...placeholder.A };
    const tB = allGroupCompleted && pair[1] ? { id: pair[1].id, ten: pair[1].doi.ten, logo: pair[1].doi.logo } : { id: null, ...placeholder.B };

    const res = getMatchForTeams(`match-${tournamentId}-k16-${i + 1}`, tA, tB, defaultTimes16[i]);
    return {
      id: `k16-${i+1}`,
      ...res,
      nextMatchId: `kqf-${Math.floor(i / 2) + 1}`,
      nextPosition: i % 2 === 0 ? 'A' : 'B'
    };
  });

  const defaultTimesQF = ["16/05 • 18:00", "16/05 • 20:45", "17/05 • 18:00", "17/05 • 20:45"];
  const tuKet = Array(4).fill(null).map((_, i) => {
    const feederA = vong16[i * 2];
    const feederB = vong16[i * 2 + 1];
    const tA = feederA?.winner ? (feederA.winner === 'A' ? feederA.doiA : feederA.doiB) : null;
    const tB = feederB?.winner ? (feederB.winner === 'A' ? feederB.doiA : feederB.doiB) : null;
    
    const placeholderA = { id: null, ten: `Thắng Trận 1/8 [${i * 2 + 1}]`, logo: '⚔️' };
    const placeholderB = { id: null, ten: `Thắng Trận 1/8 [${i * 2 + 2}]`, logo: '⚔️' };

    const res = getMatchForTeams(`match-${tournamentId}-tk-${i + 1}`, tA || placeholderA, tB || placeholderB, defaultTimesQF[i]);
    return {
      id: `kqf-${i+1}`,
      ...res,
      nextMatchId: `ksf-${Math.floor(i / 2) + 1}`,
      nextPosition: i % 2 === 0 ? 'A' : 'B'
    };
  });

  const defaultTimesSF = ["19/05 • 19:00", "19/05 • 21:00"];
  const banKet = Array(2).fill(null).map((_, i) => {
    const feederA = tuKet[i * 2];
    const feederB = tuKet[i * 2 + 1];
    const tA = feederA?.winner ? (feederA.winner === 'A' ? feederA.doiA : feederA.doiB) : null;
    const tB = feederB?.winner ? (feederB.winner === 'A' ? feederB.doiA : feederB.doiB) : null;
    
    const placeholderA = { id: null, ten: `Thắng Tứ Kết ${i * 2 + 1}`, logo: '🏆' };
    const placeholderB = { id: null, ten: `Thắng Tứ Kết ${i * 2 + 2}`, logo: '🏆' };

    const res = getMatchForTeams(`match-${tournamentId}-bk-${i + 1}`, tA || placeholderA, tB || placeholderB, defaultTimesSF[i]);
    return {
      id: `ksf-${i+1}`,
      ...res,
      nextMatchId: `kf-1`,
      nextPosition: i % 2 === 0 ? 'A' : 'B'
    };
  });

  const feederA = banKet[0];
  const feederB = banKet[1];
  const tA = feederA?.winner ? (feederA.winner === 'A' ? feederA.doiA : feederA.doiB) : null;
  const tB = feederB?.winner ? (feederB.winner === 'A' ? feederB.doiA : feederB.doiB) : null;

  const placeholderA = { id: null, ten: 'Thắng Bán Kết 1', logo: '👑' };
  const placeholderB = { id: null, ten: 'Thắng Bán Kết 2', logo: '👑' };

  const res = getMatchForTeams(`match-${tournamentId}-ck-1`, tA || placeholderA, tB || placeholderB, "24/05 • 20:00");
  const chungKet = [{
    id: `kf-1`,
    ...res,
    nextMatchId: null,
    nextPosition: null
  }];

  return { vong16, tuKet, banKet, chungKet, allGroupCompleted };
}

// Thống kê Gamification & Football Achievements
export async function layTopKienTao(giaiDauId?: string) {
  let query = supabase
    .from('cau_thu')
    .select('*, doi_bong!inner(*)');

  if (giaiDauId) {
    query = query.eq('doi_bong.giai_dau_id', giaiDauId);
  }

  const { data, error } = await query.limit(10);
  
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

export async function layTopGangTayVang(giaiDauId?: string) {
  let query = supabase
    .from('cau_thu')
    .select('*, doi_bong!inner(*)')
    .eq('vi_tri', 'Thủ môn');

  if (giaiDauId) {
    query = query.eq('doi_bong.giai_dau_id', giaiDauId);
  }

  const { data, error } = await query.limit(5);

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

export async function layTopThePhat(giaiDauId?: string) {
  let query = supabase
    .from('cau_thu')
    .select('*, doi_bong!inner(*)');

  if (giaiDauId) {
    query = query.eq('doi_bong.giai_dau_id', giaiDauId);
  }

  const { data, error } = await query.limit(5);

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

export async function deleteTournament(id: string) {
  // Get all teams of the tournament
  const { data: teams } = await supabase.from('doi_bong').select('id').eq('giai_dau_id', id);
  const teamIds = teams?.map(t => t.id) || [];
  
  // Get all matches of the tournament
  const { data: matches } = await supabase.from('tran_dau').select('id').eq('giai_dau_id', id);
  const matchIds = matches?.map(m => m.id) || [];

  // Delete su_kien of matches
  if (matchIds.length > 0) {
    await supabase.from('su_kien').delete().in('tran_dau_id', matchIds);
  }
  
  // Delete tran_dau
  await supabase.from('tran_dau').delete().eq('giai_dau_id', id);
  
  // Delete cau_thu
  if (teamIds.length > 0) {
    await supabase.from('cau_thu').delete().in('doi_id', teamIds);
  }
  
  // Delete doi_bong
  await supabase.from('doi_bong').delete().eq('giai_dau_id', id);
  
  // Delete local configuration fallbacks
  if (typeof window !== 'undefined') {
    localStorage.removeItem(`giai_dau_config_${id}`);
    localStorage.removeItem(`scheduler_config_${id}`);
    localStorage.removeItem(`blackout_dates_${id}`);
  }
  
  // Finally delete the tournament
  return await supabase.from('giai_dau').delete().eq('id', id);
}
