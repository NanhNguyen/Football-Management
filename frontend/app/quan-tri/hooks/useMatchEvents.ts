'use client';

import { useState } from 'react';
import { addEvent, deleteEvent, updateMatch, updatePlayerGoals } from '@/lib/api';

export function useMatchEvents(
  selectedMatch: any,
  liveMatches: any[],
  setLiveMatches: (fn: (prev: any[]) => any[]) => void,
  selectedTournament: any,
  customEvents: any[],
  schedulerConfig: any,
  fetchData: (id?: string) => Promise<void>,
  showToast: (msg: string) => void,
  showConfirm: (title: string, msg: string, onConfirm: () => void) => void
) {
  const [activePlayerParams, setActivePlayerParams] = useState<{ matchId: string; teamId: string; player: any; isBench?: boolean } | null>(null);
  const [pendingSubOut, setPendingSubOut] = useState<{ player: any; teamId: string } | null>(null);
  const [isSelectingSubstitute, setIsSelectingSubstitute] = useState(false);

  const handleExecuteSubstitution = async (inPlayer: any, outPlayer: any, teamId: string, minute?: string | number) => {
    if (!selectedMatch) return;
    try {
      const description = `Vào sân thay cho ${outPlayer.ten}`;
      const eventMinute = minute !== undefined && minute !== '' ? Number(minute) : (selectedMatch.phut || 0);
      await addEvent({
        matchId: selectedMatch.id,
        type: 'SUB',
        minute: eventMinute,
        teamId: teamId,
        playerId: inPlayer.id,
        description: description
      });
      showToast(`🔄 Đã thay người: ${inPlayer.ten} vào thay ${outPlayer.ten}`);
      await fetchData(selectedTournament?.id);
      setIsSelectingSubstitute(false);
      setActivePlayerParams(null);
      setPendingSubOut(null);
    } catch (e) {
      console.error(e);
      showToast('❌ Lỗi khi thay người!');
    }
  };

  const handleActionSelect = async (type: string, subType?: string, overrideParams?: any) => {
    const params = overrideParams || activePlayerParams;
    if (!params || !selectedMatch) return;
    const { teamId, matchId, player, minute } = params;

    let typeLabel = '';
    let eventType = type.toUpperCase();
    let increment = 0;
    let customEventScoreImpact: { enabled: boolean; value: number; side: 'own' | 'opponent' } | null = null;

    if (type === 'goal') {
      typeLabel = subType === 'pen' ? 'Ghi bàn (Penalty)' : subType === 'og' ? 'Phản lưới nhà' : 'Ghi bàn';
      eventType = subType ? `GOAL_${subType.toUpperCase()}` : 'GOAL_NORMAL';
      increment = 1;
    } else if (type === 'custom' && subType) {
      const customEvt = customEvents.find((e: any) => e.code === subType);
      if (customEvt) {
        typeLabel = `${customEvt.name}`;
        eventType = `CUSTOM_${customEvt.code.toUpperCase()}`;
        if (customEvt.score_impact?.enabled) {
          customEventScoreImpact = { enabled: true, value: Number(customEvt.score_impact.value || 0), side: customEvt.score_impact.side || 'own' };
          increment = customEventScoreImpact.value;
        }
      }
    } else if (type === 'card') {
      typeLabel = subType === 'yellow' ? 'Phạt thẻ vàng 🟨' : subType === 'red' ? 'Phạt thẻ đỏ 🟥' : 'Án phạt';
      eventType = subType === 'yellow' ? 'THE_VANG' : subType === 'red' ? 'THE_DO' : 'CARD';
    } else if (type === 'motm') {
      typeLabel = 'Xuất sắc nhất trận 🏅';
      eventType = 'MOTM';
    }

    let isSecondYellow = false;
    if (type === 'card' && subType === 'yellow') {
      const yellowCount = selectedMatch.suKien?.filter((ev: any) => ev.loai === 'THE_VANG' && ev.cauThuId === player.id).length || 0;
      if (yellowCount >= 1) isSecondYellow = true;
    }

    const eventMinute = minute !== undefined && minute !== '' ? Number(minute) : (selectedMatch.phut || 0);

    if (isSecondYellow) {
      await addEvent({ matchId, teamId, playerId: player.id, type: 'THE_VANG', minute: eventMinute, description: `${player.ten} (Phạt thẻ vàng 🟨)` });
      await addEvent({ matchId, teamId, playerId: player.id, type: 'THE_DO', minute: eventMinute, description: `${player.ten} (Thẻ đỏ gián tiếp - 2 thẻ vàng) 🟥` });
    } else {
      await addEvent({ matchId, teamId, playerId: player.id, type: eventType, minute: eventMinute, description: `${player.ten} (${typeLabel})` });
    }

    if (increment > 0) {
      let scoringTeamId = teamId;
      if (eventType === 'GOAL_OG') {
        scoringTeamId = teamId === selectedMatch.doiNha?.id ? selectedMatch.doiKhach?.id : selectedMatch.doiNha?.id;
      } else if (type === 'custom' && customEventScoreImpact) {
        if (customEventScoreImpact.side === 'opponent') {
          scoringTeamId = teamId === selectedMatch.doiNha?.id ? selectedMatch.doiKhach?.id : selectedMatch.doiNha?.id;
        }
      }
      const teamKey = scoringTeamId === selectedMatch.doiNha?.id ? 'tyNha' : 'tyKhach';
      const updated = { ...selectedMatch, [teamKey]: (selectedMatch[teamKey] || 0) + increment };
      await updateMatch(updated);
      if (eventType !== 'GOAL_OG' && player && player.id) {
        await updatePlayerGoals(player.id, increment);
      }
    }

    await fetchData(selectedTournament?.id);
    if (isSecondYellow) {
      showToast(`🟥 Thẻ đỏ gián tiếp (2 thẻ vàng) cho ${player.ten}!`);
    } else {
      showToast(`🔥 ${typeLabel} cho ${player.ten}!`);
    }
    setActivePlayerParams(null);
  };

  const handleUndoEvent = async (eventId: string, eventType: string, teamId: string, playerId: string) => {
    showConfirm('HOÀN TÁC SỰ KIỆN', 'Bạn có muốn hoàn tác sự kiện này?', async () => {
      let increment = 0;
      let isCustomScoreImpact = false;
      let customSide: 'own' | 'opponent' = 'own';

      if (eventType.startsWith('GOAL')) {
        increment = 1;
      } else if (eventType.startsWith('CUSTOM_')) {
        const code = eventType.replace('CUSTOM_', '');
        const customEvt = customEvents.find((e: any) => e.code === code);
        if (customEvt && customEvt.score_impact?.enabled) {
          increment = Number(customEvt.score_impact.value || 0);
          isCustomScoreImpact = true;
          customSide = customEvt.score_impact.side || 'own';
        }
      }

      await deleteEvent(eventId);

      if (increment > 0 && selectedMatch) {
        let scoringTeamId = teamId;
        if (eventType === 'GOAL_OG') {
          scoringTeamId = teamId === selectedMatch.doiNha?.id ? selectedMatch.doiKhach?.id : selectedMatch.doiNha?.id;
        } else if (eventType.startsWith('CUSTOM_') && isCustomScoreImpact) {
          if (customSide === 'opponent') {
            scoringTeamId = teamId === selectedMatch.doiNha?.id ? selectedMatch.doiKhach?.id : selectedMatch.doiNha?.id;
          }
        }
        const teamKey = scoringTeamId === selectedMatch.doiNha?.id ? 'tyNha' : 'tyKhach';
        const updated = { ...selectedMatch, [teamKey]: Math.max(0, (selectedMatch[teamKey] || 0) - increment) };
        await updateMatch(updated);
        if (eventType !== 'GOAL_OG' && playerId) {
          await updatePlayerGoals(playerId, -increment);
        }
      }

      await fetchData(selectedTournament?.id);
      showToast('Đã hoàn tác sự kiện!');
    });
  };

  const handleDeleteEvent = async (evtId: string, type: string, points?: number, isIndividual?: boolean, playerId?: string) => {
    const ev = selectedMatch?.suKien?.find((e: any) => e.id === evtId);
    const teamId = ev?.doiId || ev?.teamId || '';
    const pId = playerId || ev?.cauThuId || ev?.playerId || '';
    await handleUndoEvent(evtId, type, teamId, pId);
  };

  const handleQuickAddPlayerSuccess = (teamId: string, player: any) => {
    setLiveMatches(prev => prev.map(m => {
      let updated = false;
      let newM = { ...m };
      if (m.doiNha?.id === teamId) {
        newM.doiNha = { ...m.doiNha, cauThu: [...(m.doiNha.cauThu || []), player] };
        updated = true;
      }
      if (m.doiKhach?.id === teamId) {
        newM.doiKhach = { ...m.doiKhach, cauThu: [...(m.doiKhach.cauThu || []), player] };
        updated = true;
      }
      return updated ? newM : m;
    }));
  };

  return {
    activePlayerParams, setActivePlayerParams,
    pendingSubOut, setPendingSubOut,
    isSelectingSubstitute, setIsSelectingSubstitute,
    handleExecuteSubstitution,
    handleActionSelect,
    handleDeleteEvent,
    handleQuickAddPlayerSuccess,
  };
}
