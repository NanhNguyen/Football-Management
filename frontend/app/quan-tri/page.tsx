'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './page.module.css';
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
  layDanhSachTournamentTemplates
} from '@/lib/api';

import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import GlobalSkeletonLoader from '@/components/GlobalSkeletonLoader';
import AdminOnboardingTour from '@/components/AdminOnboardingTour';
import RefereeGuideOverlay from '@/components/RefereeGuideOverlay';
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

  useEffect(() => {
    const savedTab = localStorage.getItem('adminActiveTab');
    if (savedTab) {
      setActiveTab(savedTab);
    }

    const hasSeenTour = localStorage.getItem('hasSeenAdminTour');
    if (!hasSeenTour) {
      setRunTour(true);
    }
  }, []);
  const [liveMatches, setLiveMatches] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);

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
    templateCode: 'LEAGUE'
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
      { dayOfWeek: 1, enabled: true },
      { dayOfWeek: 2, enabled: false },
      { dayOfWeek: 3, enabled: false },
      { dayOfWeek: 4, enabled: false },
      { dayOfWeek: 5, enabled: false },
      { dayOfWeek: 6, enabled: true },
      { dayOfWeek: 0, enabled: true },
    ],
    timeSlots: [
      { id: '1', startTime: '17:00', endTime: '18:30' },
      { id: '2', startTime: '19:00', endTime: '20:30' },
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
  const [scheduleFilterVong, setScheduleFilterVong] = useState<string>('all');

  // Referee filtering states
  const [refereeFilterVong, setRefereeFilterVong] = useState<string>('all');
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

  const fetchData = async (activeTourneyId?: string) => {
    setLoading(true);
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

      if (currentTourney) {
        localStorage.setItem('adminActiveTournament', currentTourney.id);
        setTournamentName(currentTourney.ten || '');
        setTournamentSeason(currentTourney.mua_giai || '');
        setTournamentStartDate(currentTourney.ngay_bat_dau || '');
        setTournamentVenueType(currentTourney.venue_type || 'CENTRALIZED');

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
            setCustomEvents(config.customEvents || []);
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

        const defaultSchedulerConfig = {
          startDate: currentTourney.ngay_bat_dau || '',
          endDate: '',
          matchDurationMinutes: 90,
          breakTimeMinutes: 15,
          playDays: [
            { dayOfWeek: 1, enabled: true },
            { dayOfWeek: 2, enabled: false },
            { dayOfWeek: 3, enabled: false },
            { dayOfWeek: 4, enabled: false },
            { dayOfWeek: 5, enabled: false },
            { dayOfWeek: 6, enabled: true },
            { dayOfWeek: 0, enabled: true },
          ],
          timeSlots: [
            { id: '1', startTime: '17:00', endTime: '18:30' },
            { id: '2', startTime: '19:00', endTime: '20:30' },
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
      setLoading(false);
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

  const handleSaveTournamentConfig = async () => {
    if (!selectedTournament) return;
    try {
      showToast("⏳ Đang lưu cấu hình giải đấu...");

      // Update core fields in Supabase
      const { error } = await supabase
        .from('giai_dau')
        .update({
          ten: tournamentName,
          mua_giai: tournamentSeason,
          ngay_bat_dau: tournamentStartDate,
          venue_type: tournamentVenueType
        })
        .eq('id', selectedTournament.id);

      if (error) throw error;

      // Save additional configuration to localStorage
      const config = {
        ngayKetThuc: tournamentEndDate,
        maxTeams: maxTeams || 16,
        maxPlayers: tournamentMaxPlayers || 20,
        starterCount: starterCount || 7,
        benchCount: benchCount || 7,
        theThuc: tournamentType,
        luotVongBang: tournamentGroupLegs,
        soVongLeague: tournamentLeagueRounds || 5,
        standingsConfig,
        customEvents
      };
      localStorage.setItem(`giai_dau_config_${selectedTournament.id}`, JSON.stringify(config));

      showToast("✨ Đã lưu cấu hình giải đấu thành công!");
      await fetchData(selectedTournament.id);
    } catch (err: any) {
      console.error(err);
      showToast(`❌ Lỗi khi lưu cấu hình: ${err.message}`);
    }
  };


  const handleAutoSchedule = async () => {
    if (teams.length < 2) {
      showToast("⚠️ Cần tối thiểu 2 đội bóng để sinh lịch!");
      return;
    }

    showConfirm(
      "XÁC NHẬN SINH LỊCH TỰ ĐỘNG",
      "🔄 Xếp lịch tự động sẽ XÓA TOÀN BỘ lịch thi đấu nháp của giải đấu hiện tại và ghi đè lịch mới. Bạn có chắc chắn muốn tiếp tục?",
      async () => {
        try {
          showToast("⏳ Đang xếp lịch thi đấu tự động (CSP)...");

          // Auto detect base start date if empty
          const baseStartDate = schedulerConfig.startDate || selectedTournament?.ngay_bat_dau || '2025-05-01';
          
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
            startDate: baseStartDate,
            endDate: schedulerConfig.endDate || '2025-12-31',
            timeSlots: timeSlotsWithEnd,
            blackoutDates: blackoutDates
          };

          const count = await runAutoSchedule(
            teams,
            selectedTournament,
            tournamentType,
            tournamentGroupLegs,
            tournamentLeagueRounds,
            payloadConfig,
            showToast
          );

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
      const customEvt = customEvents.find(e => e.id === subType);
      if (customEvt) {
        typeLabel = `${customEvt.name}${customEvt.points ? ` (+${customEvt.points})` : ''}`;
        eventType = `CUSTOM_${customEvt.id.toUpperCase()}`;
        increment = customEvt.points || 0;
      }
    } else if (type === 'card') {
      typeLabel = subType === 'yellow' ? 'Phạt thẻ vàng 🟨' : subType === 'red' ? 'Phạt thẻ đỏ 🟥' : 'Án phạt';
      eventType = subType === 'yellow' ? 'THE_VANG' : subType === 'red' ? 'THE_DO' : 'CARD';
    } else if (type === 'motm') {
      typeLabel = 'Xuất sắc nhất trận 🏅';
      eventType = 'MOTM';
    }

    // 1. Add Event to DB
    await addEvent({
      matchId,
      teamId,
      playerId: player.id,
      type: eventType,
      minute: selectedMatch.phut || 0,
      description: `${player.ten} (${typeLabel})`
    });

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
    showToast(`🔥 ${typeLabel} cho ${player.ten}!`);
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
          const customId = eventType.replace('CUSTOM_', '');
          const customEvt = customEvents.find((e: any) => e.id.toUpperCase() === customId.toUpperCase() || e.id === customId);
          if (customEvt) increment = customEvt.points || 0;
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
    if (str.includes('Bảng') && str.includes(' - ')) {
      const parts = str.split(' - ');
      const bang = parts[0].trim(); // e.g. "Bảng A"
      const vong = parts[1].trim(); // e.g. "Vòng 1"
      return { bang, vong, isKnockout: false };
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

  const isKnockoutActive = refereeFilterVong !== 'all' && (
    refereeFilterVong.toLowerCase().includes('1/8') ||
    refereeFilterVong.toLowerCase().includes('tứ kết') ||
    refereeFilterVong.toLowerCase().includes('bán kết') ||
    refereeFilterVong.toLowerCase().includes('hạng ba') ||
    refereeFilterVong.toLowerCase().includes('chung kết')
  );

  const filteredAndSortedRefereeMatches = (() => {
    let list = liveMatches.filter(m => {
      const { bang, vong } = parseVongDetails(m.vong);
      
      if (refereeFilterVong !== 'all' && vong !== refereeFilterVong) {
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
      if (scheduleFilterVong !== 'all' && vong !== scheduleFilterVong) {
        return false;
      }
      return true;
    });

    return list.sort((a, b) => {
      const pA = getRoundPriority(parseVongDetails(a.vong).vong);
      const pB = getRoundPriority(parseVongDetails(b.vong).vong);
      if (pA !== pB) return pA - pB;
      return a.id.localeCompare(b.id);
    });
  })();



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

  if (loading) {
    return <GlobalSkeletonLoader />;
  }

  return (
    <div className={styles.layout}>
      <AdminOnboardingTour run={runTour} setRun={setRunTour} />
      <RefereeGuideOverlay 
        isVisible={runRefereeTour} 
        onClose={() => {
          setRunRefereeTour(false);
          localStorage.setItem('hasSeenRefereeTour', 'true');
        }} 
      />
      {/* GLOBAL TOPBAR */}
      <header className={styles.globalTopbar}>
        <div className={styles.topbarLeft}>
          <button
            className={styles.mobileMenuBtn}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              {mobileMenuOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </>
              ) : (
                <>
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </>
              )}
            </svg>
          </button>
          <a href="/" className={styles.topbarLogo}>
            <img src="/logo-premium-transparent.png" alt="Logo" className={styles.topbarLogoImg} />
            <span className={styles.topbarLogoText}>Sparta</span>
          </a>
          <div className={styles.switcherContainer}>
            <div id="tour-tournament-switcher" className={styles.tournamentSwitcher} onClick={() => setIsSwitcherOpen(!isSwitcherOpen)}>
              🏆 <span className={styles.tournamentSwitcherText}>{selectedTournament?.ten || 'Chọn giải đấu...'}</span>
              <svg className={`${styles.switcherArrow} ${isSwitcherOpen ? styles.switcherArrowOpen : ''}`} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </div>
            {isSwitcherOpen && (
              <div className={styles.switcherDropdown}>
                {tournaments.map((t) => (
                  <div
                    key={t.id}
                    className={`${styles.switcherOption} ${selectedTournament?.id === t.id ? styles.switcherOptionActive : ''}`}
                    onClick={() => {
                      setSelectedTournament(t);
                      setIsSwitcherOpen(false);
                      fetchData(t.id);
                      showToast(`Đã chuyển sang giải đấu: ${t.ten}`);
                    }}
                  >
                    🏆 {t.ten}
                  </div>
                ))}
                <div className={styles.switcherDivider} />
                <div
                  className={styles.switcherCreateBtn}
                  onClick={() => {
                    setIsCreatingTournament(true);
                    setIsSwitcherOpen(false);
                  }}
                >
                  <span className={styles.switcherCreateIcon}>+</span> Tạo giải đấu mới
                </div>
              </div>
            )}
          </div>
        </div>
        <div className={styles.topbarRight}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', color: 'var(--color-text-muted)' }}>
            <button 
              id="tour-topbar-guide-btn" 
              onClick={() => {
                if (activeTab === 'referee' && selectedMatchId) {
                  setRunRefereeTour(true);
                } else {
                  setRunTour(true);
                }
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: 'var(--color-primary)', fontWeight: '600', cursor: 'pointer' }}
              title="Xem hướng dẫn"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
              <span>Hướng dẫn</span>
            </button>
            <svg style={{ cursor: 'pointer' }} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={handleLogout}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>AD</div>
              <span className={styles.adminNameText} style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>Admin</span>
            </div>
          </div>
        </div>
      </header>

      <div className={styles.bodyWrapper}>
        {/* Sidebar Overlay */}
        {mobileMenuOpen && (
          <div className={styles.sidebarOverlay} onClick={() => setMobileMenuOpen(false)} />
        )}

        {/* Sidebar */}
        <aside className={`${styles.sidebar} ${mobileMenuOpen ? styles.sidebarOpen : ''}`}>
          <nav className={styles.sidebarNav}>
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                id={`tour-sidebar-${item.id}`}
                className={`${styles.sidebarItem} ${activeTab === item.id ? styles.sidebarItemActive : ''}`}
                onClick={() => {
                  setActiveTab(item.id);
                  localStorage.setItem('adminActiveTab', item.id);
                  setMobileMenuOpen(false);
                }}
              >
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <div className={styles.sidebarFooter}>
            <a href="/" className={styles.secondaryMenuItem} onClick={() => setMobileMenuOpen(false)}>
              <span className={styles.secondaryMenuItemIcon}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
              </span>
              <span>Về Home</span>
            </a>

            <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className={`${styles.secondaryMenuItem} ${styles.logoutSecondaryItem}`}>
              <span className={styles.secondaryMenuItemIcon}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
              </span>
              <span>Đăng xuất</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className={styles.main}>

          {false && ( /* activeTab === 'tong-quan' */
            <div className={`${styles.content} animate-fade-in`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h2 className={styles.pageTitle}>Tổng quan Giải đấu</h2>
                  <p className={styles.pageDesc}>Dashboard theo dõi thông số giải đấu {selectedTournament?.ten || ''}</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '30px' }}>
                <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                  <p style={{ margin: '0 0 5px 0', fontSize: '13px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Tổng số trận</p>
                  <p style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: '#1e293b' }}>
                    {liveMatches.filter((m: any) => m.trangThai === 'KET_THUC').length} / {liveMatches.length} <span style={{ fontSize: '14px', fontWeight: 500, color: '#94a3b8' }}>trận</span>
                  </p>
                </div>
                <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                  <p style={{ margin: '0 0 5px 0', fontSize: '13px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Tổng bàn thắng</p>
                  <p style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: '#1e293b' }}>
                    {liveMatches.reduce((acc: number, m: any) => acc + (m.tyNha || 0) + (m.tyKhach || 0), 0)}
                  </p>
                </div>
                <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                  <p style={{ margin: '0 0 5px 0', fontSize: '13px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Tổng thẻ phạt</p>
                  <p style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: '#1e293b' }}>
                    {liveMatches.reduce((acc: number, m: any) => {
                      const events = m.suKien || [];
                      const yellows = events.filter((e: any) => e.loai === 'CARD_YELLOW' || e.loai === 'THE_VANG').length;
                      return acc + yellows;
                    }, 0)} <span style={{ fontSize: '14px', fontWeight: 500, color: '#eab308' }}>Vàng</span> / {liveMatches.reduce((acc: number, m: any) => {
                      const events = m.suKien || [];
                      const reds = events.filter((e: any) => e.loai === 'CARD_RED' || e.loai === 'THE_DO').length;
                      return acc + reds;
                    }, 0)} <span style={{ fontSize: '14px', fontWeight: 500, color: '#ef4444' }}>Đỏ</span>
                  </p>
                </div>
                <div style={{ background: '#fef2f2', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #fca5a5' }}>
                  <p style={{ margin: '0 0 5px 0', fontSize: '13px', color: '#ef4444', fontWeight: 600, textTransform: 'uppercase' }}>Tổng Siêu Chốt</p>
                  <p style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: '#ef4444' }}>
                    15 <span style={{ fontSize: '14px', fontWeight: 500 }}>🏠 Nhà</span>
                  </p>
                </div>
              </div>
              <div className={styles.configGrid} style={{ marginTop: '20px' }}>
                <div>
                  <label className={styles.inputLabel}>Số người đá chính</label>
                  <input
                    type="number"
                    className={styles.inputField}
                    value={starterCount}
                    onChange={(e) => setStarterCount(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className={styles.inputLabel}>Số người dự bị tối đa</label>
                  <input
                    type="number"
                    className={styles.inputField}
                    value={benchCount}
                    onChange={(e) => setBenchCount(Number(e.target.value))}
                  />
                </div>
              </div>

              <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>Tiến độ giải đấu</h3>
                <div style={{ width: '100%', height: '12px', background: '#f1f5f9', borderRadius: '6px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${liveMatches.length > 0 ? Math.round((liveMatches.filter((m: any) => m.trangThai === 'KET_THUC').length / liveMatches.length) * 100) : 0}%`,
                    height: '100%',
                    background: 'var(--color-primary)',
                    transition: 'width 0.5s ease'
                  }}></div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '13px', color: '#64748b', fontWeight: 500 }}>
                  <span>0%</span>
                  <span>{liveMatches.length > 0 ? Math.round((liveMatches.filter((m: any) => m.trangThai === 'KET_THUC').length / liveMatches.length) * 100) : 0}% Hoàn thành</span>
                  <span>100%</span>
                </div>
              </div>
            </div>
          )}

          {false && ( /* activeTab === 'bxh' */
            <div className={`${styles.content} animate-fade-in`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <div>
                  <h2 className={styles.pageTitle}>Cấu hình Bảng xếp hạng</h2>
                  <p className={styles.pageDesc}>Quản lý và điều chỉnh thứ hạng thủ công (nếu cần)</p>
                </div>
              </div>
              <div className={styles.configGrid} style={{ marginTop: '20px' }}>
                <div>
                  <label className={styles.inputLabel}>Số người đá chính</label>
                  <input
                    type="number"
                    className={styles.inputField}
                    value={starterCount}
                    onChange={(e) => setStarterCount(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className={styles.inputLabel}>Số người dự bị tối đa</label>
                  <input
                    type="number"
                    className={styles.inputField}
                    value={benchCount}
                    onChange={(e) => setBenchCount(Number(e.target.value))}
                  />
                </div>
              </div>

              <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <p style={{ margin: 0, fontSize: '13px', color: '#475569', fontStyle: 'italic' }}>
                    💡 Kéo thả để điều chỉnh thứ hạng thủ công trong trường hợp các đội bằng điểm/chỉ số phụ.
                  </p>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569', fontSize: '13px', textTransform: 'uppercase' }}>
                      <th style={{ padding: '12px 16px', width: '40px' }}></th>
                      <th style={{ padding: '12px 16px', width: '60px', textAlign: 'center' }}>Hạng</th>
                      <th style={{ padding: '12px 16px' }}>Đội bóng</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center' }}>Bảng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teams.map((t, idx) => (
                      <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9', cursor: 'grab' }}>
                        <td style={{ padding: '12px 16px', color: '#94a3b8', cursor: 'grab' }}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="12" r="1" /><circle cx="9" cy="5" r="1" /><circle cx="9" cy="19" r="1" /><circle cx="15" cy="12" r="1" /><circle cx="15" cy="5" r="1" /><circle cx="15" cy="19" r="1" /></svg>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700, color: '#1e293b' }}>{idx + 1}</td>
                        <td style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontSize: '20px', lineHeight: 1, display: 'flex' }}><TeamLogo logo={t.logo} /></span>
                          <span style={{ fontWeight: 600, color: '#1e293b' }}>{t.ten}</span>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <span style={{ display: 'inline-block', padding: '4px 8px', background: '#e2e8f0', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>{t.bang}</span>
                        </td>
                      </tr>
                    ))}
                    {teams.length === 0 && (
                      <tr>
                        <td colSpan={4} style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>Chưa có đội bóng nào</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'cai-dat' && (
            <SettingsTab
              styles={styles}
              tournamentName={tournamentName}
              setTournamentName={setTournamentName}
              tournamentSeason={tournamentSeason}
              setTournamentSeason={setTournamentSeason}
              tournamentStartDate={tournamentStartDate}
              setTournamentStartDate={setTournamentStartDate}
              tournamentEndDate={tournamentEndDate}
              setTournamentEndDate={setTournamentEndDate}
              maxTeams={maxTeams}
              setMaxTeams={setMaxTeams}
              tournamentMaxPlayers={tournamentMaxPlayers}
              setTournamentMaxPlayers={setTournamentMaxPlayers}
              tournamentType={tournamentType}
              setTournamentType={setTournamentType}
              tournamentVenueType={tournamentVenueType}
              setTournamentVenueType={setTournamentVenueType}
              tournamentGroupLegs={tournamentGroupLegs}
              setTournamentGroupLegs={setTournamentGroupLegs}
              tournamentLeagueRounds={tournamentLeagueRounds}
              setTournamentLeagueRounds={setTournamentLeagueRounds}
              standingsConfig={standingsConfig}
              setStandingsConfig={setStandingsConfig}
              customEvents={customEvents}
              addCustomEvent={addCustomEvent}
              updateCustomEvent={updateCustomEvent}
              removeCustomEvent={removeCustomEvent}
              handleSaveTournamentConfig={handleSaveTournamentConfig}
            />
          )}

          {activeTab === 'doi' && (
            viewingTeam ? (
              <TeamDetailView
                team={viewingTeam}
                styles={styles}
                onBack={() => setViewingTeam(null)}
                onEdit={() => {
                  const teamToEdit = viewingTeam;
                  setViewingTeam(null);
                  handleEditTeam(teamToEdit);
                }}
              />
            ) : (
              <TeamsTab
                styles={styles}
                setIsBulkImportOpen={setIsBulkImportOpen}
                handleAddTeam={handleAddTeam}
                teams={teams}
                setViewingTeam={setViewingTeam}
                handleEditTeam={handleEditTeam}
                handleDeleteTeam={handleDeleteTeam}
                handleDeleteAllTeams={handleDeleteAllTeams}
              />
            )
          )}

          {activeTab === 'lich' && (
            <SchedulerTab
              styles={styles}
              setIsSchedulerConfigOpen={setIsSchedulerConfigOpen}
              scheduleUniqueRounds={scheduleUniqueRounds}
              scheduleFilterVong={scheduleFilterVong}
              setScheduleFilterVong={setScheduleFilterVong}
              setIsAddingMatch={setIsAddingMatch}
              filteredAndSortedScheduleMatches={filteredAndSortedScheduleMatches}
              handleInlineUpdateMatch={handleInlineUpdateMatch}
              handleDeleteMatch={handleDeleteMatch}
              handleEditMatch={handleEditMatch}
              liveMatches={liveMatches}
            />
          )}

          {/* Modals are simplified versions for brevity in this response, but keep full logic from previous version */}
          {/* ... Modal implementations (isAddingTeam, editingTeam, editingMatch) using handleSaveTeam, handleSaveMatch ... */}
          {/* I will keep the modals logic consistent with the previous version but using the new save handlers */}

          {activeTab === 'referee' && (
            <RefereeTab
              styles={styles}
              selectedMatchId={selectedMatchId}
              setSelectedMatchId={setSelectedMatchId}
              refereeFilterVong={refereeFilterVong}
              setRefereeFilterVong={setRefereeFilterVong}
              refereeFilterBang={refereeFilterBang}
              setRefereeFilterBang={setRefereeFilterBang}
              uniqueRounds={uniqueRounds}
              uniqueGroups={uniqueGroups}
              isKnockoutActive={isKnockoutActive}
              filteredAndSortedRefereeMatches={filteredAndSortedRefereeMatches}
              calculateMatchMinute={calculateMatchMinute}
              formatMatchTime={formatMatchTime}
              selectedMatch={selectedMatch}
              starterCount={starterCount}
              calculateCurrentRoster={calculateCurrentRoster}
              pendingSubOut={pendingSubOut}
              setPendingSubOut={setPendingSubOut}
              handleExecuteSubstitution={handleExecuteSubstitution}
              setActivePlayerParams={setActivePlayerParams}
              activePlayerParams={activePlayerParams}
              customEvents={customEvents}
              handleStartMatch={handleStartMatch}
              handleTemporaryPauseToggle={handleTemporaryPauseToggle}
              handlePauseMatch={handlePauseMatch}
              handleResumeMatch={handleResumeMatch}
              handleFinishMatch={handleFinishMatch}
              handleResetMatch={handleResetMatch}
              handleDeleteEvent={handleDeleteEvent}
              isSelectingSubstitute={isSelectingSubstitute}
              setIsSelectingSubstitute={setIsSelectingSubstitute}
              handleActionSelect={handleActionSelect}
              getMatchHalfState={getMatchHalfState}
            />
          )}
        </main>

        {/* Toast */}
        {toast.visible && <div className={styles.toast}>{toast.message}</div>}

        {/* Adding Team Modal */}
        {isAddingTeam && (
          <div className={styles.overlay}>
            <div className={styles.modal}>
              <h3>🏆 KHỞI TẠO ĐỘI BÓNG</h3>
              <input
                type="text"
                placeholder="Tên đội bóng"
                className={styles.modalInput}
                value={newTeamData.ten}
                onChange={(e) => setNewTeamData({ ...newTeamData, ten: e.target.value })}
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input className={styles.modalInput} style={{ flex: 1, minWidth: 0 }} placeholder="URL Logo" value={newTeamData.logo} onChange={(e) => setNewTeamData({ ...newTeamData, logo: e.target.value })} />
                  <button onClick={() => handleAutoFetchLogo(newTeamData.ten, false)} disabled={fetchingLogo} style={{ padding: '0 12px', background: '#fee2e2', color: '#d71920', border: '1px solid #fecaca', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }} title="Tự động tìm kiếm logo thật">
                    {fetchingLogo ? '⌛' : '⚡ Tự tìm'}
                  </button>
                </div>
                <select className={styles.modalInput} value={newTeamData.bang} onChange={(e) => setNewTeamData({ ...newTeamData, bang: e.target.value })}>
                  <option value="A">Bảng A</option>
                  <option value="B">Bảng B</option>
                  <option value="C">Bảng C</option>
                  <option value="D">Bảng D</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button className={styles.finishBtn} onClick={confirmAddTeam}>KHỞI TẠO</button>
                <button className={styles.undoBtn} onClick={() => setIsAddingTeam(false)}>HỦY</button>
              </div>
            </div>
          </div>
        )}

        {/* Editing Team Modal */}
        {editingTeam && (
          <div className={styles.overlay}>
            <div className={styles.modal} style={{ maxWidth: '650px', width: '100%', padding: '30px' }}>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: 800, letterSpacing: '-0.02em', color: '#1e293b' }}>
                ⚙️ CHỈNH SỬA ĐỘI BÓNG
              </h3>
              <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#64748b' }}>
                Cập nhật tên đội bóng và quản lý danh sách thành viên đăng ký thi đấu.
              </p>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                  📛 Tên đội bóng
                </label>
                <input
                  type="text"
                  className={styles.modalInput}
                  style={{ background: '#f8fafc', border: '2px solid #e2e8f0', borderRadius: '12px', padding: '12px 16px', fontSize: '15px' }}
                  value={editingTeam.ten}
                  onChange={(e) => setEditingTeam({ ...editingTeam, ten: e.target.value })}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                  🖼️ Logo đội bóng
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    className={styles.modalInput}
                    style={{ flex: 1, background: '#f8fafc', border: '2px solid #e2e8f0', borderRadius: '12px', padding: '12px 16px', fontSize: '15px' }}
                    value={editingTeam.logo || ''}
                    onChange={(e) => setEditingTeam({ ...editingTeam, logo: e.target.value })}
                    placeholder="URL ảnh Logo đội bóng"
                  />
                  <button 
                    onClick={() => handleAutoFetchLogo(editingTeam.ten, true)} 
                    disabled={fetchingLogo} 
                    style={{ padding: '0 20px', background: '#fee2e2', color: '#d71920', border: '1px solid #fecaca', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >
                    {fetchingLogo ? 'Đang tìm...' : '⚡ Tìm Logo Tự Động'}
                  </button>
                </div>
              </div>

              <div style={{ marginTop: '20px' }}>
                <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                    ➕ Thêm cầu thủ mới
                  </label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      className={styles.modalInput}
                      style={{ flex: 3, padding: '10px 14px', borderRadius: '10px', background: '#fff', border: '1px solid #cbd5e1', fontSize: '14px' }}
                      placeholder="Tên cầu thủ"
                      value={newPlayerName}
                      onChange={e => setNewPlayerName(e.target.value)}
                    />
                    <input
                      className={styles.modalInput}
                      style={{ width: '65px', padding: '10px 10px', textAlign: 'center', borderRadius: '10px', background: '#fff', border: '1px solid #cbd5e1', fontSize: '14px' }}
                      placeholder="Số"
                      value={newPlayerNumber}
                      onChange={e => setNewPlayerNumber(e.target.value)}
                    />
                    <select
                      className={styles.modalInput}
                      style={{ width: '150px', padding: '10px 10px', borderRadius: '10px', background: '#fff', border: '1px solid #cbd5e1', fontSize: '13px', cursor: 'pointer' }}
                      value={newPlayerPosition}
                      onChange={e => setNewPlayerPosition(e.target.value)}
                    >
                      <option value="Thủ môn">Thủ môn</option>
                      <option value="Hậu vệ">Hậu vệ</option>
                      <option value="Tiền vệ">Tiền vệ</option>
                      <option value="Tiền đạo">Tiền đạo</option>
                      <option value="Dự bị - Thủ môn">Dự bị - Thủ môn</option>
                      <option value="Dự bị - Hậu vệ">Dự bị - Hậu vệ</option>
                      <option value="Dự bị - Tiền vệ">Dự bị - Tiền vệ</option>
                      <option value="Dự bị - Tiền đạo">Dự bị - Tiền đạo</option>
                    </select>
                    <button
                      className={styles.addBtn}
                      style={{ height: '42px', width: '42px', padding: 0, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}
                      onClick={handleAddPlayer}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    👥 Danh sách thành viên ({editingTeam.cauThu?.length || 0})
                  </label>
                </div>

                <div style={{ maxHeight: '240px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
                  {(!editingTeam.cauThu || editingTeam.cauThu.length === 0) ? (
                    <p style={{ color: '#94a3b8', fontSize: '13px', fontStyle: 'italic', textAlign: 'center', padding: '15px' }}>Chương có cầu thủ nào. Hãy thêm cầu thủ ở trên!</p>
                  ) : (
                    editingTeam.cauThu.map((p: any) => (
                      <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', transition: 'all 0.2s' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', background: p.viTri?.startsWith('Dự bị') ? '#f1f5f9' : '#fee2e2', color: p.viTri?.startsWith('Dự bị') ? '#475569' : '#ef4444', borderRadius: '50%', fontSize: '11px', fontWeight: 700 }}>
                            {p.soAo}
                          </span>
                          <span style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>{p.ten}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <select
                            value={p.viTri || 'Chưa rõ'}
                            onChange={(e) => {
                              const updatedPlayers = editingTeam.cauThu.map((player: any) =>
                                player.id === p.id ? { ...player, viTri: e.target.value } : player
                              );
                              setEditingTeam({ ...editingTeam, cauThu: updatedPlayers });
                            }}
                            style={{ padding: '4px 8px', fontSize: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', color: '#334155', fontWeight: 500, cursor: 'pointer' }}
                          >
                            <option value="Thủ môn">Thủ môn</option>
                            <option value="Hậu vệ">Hậu vệ</option>
                            <option value="Tiền vệ">Tiền vệ</option>
                            <option value="Tiền đạo">Tiền đạo</option>
                            <option value="Dự bị - Thủ môn">Dự bị - Thủ môn</option>
                            <option value="Dự bị - Hậu vệ">Dự bị - Hậu vệ</option>
                            <option value="Dự bị - Tiền vệ">Dự bị - Tiền vệ</option>
                            <option value="Dự bị - Tiền đạo">Dự bị - Tiền đạo</option>
                            <option value="Chưa rõ">Chưa rõ</option>
                          </select>
                          <button
                            onClick={() => handleDeletePlayer(p.id)}
                            style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', padding: '4px' }}
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div className={styles.modalFooter} style={{ marginTop: '24px', padding: 0, border: 'none', display: 'flex', gap: '10px' }}>
                <button className={`${styles.modalFooterBtn} ${styles.modalFooterPrimary}`} style={{ flex: 1, padding: '12px 20px', fontSize: '14px', borderRadius: '12px' }} onClick={handleSaveTeam}>LƯU THAY ĐỔI</button>
                <button className={`${styles.modalFooterBtn} ${styles.modalFooterSecondary}`} style={{ flex: 1, padding: '12px 20px', fontSize: '14px', borderRadius: '12px' }} onClick={() => setEditingTeam(null)}>HỦY</button>
              </div>
            </div>
          </div>
        )}

        {/* Create Match Modal */}
        {isAddingMatch && (
          <div className={styles.overlay}>
            <div className={styles.modal}>
              <h3>TẠO TRẬN ĐẤU MỚI</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '15px' }}>
                <select
                  className={styles.modalInput}
                  value={newMatchData.doiNhaId}
                  onChange={(e) => setNewMatchData({ ...newMatchData, doiNhaId: e.target.value })}
                >
                  <option value="">-- Chọn đội nhà --</option>
                  {teams.map((t: any) => (
                    <option key={t.id} value={t.id}>{t.ten}</option>
                  ))}
                </select>
                <select
                  className={styles.modalInput}
                  value={newMatchData.doiKhachId}
                  onChange={(e) => setNewMatchData({ ...newMatchData, doiKhachId: e.target.value })}
                >
                  <option value="">-- Chọn đội khách --</option>
                  {teams.map((t: any) => (
                    <option key={t.id} value={t.id}>{t.ten}</option>
                  ))}
                </select>
                <input className={styles.modalInput} placeholder="Vòng đấu (VD: Vòng bảng)" value={newMatchData.vong} onChange={(e) => setNewMatchData({ ...newMatchData, vong: e.target.value })} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <input className={styles.modalInput} type="date" value={newMatchData.date} onChange={(e) => setNewMatchData({ ...newMatchData, date: e.target.value })} />
                  <input className={styles.modalInput} type="time" value={newMatchData.time} onChange={(e) => setNewMatchData({ ...newMatchData, time: e.target.value })} />
                </div>
                <input className={styles.modalInput} placeholder="Sân thi đấu" value={newMatchData.san} onChange={(e) => setNewMatchData({ ...newMatchData, san: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button className={styles.finishBtn} onClick={handleCreateMatch}>TẠO TRẬN ĐẤU</button>
                <button className={styles.undoBtn} onClick={() => setIsAddingMatch(false)}>HỦY</button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Match Modal */}
        {editingMatch && (
          <div className={styles.overlay}>
            <div className={styles.modal}>
              <h3>CHỈNH SỬA LỊCH THI ĐẤU</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '15px' }}>
                <p style={{ color: '#64748b', fontSize: '13px' }}>
                  {(editingMatch.doiNha?.ten || 'Chờ xác định')} vs {(editingMatch.doiKhach?.ten || 'Chờ xác định')}
                </p>
                <input className={styles.modalInput} placeholder="Vòng đấu" value={editingMatch.vong || ''} onChange={(e) => setEditingMatch({ ...editingMatch, vong: e.target.value })} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <input className={styles.modalInput} type="date" value={editingMatch.date || ''} onChange={(e) => setEditingMatch({ ...editingMatch, date: e.target.value })} />
                  <input className={styles.modalInput} type="time" value={editingMatch.time || ''} onChange={(e) => setEditingMatch({ ...editingMatch, time: e.target.value })} />
                </div>
                <input className={styles.modalInput} placeholder="Sân thi đấu" value={editingMatch.san || ''} onChange={(e) => setEditingMatch({ ...editingMatch, san: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button className={styles.finishBtn} onClick={handleSaveMatch}>LƯU</button>
                <button className={styles.undoBtn} onClick={() => setEditingMatch(null)}>HỦY</button>
              </div>
            </div>
          </div>
        )}



        {/* Create Tournament Modal */}
        {isCreatingTournament && (
          <div className={styles.overlay}>
            <div className={styles.modal} style={{ maxWidth: '500px' }}>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: 800, letterSpacing: '-0.02em', color: '#1e293b' }}>
                🏆 TẠO GIẢI ĐẤU MỚI
              </h3>
              <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#64748b' }}>
                Nhập các thông tin cơ bản để khởi tạo một giải đấu mới trên nền tảng.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div className={styles.formGroup}>
                  <label className={styles.label} style={{ color: '#475569', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Tên giải đấu</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Thiên Khôi Cúp 2025"
                    className={styles.modalInput}
                    value={newTournamentData.ten}
                    onChange={(e) => setNewTournamentData({ ...newTournamentData, ten: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div className={styles.formGroup}>
                    <label className={styles.label} style={{ color: '#475569', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Mùa giải</label>
                    <input
                      type="text"
                      placeholder="Ví dụ: 2025"
                      className={styles.modalInput}
                      value={newTournamentData.muaGiai}
                      onChange={(e) => setNewTournamentData({ ...newTournamentData, muaGiai: e.target.value })}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label} style={{ color: '#475569', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Ngày dự kiến bắt đầu</label>
                    <input
                      type="date"
                      className={styles.modalInput}
                      value={newTournamentData.ngayBatDau}
                      onChange={(e) => setNewTournamentData({ ...newTournamentData, ngayBatDau: e.target.value })}
                    />
                  </div>
                  </div>

                <div className={styles.formGroup} style={{ marginTop: '0px' }}>
                  <label className={styles.label} style={{ color: '#475569', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Loại giải đấu (Template)</label>
                  <select
                    className={styles.modalInput}
                    value={newTournamentData.templateCode}
                    onChange={(e) => setNewTournamentData({ ...newTournamentData, templateCode: e.target.value })}
                  >
                    {tournamentTemplates.length > 0 ? (
                      tournamentTemplates.map(t => (
                        <option key={t.code} value={t.code}>{t.name}</option>
                      ))
                    ) : (
                      <>
                        <option value="LEAGUE">League (Đấu vòng tròn)</option>
                        <option value="TOURNAMENT">Tournament (Đấu cúp/Loại trực tiếp)</option>
                        <option value="MIXED">Tournament (Vòng bảng + Loại trực tiếp)</option>
                      </>
                    )}
                  </select>
                  {tournamentTemplates.length > 0 && (
                    <p style={{ fontSize: '12px', color: '#64748b', marginTop: '6px', fontStyle: 'italic' }}>
                      {tournamentTemplates.find(t => t.code === newTournamentData.templateCode)?.description}
                    </p>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '25px' }}>
                <button
                  className={styles.undoBtn}
                  style={{ flex: 1, margin: 0, background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1' }}
                  onClick={() => setIsCreatingTournament(false)}
                >
                  HỦY BỎ
                </button>
                <button
                  className={styles.finishBtn}
                  style={{ flex: 1, margin: 0, background: '#ef4444', color: '#fff', border: 'none' }}
                  onClick={async () => {
                    if (!newTournamentData.ten) {
                      showToast("⚠️ Vui lòng nhập tên giải đấu!");
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
                      if (selectedTemplate && selectedTemplate.defaultConfig) {
                        const config = selectedTemplate.defaultConfig;
                        
                        const generalConfig = {
                          theThuc: config.theThuc,
                          luotVongBang: config.luotVongBang,
                          soVongLeague: config.soVongLeague,
                          maxTeams: config.maxTeams,
                          maxPlayers: config.maxPlayers,
                          starterCount: config.starterCount,
                          benchCount: config.benchCount,
                          standingsConfig: config.standingsConfig
                        };
                        localStorage.setItem(`giai_dau_config_${newId}`, JSON.stringify(generalConfig));
                        
                        const schedulerConfigPayload = {
                          startDate: newTournamentData.ngayBatDau,
                          endDate: '',
                          matchDurationMinutes: config.matchDurationMinutes,
                          breakTimeMinutes: config.breakTimeMinutes,
                          playDays: [
                            { dayOfWeek: 1, enabled: true },
                            { dayOfWeek: 2, enabled: false },
                            { dayOfWeek: 3, enabled: false },
                            { dayOfWeek: 4, enabled: false },
                            { dayOfWeek: 5, enabled: false },
                            { dayOfWeek: 6, enabled: true },
                            { dayOfWeek: 0, enabled: true },
                          ],
                          timeSlots: [
                            { id: '1', startTime: '17:00', endTime: '18:30' },
                            { id: '2', startTime: '19:00', endTime: '20:30' },
                          ],
                          pitchesAvailable: config.pitchesAvailable,
                          minRestHours: config.minRestHours,
                          matchesPerWeek: config.matchesPerWeek
                        };
                        localStorage.setItem(`scheduler_config_${newId}`, JSON.stringify(schedulerConfigPayload));
                      }

                      setIsCreatingTournament(false);
                      showToast(`🏆 Đã khởi tạo thành công giải đấu: ${newTournamentData.ten}!`);
                      setNewTournamentData({ ten: '', muaGiai: '2025', ngayBatDau: '2025-05-01', venue_type: 'CENTRALIZED', templateCode: 'LEAGUE' });
                      await fetchData(newId);
                    } else {
                      showToast(`❌ Lỗi: ${error.message}`);
                    }
                  }}
                >
                  TẠO GIẢI ĐẤU
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Smart Scheduler Config Modal */}
        {isSchedulerConfigOpen && (
          <div className={styles.overlay}>
            <div className={styles.modal} style={{ maxWidth: '500px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: '25px 25px 20px 25px' }}>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: 800, letterSpacing: '-0.02em', color: '#1e293b' }}>
                ⚙️ CẤU HÌNH SMART SCHEDULER
              </h3>
              <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#64748b' }}>
                Thiết lập các thông số rải lịch và blackout dates để tự động tạo lịch đấu tối ưu.
              </p>

              {/* Scrollable Form Content */}
              <div style={{ flex: 1, overflowY: 'auto', paddingRight: '6px', display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '15px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className={styles.formGroup}>
                    <label className={styles.label} style={{ color: '#475569', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Ngày bắt đầu</label>
                    <input
                      type="date"
                      className={styles.modalInput}
                      value={schedulerConfig.startDate}
                      onChange={(e) => {
                        const newStart = e.target.value;
                        let newEnd = schedulerConfig.endDate;
                        if (!newEnd || newEnd < newStart) {
                          newEnd = newStart;
                        }
                        updateSchedulerConfig({ startDate: newStart, endDate: newEnd });
                      }}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label} style={{ color: '#475569', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Ngày kết thúc dự kiến</label>
                    <input
                      type="date"
                      className={styles.modalInput}
                      min={schedulerConfig.startDate}
                      value={schedulerConfig.endDate}
                      onChange={(e) => updateSchedulerConfig({ endDate: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className={styles.formGroup}>
                    <label className={styles.label} style={{ color: '#475569', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Thời lượng trận (phút)</label>
                    <input
                      type="number"
                      min="1"
                      className={styles.modalInput}
                      value={schedulerConfig.matchDurationMinutes}
                      onChange={(e) => updateSchedulerConfig({ matchDurationMinutes: Number(e.target.value) })}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label} style={{ color: '#475569', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Nghỉ giữa các trận (phút)</label>
                    <input
                      type="number"
                      min="0"
                      className={styles.modalInput}
                      disabled={tournamentVenueType === 'HOME_AWAY'}
                      value={tournamentVenueType === 'HOME_AWAY' ? 0 : schedulerConfig.breakTimeMinutes}
                      onChange={(e) => updateSchedulerConfig({ breakTimeMinutes: Number(e.target.value) })}
                    />
                    <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px', display: 'block' }}>
                      {tournamentVenueType === 'HOME_AWAY' 
                        ? 'Không áp dụng đối với thể thức Sân nhà - Sân khách.' 
                        : 'Thời gian giãn cách giữa 2 trận đấu liên tiếp trên cùng 1 sân.'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className={styles.formGroup}>
                    <label className={styles.label} style={{ color: '#475569', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Khoảng cách trận tối thiểu (giờ)</label>
                    <input
                      type="number"
                      min="0"
                      className={styles.modalInput}
                      value={schedulerConfig.minRestHours}
                      onChange={(e) => updateSchedulerConfig({ minRestHours: Number(e.target.value) })}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label} style={{ color: '#475569', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Số trận cùng giờ (Sân khả dụng)</label>
                    <input
                      type="number"
                      min="1"
                      className={styles.modalInput}
                      value={schedulerConfig.pitchesAvailable}
                      onChange={(e) => updateSchedulerConfig({ pitchesAvailable: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label} style={{ color: '#475569', fontWeight: 600, display: 'block', marginBottom: '8px' }}>Ngày thi đấu trong tuần</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                    {['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'].map((dayName, idx) => {
                      const dayOfWeek = idx; 
                      const isChecked = schedulerConfig.playDays.find(d => d.dayOfWeek === dayOfWeek)?.enabled || false;
                      return (
                        <button
                          key={dayName}
                          type="button"
                          onClick={() => {
                            const updatedPlayDays = schedulerConfig.playDays.map(d => 
                              d.dayOfWeek === dayOfWeek ? { ...d, enabled: !isChecked } : d
                            );
                            updateSchedulerConfig({ playDays: updatedPlayDays });
                          }}
                          style={{
                            padding: '8px 10px',
                            borderRadius: '8px',
                            border: '1px solid',
                            borderColor: isChecked ? 'var(--color-primary)' : '#cbd5e1',
                            background: isChecked ? 'var(--color-primary-light)' : '#fff',
                            color: isChecked ? 'var(--color-primary)' : '#475569',
                            fontWeight: 600,
                            fontSize: '12px',
                            cursor: 'pointer',
                            textAlign: 'center',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          {dayName}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label className={styles.label} style={{ color: '#475569', fontWeight: 600, margin: 0 }}>Cấu hình Khung giờ (Time Slots)</label>
                    <button
                      type="button"
                      onClick={() => {
                        const newId = `slot-${Date.now()}`;
                        updateSchedulerConfig({
                          timeSlots: [...schedulerConfig.timeSlots, { id: newId, startTime: '15:00', endTime: '16:30' }]
                        });
                      }}
                      style={{ padding: '4px 8px', background: 'var(--color-primary)', color: '#fff', borderRadius: '4px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                    >
                      + Thêm khung giờ
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: '#f8fafc', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                    {schedulerConfig.timeSlots.length === 0 ? (
                      <span style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>Chưa cấu hình khung giờ nào.</span>
                    ) : (
                      schedulerConfig.timeSlots.map((slot, sIdx) => (
                        <div key={slot.id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontSize: '12px', color: '#64748b', minWidth: '40px' }}>Ca {sIdx + 1}:</span>
                          <input
                            type="time"
                            className={styles.modalInput}
                            style={{ margin: 0, padding: '4px 8px', width: '150px' }}
                            value={slot.startTime}
                            onChange={(e) => {
                              const updatedSlots = schedulerConfig.timeSlots.map(s => 
                                s.id === slot.id ? { ...s, startTime: e.target.value } : s
                              );
                              updateSchedulerConfig({ timeSlots: updatedSlots });
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              updateSchedulerConfig({
                                timeSlots: schedulerConfig.timeSlots.filter(s => s.id !== slot.id)
                              });
                            }}
                            style={{ color: '#ef4444', background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', padding: '0 4px', display: 'flex', alignItems: 'center' }}
                          >
                            ×
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {tournamentVenueType === 'HOME_AWAY' && (
                  <div style={{ padding: '10px 14px', background: 'var(--color-surface-hover)', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '13px', color: 'var(--color-primary)', fontWeight: 500 }}>
                    🏠 Thể thức Sân nhà - Sân khách: Các trận đấu sẽ được xếp tự động tại sân nhà của Đội Nhà (Đội 1).
                  </div>
                )}

                <div className={styles.formGroup}>
                  <label className={styles.label} style={{ color: '#475569', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Blackout Dates (Ngày nghỉ)</label>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <input
                      type="date"
                      className={styles.modalInput}
                      style={{ flex: 1, margin: 0 }}
                      value={newBlackoutDate}
                      onChange={(e) => setNewBlackoutDate(e.target.value)}
                    />
                    <button
                      className={styles.addBtn}
                      style={{ height: '42px', padding: '0 16px', margin: 0, fontSize: '14px', whiteSpace: 'nowrap' }}
                      onClick={() => {
                        if (!newBlackoutDate) return;
                        if (blackoutDates.includes(newBlackoutDate)) {
                          showToast("⚠️ Ngày nghỉ này đã được cấu hình!");
                          return;
                        }
                        saveBlackoutDates([...blackoutDates, newBlackoutDate].sort());
                        setNewBlackoutDate('');
                        showToast(`Đã thêm ngày nghỉ: ${newBlackoutDate}`);
                      }}
                    >
                      + Thêm
                    </button>
                  </div>
                  {blackoutDates.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '120px', overflowY: 'auto', background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      {blackoutDates.map(date => (
                        <div key={date} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: '#334155', fontWeight: 500 }}>
                          <span>📅 {date}</span>
                          <button
                            style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '16px', padding: '0 4px' }}
                            onClick={() => {
                              saveBlackoutDates(blackoutDates.filter(d => d !== date));
                              showToast(`Đã xóa ngày nghỉ: ${date}`);
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontStyle: 'italic', margin: '4px 0' }}>Chưa cấu hình ngày nghỉ.</p>
                  )}
                  <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '6px' }}>Khi sinh lịch, các vòng thi đấu rơi vào ngày này sẽ tự động lùi 7 ngày.</p>
                </div>
              </div>

              {/* Sticky Action Footer */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px', borderTop: '1px solid #e2e8f0', paddingTop: '15px' }}>
                <button
                  className={styles.finishBtn}
                  style={{ width: '100%', margin: 0, justifyContent: 'center' }}
                  onClick={async () => {
                    await handleAutoSchedule();
                    setIsSchedulerConfigOpen(false);
                  }}
                >
                  ✨ SINH LỊCH ĐỀ XUẤT
                </button>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    className={styles.undoBtn}
                    style={{ flex: 1, margin: 0, background: '#fee2e2', color: '#ef4444', borderColor: '#fca5a5' }}
                    onClick={() => {
                      showConfirm(
                        "TẠO LẠI LỊCH THI ĐẤU",
                        "🔄 Bạn có chắc muốn đập đi tạo lại lịch? Tất cả các trận đấu nháp của giải đấu hiện tại sẽ bị xóa.",
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
                            setIsSchedulerConfigOpen(false);
                          } catch (err: any) {
                            showToast("❌ Lỗi khi xóa lịch: " + err.message);
                          }
                        }
                      );
                    }}
                  >
                    🗑️ TẠO LẠI LỊCH
                  </button>
                  <button
                    className={styles.undoBtn}
                    style={{ flex: 1, margin: 0 }}
                    onClick={() => setIsSchedulerConfigOpen(false)}
                  >
                    ĐÓNG
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Custom Confirmation Modal */}
        {confirmDialog && confirmDialog.isOpen && (
          <div className={styles.overlay} style={{ zIndex: 9999 }}>
            <div className={styles.modal} style={{ maxWidth: '440px', textAlign: 'center', padding: '30px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>❓</div>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '20px', fontWeight: 800, letterSpacing: '-0.02em', color: '#1e293b' }}>
                {confirmDialog.title}
              </h3>
              <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#64748b', lineHeight: 1.5 }}>
                {confirmDialog.message}
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  className={styles.finishBtn}
                  style={{ flex: 1, margin: 0, justifyContent: 'center' }}
                  onClick={confirmDialog.onConfirm}
                >
                  Xác nhận
                </button>
                <button
                  className={styles.undoBtn}
                  style={{ flex: 1, margin: 0 }}
                  onClick={confirmDialog.onCancel}
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Import Teams from Excel Modal */}
        {/* Bulk Import from Excel Modal */}
        {isBulkImportOpen && (
          <div className={styles.overlay} style={{ zIndex: 9998 }}>
            <div className={styles.modal} style={{ maxWidth: '650px', width: '100%', padding: '30px', position: 'relative' }}>
              {/* Close Button */}
              {!bulkImportProgress && (
                <button
                  onClick={() => { setIsBulkImportOpen(false); handleClearBulkImport(); }}
                  style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', fontSize: '20px', color: '#94a3b8', cursor: 'pointer', transition: 'color 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#1e293b'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
                >
                  ✕
                </button>
              )}

              <h3 style={{ margin: '0 0 6px 0', fontSize: '20px', fontWeight: 800, letterSpacing: '-0.02em', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>📥</span> NHẬP DỮ LIỆU TỔNG HỢP (EXCEL)
              </h3>
              <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#64748b' }}>
                Tải lên một file Excel duy nhất chứa cả thông tin <strong>Đội Bóng</strong> và <strong>Cầu Thủ</strong> để thiết lập nhanh chóng.
              </p>

              {/* Guide and Download template */}
              {!bulkImportProgress && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', background: '#f8fafc', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap', fontSize: '13px', color: '#475569' }}>
                    <span style={{ fontWeight: 600 }}>Lưu ý:</span>
                    <span>Sử dụng cấu trúc nhiều sheet (Đội Bóng, Cầu Thủ) như trong file mẫu.</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadBulkTemplate}
                    style={{ background: 'none', border: 'none', color: '#D71920', textDecoration: 'underline', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', padding: 0, transition: 'color 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#ae0011'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#D71920'}
                  >
                    ⬇️ Tải file mẫu (.xlsx)
                  </button>
                </div>
              )}

              {/* Progress Bar Section */}
              {bulkImportProgress ? (
                <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: bulkImportProgress.step === 'error' ? '#ef4444' : '#1e293b' }}>
                      {bulkImportProgress.message}
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#3b82f6' }}>
                      {bulkImportProgress.percent}%
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div 
                      style={{ 
                        width: `${bulkImportProgress.percent}%`, 
                        height: '100%', 
                        background: bulkImportProgress.step === 'error' ? '#ef4444' : (bulkImportProgress.step === 'done' ? '#10b981' : '#3b82f6'),
                        transition: 'width 0.3s ease-out, background-color 0.3s ease'
                      }} 
                    />
                  </div>
                  {bulkImportProgress.step === 'error' && (
                    <button 
                      onClick={handleClearBulkImport}
                      style={{ marginTop: '16px', padding: '8px 16px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
                    >
                      Thử lại
                    </button>
                  )}
                </div>
              ) : (
                /* Upload Dropzone / File Selected State */
                selectedBulkFile === null ? (
                  <div
                    onClick={() => bulkFileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setIsBulkDragActive(true); }}
                    onDragLeave={() => setIsBulkDragActive(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsBulkDragActive(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) {
                        const evt = { target: { files: [file] } } as any;
                        handleImportBulkFile(evt);
                      }
                    }}
                    style={{
                      background: isBulkDragActive ? 'rgba(59, 130, 246, 0.04)' : '#fff',
                      border: isBulkDragActive ? '2px dashed #3b82f6' : '2px dashed #cbd5e1',
                      borderRadius: '12px',
                      padding: '40px 24px',
                      textAlign: 'center',
                      marginBottom: '20px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease-in-out',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <input
                      ref={bulkFileInputRef}
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleImportBulkFile}
                      style={{ display: 'none' }}
                    />
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={isBulkDragActive ? '#3b82f6' : '#10b981'}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{
                        width: '56px',
                        height: '56px',
                        marginBottom: '16px',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
                      <path d="M12 12v9" />
                      <path d="m16 16-4-4-4 4" />
                    </svg>
                    <p style={{ fontSize: '16px', color: '#1e293b', fontWeight: 600, margin: '0 0 6px 0' }}>
                      Kéo thả file Excel vào đây để tự động import
                    </p>
                    <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                      Hoặc bấm để chọn file từ máy tính <span style={{ fontWeight: 600, color: '#475569' }}>(Hỗ trợ .xls, .xlsx)</span>
                    </p>
                  </div>
                ) : null
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
