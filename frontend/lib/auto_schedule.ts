import { supabase } from '@/lib/supabase';
import { generateRoundRobin, generateScheduleCSP, AdvancedScheduleConfig, MatchPair } from './scheduling_algorithm';

export const runAutoSchedule = async (
  teams: any[],
  selectedTournament: any,
  tournamentType: string,
  tournamentGroupLegs: number,
  tournamentLeagueRounds: number,
  scheduleConfig: AdvancedScheduleConfig,
  showToast: (msg: string) => void
) => {
  if (teams.length < 2) {
    showToast("Cần tối thiểu 2 đội bóng để sinh lịch!");
    return;
  }

  showToast("Đang chuẩn bị cơ sở dữ liệu lịch đấu...");

  // 1. Delete draft and scheduled matches (only those that are not started/live/finished)
  const { data: allCurrentMatches, error: fetchErr } = await supabase
    .from('tran_dau')
    .select('id')
    .eq('giai_dau_id', selectedTournament?.id)
    .in('trang_thai', ['DRAFT', 'SAP_DIEN_RA']);
  if (fetchErr) throw fetchErr;

  if (allCurrentMatches && allCurrentMatches.length > 0) {
    const matchIds = allCurrentMatches.map(m => m.id);
    const chunkSize = 100;
    for (let i = 0; i < matchIds.length; i += chunkSize) {
      const chunk = matchIds.slice(i, i + chunkSize);
      const { error: delEventsErr } = await supabase.from('su_kien').delete().in('tran_dau_id', chunk);
      if (delEventsErr) throw delEventsErr;

      const { error: delMatchesErr } = await supabase.from('tran_dau').delete().in('id', chunk);
      if (delMatchesErr) throw delMatchesErr;
    }
  }

  showToast("⚡ Đang chạy thuật toán CSP để xếp lịch...");

  const pairs: MatchPair[] = [];

  if (tournamentType === 'tournament') {
    // 2A. Tournament Format: Group-based scheduling
    const groups: { [key: string]: any[] } = {};
    teams.forEach(t => {
      const gName = t.bang || 'A';
      if (!groups[gName]) groups[gName] = [];
      groups[gName].push(t);
    });

    const groupRounds: { [gName: string]: MatchPair[] } = {};
    let maxRounds = 0;
    Object.keys(groups).forEach(gName => {
      // Map to IDs
      const teamIds = groups[gName].map(t => t.id);
      const generatedRounds = generateRoundRobin(teamIds, tournamentGroupLegs || 1, `Bảng ${gName} - Vòng`);
      groupRounds[gName] = generatedRounds;
    });
    
    // Sort by Vòng number
    const allGroupPairs: MatchPair[] = [];
    Object.values(groupRounds).forEach(r => allGroupPairs.push(...r));
    allGroupPairs.sort((a, b) => {
      const vA = parseInt(a.roundName.match(/Vòng (\d+)/)?.[1] || '0');
      const vB = parseInt(b.roundName.match(/Vòng (\d+)/)?.[1] || '0');
      return vA - vB;
    });

    pairs.push(...allGroupPairs);

    // 2C. Knockout Stages
    const stagesToProcess = [
      { key: 'Vòng 1/8', matchKeys: Array.from({ length: 8 }, (_, idx) => `Trận ${idx + 1}`), condition: teams.length >= 16 },
      { key: 'Tứ kết', matchKeys: Array.from({ length: 4 }, (_, idx) => `Trận ${idx + 1}`), condition: teams.length >= 8 },
      { key: 'Bán kết', matchKeys: Array.from({ length: 2 }, (_, idx) => `Trận ${idx + 1}`), condition: teams.length >= 4 },
      { key: 'Chung kết & Tranh hạng ba', matchKeys: ['Tranh hạng ba', 'Chung kết'], condition: teams.length >= 2 }
    ];

    stagesToProcess.forEach(stage => {
      if (!stage.condition) return;
      stage.matchKeys.forEach(label => {
        let roundLabel = stage.key === 'Chung kết & Tranh hạng ba' ? label : `${stage.key} - ${label}`;
        pairs.push({ homeId: null, awayId: null, roundName: roundLabel });
      });
    });

  } else {
    // 2B. League Format
    const teamIds = teams.map(t => t.id);
    const roundsRequired = Math.max(1, tournamentLeagueRounds || 5);
    const singleLegRoundsCount = teams.length % 2 === 0 ? teams.length - 1 : teams.length;
    const legsToGenerate = Math.ceil(roundsRequired / (singleLegRoundsCount || 1)) || 1;

    const leaguePairs = generateRoundRobin(teamIds, legsToGenerate, 'Vòng', true);
    
    // Filter out extra rounds if roundsRequired is strict
    const filteredPairs = leaguePairs.filter(p => {
      const match = p.roundName.match(/Vòng (\d+)/);
      if (match) {
        const rNum = parseInt(match[1], 10);
        return rNum <= roundsRequired;
      }
      return true;
    });
    pairs.push(...filteredPairs);
  }

  const isHomeAway = selectedTournament?.venue_type === 'HOME_AWAY';

  // 3. CSP Allocation
  const scheduledMatches = generateScheduleCSP(pairs, isHomeAway ? { ...scheduleConfig, pitchesAvailable: Infinity } : scheduleConfig);

  // 4. Save to DB
  const matchesToCreate = scheduledMatches.map((m, idx) => {
    let san = `Sân TK ${m.pitch}`;
    if (isHomeAway) {
      const homeTeam = teams.find(t => t.id === m.homeId);
      if (homeTeam && homeTeam.home_stadium) {
        san = homeTeam.home_stadium;
      } else if (m.homeId) {
        san = "Sân nhà (chưa xác định)";
      } else {
        san = "Chưa xếp sân"; // Knockout dummy match
      }
    }

    return {
      id: `match-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 9)}`,
      doi_nha_id: m.homeId,
      doi_khach_id: m.awayId,
      vong: m.roundName,
      ngay: m.date,
      gio: m.time,
      san,
      giai_dau_id: selectedTournament?.id,
      trang_thai: 'SAP_DIEN_RA',
      ty_doi_nha: 0,
      ty_doi_khach: 0,
      phut: 0
    };
  });

  const { error: insertErr } = await supabase.from('tran_dau').insert(matchesToCreate);
  if (insertErr) throw insertErr;

  return matchesToCreate.length;
};
