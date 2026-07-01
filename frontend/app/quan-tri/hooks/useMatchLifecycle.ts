'use client';

import { useState, useEffect, useRef } from 'react';
import { updateMatch, calculateMatchMinute } from '@/lib/api';
import { startHalf1, endHalf1, startHalf2, endMatchPeriod } from '@/lib/api';
import { supabase } from '@/lib/supabase';

export function useMatchLifecycle(
  liveMatches: any[],
  setLiveMatches: (fn: (prev: any[]) => any[]) => void,
  selectedTournament: any,
  schedulerConfig: any,
  fetchData: (id?: string, silent?: boolean) => Promise<void>,
  showToast: (msg: string) => void,
  showConfirm: (title: string, msg: string, onConfirm: () => void) => void,
  updatePlayerGoals: (playerId: string, increment: number) => Promise<void>
) {
  const liveMatchesRef = useRef(liveMatches);
  const handleStartMatchRef = useRef<any>(null);
  const handleAutoFinishMatchRef = useRef<any>(null);
  const handleAutoStartHalf2Ref = useRef<any>(null);
  const handleAutoEndHalf1Ref = useRef<any>(null);
  const transitionInProgressRef = useRef<Record<string, boolean>>({});

  // Sync refs
  useEffect(() => {
    liveMatchesRef.current = liveMatches;
  }, [liveMatches]);

  useEffect(() => {
    handleStartMatchRef.current = handleStartMatch;
    handleAutoFinishMatchRef.current = handleAutoFinishMatch;
    handleAutoStartHalf2Ref.current = handleAutoStartHalf2;
    handleAutoEndHalf1Ref.current = handleAutoEndHalf1;
  });

  // Real-time timer
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveMatches(prev => {
        let changed = false;
        const newMatches = prev.map(match => {
          if (match.trangThai === 'SAP_DIEN_RA' && match.date && match.time) {
            const scheduledTime = new Date(`${match.date}T${match.time}:00`);
            if (Date.now() >= scheduledTime.getTime() && !transitionInProgressRef.current[`${match.id}_start`]) {
              transitionInProgressRef.current[`${match.id}_start`] = true;
              if (handleStartMatchRef.current) handleStartMatchRef.current(match.id);
            }
          }

          if (match.trangThai === 'DANG_DIEN_RA' && !match.dangTamDung) {
            const currentPhut = calculateMatchMinute(match, schedulerConfig?.matchDurationMinutes || 90);
            const matchDuration = schedulerConfig?.matchDurationMinutes || 90;
            const halfDuration = matchDuration / 2;
            const breakDuration = schedulerConfig?.breakTimeMinutes || 15;

            if (match.currentPeriod === 'HALF_1' && currentPhut > halfDuration && !transitionInProgressRef.current[`${match.id}_end_half1`]) {
                transitionInProgressRef.current[`${match.id}_end_half1`] = true;
                if (handleAutoEndHalf1Ref.current) handleAutoEndHalf1Ref.current(match.id);
            } else if (match.currentPeriod === 'BREAK' && match.half1EndTime && !transitionInProgressRef.current[`${match.id}_start_half2`]) {
                const breakEnd = new Date(match.half1EndTime).getTime() + breakDuration * 60000;
                if (Date.now() >= breakEnd) {
                    transitionInProgressRef.current[`${match.id}_start_half2`] = true;
                    if (handleAutoStartHalf2Ref.current) handleAutoStartHalf2Ref.current(match.id);
                }
            } else if (match.currentPeriod === 'HALF_2' && currentPhut > matchDuration && !transitionInProgressRef.current[`${match.id}_finish`]) {
                transitionInProgressRef.current[`${match.id}_finish`] = true;
                if (handleAutoFinishMatchRef.current) handleAutoFinishMatchRef.current(match.id);
            }

            if (match.phut !== currentPhut) {
                changed = true;
                return { ...match, phut: currentPhut };
            }
          }
          return match;
        });
        return changed ? newMatches : prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [schedulerConfig, setLiveMatches]);

  const calculateCurrentRoster = (team: any, events: any[], limit: number) => {
    if (!team || !team.cauThu) return { starters: [], bench: [] };
    let starters: any[] = [];
    let bench: any[] = [];

    team.cauThu.forEach((p: any, idx: number) => {
      if (idx < limit) starters.push(p);
      else bench.push(p);
    });

    if (events) {
      const subs = events.filter((e: any) => e.loai === 'SUB' || e.loai === 'THAY_NGUOI').sort((a: any, b: any) => a.phut - b.phut);
      subs.forEach((sub: any) => {
        const inPlayerId = sub.cauThuId;
        const outPlayerMatch = sub.moTa?.match(/cho (.*?)$/);
        const outPlayerName = outPlayerMatch ? outPlayerMatch[1].trim() : '';
        const outIdx = starters.findIndex(p => p.ten === outPlayerName);
        const inIdx = bench.findIndex(p => p.id === inPlayerId);
        if (outIdx >= 0 && inIdx >= 0) {
          const outP = starters[outIdx];
          starters.splice(outIdx, 1);
          starters.push(bench[inIdx]);
          bench.splice(inIdx, 1);
          bench.push(outP);
        }
      });
    }
    return { starters, bench };
  };

  const formatMatchTime = (match: any): string => {
    if (!match) return '00:00';
    if (match.trangThai === 'SAP_DIEN_RA') return '00:00';
    if (match.trangThai === 'KET_THUC') return `${String(match.phut || 90).padStart(2, '0')}:00`;

    const matchDuration = schedulerConfig?.matchDurationMinutes || 90;
    const halfDuration = matchDuration / 2;
    let diffInSeconds = 0;

    if (match.currentPeriod === 'HALF_1') {
      if (!match.half1StartTime) return '00:00';
      if (match.dangTamDung) {
        diffInSeconds = match.thoiGianDaQua || 0;
      } else {
        const startTime = new Date(match.half1StartTime).getTime();
        diffInSeconds = Math.floor((Date.now() - startTime) / 1000) + (match.thoiGianDaQua || 0);
      }
    } else if (match.currentPeriod === 'BREAK') {
      if (match.half1StartTime && match.half1EndTime) {
        diffInSeconds = Math.floor((new Date(match.half1EndTime).getTime() - new Date(match.half1StartTime).getTime()) / 1000);
      } else {
        diffInSeconds = halfDuration * 60;
      }
    } else if (match.currentPeriod === 'HALF_2') {
      const half1Duration = (match.half1StartTime && match.half1EndTime)
        ? Math.floor((new Date(match.half1EndTime).getTime() - new Date(match.half1StartTime).getTime()) / 1000)
        : halfDuration * 60;

      if (!match.half2StartTime) {
        diffInSeconds = half1Duration;
      } else if (match.dangTamDung) {
        diffInSeconds = half1Duration + (match.thoiGianDaQua || 0);
      } else {
        diffInSeconds = half1Duration + Math.floor((Date.now() - new Date(match.half2StartTime).getTime()) / 1000) + (match.thoiGianDaQua || 0);
      }
    } else if (match.currentPeriod === 'FINISHED') {
      return `${String(match.phut || matchDuration).padStart(2, '0')}:00`;
    } else {
      if (!match.batDauLuc) return `${String(match.phut || 0).padStart(2, '0')}:00`;
      if (match.dangTamDung) {
        diffInSeconds = match.thoiGianDaQua || 0;
      } else {
        diffInSeconds = Math.floor((Date.now() - new Date(match.batDauLuc).getTime()) / 1000) + (match.thoiGianDaQua || 0);
      }
    }

    const m = Math.floor(diffInSeconds / 60);
    const s = Math.floor(diffInSeconds % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const getMatchHalfState = (match: any): '1_not_started' | '1_active' | 'half_time' | '2_active' | 'finished' => {
    if (!match) return '1_not_started';
    if (match.trangThai === 'SAP_DIEN_RA') return '1_not_started';
    if (match.trangThai === 'KET_THUC') return 'finished';
    if (match.currentPeriod === 'HALF_1') return '1_active';
    if (match.currentPeriod === 'BREAK') return 'half_time';
    if (match.currentPeriod === 'HALF_2') return '2_active';
    if (match.currentPeriod === 'FINISHED') return 'finished';
    return '1_active';
  };

  const handleStartMatch = async (matchId: string) => {
    const match = liveMatches.find(m => m.id === matchId);
    if (match) {
      if (typeof window !== 'undefined') localStorage.setItem(`match_hiep_${matchId}`, '1_active');
      try {
        await startHalf1(matchId);
        await fetchData(selectedTournament?.id);
        showToast('Trận đấu đã bắt đầu!');
      } catch (e) {
        showToast('Lỗi bắt đầu trận đấu');
      }
    }
  };

  const handleAutoFinishMatch = async (matchId: string) => {
    const match = liveMatchesRef.current.find(m => m.id === matchId);
    if (match) {
      const finalPhut = calculateMatchMinute(match, schedulerConfig?.matchDurationMinutes || 90);
      const updated = { ...match, trangThai: 'KET_THUC', phut: finalPhut };
      if (typeof window !== 'undefined') localStorage.setItem(`match_hiep_${matchId}`, 'finished');
      await updateMatch(updated);
      await fetchData(selectedTournament?.id, true);
      showToast(`Trận đấu giữa ${match.doiNha?.ten} và ${match.doiKhach?.ten} đã tự động kết thúc!`);
    }
  };

  const handleAutoStartHalf2 = async (matchId: string) => {
    const match = liveMatchesRef.current.find(m => m.id === matchId);
    if (match) {
      if (typeof window !== 'undefined') localStorage.setItem(`match_hiep_${matchId}`, '2_active');
      try {
        await startHalf2(matchId);
        await fetchData(selectedTournament?.id);
        showToast(`⏰ Tự động bắt đầu Hiệp 2 - ${match.doiNha?.ten} vs ${match.doiKhach?.ten}`);
      } catch (e) { /* Silently fail */ }
    }
  };

  const handleAutoEndHalf1 = async (matchId: string) => {
    const match = liveMatchesRef.current.find(m => m.id === matchId);
    if (match) {
      if (typeof window !== 'undefined') localStorage.setItem(`match_hiep_${matchId}`, 'half_time');
      try {
        await endHalf1(matchId);
        await fetchData(selectedTournament?.id);
        showToast(`⏰ Tự động kết thúc Hiệp 1 - ${match.doiNha?.ten} vs ${match.doiKhach?.ten}`);
      } catch (e) { /* Silently fail */ }
    }
  };

  const handlePauseMatch = async (matchId: string) => {
    const match = liveMatches.find(m => m.id === matchId);
    if (match) {
      if (typeof window !== 'undefined') localStorage.setItem(`match_hiep_${matchId}`, 'half_time');
      try {
        await endHalf1(matchId);
        await fetchData(selectedTournament?.id);
        showToast('Đã kết thúc hiệp 1!');
      } catch (e) { showToast('Lỗi kết thúc hiệp 1'); }
    }
  };

  const handleResumeMatch = async (matchId: string) => {
    const match = liveMatches.find(m => m.id === matchId);
    if (match) {
      if (typeof window !== 'undefined') localStorage.setItem(`match_hiep_${matchId}`, '2_active');
      try {
        await startHalf2(matchId);
        await fetchData(selectedTournament?.id);
        showToast('Bắt đầu hiệp 2!');
      } catch (e) { showToast('Lỗi bắt đầu hiệp 2'); }
    }
  };

  const handleTemporaryPauseToggle = async (matchId: string) => {
    const match = liveMatches.find(m => m.id === matchId);
    if (match) {
      if (match.dangTamDung) {
        const updated = { ...match, dangTamDung: false, batDauLuc: new Date().toISOString() };
        await updateMatch(updated);
        await fetchData(selectedTournament?.id);
        showToast('▶ Trận đấu tiếp tục!');
      } else {
        const now = Date.now();
        const start = new Date(match.batDauLuc).getTime();
        const passed = Math.floor((now - start) / 1000) + (match.thoiGianDaQua || 0);
        const updated = { ...match, dangTamDung: true, thoiGianDaQua: passed, phut: Math.floor(passed / 60) + 1 };
        await updateMatch(updated);
        await fetchData(selectedTournament?.id);
        showToast('⏸ Trận đấu đã tạm dừng!');
      }
    }
  };

  const handleFinishMatch = async (matchId: string) => {
    showConfirm('KẾT THÚC TRẬN ĐẤU', 'Bạn có chắc chắn muốn kết thúc trận đấu này? Kết quả sẽ được chốt.', async () => {
      const match = liveMatches.find(m => m.id === matchId);
      if (match) {
        if (typeof window !== 'undefined') localStorage.setItem(`match_hiep_${matchId}`, 'finished');
        try {
          await endMatchPeriod(matchId);
          await fetchData(selectedTournament?.id);
          showToast('Trận đấu đã kết thúc!');
        } catch (e) { showToast('Lỗi kết thúc trận đấu'); }
      }
    });
  };

  const handleResetMatch = async (matchId: string) => {
    showConfirm('RESET TRẬN ĐẤU', '🔄 Bạn có chắc muốn RESET trận đấu này về trạng thái chưa diễn ra? Tất cả sự kiện sẽ bị xóa và tỷ số sẽ quay về 0-0.', async () => {
      const match = liveMatches.find(m => m.id === matchId);
      if (match) {
        if (match.suKien && match.suKien.length > 0) {
          for (const ev of match.suKien) {
            let decrement = 0;
            if (ev.loai === 'GOAL_NORMAL' || ev.loai === 'GOAL_PEN' || ev.loai === 'GOAL_OG') decrement = -1;
            else if (ev.loai === 'CHOT') decrement = -2;
            if (decrement !== 0 && ev.cauThuId) await updatePlayerGoals(ev.cauThuId, decrement);
          }
        }

        await supabase.from('su_kien').delete().eq('tran_dau_id', matchId);

        const updated = {
          ...match, tyNha: 0, tyKhach: 0, trangThai: 'SAP_DIEN_RA',
          phut: 0, batDauLuc: null, thoiGianDaQua: 0, dangTamDung: false
        };
        if (typeof window !== 'undefined') localStorage.removeItem(`match_hiep_${matchId}`);
        await updateMatch(updated);
        await fetchData(selectedTournament?.id);
        showToast('Trận đấu đã được reset về 0-0!');
      }
    });
  };

  return {
    liveMatchesRef,
    calculateCurrentRoster,
    formatMatchTime,
    getMatchHalfState,
    handleStartMatch,
    handleAutoFinishMatch,
    handleAutoStartHalf2,
    handleAutoEndHalf1,
    handlePauseMatch,
    handleResumeMatch,
    handleTemporaryPauseToggle,
    handleFinishMatch,
    handleResetMatch,
  };
}
