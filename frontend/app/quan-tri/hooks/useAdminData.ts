'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { layDanhSachGiaiDau, layDanhSachDoi, layDanhSachTranDau } from '@/lib/api';

export function useAdminData(
  showToast: (msg: string) => void,
  setTournamentName: (v: string) => void,
  setTournamentSeason: (v: string) => void,
  setTournamentStartDate: (v: string) => void,
  setTournamentVenueType: (v: 'CENTRALIZED' | 'HOME_AWAY') => void,
  setTournamentEndDate: (v: string) => void,
  setMaxTeams: (v: number) => void,
  setTournamentMaxPlayers: (v: number) => void,
  setStarterCount: (v: number) => void,
  setBenchCount: (v: number) => void,
  setTournamentType: (v: 'tournament' | 'league') => void,
  setTournamentGroupLegs: (v: 1 | 2) => void,
  setTournamentLeagueRounds: (v: number) => void,
  setStandingsConfig: (v: any) => void,
  setCustomEvents: (v: any[]) => void,
  setSchedulerConfig: (v: any) => void,
  setBlackoutDates: (v: string[]) => void,
  selectedMatchId: string | null,
  setSelectedMatchId: (id: string | null) => void
) {
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState<any[]>([]);
  const [liveMatches, setLiveMatches] = useState<any[]>([]);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<any | null>(null);

  const fetchData = async (activeTourneyId?: string, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const tourneys = await layDanhSachGiaiDau();
      setTournaments(tourneys);

      let currentTourney = selectedTournament;
      if (activeTourneyId) {
        currentTourney = tourneys.find((t: any) => t.id === activeTourneyId) || null;
      }

      if (!currentTourney && tourneys.length > 0) {
        const savedTourneyId = localStorage.getItem('adminActiveTournament');
        if (savedTourneyId) {
          currentTourney = tourneys.find((t: any) => t.id === savedTourneyId) || null;
        }
        if (!currentTourney) {
          currentTourney = tourneys.find((t: any) => t.id === 'giai-thien-khoi-cup-2024') || tourneys[0];
        }
      }

      if (currentTourney && selectedTournament && currentTourney.id !== selectedTournament.id) {
        setSelectedMatchId(null);
      }

      setSelectedTournament(currentTourney);

      if (currentTourney && !silent) {
        localStorage.setItem('adminActiveTournament', currentTourney.id);
        setTournamentName(currentTourney.ten || '');
        setTournamentSeason(currentTourney.mua_giai || '');
        setTournamentStartDate(currentTourney.ngay_bat_dau || '');
        setTournamentVenueType(currentTourney.venue_type || 'CENTRALIZED');

        if (currentTourney.rules_config) {
          const config = currentTourney.rules_config;
          setTournamentEndDate(config.ngayKetThuc || '2024-06-30');
          setMaxTeams(config.maxTeams || 16);
          setTournamentMaxPlayers(config.maxPlayers || 20);
          setStarterCount(config.starterCount || 7);
          setBenchCount(config.benchCount || 7);
          setTournamentType(config.theThuc || 'tournament');
          setTournamentGroupLegs(config.luotVongBang || 1);
          setTournamentLeagueRounds(config.soVongLeague || 5);
          setStandingsConfig(config.standingsConfig || { phongDo: true, thePhat: false });
          setCustomEvents(config.custom_events || config.customEvents || []);
        } else {
          const localConfigStr = localStorage.getItem(`giai_dau_config_${currentTourney.id}`);
          if (localConfigStr) {
            try {
              const config = JSON.parse(localConfigStr);
              setTournamentEndDate(config.ngayKetThuc || '2024-06-30');
              setMaxTeams(config.maxTeams || 16);
              setTournamentMaxPlayers(config.maxPlayers || 20);
              setStarterCount(config.starterCount || 7);
              setBenchCount(config.benchCount || 7);
              setTournamentType(config.theThuc || 'tournament');
              setTournamentGroupLegs(config.luotVongBang || 1);
              setTournamentLeagueRounds(config.soVongLeague || 5);
              setStandingsConfig(config.standingsConfig || { phongDo: true, thePhat: false });
              setCustomEvents(config.custom_events || config.customEvents || []);
            } catch (e) {
              console.error('Error loading tournament config:', e);
            }
          } else {
            setTournamentEndDate('2024-06-30');
            setMaxTeams(16);
            setTournamentMaxPlayers(20);
            setStarterCount(7);
            setBenchCount(7);
            setTournamentType('tournament');
            setTournamentGroupLegs(1);
            setTournamentLeagueRounds(5);
            setStandingsConfig({ phongDo: true, thePhat: false });
            setCustomEvents([]);
          }
        }

        const minutesPerHalf = currentTourney?.rules_config?.matchFormat?.minutesPerHalf || 45;
        const defaultSchedulerConfig = {
          startDate: currentTourney.ngay_bat_dau || '',
          endDate: '',
          matchDurationMinutes: minutesPerHalf * 2,
          breakTimeMinutes: 15,
          maxExtraTimeMinutes: 15,
          playDays: [
            { dayOfWeek: 1, enabled: false },
            { dayOfWeek: 2, enabled: false },
            { dayOfWeek: 3, enabled: false },
            { dayOfWeek: 4, enabled: false },
            { dayOfWeek: 5, enabled: false },
            { dayOfWeek: 6, enabled: true },
            { dayOfWeek: 0, enabled: true },
          ],
          timeSlots: [
            { id: '1', startTime: '17:30', endTime: '19:00' },
            { id: '2', startTime: '19:30', endTime: '21:00' },
          ],
          pitchesAvailable: 2,
          minRestHours: 48,
          matchesPerWeek: 8
        };

        const localSchedulerConfigStr = localStorage.getItem(`scheduler_config_${currentTourney.id}`);
        if (localSchedulerConfigStr) {
          try {
            const parsed = JSON.parse(localSchedulerConfigStr);
            setSchedulerConfig({ ...defaultSchedulerConfig, ...parsed });
          } catch (e) {
            console.error('Error loading scheduler config:', e);
            setSchedulerConfig(defaultSchedulerConfig);
          }
        } else {
          setSchedulerConfig(defaultSchedulerConfig);
        }

        const localBlackoutDatesStr = localStorage.getItem(`blackout_dates_${currentTourney.id}`);
        if (localBlackoutDatesStr) {
          try {
            setBlackoutDates(JSON.parse(localBlackoutDatesStr));
          } catch (e) {
            console.error('Error loading blackout dates:', e);
            setBlackoutDates([]);
          }
        } else {
          setBlackoutDates([]);
        }
      }

      const tourneyId = currentTourney?.id || null;
      const [teamsData, matchesData] = await Promise.all([
        layDanhSachDoi(tourneyId),
        layDanhSachTranDau(tourneyId)
      ]);
      setTeams(teamsData);
      setLiveMatches(matchesData);
    } catch (err) {
      console.error('Lỗi tải dữ liệu:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Real-time subscriptions
  useEffect(() => {
    if (!selectedTournament?.id) return;
    const tourneyId = selectedTournament.id;

    const matchChannel = supabase
      .channel(`admin_matches_${tourneyId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tran_dau', filter: `giai_dau_id=eq.${tourneyId}` },
        () => fetchData(tourneyId, true))
      .subscribe();

    const eventChannel = supabase
      .channel(`admin_events_${tourneyId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'su_kien' },
        () => fetchData(tourneyId, true))
      .subscribe();

    return () => {
      supabase.removeChannel(matchChannel);
      supabase.removeChannel(eventChannel);
    };
  }, [selectedTournament?.id]);

  return {
    loading, setLoading,
    teams, setTeams,
    liveMatches, setLiveMatches,
    tournaments, setTournaments,
    selectedTournament, setSelectedTournament,
    fetchData,
  };
}
