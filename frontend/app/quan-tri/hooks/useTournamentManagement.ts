'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { createTournament, deleteTournament, layDanhSachGiaiDau } from '@/lib/api';

export function useTournamentManagement(
  selectedTournament: any,
  schedulerConfig: any,
  starterCount: number,
  benchCount: number,
  tournamentType: 'tournament' | 'league',
  tournamentGroupLegs: 1 | 2,
  tournamentLeagueRounds: number,
  standingsConfig: any,
  customEvents: any[],
  fetchData: (id?: string) => Promise<void>,
  showToast: (msg: string) => void,
  showConfirm: (title: string, msg: string, onConfirm: () => void) => void,
  setTournaments: (t: any[]) => void,
  setSelectedTournament: (t: any) => void,
  setCustomEvents: (e: any[]) => void,
  setStarterCount: (n: number) => void,
  tournamentTemplates: any[]
) {
  const [tournamentName, setTournamentName] = useState('');
  const [tournamentSeason, setTournamentSeason] = useState('');
  const [tournamentStartDate, setTournamentStartDate] = useState('');
  const [tournamentVenueType, setTournamentVenueType] = useState<'CENTRALIZED' | 'HOME_AWAY'>('CENTRALIZED');
  const [tournamentEndDate, setTournamentEndDate] = useState('2024-06-30');
  const [tournamentMaxPlayers, setTournamentMaxPlayers] = useState(20);
  const [tournamentLeagueRoundsState, setTournamentLeagueRoundsState] = useState<number>(5);
  const [isCreatingTournament, setIsCreatingTournament] = useState(false);
  const [newTournamentData, setNewTournamentData] = useState({
    ten: '',
    muaGiai: '2024',
    ngayBatDau: '2024-05-01',
    venue_type: 'CENTRALIZED',
    templateCode: ''
  });

  const addCustomEvent = () => {
    setCustomEvents([...customEvents, { id: `event_custom_${Date.now()}`, name: 'Sự kiện mới', icon: '⭐', points: 0, isIndividual: false }]);
  };

  const removeCustomEvent = (idx: number) => {
    const newEvents = [...customEvents];
    newEvents.splice(idx, 1);
    setCustomEvents(newEvents);
  };

  const updateCustomEvent = (idx: number, field: string, value: any) => {
    const newEvents = [...customEvents];
    newEvents[idx][field] = value;
    setCustomEvents(newEvents);
  };

  const handleSaveTournamentConfig = async (rules?: any) => {
    if (!selectedTournament) return;
    try {
      showToast('⏳ Đang lưu cấu hình giải đấu...');

      if (rules) {
        if (rules.matchFormat) setStarterCount(rules.matchFormat.playersPerTeam);
        if (rules.custom_events) setCustomEvents(rules.custom_events);
      }

      const config = {
        ngayKetThuc: tournamentEndDate,
        maxTeams: 16,
        maxPlayers: tournamentMaxPlayers || 20,
        starterCount: rules?.matchFormat?.playersPerTeam || starterCount || 7,
        benchCount: benchCount || 7,
        theThuc: tournamentType,
        luotVongBang: tournamentGroupLegs,
        soVongLeague: tournamentLeagueRounds || 5,
        standingsConfig,
        custom_events: rules?.custom_events || customEvents,
        matchFormat: rules?.matchFormat || { playersPerTeam: starterCount || 7, minutesPerHalf: 45, penaltyIfDraw: false },
        pointsSystem: rules?.pointsSystem || { win: 3, draw: 1, loss: 0, winByPenalty: 2, lossByPenalty: 1 },
        tieBreakerPriority: rules?.tieBreakerPriority || ['headToHead', 'goalDifference', 'goalsScored'],
      };
      localStorage.setItem(`giai_dau_config_${selectedTournament.id}`, JSON.stringify(config));

      const { error } = await supabase
        .from('giai_dau')
        .update({
          ten: tournamentName,
          mua_giai: tournamentSeason,
          ngay_bat_dau: tournamentStartDate,
          venue_type: tournamentVenueType,
          rules_config: config
        })
        .eq('id', selectedTournament.id);

      if (error) throw error;
      showToast('✨ Đã lưu cấu hình giải đấu thành công!');
      await fetchData(selectedTournament.id);
    } catch (err: any) {
      console.error(err);
      showToast(`❌ Lỗi khi lưu cấu hình: ${err.message}`);
    }
  };

  const handleDeleteTournament = async () => {
    if (!selectedTournament?.id) return;
    showConfirm(
      'XÓA GIẢI ĐẤU',
      `⚠️ Bạn có chắc chắn muốn xóa giải đấu "${selectedTournament.ten}" không? Toàn bộ đội bóng, cầu thủ, trận đấu, sự kiện và cấu hình liên quan sẽ bị XÓA VĨNH VIỄN và KHÔNG thể khôi phục!`,
      async () => {
        try {
          showToast('🗑️ Đang xóa giải đấu...');
          const { error } = await deleteTournament(selectedTournament.id);
          if (error) {
            showToast(`❌ Lỗi khi xóa giải đấu: ${error.message}`);
          } else {
            showToast('✨ Đã xóa giải đấu thành công!');
            const freshTournaments = await layDanhSachGiaiDau();
            setTournaments(freshTournaments);
            if (freshTournaments.length > 0) {
              setSelectedTournament(freshTournaments[0]);
              await fetchData(freshTournaments[0].id);
            } else {
              setSelectedTournament(null);
            }
          }
        } catch (err: any) {
          showToast(`❌ Lỗi khi xóa giải đấu: ${err.message}`);
        }
      }
    );
  };

  const handleCreateTournament = async () => {
    if (!newTournamentData.ten) {
      showToast('⚠️ Vui lòng nhập tên giải đấu!');
      return;
    }
    if (!newTournamentData.templateCode) {
      showToast('⚠️ Vui lòng chọn loại giải đấu!');
      return;
    }
    const newId = `giai-${Date.now()}`;
    const payload = {
      id: newId,
      ten: newTournamentData.ten,
      muaGiai: newTournamentData.muaGiai,
      ngayBatDau: newTournamentData.ngayBatDau,
      venue_type: newTournamentData.venue_type
    };
    const { error } = await createTournament(payload);
    if (!error) {
      const selectedTemplate = tournamentTemplates.find(t => t.code === newTournamentData.templateCode);
      let generalConfig: any = null;
      let schedulerConfigPayload: any = null;

      if (selectedTemplate && selectedTemplate.defaultConfig) {
        const config = selectedTemplate.defaultConfig;
        generalConfig = {
          theThuc: config.theThuc, luotVongBang: config.luotVongBang,
          soVongLeague: config.soVongLeague, maxTeams: config.maxTeams,
          maxPlayers: config.maxPlayers, starterCount: config.starterCount,
          benchCount: config.benchCount, standingsConfig: config.standingsConfig
        };
        schedulerConfigPayload = {
          startDate: newTournamentData.ngayBatDau, endDate: '',
          matchDurationMinutes: config.matchDurationMinutes,
          breakTimeMinutes: config.breakTimeMinutes,
          playDays: [
            { dayOfWeek: 1, enabled: false }, { dayOfWeek: 2, enabled: false },
            { dayOfWeek: 3, enabled: false }, { dayOfWeek: 4, enabled: false },
            { dayOfWeek: 5, enabled: false }, { dayOfWeek: 6, enabled: true },
            { dayOfWeek: 0, enabled: true },
          ],
          timeSlots: [
            { id: '1', startTime: '17:30', endTime: '19:00' },
            { id: '2', startTime: '19:30', endTime: '21:00' },
          ],
          pitchesAvailable: config.pitchesAvailable,
          minRestHours: config.minRestHours,
          matchesPerWeek: config.matchesPerWeek
        };
      } else {
        const theThuc = newTournamentData.templateCode === 'LEAGUE' ? 'league' : 'tournament';
        generalConfig = {
          theThuc, luotVongBang: 1, soVongLeague: 5, maxTeams: 16, maxPlayers: 20,
          starterCount: 7, benchCount: 7, standingsConfig: { phongDo: theThuc === 'league', thePhat: false }
        };
        schedulerConfigPayload = {
          startDate: newTournamentData.ngayBatDau, endDate: '',
          matchDurationMinutes: 90, breakTimeMinutes: 15,
          playDays: [
            { dayOfWeek: 1, enabled: false }, { dayOfWeek: 2, enabled: false },
            { dayOfWeek: 3, enabled: false }, { dayOfWeek: 4, enabled: false },
            { dayOfWeek: 5, enabled: false }, { dayOfWeek: 6, enabled: true },
            { dayOfWeek: 0, enabled: true },
          ],
          timeSlots: [
            { id: '1', startTime: '17:30', endTime: '19:00' },
            { id: '2', startTime: '19:30', endTime: '21:00' },
          ],
          pitchesAvailable: 2, minRestHours: 48, matchesPerWeek: 8
        };
      }

      localStorage.setItem(`giai_dau_config_${newId}`, JSON.stringify(generalConfig));
      localStorage.setItem(`scheduler_config_${newId}`, JSON.stringify(schedulerConfigPayload));

      setIsCreatingTournament(false);
      showToast(`🏆 Đã khởi tạo thành công giải đấu: ${newTournamentData.ten}!`);
      setNewTournamentData({ ten: '', muaGiai: '2025', ngayBatDau: '2025-05-01', venue_type: 'CENTRALIZED', templateCode: '' });
      await fetchData(newId);
    } else {
      showToast(`❌ Lỗi: ${error.message}`);
    }
  };

  return {
    tournamentName, setTournamentName,
    tournamentSeason, setTournamentSeason,
    tournamentStartDate, setTournamentStartDate,
    tournamentVenueType, setTournamentVenueType,
    tournamentEndDate, setTournamentEndDate,
    tournamentMaxPlayers, setTournamentMaxPlayers,
    isCreatingTournament, setIsCreatingTournament,
    newTournamentData, setNewTournamentData,
    addCustomEvent, removeCustomEvent, updateCustomEvent,
    handleSaveTournamentConfig,
    handleDeleteTournament,
    handleCreateTournament,
  };
}
