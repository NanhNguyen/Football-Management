'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { updateMatch } from '@/lib/api';
import { runAutoSchedule } from '@/lib/auto_schedule';

export function useScheduler(
  liveMatches: any[],
  teams: any[],
  selectedTournament: any,
  schedulerConfig: any,
  setSchedulerConfig: (config: any) => void,
  blackoutDates: string[],
  setBlackoutDates: (dates: string[]) => void,
  loading: boolean,
  fetchData: (id?: string) => Promise<void>,
  showToast: (msg: string) => void,
  showConfirm: (title: string, msg: string, onConfirm: () => void) => void
) {
  const [scheduleFilterVong, setScheduleFilterVong] = useState<string>('NONE');
  const [refereeFilterVong, setRefereeFilterVong] = useState<string>('NONE');
  const [refereeFilterBang, setRefereeFilterBang] = useState<string>('all');
  const [isSchedulerConfigOpen, setIsSchedulerConfigOpen] = useState(false);
  const [isPostponeModalOpen, setIsPostponeModalOpen] = useState(false);
  const [postponeTargetDate, setPostponeTargetDate] = useState('');
  const [isRescheduleDashboardOpen, setIsRescheduleDashboardOpen] = useState(false);
  const [newBlackoutDate, setNewBlackoutDate] = useState('');

  const saveBlackoutDates = (dates: string[]) => {
    setBlackoutDates(dates);
    if (selectedTournament?.id) {
      localStorage.setItem(`blackout_dates_${selectedTournament.id}`, JSON.stringify(dates));
    }
  };

  const updateSchedulerConfig = (updates: Partial<typeof schedulerConfig>) => {
    setSchedulerConfig((prev: any) => {
      const next = { ...prev, ...updates };
      if (selectedTournament?.id) {
        localStorage.setItem(`scheduler_config_${selectedTournament.id}`, JSON.stringify(next));
      }
      return next;
    });
  };

  // Helper: parse vong string
  const parseVongDetails = (vongStr: string = '') => {
    const str = vongStr.trim();
    const matchNew = str.match(/Vòng\s+(\d+)\s+-\s+Bảng\s+([A-Z])/i);
    if (matchNew) return { bang: `Bảng ${matchNew[2]}`, vong: `Vòng ${matchNew[1]}`, isKnockout: false };
    const matchOld = str.match(/Bảng\s+([A-Z])\s+-\s+Vòng\s+(\d+)/i);
    if (matchOld) return { bang: `Bảng ${matchOld[1]}`, vong: `Vòng ${matchOld[2]}`, isKnockout: false };
    if (str.toLowerCase().includes('1/16')) return { bang: '', vong: 'Vòng 1/16', isKnockout: true };
    if (str.toLowerCase().includes('1/8')) return { bang: '', vong: 'Vòng 1/8', isKnockout: true };
    if (str.toLowerCase().includes('tứ kết')) return { bang: '', vong: 'Tứ kết', isKnockout: true };
    if (str.toLowerCase().includes('bán kết')) return { bang: '', vong: 'Bán kết', isKnockout: true };
    if (str.toLowerCase().includes('tranh hạng ba')) return { bang: '', vong: 'Tranh hạng ba', isKnockout: true };
    if (str.toLowerCase().includes('chung kết')) return { bang: '', vong: 'Chung kết', isKnockout: true };
    return { bang: '', vong: str, isKnockout: !str.toLowerCase().startsWith('vòng') };
  };

  const getRoundPriority = (roundName: string) => {
    const name = roundName.toLowerCase();
    if (name.includes('1/8')) return 100;
    if (name.includes('tứ kết')) return 200;
    if (name.includes('bán kết')) return 300;
    if (name.includes('hạng ba')) return 400;
    if (name.includes('chung kết')) return 500;
    const match = name.match(/vòng\s+(\d+)/);
    if (match) return parseInt(match[1], 10);
    return 9999;
  };

  // Derived state
  const { uniqueRounds, uniqueGroups } = (() => {
    const roundsSet = new Set<string>();
    const groupsSet = new Set<string>();
    liveMatches.forEach(m => {
      const { bang, vong } = parseVongDetails(m.vong);
      if (vong) roundsSet.add(vong);
      if (bang) groupsSet.add(bang);
    });
    const sortedRounds = Array.from(roundsSet).sort((a, b) => getRoundPriority(a) - getRoundPriority(b));
    const sortedGroups = Array.from(groupsSet).sort();
    return { uniqueRounds: sortedRounds, uniqueGroups: sortedGroups };
  })();

  const isKnockoutActive = refereeFilterVong !== 'NONE' && (
    refereeFilterVong.toLowerCase().includes('1/8') ||
    refereeFilterVong.toLowerCase().includes('tứ kết') ||
    refereeFilterVong.toLowerCase().includes('bán kết') ||
    refereeFilterVong.toLowerCase().includes('hạng ba') ||
    refereeFilterVong.toLowerCase().includes('chung kết')
  );

  const filteredAndSortedRefereeMatches = (() => {
    let list = liveMatches.filter(m => {
      const { bang, vong } = parseVongDetails(m.vong);
      if (vong !== refereeFilterVong) return false;
      if (!isKnockoutActive && refereeFilterBang !== 'all' && bang !== refereeFilterBang) return false;
      return true;
    });
    return list.sort((a, b) => {
      const isLiveA = a.trangThai === 'DANG_DIEN_RA';
      const isLiveB = b.trangThai === 'DANG_DIEN_RA';
      if (isLiveA && !isLiveB) return -1;
      if (!isLiveA && isLiveB) return 1;
      const pA = getRoundPriority(parseVongDetails(a.vong).vong);
      const pB = getRoundPriority(parseVongDetails(b.vong).vong);
      if (pA !== pB) return pA - pB;
      const gA = parseVongDetails(a.vong).bang || '';
      const gB = parseVongDetails(b.vong).bang || '';
      if (gA !== gB) return gA.localeCompare(gB);
      return a.id.localeCompare(b.id);
    });
  })();

  const scheduleUniqueRounds = (() => {
    const roundsSet = new Set<string>();
    liveMatches.forEach(m => {
      const { vong } = parseVongDetails(m.vong);
      if (vong) roundsSet.add(vong);
    });
    return Array.from(roundsSet).sort((a, b) => getRoundPriority(a) - getRoundPriority(b));
  })();

  const filteredAndSortedScheduleMatches = (() => {
    let list = liveMatches.filter(m => {
      const { vong } = parseVongDetails(m.vong);
      return vong === scheduleFilterVong;
    });
    return list.sort((a, b) => {
      const pA = getRoundPriority(parseVongDetails(a.vong).vong);
      const pB = getRoundPriority(parseVongDetails(b.vong).vong);
      if (pA !== pB) return pA - pB;
      const dateA = a.date || '';
      const dateB = b.date || '';
      if (dateA !== dateB) return dateA.localeCompare(dateB);
      const timeA = a.time || '';
      const timeB = b.time || '';
      if (timeA !== timeB) return timeA.localeCompare(timeB);
      const gA = parseVongDetails(a.vong).bang || '';
      const gB = parseVongDetails(b.vong).bang || '';
      if (gA !== gB) return gA.localeCompare(gB);
      const nameA = a.doiNha?.ten || '';
      const nameB = b.doiNha?.ten || '';
      if (!nameA || !nameB) return (a.vong || '').localeCompare(b.vong || '');
      return nameA.localeCompare(nameB);
    });
  })();

  // Auto-select closest round
  const getClosestMatchweek = (matches: any[], rounds: string[]): string => {
    if (!rounds || rounds.length === 0) return 'NONE';
    if (!matches || matches.length === 0) return rounds[0];
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const todayEnd = todayStart + 24 * 60 * 60 * 1000;
    const getRoundKey = (vongStr: string) => parseVongDetails(vongStr).vong;

    const matchesToday = matches.filter((m: any) => {
      const mDateStr = m.date || m.batDauLuc;
      if (!mDateStr) return false;
      try { const mTime = new Date(mDateStr).getTime(); return mTime >= todayStart && mTime < todayEnd; } catch (e) { return false; }
    });
    if (matchesToday.length > 0) {
      const key = getRoundKey(matchesToday[0].vong);
      if (key && rounds.includes(key)) return key;
    }

    const upcomingMatches = matches.filter((m: any) => m.trangThai === 'DANG_DIEN_RA' || m.trangThai === 'SAP_DIEN_RA');
    if (upcomingMatches.length > 0) {
      upcomingMatches.sort((a: any, b: any) => new Date(a.batDauLuc || a.date).getTime() - new Date(b.batDauLuc || b.date).getTime());
      const key = getRoundKey(upcomingMatches[0].vong);
      if (key && rounds.includes(key)) return key;
    }

    const finishedMatches = matches.filter((m: any) => m.trangThai === 'KET_THUC');
    if (finishedMatches.length > 0) {
      finishedMatches.sort((a: any, b: any) => new Date(b.batDauLuc || b.date).getTime() - new Date(a.batDauLuc || a.date).getTime());
      const key = getRoundKey(finishedMatches[0].vong);
      if (key && rounds.includes(key)) return key;
    }
    return rounds[0];
  };

  useEffect(() => {
    if (loading || liveMatches.length === 0 || uniqueRounds.length === 0) return;
    const key = `has_set_default_round_${selectedTournament?.id}`;
    const hasSet = sessionStorage.getItem(key);
    const needsRefereeReset = refereeFilterVong === 'NONE' || !uniqueRounds.includes(refereeFilterVong);
    const needsScheduleReset = scheduleFilterVong === 'NONE' || !uniqueRounds.includes(scheduleFilterVong);
    if (!hasSet || needsRefereeReset || needsScheduleReset) {
      const closestRound = getClosestMatchweek(liveMatches, uniqueRounds);
      if (closestRound && closestRound !== 'NONE') {
        if (!hasSet || needsRefereeReset) setRefereeFilterVong(closestRound);
        if (!hasSet || needsScheduleReset) setScheduleFilterVong(closestRound);
        sessionStorage.setItem(key, 'true');
      }
    }
  }, [liveMatches, selectedTournament?.id, loading, uniqueRounds]);

  const handleAutoSchedule = async () => {
    if (teams.length < 2) { showToast('⚠️ Cần tối thiểu 2 đội bóng để sinh lịch!'); return; }
    if (!schedulerConfig.endDate) { showToast('⚠️ Vui lòng nhập Ngày kết thúc dự kiến!'); return; }

    const baseStartDate = schedulerConfig.startDate || selectedTournament?.ngay_bat_dau;
    if (baseStartDate && schedulerConfig.endDate < baseStartDate) {
      showToast('⚠️ Ngày kết thúc dự kiến không được trước Ngày bắt đầu!');
      return;
    }

    showConfirm(
      'XÁC NHẬN SINH LỊCH TỰ ĐỘNG',
      '🔄 Xếp lịch tự động sẽ XÓA TOÀN BỘ lịch thi đấu nháp của giải đấu hiện tại và ghi đè lịch mới. Bạn có chắc chắn muốn tiếp tục?',
      async () => {
        try {
          showToast('⏳ Đang xếp lịch thi đấu tự động (CSP)...');
          const actualStartDate = baseStartDate || '2026-05-01';
          const timeSlotsWithEnd = schedulerConfig.timeSlots.map((slot: any) => {
            const [hours, minutes] = slot.startTime.split(':').map(Number);
            const totalMinutes = hours * 60 + minutes + schedulerConfig.matchDurationMinutes + schedulerConfig.breakTimeMinutes;
            const endHours = Math.floor(totalMinutes / 60) % 24;
            const endMinutes = totalMinutes % 60;
            return { ...slot, endTime: `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}` };
          });

          const payloadConfig = { ...schedulerConfig, startDate: actualStartDate, timeSlots: timeSlotsWithEnd, blackoutDates };

          const configStr = localStorage.getItem(`giai_dau_config_${selectedTournament.id}`);
          let activeType = 'tournament', activeGroupLegs = 1, activeLeagueRounds = 5;
          if (configStr) {
            try {
              const config = JSON.parse(configStr);
              activeType = config.theThuc || 'tournament';
              activeGroupLegs = config.luotVongBang || 1;
              activeLeagueRounds = config.soVongLeague || 5;
            } catch (e) { }
          }

          const count = await runAutoSchedule(teams, selectedTournament, activeType, activeGroupLegs, activeLeagueRounds, payloadConfig, showToast);
          setIsSchedulerConfigOpen(false);
          await fetchData(selectedTournament?.id);
          showToast(`✨ Đã tự động xếp ${count} trận đấu thành công!`);
        } catch (err: any) {
          console.error(err);
          showToast(`❌ Lỗi khi sinh lịch: ${err.message}`);
        }
      }
    );
  };

  const handleDelayMatchSchedule = async (matchId: string, newDate: string, newTime: string) => {
    const match = liveMatches.find(m => m.id === matchId);
    if (match && match.trangThai === 'SAP_DIEN_RA') {
      await updateMatch({ ...match, date: newDate, time: newTime });
      await fetchData(selectedTournament?.id);
      showToast('Đã lùi lịch thi đấu thành công!');
    }
  };

  const handleClearDraftSchedule = () => {
    showConfirm(
      'XÓA LỊCH THI ĐẤU',
      '🔄 Bạn có chắc muốn xóa lịch? Tất cả các trận đấu của giải đấu hiện tại sẽ bị xóa.',
      async () => {
        try {
          showToast('🧹 Đang dọn dẹp lịch cũ...');
          const matchIds = liveMatches.map(m => m.id);
          if (matchIds.length > 0) {
            const chunkSize = 100;
            for (let i = 0; i < matchIds.length; i += chunkSize) {
              const chunk = matchIds.slice(i, i + chunkSize);
              const { error: delEventsErr } = await supabase.from('su_kien').delete().in('tran_dau_id', chunk);
              if (delEventsErr) throw delEventsErr;
              const { error: delMatchesErr } = await supabase.from('tran_dau').delete().in('id', chunk);
              if (delMatchesErr) throw delMatchesErr;
            }
          }
          await fetchData(selectedTournament?.id);
          showToast('Đã xóa toàn bộ lịch thi đấu!');
        } catch (err: any) {
          showToast('❌ Lỗi khi xóa lịch: ' + err.message);
        }
      }
    );
  };

  const handlePostponeMatchday = async () => {
    if (!selectedTournament?.id || !postponeTargetDate) return;
    try {
      showToast(`Đang hoãn các trận đấu ngày ${postponeTargetDate}...`);
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`http://localhost:3001/api/tournaments/${selectedTournament.id}/postpone-day`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(session ? { 'Authorization': `Bearer ${session.access_token}` } : {}) },
        body: JSON.stringify({ targetDate: postponeTargetDate })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Hoãn lịch thất bại');
      showToast(`Đã hoãn thành công ${result.affected || 0} trận đấu!`);
      setIsPostponeModalOpen(false);
      setIsRescheduleDashboardOpen(true);
      await fetchData(selectedTournament.id);
    } catch (err: any) {
      console.error(err);
      showToast(`Lỗi: ${err.message}`);
    }
  };

  const handleRescheduleRolling = async (fromDate: string, daysToShift: number) => {
    if (!selectedTournament?.id) return;
    try {
      showToast('Đang tịnh tiến lịch thi đấu...');
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`http://localhost:3001/api/tournaments/${selectedTournament.id}/reschedule-rolling`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(session ? { 'Authorization': `Bearer ${session.access_token}` } : {}) },
        body: JSON.stringify({ fromDate, daysToShift })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Tịnh tiến thất bại');
      showToast(`Đã tịnh tiến thành công ${result.affected || 0} trận đấu!`);
      setIsRescheduleDashboardOpen(false);
      await fetchData(selectedTournament.id);
    } catch (err: any) {
      showToast(`Lỗi: ${err.message}`);
    }
  };

  const handleMoveToPool = async (matchIds: string[]) => {
    if (!selectedTournament?.id || matchIds.length === 0) return;
    try {
      showToast('Đang đưa vào kho chờ...');
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`http://localhost:3001/api/tournaments/${selectedTournament.id}/move-to-pool`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(session ? { 'Authorization': `Bearer ${session.access_token}` } : {}) },
        body: JSON.stringify({ matchIds })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Chuyển kho chờ thất bại');
      showToast(`Đã đưa ${result.affected || 0} trận vào kho chờ!`);
      await fetchData(selectedTournament.id);
    } catch (err: any) {
      showToast(`Lỗi: ${err.message}`);
    }
  };

  return {
    scheduleFilterVong, setScheduleFilterVong,
    refereeFilterVong, setRefereeFilterVong,
    refereeFilterBang, setRefereeFilterBang,
    isSchedulerConfigOpen, setIsSchedulerConfigOpen,
    isPostponeModalOpen, setIsPostponeModalOpen,
    postponeTargetDate, setPostponeTargetDate,
    isRescheduleDashboardOpen, setIsRescheduleDashboardOpen,
    newBlackoutDate, setNewBlackoutDate,
    saveBlackoutDates,
    updateSchedulerConfig,
    uniqueRounds, uniqueGroups,
    isKnockoutActive,
    filteredAndSortedRefereeMatches,
    scheduleUniqueRounds,
    filteredAndSortedScheduleMatches,
    handleAutoSchedule,
    handleDelayMatchSchedule,
    handleClearDraftSchedule,
    handlePostponeMatchday,
    handleRescheduleRolling,
    handleMoveToPool,
    parseVongDetails,
    getRoundPriority,
  };
}
