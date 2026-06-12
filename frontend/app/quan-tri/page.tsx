'use client';

import { useMediaQuery } from '@/hooks/useMediaQuery';
import AdminDesktopView from './components/AdminDesktopView';
import AdminMobileView from './components/AdminMobileView';

import { useState, useEffect, useRef } from 'react';
import styles from './quan-tri.module.css';
import {
  layDanhSachDoi,
  layDanhSachTranDau,
  createTeam,
  updateTeam,
  deleteTeam,
  deleteAllTeams,
  updateMatch,
  addEvent,
  deleteEvent,
  updatePlayerGoals,
  createMatch,
  deleteMatch,
  calculateMatchMinute,
  layDanhSachGiaiDau,
  createTournament,
  layDanhSachTournamentTemplates,
  deleteTournament
} from '@/lib/api';

import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import GlobalSkeletonLoader from '@/components/GlobalSkeletonLoader';
import dynamic from 'next/dynamic';
const AdminOnboardingTour = dynamic(() => import('@/components/AdminOnboardingTour'), { ssr: false });
const RefereeGuideOverlay = dynamic(() => import('@/components/RefereeGuideOverlay'), { ssr: false });
import { runAutoSchedule } from '@/lib/auto_schedule';

import SettingsTab from './components/SettingsTab';
import TeamsTab from './components/TeamsTab';
import SchedulerTab from './components/SchedulerTab';
import RefereeTab from './components/RefereeTab';
import TeamDetailView from './components/TeamDetailView';

import * as XLSX from 'xlsx';
import TeamLogo from '@/components/TeamLogo';
import { processBulkImport, generateBulkImportTemplate, ImportProgress } from '@/lib/bulk_import';

const sidebarItems = [
  { label: 'Lịch đấu', id: 'lich' },
  { label: 'Quản lý đội', id: 'doi' },
  { label: 'Trọng tài', id: 'referee' },
  { label: 'Cài đặt giải đấu', id: 'cai-dat' },
];

export default function QuanTriPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('lich');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [runTour, setRunTour] = useState(false);
  const [runRefereeTour, setRunRefereeTour] = useState(false);
  const [liveMatches, setLiveMatches] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const savedTab = localStorage.getItem('adminActiveTab');
    if (savedTab) {
      setActiveTab(savedTab);
    }

    const savedMatchId = localStorage.getItem('adminSelectedMatchId');
    if (savedMatchId) {
      setSelectedMatchId(savedMatchId);
    }

    const hasSeenTour = localStorage.getItem('hasSeenAdminTour');
    if (!hasSeenTour) {
      setRunTour(true);
    }
    setIsMounted(true);
  }, []);

  // Persist activeTab to localStorage
  useEffect(() => {
    if (isMounted && activeTab) {
      localStorage.setItem('adminActiveTab', activeTab);
    }
  }, [activeTab, isMounted]);

  // Persist selectedMatchId to localStorage
  useEffect(() => {
    if (isMounted) {
      if (selectedMatchId) {
        localStorage.setItem('adminSelectedMatchId', selectedMatchId);
      } else {
        localStorage.removeItem('adminSelectedMatchId');
      }
    }
  }, [selectedMatchId, isMounted]);

  useEffect(() => {
    if (selectedMatchId) {
      const hasSeenRefereeTour = localStorage.getItem('hasSeenRefereeTour');
      if (!hasSeenRefereeTour) {
        setRunRefereeTour(true);
      }
    } else {
      setRunRefereeTour(false);
    }
  }, [selectedMatchId]);

  const [activePlayerParams, setActivePlayerParams] = useState<{ matchId: string, teamId: string, player: any, isBench?: boolean } | null>(null);
  const [pendingSubOut, setPendingSubOut] = useState<{ player: any, teamId: string } | null>(null);
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });

  // Switcher states
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<any | null>(null);
  const [tournamentTemplates, setTournamentTemplates] = useState<any[]>([]);

  // New Tournament creation modal states
  const [isCreatingTournament, setIsCreatingTournament] = useState(false);
  const [newTournamentData, setNewTournamentData] = useState({
    ten: '',
    muaGiai: '2024',
    ngayBatDau: '2024-05-01',
    venue_type: 'CENTRALIZED',
    templateCode: ''
  });


  // Modals state
  const [editingTeam, setEditingTeam] = useState<any | null>(null);
  const [viewingTeam, setViewingTeam] = useState<any | null>(null);
  const [isAddingTeam, setIsAddingTeam] = useState(false);
  const [fetchingLogo, setFetchingLogo] = useState(false);

  const handleAutoFetchLogo = async (teamName: string, isEditing = false) => {
    if (!teamName) return showToast("Vui lòng nhập tên đội bóng trước!");
    setFetchingLogo(true);
    try {
      // TheSportsDB free key '3' is locked to test data (Arsenal only).
      // So we fallback to generating a beautiful Initials Logo instantly.
      const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(teamName)}&background=random&color=fff&size=200&bold=true&format=svg`;
      if (isEditing) {
        setEditingTeam((prev: any) => ({ ...prev, logo: fallbackUrl }));
      } else {
        setNewTeamData((prev: any) => ({ ...prev, logo: fallbackUrl }));
      }
      showToast("✅ Đã tạo Logo Avatar cực chất!");
    } catch (error) {
      showToast("❌ Có lỗi khi tạo logo");
    } finally {
      setFetchingLogo(false);
    }
  };

  const [newTeamData, setNewTeamData] = useState({ ten: '', logo: '⚽', bang: 'A' });
  const [editingMatch, setEditingMatch] = useState<any | null>(null);
  const [isAddingMatch, setIsAddingMatch] = useState(false);
  const [newMatchData, setNewMatchData] = useState({ doiNhaId: '', doiKhachId: '', vong: 'Vòng bảng', date: '', time: '15:00', san: 'Sân TK' });
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerNumber, setNewPlayerNumber] = useState('');
  const [newPlayerPosition, setNewPlayerPosition] = useState('Thủ môn');
  const [maxTeams, setMaxTeams] = useState(16);
  const [standingsConfig, setStandingsConfig] = useState({ phongDo: true, thePhat: false });
  const [scheduleConfig, setScheduleConfig] = useState({ matchesPerWeek: 8 });
  const [blackoutDates, setBlackoutDates] = useState<string[]>([]);
  const saveBlackoutDates = (dates: string[]) => {
    setBlackoutDates(dates);
    if (selectedTournament?.id) {
      localStorage.setItem(`blackout_dates_${selectedTournament.id}`, JSON.stringify(dates));
    }
  };
  const [newBlackoutDate, setNewBlackoutDate] = useState('');
  const [isSchedulerConfigOpen, setIsSchedulerConfigOpen] = useState(false);
  const [schedulerConfig, setSchedulerConfig] = useState({
    startDate: '',
    endDate: '',
    matchDurationMinutes: 90,
    breakTimeMinutes: 15,
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
  });

  const updateSchedulerConfig = (updates: Partial<typeof schedulerConfig>) => {
    setSchedulerConfig(prev => {
      const next = { ...prev, ...updates };
      if (selectedTournament?.id) {
        localStorage.setItem(`scheduler_config_${selectedTournament.id}`, JSON.stringify(next));
      }
      return next;
    });
  };

  // Scheduler states
  const [scheduleFilterVong, setScheduleFilterVong] = useState<string>('NONE');

  // Referee filtering states
  const [refereeFilterVong, setRefereeFilterVong] = useState<string>('NONE');
  const [refereeFilterBang, setRefereeFilterBang] = useState<string>('all');

  // Custom Events
  const [customEvents, setCustomEvents] = useState<any[]>([]);

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

  // Dynamic tournament settings states
  const [tournamentName, setTournamentName] = useState('');
  const [tournamentSeason, setTournamentSeason] = useState('');
  const [tournamentStartDate, setTournamentStartDate] = useState('');
  const [tournamentVenueType, setTournamentVenueType] = useState<'CENTRALIZED' | 'HOME_AWAY'>('CENTRALIZED');
  const [tournamentEndDate, setTournamentEndDate] = useState('2024-06-30');
  const [tournamentMaxPlayers, setTournamentMaxPlayers] = useState(20);
  const [starterCount, setStarterCount] = useState<number>(7);
  const [benchCount, setBenchCount] = useState<number>(7);
  const [isSelectingSubstitute, setIsSelectingSubstitute] = useState(false);
  const [tournamentType, setTournamentType] = useState<'tournament' | 'league'>('tournament');
  const [tournamentGroupLegs, setTournamentGroupLegs] = useState<1 | 2>(1);
  const [tournamentLeagueRounds, setTournamentLeagueRounds] = useState<number>(5);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel?: () => void;
  } | null>(null);

  const showConfirm = (title: string, message: string, onConfirm: () => void, onCancel?: () => void) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmDialog(null);
      },
      onCancel: () => {
        if (onCancel) onCancel();
        setConfirmDialog(null);
      }
    });
  };

  const showToast = (message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast({ message: '', visible: false }), 3000);
  };

  // Excel Bulk Import States
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [bulkImportProgress, setBulkImportProgress] = useState<ImportProgress | null>(null);
  const [selectedBulkFile, setSelectedBulkFile] = useState<File | null>(null);
  const [isBulkDragActive, setIsBulkDragActive] = useState(false);
  const bulkFileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadBulkTemplate = () => {
    try {
      generateBulkImportTemplate();
      showToast("📥 Đã tải file mẫu: Template_Nhap_Du_Lieu_Tong_Hop.xlsx!");
    } catch (err: any) {
      showToast(`❌ Lỗi tải template: ${err.message}`);
    }
  };

  const handleClearBulkImport = () => {
    setSelectedBulkFile(null);
    setBulkImportProgress(null);
    if (bulkFileInputRef.current) {
      bulkFileInputRef.current.value = '';
    }
  };

  const processBulkFile = async (file: File) => {
    if (!selectedTournament?.id) {
      showToast("⚠️ Vui lòng chọn một giải đấu trước khi import.");
      return;
    }
    setSelectedBulkFile(file);
    try {
      await processBulkImport(file, selectedTournament.id, (progress) => {
        setBulkImportProgress(progress);
      });
      
      // On success, refresh data
      await fetchData(selectedTournament.id);
      setTimeout(() => {
        setIsBulkImportOpen(false);
        handleClearBulkImport();
        showToast("✅ Import dữ liệu tổng hợp thành công!");
      }, 1500);
    } catch (error: any) {
      // Keep modal open to show error in progress or toast
      showToast(`❌ Lỗi Import: ${error.message}`);
    }
  };

  const handleImportBulkFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processBulkFile(file);
    }
  };


  // Fetch data on mount & check auth
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
      } else {
        const templates = await layDanhSachTournamentTemplates();
        if (templates && templates.length > 0) {
          setTournamentTemplates(templates);
        }
        fetchData();
      }
    };
    checkAuth();
  }, [router]);

  // Real-time database subscription for the active tournament
  useEffect(() => {
    if (!selectedTournament?.id) return;

    const tourneyId = selectedTournament.id;

    // 1. Subscribe to match changes for this tournament
    const matchChannel = supabase
      .channel(`admin_matches_${tourneyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tran_dau',
          filter: `giai_dau_id=eq.${tourneyId}`,
        },
        () => {
          fetchData(tourneyId, true);
        }
      )
      .subscribe();

    // 2. Subscribe to event table changes (updates score, timeline, etc.)
    const eventChannel = supabase
      .channel(`admin_events_${tourneyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'su_kien',
        },
        () => {
          fetchData(tourneyId, true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(matchChannel);
      supabase.removeChannel(eventChannel);
    };
  }, [selectedTournament?.id]);

  const calculateCurrentRoster = (team: any, events: any[], limit: number) => {
    if (!team || !team.cauThu) return { starters: [], bench: [] };
    let starters: any[] = [];
    let bench: any[] = [];
    
    // Initial assignment
    team.cauThu.forEach((p: any, idx: number) => {
      if (idx < limit) starters.push(p);
      else bench.push(p);
    });

    // Apply substitutions
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

        // Load from DB rules_config if available
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
          // Lấy custom_events từ dữ liệu API
          setCustomEvents(config.custom_events || config.customEvents || []);
        } else {
          // Fallback to localStorage ONLY if there's no DB config
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

        const defaultSchedulerConfig = {
          startDate: currentTourney.ngay_bat_dau || '',
          endDate: '',
          matchDurationMinutes: 90,
          breakTimeMinutes: 15,
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

        // Load scheduler config from localStorage if it exists
        const localSchedulerConfigStr = localStorage.getItem(`scheduler_config_${currentTourney.id}`);
        if (localSchedulerConfigStr) {
          try {
            const parsed = JSON.parse(localSchedulerConfigStr);
            setSchedulerConfig({
              ...defaultSchedulerConfig,
              ...parsed
            });
          } catch (e) {
            console.error('Error loading scheduler config:', e);
            setSchedulerConfig(defaultSchedulerConfig);
          }
        } else {
          setSchedulerConfig(defaultSchedulerConfig);
        }

        // Load blackout dates from localStorage if they exist
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
      console.error("Lỗi tải dữ liệu:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  };


  // Event Handlers for Teams & Schedule
  const handleAddTeam = () => setIsAddingTeam(true);

  const confirmAddTeam = async () => {
    if (!newTeamData.ten) {
      showToast("⚠️ Vui lòng nhập tên đội bóng!");
      return;
    }
    if (teams.length >= maxTeams) {
      showToast(`⚠️ [Lỗi] Vượt quá số lượng đội quy định! Giải đấu này chỉ cho phép tối đa ${maxTeams} đội.`);
      return;
    }
    const newTeam = {
      id: `doi-${Date.now()}`,
      ten: newTeamData.ten,
      vietTat: newTeamData.ten.substring(0, 3).toUpperCase(),
      logo: newTeamData.logo,
      bang: newTeamData.bang,
      giaiDauId: selectedTournament?.id,
      cauThu: []
    };

    const { error } = await createTeam(newTeam);
    if (!error) {
      await fetchData(selectedTournament?.id);
      setIsAddingTeam(false);
      setNewTeamData({ ten: '', logo: '⚽', bang: 'A' });
      showToast(`Đã khởi tạo đội ${newTeam.ten} thành công!`);
    } else {
      showToast(`Lỗi: ${error.message}`);
    }
  };


  const handleEditTeam = (team: any) => setEditingTeam({ ...team });

  const handleSaveTeam = async () => {
    const { error } = await updateTeam(editingTeam);
    if (!error) {
      await fetchData(selectedTournament?.id);
      setEditingTeam(null);
      showToast("Đã cập nhật thông tin đội bóng!");
    } else {
      showToast(`Lỗi: ${error.message}`);
    }
  };

  const handleAddPlayer = () => {
    if (!newPlayerName) return;
    const newPlayer = {
      id: `ct-${Date.now()}`,
      ten: newPlayerName,
      soAo: newPlayerNumber ? parseInt(newPlayerNumber) : 99,
      viTri: newPlayerPosition,
      banThang: 0
    };
    setEditingTeam({
      ...editingTeam,
      cauThu: [...(editingTeam.cauThu || []), newPlayer]
    });
    setNewPlayerName('');
    setNewPlayerNumber('');
    setNewPlayerPosition('Thủ môn');
  };

  const handleDeletePlayer = (playerId: string) => {
    setEditingTeam({
      ...editingTeam,
      cauThu: editingTeam.cauThu.filter((p: any) => p.id !== playerId)
    });
  };

  const handleDeleteTeam = async (teamId: string) => {
    showConfirm(
      "XÓA ĐỘI BÓNG",
      "Bạn có chắc chắn muốn xóa đội bóng này không?",
      async () => {
        const { error } = await deleteTeam(teamId);
        if (!error) {
          await fetchData(selectedTournament?.id);
          showToast("Đã xóa đội bóng thành công!");
        }
      }
    );
  };

  const handleDeleteAllTeams = async () => {
    if (!selectedTournament?.id) return;
    showConfirm(
      "XÓA TẤT CẢ ĐỘI BÓNG",
      "⚠️ Bạn có chắc chắn muốn xóa TẤT CẢ đội bóng (và toàn bộ cầu thủ của họ) khỏi giải đấu này không? Hành động này không thể hoàn tác!",
      async () => {
        try {
          showToast("🧹 Đang xóa tất cả đội bóng...");
          const { error } = await deleteAllTeams(selectedTournament.id);
          if (error) {
            if (error.message?.includes('violates foreign key constraint') || error.details?.includes('is still referenced')) {
              showToast("❌ Không thể xóa! Một số đội đã được xếp lịch đấu. Hãy xóa lịch trước.");
            } else {
              showToast(`❌ Lỗi khi xóa: ${error.message}`);
            }
          } else {
            await fetchData(selectedTournament.id);
            showToast("Đã xóa toàn bộ đội bóng thành công!");
          }
        } catch (err: any) {
          showToast(`❌ Lỗi khi xóa: ${err.message}`);
        }
      }
    );
  };

  const handleSaveTournamentConfig = async (rules?: any) => {
    if (!selectedTournament) return;
    try {
      showToast("⏳ Đang lưu cấu hình giải đấu...");

      // Update local states if rules was supplied from form
      if (rules) {
        if (rules.matchFormat) {
          setStarterCount(rules.matchFormat.playersPerTeam);
        }
        if (rules.custom_events) {
          setCustomEvents(rules.custom_events);
        }
      }

      // Save additional configuration to localStorage as fallback
      const config = {
        ngayKetThuc: tournamentEndDate,
        maxTeams: maxTeams || 16,
        maxPlayers: tournamentMaxPlayers || 20,
        starterCount: rules?.matchFormat?.playersPerTeam || starterCount || 7,
        benchCount: benchCount || 7,
        theThuc: tournamentType,
        luotVongBang: tournamentGroupLegs,
        soVongLeague: tournamentLeagueRounds || 5,
        standingsConfig,
        custom_events: rules?.custom_events || customEvents,
        matchFormat: rules?.matchFormat || {
          playersPerTeam: starterCount || 7,
          minutesPerHalf: 45,
          penaltyIfDraw: false,
        },
        pointsSystem: rules?.pointsSystem || {
          win: 3,
          draw: 1,
          loss: 0,
          winByPenalty: 2,
          lossByPenalty: 1,
        },
        tieBreakerPriority: rules?.tieBreakerPriority || ['headToHead', 'goalDifference', 'goalsScored'],
      };
      localStorage.setItem(`giai_dau_config_${selectedTournament.id}`, JSON.stringify(config));

      // Update core fields and config in Supabase
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

      showToast("✨ Đã lưu cấu hình giải đấu thành công!");
      await fetchData(selectedTournament.id);
    } catch (err: any) {
      console.error(err);
      showToast(`❌ Lỗi khi lưu cấu hình: ${err.message}`);
    }
  };

  const handleDeleteTournament = async () => {
    if (!selectedTournament?.id) return;
    showConfirm(
      "XÓA GIẢI ĐẤU",
      `⚠️ Bạn có chắc chắn muốn xóa giải đấu "${selectedTournament.ten}" không? Toàn bộ đội bóng, cầu thủ, trận đấu, sự kiện và cấu hình liên quan sẽ bị XÓA VĨNH VIỄN và KHÔNG thể khôi phục!`,
      async () => {
        try {
          showToast("🗑️ Đang xóa giải đấu...");
          const { error } = await deleteTournament(selectedTournament.id);
          if (error) {
            showToast(`❌ Lỗi khi xóa giải đấu: ${error.message}`);
          } else {
            showToast("✨ Đã xóa giải đấu thành công!");
            const freshTournaments = await layDanhSachGiaiDau();
            setTournaments(freshTournaments);
            if (freshTournaments.length > 0) {
              setSelectedTournament(freshTournaments[0]);
              await fetchData(freshTournaments[0].id);
            } else {
              setSelectedTournament(null);
              setTeams([]);
              setLiveMatches([]);
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
      showToast("⚠️ Vui lòng nhập tên giải đấu!");
      return;
    }
    if (!newTournamentData.templateCode) {
      showToast("⚠️ Vui lòng chọn loại giải đấu!");
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
          theThuc: config.theThuc,
          luotVongBang: config.luotVongBang,
          soVongLeague: config.soVongLeague,
          maxTeams: config.maxTeams,
          maxPlayers: config.maxPlayers,
          starterCount: config.starterCount,
          benchCount: config.benchCount,
          standingsConfig: config.standingsConfig
        };
        schedulerConfigPayload = {
          startDate: newTournamentData.ngayBatDau,
          endDate: '',
          matchDurationMinutes: config.matchDurationMinutes,
          breakTimeMinutes: config.breakTimeMinutes,
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
          pitchesAvailable: config.pitchesAvailable,
          minRestHours: config.minRestHours,
          matchesPerWeek: config.matchesPerWeek
        };
      } else {
        // Fallback when template load fails
        const theThuc = newTournamentData.templateCode === 'LEAGUE' ? 'league' : 'tournament';
        generalConfig = {
          theThuc,
          luotVongBang: 1,
          soVongLeague: 5,
          maxTeams: 16,
          maxPlayers: 20,
          starterCount: 7,
          benchCount: 7,
          standingsConfig: {
            phongDo: theThuc === 'league',
            thePhat: false
          }
        };
        schedulerConfigPayload = {
          startDate: newTournamentData.ngayBatDau,
          endDate: '',
          matchDurationMinutes: 90,
          breakTimeMinutes: 15,
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


  const handleAutoSchedule = async () => {
    if (teams.length < 2) {
      showToast("⚠️ Cần tối thiểu 2 đội bóng để sinh lịch!");
      return;
    }

    if (!schedulerConfig.endDate) {
      showToast("⚠️ Vui lòng nhập Ngày kết thúc dự kiến!");
      return;
    }

    const baseStartDate = schedulerConfig.startDate || selectedTournament?.ngay_bat_dau;
    if (baseStartDate && schedulerConfig.endDate < baseStartDate) {
      showToast("⚠️ Ngày kết thúc dự kiến không được trước Ngày bắt đầu!");
      return;
    }

    showConfirm(
      "XÁC NHẬN SINH LỊCH TỰ ĐỘNG",
      "🔄 Xếp lịch tự động sẽ XÓA TOÀN BỘ lịch thi đấu nháp của giải đấu hiện tại và ghi đè lịch mới. Bạn có chắc chắn muốn tiếp tục?",
      async () => {
        try {
          showToast("⏳ Đang xếp lịch thi đấu tự động (CSP)...");

          const actualStartDate = baseStartDate || '2026-05-01';
          
          // Dynamically compute end times for each slot based on start time + match duration + break buffer
          const timeSlotsWithEnd = schedulerConfig.timeSlots.map(slot => {
            const [hours, minutes] = slot.startTime.split(':').map(Number);
            const totalMinutes = hours * 60 + minutes + schedulerConfig.matchDurationMinutes + schedulerConfig.breakTimeMinutes;
            const endHours = Math.floor(totalMinutes / 60) % 24;
            const endMinutes = totalMinutes % 60;
            const endTime = `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
            return {
              ...slot,
              endTime
            };
          });

          const payloadConfig = {
            ...schedulerConfig,
            startDate: actualStartDate,
            endDate: schedulerConfig.endDate,
            timeSlots: timeSlotsWithEnd,
            blackoutDates: blackoutDates
          };

          // Load configuration from localStorage as the source of truth
          const configStr = localStorage.getItem(`giai_dau_config_${selectedTournament.id}`);
          let activeType = 'tournament';
          let activeGroupLegs = 1;
          let activeLeagueRounds = 5;
          if (configStr) {
            try {
              const config = JSON.parse(configStr);
              activeType = config.theThuc || 'tournament';
              activeGroupLegs = config.luotVongBang || 1;
              activeLeagueRounds = config.soVongLeague || 5;
            } catch (e) {}
          }

          const count = await runAutoSchedule(
            teams,
            selectedTournament,
            activeType,
            activeGroupLegs,
            activeLeagueRounds,
            payloadConfig,
            showToast
          );

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

  const handleEditMatch = (match: any) => setEditingMatch({ ...match });

  const handleSaveMatch = async () => {
    const { error } = await updateMatch(editingMatch);
    if (!error) {
      await fetchData(selectedTournament?.id);
      setEditingMatch(null);
      showToast("Đã cập nhật lịch thi đấu!");
    }
  };

  const handleCreateMatch = async () => {
    if (!newMatchData.doiNhaId || !newMatchData.doiKhachId) {
      showToast('Vui lòng chọn hai đội thi đấu!');
      return;
    }
    if (newMatchData.doiNhaId === newMatchData.doiKhachId) {
      showToast('Hai đội không được trùng nhau!');
      return;
    }
    const { error } = await createMatch({
      ...newMatchData,
      giaiDauId: selectedTournament?.id
    });
    if (!error) {
      await fetchData(selectedTournament?.id);
      setIsAddingMatch(false);
      setNewMatchData({ doiNhaId: '', doiKhachId: '', vong: 'Vòng bảng', date: '', time: '15:00', san: 'Sân TK' });
      showToast('Đã tạo trận đấu mới thành công!');
    } else {
      showToast(`Lỗi: ${error.message}`);
    }
  };

  const handleDeleteMatch = async (matchId: string) => {
    showConfirm(
      "XÓA TRẬN ĐẤU",
      "Bạn có chắc chắn muốn xóa trận đấu này?",
      async () => {
        const { error } = await deleteMatch(matchId);
        if (!error) {
          await fetchData(selectedTournament?.id);
          showToast('Đã xóa trận đấu!');
        }
      }
    );
  };


  const formatMatchTime = (match: any): string => {
    if (!match) return '00:00';
    if (match.trangThai === 'SAP_DIEN_RA') return '00:00';
    if (match.trangThai === 'KET_THUC') return `${String(match.phut || 90).padStart(2, '0')}:00`;
    if (!match.batDauLuc) return `${String(match.phut || 0).padStart(2, '0')}:00`;

    let diffInSeconds = 0;
    if (match.dangTamDung) {
      diffInSeconds = match.thoiGianDaQua || 0;
    } else {
      const startTime = new Date(match.batDauLuc).getTime();
      const now = new Date().getTime();
      diffInSeconds = Math.floor((now - startTime) / 1000) + (match.thoiGianDaQua || 0);
    }
    
    const m = Math.floor(diffInSeconds / 60);
    const s = diffInSeconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const getMatchHalfState = (match: any): '1_not_started' | '1_active' | 'half_time' | '2_active' | 'finished' => {
    if (!match) return '1_not_started';
    if (match.trangThai === 'SAP_DIEN_RA') return '1_not_started';
    if (match.trangThai === 'KET_THUC') return 'finished';
    
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`match_hiep_${match.id}`);
      if (saved) return saved as any;
    }
    
    if (match.dangTamDung) return 'half_time';
    return '1_active';
  };

  // Real-time timer logic (Realistic calculation ticking every 1s)
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveMatches(prev => prev.map(match => {
        if (match.trangThai === 'DANG_DIEN_RA' && !match.dangTamDung) {
          const currentPhut = calculateMatchMinute(match);
          if (currentPhut !== match.phut) {
            return { ...match, phut: currentPhut };
          }
        }
        return match;
      }));
    }, 1000); // Check every 1s for UI updates
    return () => clearInterval(interval);
  }, []);

  const [searchTermList, setSearchTermList] = useState('');
  const selectedMatch = liveMatches.find(m => m.id === selectedMatchId);
  const filteredMatches = liveMatches.filter(m =>
    m.doiNha?.ten?.toLowerCase().includes(searchTermList.toLowerCase()) ||
    m.doiKhach?.ten?.toLowerCase().includes(searchTermList.toLowerCase()) ||
    m.vong?.toLowerCase().includes(searchTermList.toLowerCase())
  );

  const handleStartMatch = async (matchId: string) => {
    const match = liveMatches.find(m => m.id === matchId);
    if (match) {
      const updated = {
        ...match,
        trangThai: 'DANG_DIEN_RA',
        phut: 1,
        batDauLuc: new Date().toISOString(),
        thoiGianDaQua: 0,
        dangTamDung: false
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem(`match_hiep_${matchId}`, '1_active');
      }
      await updateMatch(updated);
      await fetchData(selectedTournament?.id);
      showToast("Trận đấu đã bắt đầu!");
    }
  };

  const handlePauseMatch = async (matchId: string) => {
    const match = liveMatches.find(m => m.id === matchId);
    if (match) {
      const now = new Date().getTime();
      const start = new Date(match.batDauLuc).getTime();
      const passed = Math.floor((now - start) / 1000) + (match.thoiGianDaQua || 0);

      const updated = {
        ...match,
        dangTamDung: true,
        thoiGianDaQua: passed,
        phut: Math.floor(passed / 60) + 1
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem(`match_hiep_${matchId}`, 'half_time');
      }
      await updateMatch(updated);
      await fetchData(selectedTournament?.id);
      showToast("Đã tạm dừng đồng hồ (Nghỉ giữa hiệp)!");
    }
  };

  const handleResumeMatch = async (matchId: string) => {
    const match = liveMatches.find(m => m.id === matchId);
    if (match) {
      const updated = {
        ...match,
        dangTamDung: false,
        batDauLuc: new Date().toISOString() // New reference point
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem(`match_hiep_${matchId}`, '2_active');
      }
      await updateMatch(updated);
      await fetchData(selectedTournament?.id);
      showToast("Bắt đầu hiệp 2!");
    }
  };

  const handleTemporaryPauseToggle = async (matchId: string) => {
    const match = liveMatches.find(m => m.id === matchId);
    if (match) {
      if (match.dangTamDung) {
        const updated = {
          ...match,
          dangTamDung: false,
          batDauLuc: new Date().toISOString()
        };
        await updateMatch(updated);
        await fetchData(selectedTournament?.id);
        showToast("▶ Trận đấu tiếp tục!");
      } else {
        const now = new Date().getTime();
        const start = new Date(match.batDauLuc).getTime();
        const passed = Math.floor((now - start) / 1000) + (match.thoiGianDaQua || 0);

        const updated = {
          ...match,
          dangTamDung: true,
          thoiGianDaQua: passed,
          phut: Math.floor(passed / 60) + 1
        };
        await updateMatch(updated);
        await fetchData(selectedTournament?.id);
        showToast("⏸ Trận đấu đã tạm dừng!");
      }
    }
  };

  const handleFinishMatch = async (matchId: string) => {
    showConfirm(
      "KẾT THÚC TRẬN ĐẤU",
      "Bạn có chắc chắn muốn kết thúc trận đấu này? Kết quả sẽ được chốt.",
      async () => {
        const match = liveMatches.find(m => m.id === matchId);
        if (match) {
          const finalPhut = calculateMatchMinute(match);
          const updated = { ...match, trangThai: 'KET_THUC', phut: finalPhut };
          if (typeof window !== 'undefined') {
            localStorage.setItem(`match_hiep_${matchId}`, 'finished');
          }
          await updateMatch(updated);
          await fetchData(selectedTournament?.id);
          showToast("Trận đấu đã kết thúc!");
        }
      }
    );
  };

  const handleResetMatch = async (matchId: string) => {
    showConfirm(
      "RESET TRẬN ĐẤU",
      "🔄 Bạn có chắc muốn RESET trận đấu này về trạng thái chưa diễn ra? Tất cả sự kiện sẽ bị xóa và tỷ số sẽ quay về 0-0.",
      async () => {
        const match = liveMatches.find(m => m.id === matchId);
        if (match) {
          // 1. Decrement goals for players who scored in this match
          if (match.suKien && match.suKien.length > 0) {
            for (const ev of match.suKien) {
              let decrement = 0;
              if (ev.loai === 'GOAL_NORMAL' || ev.loai === 'GOAL_PEN' || ev.loai === 'GOAL_OG') {
                decrement = -1;
              } else if (ev.loai === 'CHOT') {
                decrement = -2;
              }
              if (decrement !== 0 && ev.cauThuId) {
                await updatePlayerGoals(ev.cauThuId, decrement);
              }
            }
          }

          // 2. Delete all events of the match
          await supabase.from('su_kien').delete().eq('tran_dau_id', matchId);

          // 3. Reset match status, scores and times
          const updated = {
            ...match,
            tyNha: 0,
            tyKhach: 0,
            trangThai: 'SAP_DIEN_RA',
            phut: 0,
            batDauLuc: null,
            thoiGianDaQua: 0,
            dangTamDung: false
          };
          if (typeof window !== 'undefined') {
            localStorage.removeItem(`match_hiep_${matchId}`);
          }
          await updateMatch(updated);
          await fetchData(selectedTournament?.id);
          showToast("Trận đấu đã được reset về 0-0!");
        }
      }
    );
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleExecuteSubstitution = async (inPlayer: any, outPlayer: any, teamId: string) => {
    if (!selectedMatch) return;
    try {
      const description = `Vào sân thay cho ${outPlayer.ten}`;
      const res = await addEvent({
        matchId: selectedMatch.id,
        type: 'SUB',
        minute: selectedMatch.phut || 0,
        teamId: teamId,
        playerId: inPlayer.id,
        description: description
      });
      // Wait, is addEvent signature like this? Let's check `handleActionSelect`.
      // `await addEvent({ matchId, teamId, playerId: player.id, type: eventType, minute: selectedMatch.phut || 0, description: ... });`
      // So no error field from res.
      
      showToast(`🔄 Đã thay người: ${inPlayer.ten} vào thay ${outPlayer.ten}`);
      await fetchData(selectedTournament?.id);
      setIsSelectingSubstitute(false);
      setActivePlayerParams(null);
      setPendingSubOut(null);
    } catch (e) {
      console.error(e);
      showToast("❌ Lỗi khi thay người!");
    }
  };

  const handleActionSelect = async (type: string, subType?: string, overrideParams?: any) => {
    const params = overrideParams || activePlayerParams;
    if (!params || !selectedMatch) return;
    const { teamId, matchId, player } = params;
    let typeLabel = '';
    let eventType = type.toUpperCase();
    let increment = 0;

    if (type === 'goal') {
      typeLabel = subType === 'pen' ? 'Ghi bàn (Penalty)' : subType === 'og' ? 'Phản lưới nhà' : 'Ghi bàn';
      eventType = subType ? `GOAL_${subType.toUpperCase()}` : 'GOAL_NORMAL';
      increment = 1;
    } else if (type === 'custom' && subType) {
      const customEvt = customEvents.find((e: any) => e.code === subType);
      if (customEvt) {
        typeLabel = `${customEvt.name}`;
        eventType = `CUSTOM_${customEvt.code.toUpperCase()}`;
        increment = 0; // Custom events based on new schema do not implicitly add points here
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
      if (yellowCount >= 1) {
        isSecondYellow = true;
      }
    }

    // 1. Add Event to DB
    if (isSecondYellow) {
      await addEvent({
        matchId,
        teamId,
        playerId: player.id,
        type: 'THE_VANG',
        minute: selectedMatch.phut || 0,
        description: `${player.ten} (Phạt thẻ vàng 🟨)`
      });
      await addEvent({
        matchId,
        teamId,
        playerId: player.id,
        type: 'THE_DO',
        minute: selectedMatch.phut || 0,
        description: `${player.ten} (Thẻ đỏ gián tiếp - 2 thẻ vàng) 🟥`
      });
    } else {
      await addEvent({
        matchId,
        teamId,
        playerId: player.id,
        type: eventType,
        minute: selectedMatch.phut || 0,
        description: `${player.ten} (${typeLabel})`
      });
    }

    // 2. Update score if goal/chot
    if (increment > 0) {
      let scoringTeamId = teamId;
      if (eventType === 'GOAL_OG') {
        // Opponent team gets the score
        scoringTeamId = teamId === selectedMatch.doiNha?.id ? selectedMatch.doiKhach?.id : selectedMatch.doiNha?.id;
      }
      const teamKey = scoringTeamId === selectedMatch.doiNha?.id ? 'tyNha' : 'tyKhach';
      const updated = { ...selectedMatch, [teamKey]: (selectedMatch[teamKey] || 0) + increment };
      await updateMatch(updated);

      // Update player goals (skip for OG)
      if (eventType !== 'GOAL_OG') {
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
    showConfirm(
      "HOÀN TÁC SỰ KIỆN",
      "Bạn có muốn hoàn tác sự kiện này?",
      async () => {
        let increment = 0;
        if (eventType.startsWith('GOAL')) increment = 1;
        if (eventType.startsWith('CUSTOM_')) {
          // Custom events don't have points mapped implicitly now
          increment = 0;
        }

        await deleteEvent(eventId);

        if (increment > 0 && selectedMatch) {
          let scoringTeamId = teamId;
          if (eventType === 'GOAL_OG') {
            scoringTeamId = teamId === selectedMatch.doiNha?.id ? selectedMatch.doiKhach?.id : selectedMatch.doiNha?.id;
          }
          const teamKey = scoringTeamId === selectedMatch.doiNha?.id ? 'tyNha' : 'tyKhach';
          const updated = { ...selectedMatch, [teamKey]: Math.max(0, (selectedMatch[teamKey] || 0) - increment) };
          await updateMatch(updated);

          if (eventType !== 'GOAL_OG') {
            await updatePlayerGoals(playerId, -increment);
          }
        }

        await fetchData(selectedTournament?.id);
        showToast("Đã hoàn tác sự kiện!");
      }
    );
  };
  const handleDeleteEvent = async (evtId: string, type: string, points?: number, isIndividual?: boolean, playerId?: string) => {
    const ev = selectedMatch?.suKien?.find((e: any) => e.id === evtId);
    const teamId = ev?.doiId || ev?.teamId || '';
    const pId = playerId || ev?.cauThuId || ev?.playerId || '';
    await handleUndoEvent(evtId, type, teamId, pId);
  };

  // Helper to extract round and group from vong string
  const parseVongDetails = (vongStr: string = '') => {
    const str = vongStr.trim();
    const matchNew = str.match(/Vòng\s+(\d+)\s+-\s+Bảng\s+([A-Z])/i);
    if (matchNew) {
      return { bang: `Bảng ${matchNew[2]}`, vong: `Vòng ${matchNew[1]}`, isKnockout: false };
    }
    const matchOld = str.match(/Bảng\s+([A-Z])\s+-\s+Vòng\s+(\d+)/i);
    if (matchOld) {
      return { bang: `Bảng ${matchOld[1]}`, vong: `Vòng ${matchOld[2]}`, isKnockout: false };
    }
    if (str.toLowerCase().includes('1/16')) {
      return { bang: '', vong: 'Vòng 1/16', isKnockout: true };
    }
    if (str.toLowerCase().includes('1/8')) {
      return { bang: '', vong: 'Vòng 1/8', isKnockout: true };
    }
    if (str.toLowerCase().includes('tứ kết')) {
      return { bang: '', vong: 'Tứ kết', isKnockout: true };
    }
    if (str.toLowerCase().includes('bán kết')) {
      return { bang: '', vong: 'Bán kết', isKnockout: true };
    }
    if (str.toLowerCase().includes('tranh hạng ba')) {
      return { bang: '', vong: 'Tranh hạng ba', isKnockout: true };
    }
    if (str.toLowerCase().includes('chung kết')) {
      return { bang: '', vong: 'Chung kết', isKnockout: true };
    }
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
    if (match) {
      return parseInt(match[1], 10);
    }
    return 9999;
  };

  // Extract all unique round names and group names from active tournament matches
  const { uniqueRounds, uniqueGroups } = (() => {
    const roundsSet = new Set<string>();
    const groupsSet = new Set<string>();
    
    liveMatches.forEach(m => {
      const { bang, vong } = parseVongDetails(m.vong);
      if (vong) roundsSet.add(vong);
      if (bang) groupsSet.add(bang);
    });
    
    const sortedRounds = Array.from(roundsSet).sort((a, b) => {
      return getRoundPriority(a) - getRoundPriority(b);
    });
    
    const sortedGroups = Array.from(groupsSet).sort();
    
    return { uniqueRounds: sortedRounds, uniqueGroups: sortedGroups };
  })();

  // Helper to find the round containing the match closest to today
  const getClosestMatchweek = (matches: any[], rounds: string[]): string => {
    if (!rounds || rounds.length === 0) return 'NONE';
    if (!matches || matches.length === 0) return rounds[0];

    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const todayEnd = todayStart + 24 * 60 * 60 * 1000;

    const getRoundKey = (vongStr: string) => {
      const { vong } = parseVongDetails(vongStr);
      return vong;
    };

    // 1. Matches today
    const matchesToday = matches.filter((m: any) => {
      const mDateStr = m.date || m.batDauLuc;
      if (!mDateStr) return false;
      try {
        const mTime = new Date(mDateStr).getTime();
        return mTime >= todayStart && mTime < todayEnd;
      } catch (e) {
        return false;
      }
    });
    if (matchesToday.length > 0) {
      const key = getRoundKey(matchesToday[0].vong);
      if (key && rounds.includes(key)) return key;
    }

    // 2. Matches this week (Mon to Sun)
    const currentDay = today.getDay();
    const distanceToMon = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(today);
    monday.setDate(today.getDate() + distanceToMon);
    monday.setHours(0, 0, 0, 0);
    const monTime = monday.getTime();
    const sunTime = monTime + 7 * 24 * 60 * 60 * 1000;

    const matchesThisWeek = matches.filter((m: any) => {
      const mDateStr = m.date || m.batDauLuc;
      if (!mDateStr) return false;
      try {
        const mTime = new Date(mDateStr).getTime();
        return mTime >= monTime && mTime < sunTime;
      } catch (e) {
        return false;
      }
    });

    if (matchesThisWeek.length > 0) {
      matchesThisWeek.sort((a: any, b: any) => {
        const tA = new Date(a.date || a.batDauLuc).getTime();
        const tB = new Date(b.date || b.batDauLuc).getTime();
        return Math.abs(tA - today.getTime()) - Math.abs(tB - today.getTime());
      });
      const key = getRoundKey(matchesThisWeek[0].vong);
      if (key && rounds.includes(key)) return key;
    }

    // 3. Nearest upcoming matches (DANG_DIEN_RA or SAP_DIEN_RA)
    const upcomingMatches = matches.filter((m: any) => m.trangThai === 'DANG_DIEN_RA' || m.trangThai === 'SAP_DIEN_RA');
    if (upcomingMatches.length > 0) {
      upcomingMatches.sort((a: any, b: any) => {
        const tA = new Date(a.batDauLuc || a.date).getTime();
        const tB = new Date(b.batDauLuc || b.date).getTime();
        return tA - tB;
      });
      const key = getRoundKey(upcomingMatches[0].vong);
      if (key && rounds.includes(key)) return key;
    }

    // 4. Fallback to nearest past match
    const finishedMatches = matches.filter((m: any) => m.trangThai === 'KET_THUC');
    if (finishedMatches.length > 0) {
      finishedMatches.sort((a: any, b: any) => {
        const tA = new Date(a.batDauLuc || a.date).getTime();
        const tB = new Date(b.batDauLuc || b.date).getTime();
        return tB - tA;
      });
      const key = getRoundKey(finishedMatches[0].vong);
      if (key && rounds.includes(key)) return key;
    }

    return rounds[0];
  };

  // Automatically select the closest round on load or tournament change
  useEffect(() => {
    if (loading || liveMatches.length === 0 || uniqueRounds.length === 0) return;

    // Only set default once per tournament load
    const key = `has_set_default_round_${selectedTournament?.id}`;
    const hasSet = sessionStorage.getItem(key);
    
    const needsRefereeReset = refereeFilterVong === 'NONE' || !uniqueRounds.includes(refereeFilterVong);
    const needsScheduleReset = scheduleFilterVong === 'NONE' || !uniqueRounds.includes(scheduleFilterVong);

    if (!hasSet || needsRefereeReset || needsScheduleReset) {
      const closestRound = getClosestMatchweek(liveMatches, uniqueRounds);
      if (closestRound && closestRound !== 'NONE') {
        if (!hasSet || needsRefereeReset) {
          setRefereeFilterVong(closestRound);
        }
        if (!hasSet || needsScheduleReset) {
          setScheduleFilterVong(closestRound);
        }
        sessionStorage.setItem(key, 'true');
      }
    }
  }, [liveMatches, selectedTournament?.id, loading, uniqueRounds, refereeFilterVong, scheduleFilterVong]);

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
      
      if (vong !== refereeFilterVong) {
        return false;
      }
      
      if (!isKnockoutActive && refereeFilterBang !== 'all' && bang !== refereeFilterBang) {
        return false;
      }
      
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

  // Scheduler selectors and actions
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
      if (vong !== scheduleFilterVong) {
        return false;
      }
      return true;
    });

    return list.sort((a, b) => {
      const pA = getRoundPriority(parseVongDetails(a.vong).vong);
      const pB = getRoundPriority(parseVongDetails(b.vong).vong);
      if (pA !== pB) return pA - pB;
      
      const gA = parseVongDetails(a.vong).bang || '';
      const gB = parseVongDetails(b.vong).bang || '';
      if (gA !== gB) return gA.localeCompare(gB);
      
      const nameA = a.doiNha?.ten || '';
      const nameB = b.doiNha?.ten || '';
      if (!nameA || !nameB) {
        return (a.vong || '').localeCompare(b.vong || '');
      }
      return nameA.localeCompare(nameB);
    });
  })();

  const handleClearDraftSchedule = () => {
    showConfirm(
      "XÓA LỊCH THI ĐẤU",
      "🔄 Bạn có chắc muốn xóa lịch? Tất cả các trận đấu nháp hoặc chưa diễn ra của giải đấu hiện tại sẽ bị xóa.",
      async () => {
        try {
          showToast("🧹 Đang dọn dẹp lịch cũ...");
          const draftMatches = liveMatches.filter(m => m.trangThai === 'DRAFT' || m.trangThai === 'SAP_DIEN_RA');
          const matchIds = draftMatches.map(m => m.id);
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
          showToast('Đã xóa toàn bộ lịch nháp!');
        } catch (err: any) {
          showToast("❌ Lỗi khi xóa lịch: " + err.message);
        }
      }
    );
  };



  const handleInlineUpdateMatch = async (id: string, field: string, value: string) => {
    try {
      const matchToUpdate = liveMatches.find(m => m.id === id);
      if (!matchToUpdate) return;

      let updatePayload: any = {};
      if (field === 'ngay') {
        updatePayload.date = value;
      } else if (field === 'gio') {
        updatePayload.time = value;
      } else if (field === 'san') {
        updatePayload.san = value;
      } else if (field === 'tyNha') {
        updatePayload.tyNha = parseInt(value, 10) || 0;
      } else if (field === 'tyKhach') {
        updatePayload.tyKhach = parseInt(value, 10) || 0;
      }

      const updatedMatch = {
        ...matchToUpdate,
        ...updatePayload,
      };

      const { error } = await updateMatch(updatedMatch);
      if (!error) {
        setLiveMatches(prev => prev.map(m => m.id === id ? { ...m, ...updatePayload } : m));
        showToast("⚡ Đã cập nhật trực tiếp trận đấu!");
      } else {
        showToast(`❌ Lỗi cập nhật: ${error.message}`);
      }
    } catch (err: any) {
      showToast(`❌ Lỗi: ${err.message}`);
    }
  };

  const isMobile = useMediaQuery('(max-width: 768px)');

  if (loading) {
    return <GlobalSkeletonLoader />;
  }

  const data = {
    activeTab, mobileMenuOpen, runTour, runRefereeTour,
    liveMatches, teams, loading, selectedMatchId,
    activePlayerParams, pendingSubOut, toast,
    isSwitcherOpen, tournaments, selectedTournament, tournamentTemplates,
    isCreatingTournament, newTournamentData,
    editingTeam, viewingTeam, isAddingTeam, fetchingLogo,
    newTeamData, editingMatch, isAddingMatch, newMatchData,
    newPlayerName, newPlayerNumber, newPlayerPosition, maxTeams,
    standingsConfig, scheduleConfig, blackoutDates, newBlackoutDate,
    isSchedulerConfigOpen, schedulerConfig,
    scheduleFilterVong, refereeFilterVong, refereeFilterBang,
    customEvents, tournamentName, tournamentSeason, tournamentStartDate,
    tournamentVenueType, tournamentEndDate, tournamentMaxPlayers,
    starterCount, benchCount, isSelectingSubstitute, tournamentType,
    tournamentGroupLegs, tournamentLeagueRounds, confirmDialog,
    isBulkImportOpen, bulkImportProgress, selectedBulkFile, isBulkDragActive,
    bulkFileInputRef, sidebarItems,
    selectedMatch,
    uniqueRounds,
    uniqueGroups,
    isKnockoutActive,
    filteredAndSortedRefereeMatches,
    scheduleUniqueRounds,
    filteredAndSortedScheduleMatches
  };

  const actions = {
    setActiveTab, setMobileMenuOpen, setRunTour, setRunRefereeTour,
    setLiveMatches, setTeams, setLoading, setSelectedMatchId,
    setActivePlayerParams, setPendingSubOut, setToast,
    setIsSwitcherOpen, setTournaments, setSelectedTournament, setTournamentTemplates,
    setIsCreatingTournament, setNewTournamentData,
    setEditingTeam, setViewingTeam, setIsAddingTeam, setFetchingLogo,
    setNewTeamData, setEditingMatch, setIsAddingMatch, setNewMatchData,
    setNewPlayerName, setNewPlayerNumber, setNewPlayerPosition, setMaxTeams,
    setStandingsConfig, setScheduleConfig, saveBlackoutDates, setNewBlackoutDate,
    setIsSchedulerConfigOpen, setSchedulerConfig, updateSchedulerConfig,
    setScheduleFilterVong, setRefereeFilterVong, setRefereeFilterBang,
    setCustomEvents, setTournamentName, setTournamentSeason, setTournamentStartDate,
    setTournamentVenueType, setTournamentEndDate, setTournamentMaxPlayers,
    setStarterCount, setBenchCount, setIsSelectingSubstitute, setTournamentType,
    setTournamentGroupLegs, setTournamentLeagueRounds, showConfirm,
    setIsBulkImportOpen, setBulkImportProgress, setSelectedBulkFile, setIsBulkDragActive,
    handleAutoFetchLogo, handleAddTeam, confirmAddTeam, handleEditTeam, handleSaveTeam,
    handleAddPlayer, handleDeletePlayer, handleDeleteTeam, handleDeleteAllTeams,
    handleSaveTournamentConfig, handleDeleteTournament, handleAutoSchedule, handleEditMatch, handleSaveMatch,
    handleCreateMatch, handleDeleteMatch, formatMatchTime, getMatchHalfState,
    calculateCurrentRoster, fetchData, addCustomEvent, removeCustomEvent, updateCustomEvent,
    handleDownloadBulkTemplate, handleClearDraftSchedule, processBulkFile, handleImportBulkFile,
    handleCreateTournament,
    showToast,
    handleLogout,
    handleExecuteSubstitution,
    handleStartMatch,
    handleTemporaryPauseToggle,
    handlePauseMatch,
    handleResumeMatch,
    handleFinishMatch,
    handleResetMatch,
    handleDeleteEvent,
    handleActionSelect,
    handleInlineUpdateMatch,
    calculateMatchMinute
  };

  if (isMobile) {
    return <AdminMobileView data={data} actions={actions} />;
  }

  return <AdminDesktopView data={data} actions={actions} />;
}
