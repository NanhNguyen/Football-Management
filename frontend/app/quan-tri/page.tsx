'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './page.module.css';
import {
  layDanhSachDoi,
  layDanhSachTranDau,
  createTeam,
  updateTeam,
  deleteTeam,
  updateMatch,
  addEvent,
  deleteEvent,
  updatePlayerGoals,
  createMatch,
  deleteMatch,
  calculateMatchMinute,
  layDanhSachGiaiDau,
  createTournament
} from '@/lib/api';

import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import GlobalSkeletonLoader from '@/components/GlobalSkeletonLoader';
import AdminOnboardingTour from '@/components/AdminOnboardingTour';
import RefereeGuideOverlay from '@/components/RefereeGuideOverlay';

import * as XLSX from 'xlsx';
import TeamLogo from '@/components/TeamLogo';

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

  // New Tournament creation modal states
  const [isCreatingTournament, setIsCreatingTournament] = useState(false);
  const [newTournamentData, setNewTournamentData] = useState({
    ten: '',
    muaGiai: '2024',
    ngayBatDau: '2024-05-01'
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
  const [newBlackoutDate, setNewBlackoutDate] = useState('');
  const [isSchedulerConfigOpen, setIsSchedulerConfigOpen] = useState(false);

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

  // Excel Import states
  const [isImportTeamsOpen, setIsImportTeamsOpen] = useState(false);
  const [isImportPlayersOpen, setIsImportPlayersOpen] = useState(false);
  const [importTeamsPreview, setImportTeamsPreview] = useState<any[]>([]);
  const [importPlayersPreview, setImportPlayersPreview] = useState<any[]>([]);
  const [importPlayersTargetTeam, setImportPlayersTargetTeam] = useState<any>(null);
  const [importLoading, setImportLoading] = useState(false);

  // Custom enhanced states for modern Excel Import Modals (Drag-and-Drop / File details / Refs)
  const [selectedTeamsFile, setSelectedTeamsFile] = useState<File | null>(null);
  const [isTeamsDragActive, setIsTeamsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedPlayersFile, setSelectedPlayersFile] = useState<File | null>(null);
  const [isPlayersDragActive, setIsPlayersDragActive] = useState(false);
  const playerFileInputRef = useRef<HTMLInputElement>(null);

  // Excel Import Template Downloads
  const downloadTeamsTemplate = () => {
    try {
      const templateData = [
        { 'Tên đội': 'Thiên Khôi FC', 'Logo': '⚽', 'Bảng': 'A' },
        { 'Tên đội': 'Hà Nội FC', 'Logo': '🏆', 'Bảng': 'B' },
        { 'Tên đội': 'Hải Phòng FC', 'Logo': '⚓', 'Bảng': 'C' }
      ];
      const worksheet = XLSX.utils.json_to_sheet(templateData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Danh sach Doi Bong");
      XLSX.writeFile(workbook, "TKScore_Template_DoiBong.xlsx");
      showToast("📥 Đã tải file mẫu TKScore_Template_DoiBong.xlsx!");
    } catch (err: any) {
      showToast(`❌ Lỗi tải template: ${err.message}`);
    }
  };

  const downloadPlayersTemplate = () => {
    try {
      const templateData = [
        { 'Tên cầu thủ': 'Nguyễn Văn A', 'Số áo': 10, 'Vị trí': 'Tiền đạo' },
        { 'Tên cầu thủ': 'Trần Thị B', 'Số áo': 1, 'Vị trí': 'Thủ môn' },
        { 'Tên cầu thủ': 'Phạm Văn C', 'Số áo': 4, 'Vị trí': 'Hậu vệ' }
      ];
      const worksheet = XLSX.utils.json_to_sheet(templateData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Danh sach Cau Thu");
      XLSX.writeFile(workbook, "TKScore_Template_CauThu.xlsx");
      showToast("📥 Đã tải file mẫu TKScore_Template_CauThu.xlsx!");
    } catch (err: any) {
      showToast(`❌ Lỗi tải template: ${err.message}`);
    }
  };

  // Excel Parsing Processors
  const processTeamsFile = (file: File) => {
    setSelectedTeamsFile(file);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json: any[] = XLSX.utils.sheet_to_json(sheet);
        // Map columns: Tên đội | Logo | Bảng
        const parsed = json.map((row, i) => ({
          id: `doi-import-${Date.now()}-${i}`,
          ten: row['Tên đội'] || row['ten'] || row['Team'] || row['name'] || '',
          logo: row['Logo'] || row['logo'] || '⚽',
          bang: row['Bảng'] || row['bang'] || row['Group'] || 'A',
          vietTat: (row['Tên đội'] || row['ten'] || row['Team'] || row['name'] || '').substring(0, 3).toUpperCase(),
          cauThu: []
        })).filter(t => t.ten.trim() !== '');

        if (parsed.length === 0) {
          showToast("⚠️ File Excel không có dữ liệu hợp lệ hoặc thiếu cột 'Tên đội'!");
          setSelectedTeamsFile(null);
          setImportTeamsPreview([]);
        } else {
          setImportTeamsPreview(parsed);
          showToast(`📋 Đã đọc ${parsed.length} đội bóng từ file!`);
        }
      } catch (err: any) {
        showToast(`❌ Lỗi đọc file: ${err.message}`);
        setSelectedTeamsFile(null);
        setImportTeamsPreview([]);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const processPlayersFile = (file: File) => {
    setSelectedPlayersFile(file);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json: any[] = XLSX.utils.sheet_to_json(sheet);
        // Map columns: Tên cầu thủ | Số áo | Vị trí
        const parsed = json.map((row, i) => ({
          id: `ct-import-${Date.now()}-${i}`,
          ten: row['Tên cầu thủ'] || row['Tên'] || row['ten'] || row['Player'] || row['name'] || '',
          soAo: Number(row['Số áo'] || row['soAo'] || row['Number'] || row['number'] || i + 1),
          viTri: row['Vị trí'] || row['viTri'] || row['Position'] || row['position'] || 'Chưa rõ',
          banThang: 0
        })).filter(p => p.ten.trim() !== '');

        if (parsed.length === 0) {
          showToast("⚠️ File Excel không có dữ liệu hợp lệ hoặc thiếu cột 'Tên cầu thủ'!");
          setSelectedPlayersFile(null);
          setImportPlayersPreview([]);
        } else {
          setImportPlayersPreview(parsed);
          showToast(`📋 Đã đọc ${parsed.length} cầu thủ từ file!`);
        }
      } catch (err: any) {
        showToast(`❌ Lỗi đọc file: ${err.message}`);
        setSelectedPlayersFile(null);
        setImportPlayersPreview([]);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // File selection handlers
  const handleImportTeamsFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processTeamsFile(file);
    }
  };

  const handleImportPlayersFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processPlayersFile(file);
    }
  };

  // Reset/Clear helpers
  const handleClearTeamsImport = () => {
    setSelectedTeamsFile(null);
    setImportTeamsPreview([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClearPlayersImport = () => {
    setSelectedPlayersFile(null);
    setImportPlayersPreview([]);
    if (playerFileInputRef.current) {
      playerFileInputRef.current.value = '';
    }
  };

  // Confirm Import handlers to DB
  const handleConfirmImportTeams = async () => {
    if (importTeamsPreview.length === 0) return;
    setImportLoading(true);
    try {
      let successCount = 0;
      const totalRequested = teams.length + importTeamsPreview.length;
      
      // Tự động mở rộng maxTeams nếu import số lượng lớn
      if (totalRequested > maxTeams) {
        setMaxTeams(totalRequested);
      }

      for (const team of importTeamsPreview) {
        const { error } = await createTeam({
          ...team,
          giaiDauId: selectedTournament?.id
        });
        if (!error) successCount++;
      }
      await fetchData(selectedTournament?.id);
      setIsImportTeamsOpen(false);
      handleClearTeamsImport();
      showToast(`✅ Đã import thành công ${successCount} đội bóng từ file Excel!`);
    } catch (err: any) {
      showToast(`❌ Lỗi import: ${err.message}`);
    } finally {
      setImportLoading(false);
    }
  };

  const handleConfirmImportPlayers = async () => {
    if (importPlayersPreview.length === 0 || !importPlayersTargetTeam) return;
    setImportLoading(true);
    try {
      const existingPlayers = importPlayersTargetTeam.cauThu || [];
      const mergedPlayers = [...existingPlayers, ...importPlayersPreview];
      const updatedTeam = { ...importPlayersTargetTeam, cauThu: mergedPlayers };
      const { error } = await updateTeam(updatedTeam);
      if (!error) {
        await fetchData(selectedTournament?.id);
        setIsImportPlayersOpen(false);
        handleClearPlayersImport();
        setImportPlayersTargetTeam(null);
        showToast(`✅ Đã import ${importPlayersPreview.length} cầu thủ vào đội ${importPlayersTargetTeam.ten}!`);
      } else {
        showToast(`❌ Lỗi: ${error.message}`);
      }
    } catch (err: any) {
      showToast(`❌ Lỗi import: ${err.message}`);
    } finally {
      setImportLoading(false);
    }
  };


  // Fetch data on mount & check auth
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
      } else {
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
          ngay_bat_dau: tournamentStartDate
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
          showToast("⏳ Đang chuẩn bị cơ sở dữ liệu lịch đấu...");

          // 1. Delete draft matches of the active tournament from Supabase to "start fresh"
          const { data: allCurrentMatches, error: fetchErr } = await supabase
            .from('tran_dau')
            .select('id')
            .eq('giai_dau_id', selectedTournament?.id)
            .eq('trang_thai', 'SAP_DIEN_RA');
          if (fetchErr) throw fetchErr;

          if (allCurrentMatches && allCurrentMatches.length > 0) {
            for (const m of allCurrentMatches) {
              await supabase.from('su_kien').delete().eq('tran_dau_id', m.id);
              await supabase.from('tran_dau').delete().eq('id', m.id);
            }
          }

          showToast("⚡ Đang sinh lịch đấu tự động...");

          // Helper function: Circle Method Round-Robin
          const generateRoundRobin = (groupTeams: any[], legs: number, maxRoundsOverride?: number) => {
            const list = [...groupTeams];
            const N = list.length;
            if (N < 2) return [];

            const hasBye = N % 2 !== 0;
            if (hasBye) {
              list.push({ id: 'BYE', ten: 'Nghỉ' });
            }

            const numTeams = list.length;
            const singleRoundsCount = numTeams - 1;
            const matchesPerRound = numTeams / 2;

            const singleLegRounds: { home: any; away: any }[][] = [];

            for (let r = 0; r < singleRoundsCount; r++) {
              const roundMatches: { home: any; away: any }[] = [];
              for (let i = 0; i < matchesPerRound; i++) {
                const homeIdx = (r + i) % (numTeams - 1);
                let awayIdx = (numTeams - 1 - i + r) % (numTeams - 1);

                if (i === 0) {
                  awayIdx = numTeams - 1;
                }

                const home = list[homeIdx];
                const away = list[awayIdx];

                if (home.id !== 'BYE' && away.id !== 'BYE') {
                  if (r % 2 === 0) {
                    roundMatches.push({ home, away });
                  } else {
                    roundMatches.push({ home: away, away: home });
                  }
                }
              }
              singleLegRounds.push(roundMatches);
            }

            let allRounds: { home: any; away: any; isReturnLeg: boolean }[][] = [];

            for (let leg = 0; leg < legs; leg++) {
              for (let r = 0; r < singleRoundsCount; r++) {
                const roundMatches = singleLegRounds[r].map(m => {
                  if (leg % 2 === 1) {
                    return { home: m.away, away: m.home, isReturnLeg: true };
                  }
                  return { home: m.home, away: m.away, isReturnLeg: false };
                });
                allRounds.push(roundMatches);
              }
            }

            if (maxRoundsOverride && maxRoundsOverride > 0) {
              allRounds = allRounds.slice(0, maxRoundsOverride);
            }

            return allRounds;
          };

          const formatDateString = (dateObj: Date) => {
            const y = dateObj.getFullYear();
            const m = String(dateObj.getMonth() + 1).padStart(2, '0');
            const d = String(dateObj.getDate()).padStart(2, '0');
            return `${y}-${m}-${d}`;
          };

          const startBaseStr = tournamentStartDate || selectedTournament?.ngay_bat_dau || '2024-05-01';
          let baseDate = new Date(startBaseStr);
          let accumulatedDelayDays = 0;
          const blackoutSet = new Set(blackoutDates);
          const matchesToCreate: any[] = [];
          let totalRounds = 0;

          if (tournamentType === 'tournament') {
            // 2A. Tournament Format: Group-based scheduling
            const groups: { [key: string]: any[] } = {};
            teams.forEach(t => {
              const gName = t.bang || 'A';
              if (!groups[gName]) groups[gName] = [];
              groups[gName].push(t);
            });

            const groupRounds: { [gName: string]: any[][] } = {};
            let maxRounds = 0;
            Object.keys(groups).forEach(gName => {
              const rounds = generateRoundRobin(groups[gName], tournamentGroupLegs || 1);
              groupRounds[gName] = rounds;
              if (rounds.length > maxRounds) {
                maxRounds = rounds.length;
              }
            });

            totalRounds = maxRounds;

            // Distribute round matches week-by-week (round-by-round) across all groups
            for (let r = 0; r < maxRounds; r++) {
              const roundMatches: any[] = [];
              Object.keys(groupRounds).forEach(gName => {
                const rounds = groupRounds[gName];
                if (rounds[r]) {
                  rounds[r].forEach(m => {
                    roundMatches.push({ ...m, bang: gName });
                  });
                }
              });

              if (roundMatches.length === 0) continue;

              const roundBaseDate = new Date(baseDate.getTime() + r * 7 * 24 * 60 * 60 * 1000);
              let roundDate = new Date(roundBaseDate.getTime() + accumulatedDelayDays * 24 * 60 * 60 * 1000);

              while (blackoutSet.has(formatDateString(roundDate))) {
                roundDate = new Date(roundDate.getTime() + 7 * 24 * 60 * 60 * 1000);
                accumulatedDelayDays += 7;
              }

              const limitPerWeek = Math.max(1, scheduleConfig.matchesPerWeek || 8);
              roundMatches.forEach((m, idx) => {
                const offsetDays = Math.floor(idx / limitPerWeek);
                const matchDateObj = new Date(roundDate.getTime() + offsetDays * 24 * 60 * 60 * 1000);
                const dateStr = formatDateString(matchDateObj);

                const timeSlots = ["15:00", "17:00", "19:00"];
                const timeStr = timeSlots[idx % timeSlots.length];
                const sanStr = `Sân TK ${(idx % 2) + 1}`;

                matchesToCreate.push({
                  doiNhaId: m.home.id,
                  doiKhachId: m.away.id,
                  vong: `Bảng ${m.bang} - Vòng ${r + 1}`,
                  date: dateStr,
                  time: timeStr,
                  san: sanStr,
                  giaiDauId: selectedTournament?.id
                });
              });
            }

            // 2C. Automatically append Knockout Stages for Tournament Type
            let lastGroupMatchDate = new Date(baseDate);
            matchesToCreate.forEach(m => {
              const d = new Date(m.date);
              if (d > lastGroupMatchDate) {
                lastGroupMatchDate = d;
              }
            });

            // Start knockout stages 7 days after the last group match
            let knockoutBaseDate = new Date(lastGroupMatchDate.getTime() + 7 * 24 * 60 * 60 * 1000);

            const stagesToProcess = [
              { key: 'Vòng 1/8', matchKeys: Array.from({ length: 8 }, (_, idx) => `Trận ${idx + 1}`), condition: teams.length >= 16 },
              { key: 'Tứ kết', matchKeys: Array.from({ length: 4 }, (_, idx) => `Trận ${idx + 1}`), condition: teams.length >= 8 },
              { key: 'Bán kết', matchKeys: Array.from({ length: 2 }, (_, idx) => `Trận ${idx + 1}`), condition: teams.length >= 4 },
              { key: 'Chung kết & Tranh hạng ba', matchKeys: ['Tranh hạng ba', 'Chung kết'], condition: teams.length >= 2 }
            ];

            let stageIndex = 0;
            stagesToProcess.forEach(stage => {
              if (!stage.condition) return;

              // Calculate date for this stage (one stage per week)
              let currentStageDate = new Date(knockoutBaseDate.getTime() + stageIndex * 7 * 24 * 60 * 60 * 1000);

              // Skip blackout dates
              while (blackoutSet.has(formatDateString(currentStageDate))) {
                knockoutBaseDate = new Date(knockoutBaseDate.getTime() + 7 * 24 * 60 * 60 * 1000);
                currentStageDate = new Date(knockoutBaseDate.getTime() + stageIndex * 7 * 24 * 60 * 60 * 1000);
              }

              const dateStr = formatDateString(currentStageDate);
              const limitPerWeek = Math.max(1, scheduleConfig.matchesPerWeek || 8);

              stage.matchKeys.forEach((label, idx) => {
                const offsetDays = Math.floor(idx / limitPerWeek);
                const matchDateObj = new Date(currentStageDate.getTime() + offsetDays * 24 * 60 * 60 * 1000);
                const matchDateStr = formatDateString(matchDateObj);

                const timeSlots = ["15:00", "17:00", "19:00"];
                const timeStr = timeSlots[idx % timeSlots.length];
                const sanStr = `Sân TK ${(idx % 2) + 1}`;

                let roundLabel = '';
                if (stage.key === 'Chung kết & Tranh hạng ba') {
                  roundLabel = label;
                } else {
                  roundLabel = `${stage.key} - ${label}`;
                }

                matchesToCreate.push({
                  doiNhaId: null,
                  doiKhachId: null,
                  vong: roundLabel,
                  date: matchDateStr,
                  time: timeStr,
                  san: sanStr,
                  giaiDauId: selectedTournament?.id
                });
              });

              stageIndex++;
            });

            totalRounds += stageIndex;
          } else {
            // 2B. League Format: Single large round-robin table capped by round count
            const roundsRequired = Math.max(1, tournamentLeagueRounds || 5);
            const singleLegRoundsCount = teams.length % 2 === 0 ? teams.length - 1 : teams.length;
            const legsToGenerate = Math.ceil(roundsRequired / (singleLegRoundsCount || 1)) || 1;

            const leagueRounds = generateRoundRobin(teams, legsToGenerate, roundsRequired);
            totalRounds = leagueRounds.length;

            for (let r = 0; r < leagueRounds.length; r++) {
              const roundMatches = leagueRounds[r] || [];
              if (roundMatches.length === 0) continue;

              const roundBaseDate = new Date(baseDate.getTime() + r * 7 * 24 * 60 * 60 * 1000);
              let roundDate = new Date(roundBaseDate.getTime() + accumulatedDelayDays * 24 * 60 * 60 * 1000);

              while (blackoutSet.has(formatDateString(roundDate))) {
                roundDate = new Date(roundDate.getTime() + 7 * 24 * 60 * 60 * 1000);
                accumulatedDelayDays += 7;
              }

              const limitPerWeek = Math.max(1, scheduleConfig.matchesPerWeek || 8);
              roundMatches.forEach((m, idx) => {
                const offsetDays = Math.floor(idx / limitPerWeek);
                const matchDateObj = new Date(roundDate.getTime() + offsetDays * 24 * 60 * 60 * 1000);
                const dateStr = formatDateString(matchDateObj);

                const timeSlots = ["15:00", "17:00", "19:00"];
                const timeStr = timeSlots[idx % timeSlots.length];
                const sanStr = `Sân TK ${(idx % 2) + 1}`;

                matchesToCreate.push({
                  doiNhaId: m.home.id,
                  doiKhachId: m.away.id,
                  vong: `Vòng ${r + 1}`,
                  date: dateStr,
                  time: timeStr,
                  san: sanStr,
                  giaiDauId: selectedTournament?.id
                });
              });
            }
          }

          // 3. Batch Create matches in database
          for (const m of matchesToCreate) {
            const { error: createErr } = await createMatch(m);
            if (createErr) throw createErr;
          }

          await fetchData(selectedTournament?.id);
          showToast(`✨ Đã tự động xếp ${matchesToCreate.length} trận đấu cho ${totalRounds} vòng đấu thành công!`);
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

  const handleActionSelect = async (type: string, subType?: string) => {
    if (!activePlayerParams || !selectedMatch) return;
    const { teamId, matchId, player } = activePlayerParams;
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
            <span className={styles.topbarLogoText}>TKScore</span>
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
            <div className={`${styles.content} animate-fade-in`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                  <h2 className={styles.pageTitle}>Cài đặt giải đấu</h2>
                  <p className={styles.pageDesc}>Cấu hình thông tin cơ bản và giới hạn của giải đấu</p>
                </div>
                <button className={styles.addBtn} onClick={handleSaveTournamentConfig}>Lưu cấu hình</button>
              </div>

              <div className={styles.formCard}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Thông tin cơ bản</h3>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Tên giải đấu</label>
                    <input
                      type="text"
                      className={styles.input}
                      value={tournamentName}
                      onChange={(e) => setTournamentName(e.target.value)}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Mùa giải</label>
                    <input
                      type="text"
                      className={styles.input}
                      value={tournamentSeason}
                      onChange={(e) => setTournamentSeason(e.target.value)}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Ngày khai mạc</label>
                    <input
                      type="date"
                      className={styles.input}
                      value={tournamentStartDate}
                      onChange={(e) => setTournamentStartDate(e.target.value)}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Ngày bế mạc</label>
                    <input
                      type="date"
                      className={styles.input}
                      value={tournamentEndDate}
                      onChange={(e) => setTournamentEndDate(e.target.value)}
                    />
                  </div>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid var(--color-border-light)', margin: '24px 0' }} />

                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Giới hạn đội bóng & Đăng ký</h3>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Số đội tối đa</label>
                    <input
                      type="number"
                      className={styles.input}
                      value={maxTeams === 0 ? '' : maxTeams}
                      onChange={(e) => setMaxTeams(e.target.value === '' ? 0 : Number(e.target.value))}
                    />
                    <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>Nếu thêm vượt quá số này trong Quản lý Đội, hệ thống sẽ chặn lại.</p>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Số cầu thủ tối đa / đội</label>
                    <input
                      type="number"
                      className={styles.input}
                      value={tournamentMaxPlayers === 0 ? '' : tournamentMaxPlayers}
                      onChange={(e) => setTournamentMaxPlayers(e.target.value === '' ? 0 : Number(e.target.value))}
                    />
                  </div>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid var(--color-border-light)', margin: '24px 0' }} />

                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Thể thức & Sắp lịch thi đấu</h3>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Thể thức thi đấu</label>
                    <select
                      className={styles.input}
                      value={tournamentType}
                      onChange={(e) => setTournamentType(e.target.value as 'tournament' | 'league')}
                      style={{ width: '100%', height: '42px', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    >
                      <option value="tournament">Đấu cúp chia bảng (Tournament)</option>
                      <option value="league">Đấu vòng tròn toàn giải (League)</option>
                    </select>
                  </div>

                  {tournamentType === 'tournament' ? (
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Số lượt đá vòng bảng</label>
                      <select
                        className={styles.input}
                        value={tournamentGroupLegs}
                        onChange={(e) => setTournamentGroupLegs(Number(e.target.value) as 1 | 2)}
                        style={{ width: '100%', height: '42px', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      >
                        <option value={1}>1 lượt (Đá vòng tròn 1 lượt)</option>
                        <option value={2}>2 lượt (Lượt đi - Lượt về)</option>
                      </select>
                    </div>
                  ) : (
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Số vòng đấu thi đấu</label>
                      <input
                        type="number"
                        className={styles.input}
                        value={tournamentLeagueRounds === 0 ? '' : tournamentLeagueRounds}
                        onChange={(e) => setTournamentLeagueRounds(e.target.value === '' ? 0 : Number(e.target.value))}
                        min={1}
                      />
                    </div>
                  )}
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid var(--color-border-light)', margin: '24px 0' }} />

                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Cấu hình hiển thị Bảng xếp hạng</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={standingsConfig.phongDo} onChange={(e) => setStandingsConfig({ ...standingsConfig, phongDo: e.target.checked })} style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)' }} />
                    <span style={{ fontSize: '15px', fontWeight: 600 }}>Hiển thị cột Phong độ (5 trận gần nhất)</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={standingsConfig.thePhat} onChange={(e) => setStandingsConfig({ ...standingsConfig, thePhat: e.target.checked })} style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)' }} />
                    <span style={{ fontSize: '15px', fontWeight: 600 }}>Hiển thị cột Thẻ phạt (Fair-play)</span>
                  </label>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid var(--color-border-light)', margin: '24px 0' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Sự kiện & Luật Bổ Sung (Custom Events)</h3>
                  <button className={styles.editBtnCompact} style={{ padding: '6px 12px' }} onClick={addCustomEvent}>+ Thêm sự kiện</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {customEvents.map((evt, idx) => (
                    <div key={evt.id} style={{ display: 'flex', gap: '12px', alignItems: 'center', background: 'var(--color-surface-hover)', padding: '12px', borderRadius: '8px' }}>
                      <input 
                        type="text" 
                        value={evt.icon} 
                        onChange={(e) => updateCustomEvent(idx, 'icon', e.target.value)}
                        style={{ width: '40px', textAlign: 'center', fontSize: '20px', padding: '8px', borderRadius: '6px', border: '1px solid var(--color-border-light)' }}
                        placeholder="⚽"
                      />
                      <input 
                        type="text" 
                        value={evt.name} 
                        onChange={(e) => updateCustomEvent(idx, 'name', e.target.value)}
                        style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--color-border-light)' }}
                        placeholder="Tên sự kiện (VD: Siêu Chốt)"
                      />
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600 }}>Cộng:</span>
                        <input 
                          type="number" 
                          value={evt.points} 
                          onChange={(e) => updateCustomEvent(idx, 'points', Number(e.target.value))}
                          style={{ width: '60px', padding: '8px', borderRadius: '6px', border: '1px solid var(--color-border-light)' }}
                        />
                        <span style={{ fontSize: '13px', fontWeight: 600 }}>Điểm BXH</span>
                      </div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', marginLeft: '12px' }}>
                        <input 
                          type="checkbox" 
                          checked={evt.isIndividual} 
                          onChange={(e) => updateCustomEvent(idx, 'isIndividual', e.target.checked)}
                          style={{ accentColor: 'var(--color-primary)' }}
                        />
                        <span style={{ fontSize: '13px' }}>Tính cá nhân</span>
                      </label>
                      <button 
                        onClick={() => removeCustomEvent(idx)}
                        style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontSize: '18px', padding: '4px 8px', marginLeft: 'auto' }}
                        title="Xóa sự kiện"
                      >×</button>
                    </div>
                  ))}
                  {customEvents.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '20px', color: 'var(--color-text-muted)', fontSize: '13px', fontStyle: 'italic', border: '1px dashed var(--color-border-light)', borderRadius: '8px' }}>
                      Giải đấu đang sử dụng các luật mặc định (Bàn thắng, Thẻ phạt).<br/>Bấm "+ Thêm sự kiện" để định nghĩa các luật đặc thù.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'doi' && (
            <div className={`${styles.content} animate-fade-in`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 className={styles.pageTitle}>Quản lý đội bóng</h2>
                  <p className={styles.pageDesc}>Danh sách các đội tham gia Thiên Khôi Cúp Siêu Chốt</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className={styles.editBtnCompact} style={{ padding: '8px 14px', height: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => { setImportTeamsPreview([]); setIsImportTeamsOpen(true); }}>Thêm đội từ file Excel</button>
                  <button className={styles.addBtn} onClick={handleAddTeam}>+ Thêm đội mới</button>
                </div>
              </div>

              <table className={styles.adminTable}>
                <thead>
                  <tr>
                    <th>Đội bóng</th>
                    <th>Bảng</th>
                    <th>Số cầu thủ</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {teams.map(doi => (
                    <tr key={doi.id}>
                      <td>
                        <div className={styles.teamRow} onClick={() => setViewingTeam(doi)}>
                          <div className={styles.teamLogoMini}><TeamLogo logo={doi.logo} /></div>
                          <span style={{ fontWeight: 600 }}>{doi.ten}</span>
                        </div>
                      </td>
                      <td><span className={styles.statusBadge} style={{ background: '#f1f5f9' }}>Bảng {doi.bang}</span></td>
                      <td>{doi.cauThu?.length || 0} cầu thủ</td>
                      <td><span className={`${styles.statusBadge} ${styles.badgeSuccess}`}>Đã đăng ký</span></td>
                      <td>
                        <div className={styles.actionBtnGroup}>
                          <button className={styles.editBtnCompact} onClick={() => handleEditTeam(doi)}>Sửa</button>
                          <button className={styles.deleteBtnCompact} onClick={() => handleDeleteTeam(doi.id)}>Xóa</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'lich' && (
            <div className={`${styles.content} animate-fade-in`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                  <h2 className={styles.pageTitle}>Smart Scheduler</h2>
                  <p className={styles.pageDesc}>Trung tâm điều khiển lịch thông minh tự động</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button className={styles.editBtnCompact} style={{ padding: '8px 16px', height: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => setIsSchedulerConfigOpen(true)}>⚙️ Cấu hình & Sinh lịch</button>
                  <button className={styles.addBtn} onClick={() => showToast("Đã phê duyệt toàn bộ Lịch!")}>Phê duyệt toàn bộ Lịch</button>
                </div>
              </div>

              <div style={{ width: '100%' }}>
                {/* Khu vực Danh sách Lịch */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Danh sách Lịch đề xuất</h3>
                    <button className={styles.editBtnCompact} onClick={() => setIsAddingMatch(true)}>+ Thêm trận thủ công</button>
                  </div>

                  <table className={styles.adminTable}>
                    <thead>
                      <tr>
                        <th>Thời gian</th>
                        <th>Vòng</th>
                        <th>Trận đấu</th>
                        <th>Sân</th>
                        <th>Trạng thái</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {liveMatches.length === 0 ? (
                        <tr><td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--color-text-muted)' }}>Chưa có lịch thi đấu. Hãy cấu hình và bấm Sinh lịch đề xuất.</td></tr>
                      ) : liveMatches.map(m => (
                        <tr key={m.id}>
                          <td>
                            <div style={{ fontWeight: 600 }}>{m.time}</div>
                            <div style={{ fontSize: '11px', color: '#94a3b8' }}>{m.date}</div>
                          </td>
                          <td>{m.vong}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span>{m.doiNha?.ten || '???'}</span>
                              <span style={{ color: '#cbd5e1' }}>vs</span>
                              <span>{m.doiKhach?.ten || '???'}</span>
                            </div>
                          </td>
                          <td>{m.san}</td>
                          <td>
                            <span className={`${styles.statusBadge}`} style={{ background: '#fef3c7', color: '#d97706', border: '1px solid #fde68a' }}>Draft</span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button className={styles.editBtnCompact} style={{ padding: '6px' }} onClick={() => handleEditMatch(m)}>✏️</button>
                              <button className={styles.deleteBtnCompact} style={{ padding: '6px' }} onClick={() => handleDeleteMatch(m.id)}>❌</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Modals are simplified versions for brevity in this response, but keep full logic from previous version */}
          {/* ... Modal implementations (isAddingTeam, editingTeam, editingMatch) using handleSaveTeam, handleSaveMatch ... */}
          {/* I will keep the modals logic consistent with the previous version but using the new save handlers */}

          {activeTab === 'referee' && (
            <div className={`${styles.refereeConsoleWrapper} animate-fade-in`}>
              {!selectedMatchId ? (
                <div className={styles.content}>
                  <h2 className={styles.pageTitle}>Trung tâm Điều khiển</h2>
                  <p className={styles.pageDesc}>Chọn một trận đấu để bắt đầu điều khiển và cập nhật tỉ số</p>

                  {/* Referee Filter Bar */}
                  <div className={styles.refereeFilterBar}>
                    <div className={styles.refereeFilterItem}>
                      <label className={styles.refereeFilterLabel}>Vòng đấu</label>
                      <select 
                        className={styles.refereeFilterSelect}
                        value={refereeFilterVong}
                        onChange={(e) => {
                          setRefereeFilterVong(e.target.value);
                          setRefereeFilterBang('all'); // Reset group filter when round changes
                        }}
                      >
                        <option value="all">Tất cả các vòng</option>
                        {uniqueRounds.map(r => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>

                    {!isKnockoutActive && uniqueGroups.length > 0 && (
                      <div className={styles.refereeFilterItem}>
                        <label className={styles.refereeFilterLabel}>Bảng đấu</label>
                        <select 
                          className={styles.refereeFilterSelect}
                          value={refereeFilterBang}
                          onChange={(e) => setRefereeFilterBang(e.target.value)}
                        >
                          <option value="all">Tất cả các bảng</option>
                          {uniqueGroups.map(g => (
                            <option key={g} value={g}>{g}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <div className={styles.adminMatchList}>
                    {filteredAndSortedRefereeMatches.length > 0 ? (
                      filteredAndSortedRefereeMatches.map(m => (
                        <div 
                          key={m.id} 
                          className={`${styles.adminMatchItem} ${m.trangThai === 'DANG_DIEN_RA' ? styles.adminMatchItemLive : ''}`} 
                          onClick={() => setSelectedMatchId(m.id)}
                        >
                          <div className={styles.matchListInfo}>
                            <span style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 700, width: '80px' }}>{m.vong}</span>
                            <div className={styles.listTeam}>
                              <span style={{ display: 'flex' }}><TeamLogo logo={m.doiNha?.logo} /></span>
                              <span style={{ fontWeight: 700 }}>{m.doiNha?.ten || 'Chờ xác định'}</span>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', fontWeight: 800, fontSize: '18px', width: '60px', justifyContent: 'center' }}>
                              <span>{m.tyNha}</span>
                              <span>-</span>
                              <span>{m.tyKhach}</span>
                            </div>
                            <div className={styles.listTeam}>
                              <span style={{ display: 'flex' }}><TeamLogo logo={m.doiKhach?.logo} /></span>
                              <span style={{ fontWeight: 700 }}>{m.doiKhach?.ten || 'Chờ xác định'}</span>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <span className={`
                            ${styles.listStatus} 
                            ${m.trangThai === 'DANG_DIEN_RA' ? styles.statusLive : ''}
                            ${m.trangThai === 'KET_THUC' ? styles.statusFinished : ''}
                          `}>
                              {m.trangThai === 'DANG_DIEN_RA' ? (m.dangTamDung ? `TẠM DỪNG - ${calculateMatchMinute(m)}'` : `LIVE - ${calculateMatchMinute(m)}'`) :
                                m.trangThai === 'KET_THUC' ? 'KẾT THÚC' : 'CHƯA ĐÁ'}
                            </span>
                            <span style={{ color: '#cbd5e1' }}>➜</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className={styles.consoleEmptyRoster} style={{ padding: '40px', background: '#f8fafc', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                        Không tìm thấy trận đấu nào thỏa mãn bộ lọc.
                      </div>
                    )}
                  </div>
                </div>
              ) : selectedMatch && (
                <div className={styles.liveConsole}>
                  {/* TOP BAR */}
                  <div className={styles.consoleTopBar}>
                    <button className={styles.consoleBackBtn} onClick={() => setSelectedMatchId(null)}>
                      ← Danh sách
                    </button>
                    <div className={styles.consoleMatchMeta}>
                      <span className={styles.consoleVong}>{selectedMatch.vong}</span>
                      {selectedMatch.trangThai === 'DANG_DIEN_RA' && (
                        <div className={styles.consoleLiveBadge}>
                          <span className={selectedMatch.dangTamDung ? '' : styles.consolePulseDot} />
                          {selectedMatch.dangTamDung ? 'TM DUNG' : 'LIVE'} {calculateMatchMinute(selectedMatch)}&apos;
                        </div>
                      )}
                      {selectedMatch.trangThai === 'SAP_DIEN_RA' && <span className={styles.consolePendingBadge}>CHUA BAT DAU</span>}
                      {selectedMatch.trangThai === 'KET_THUC' && <span className={styles.consoleFinishedBadge}>KET THUC</span>}
                    </div>
                    <div id="tour-referee-top-actions" className={styles.consoleTopActions}>
                      {(selectedMatch.trangThai === 'KET_THUC' || selectedMatch.trangThai === 'DANG_DIEN_RA') && (
                        <button className={styles.consoleResetBtn} onClick={() => handleResetMatch(selectedMatch.id)}>Reset</button>
                      )}
                    </div>
                  </div>

                  {/* 3-PANEL GRID */}
                  <div className={styles.consoleGrid}>

                    {/* LEFT — Doi nha */}
                    <div id="tour-referee-team-panel" className={styles.consoleTeamPanel}>
                      <div className={styles.consoleTeamHeader}>
                        <span className={styles.consoleTeamEmoji}><TeamLogo logo={selectedMatch.doiNha?.logo} /></span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className={styles.consoleTeamName}>{selectedMatch.doiNha?.ten || 'Chờ xác định'}</div>
                          <div className={styles.consoleTeamLabel} style={{ color: '#f87171' }}>ĐỘI NHÀ</div>
                        </div>
                      </div>
                      <div className={styles.consoleRosterGrid}>
                        {(!selectedMatch.doiNha?.cauThu || selectedMatch.doiNha.cauThu.length === 0) ? (
                          <p className={styles.consoleEmptyRoster}>Chua co cau thu nao</p>
                        ) : (
                          (() => {
                            const { starters, bench } = calculateCurrentRoster(selectedMatch.doiNha, selectedMatch.suKien, starterCount);
                            const renderPlayer = (player: any, isBench: boolean) => {
                          const yellowCount = selectedMatch.suKien?.filter((ev: any) => ev.loai === 'THE_VANG' && ev.cauThuId === player.id).length || 0;
                          const hasRedCard = selectedMatch.suKien?.some((ev: any) => ev.loai === 'THE_DO' && ev.cauThuId === player.id) || yellowCount >= 2;
                          const goalCount = selectedMatch.suKien?.filter((ev: any) => ev.loai.startsWith('GOAL_') && ev.loai !== 'GOAL_OG' && ev.cauThuId === player.id).length || 0;
                          const customEventCounts = customEvents.map(evt => ({
                            ...evt,
                            count: selectedMatch.suKien?.filter((ev: any) => ev.loai === `CUSTOM_${evt.id.toUpperCase()}` && ev.cauThuId === player.id).length || 0
                          }));
                          const isMotm = selectedMatch.suKien?.some((ev: any) => ev.loai === 'MOTM' && ev.cauThuId === player.id);
                          const isClickable = !hasRedCard && (selectedMatch.trangThai === 'DANG_DIEN_RA' || selectedMatch.trangThai === 'KET_THUC');
                          
                          const isPendingSub = pendingSubOut?.player?.id === player.id;
                          const isOtherPending = pendingSubOut && pendingSubOut.teamId === selectedMatch.doiNha.id && !isPendingSub;
                          const dimClass = isOtherPending && !isBench ? styles.consolePlayerDimmed : '';
                          const highlightClass = pendingSubOut && isBench && pendingSubOut.teamId === selectedMatch.doiNha.id ? styles.consolePlayerHighlighted : '';
                          const benchClass = isBench ? styles.consolePlayerBench : '';
                          
                          const handleClick = () => {
                            if (!isClickable) return;
                            if (pendingSubOut) {
                              if (pendingSubOut.teamId !== selectedMatch.doiNha.id) return;
                              if (isPendingSub) {
                                setPendingSubOut(null); // Cancel
                              } else if (isBench) {
                                handleExecuteSubstitution(player, pendingSubOut.player, pendingSubOut.teamId);
                              }
                            } else {
                              setActivePlayerParams({ matchId: selectedMatch.id, teamId: selectedMatch.doiNha.id, player, isBench });
                            }
                          };

                          return (
                            <button
                              key={player.id}
                              className={`${styles.consolePlayerBtn} ${benchClass} ${hasRedCard ? styles.consolePlayerRedCarded : ''} ${isClickable ? styles.consolePlayerActive : ''} ${dimClass} ${highlightClass}`}
                              onClick={handleClick}
                              disabled={!isClickable && !isPendingSub}
                            >
                              <div className={styles.consolePlayerNo}>{player.soAo}</div>
                              <div className={styles.consolePlayerName}>{player.ten || 'Chưa đặt tên'}</div>
                              
                              {/* Action Badges */}
                              <div className={styles.consolePlayerBadges}>
                                {goalCount > 0 && <span>{goalCount > 1 ? goalCount : ''}&#x26BD;</span>}
                                {customEventCounts.map((cEvt: any) => cEvt.count > 0 ? <span key={cEvt.id} title={cEvt.name}>{cEvt.count > 1 ? cEvt.count : ''}{cEvt.icon}</span> : null)}
                                {yellowCount > 0 && <span>Y{yellowCount > 1 ? yellowCount : ''}</span>}
                                {hasRedCard && <span>R</span>}
                                {isMotm && <span>MVP</span>}
                              </div>
                            </button>
                          );
                        };
                        return (
                          <>
                            <div className={styles.rosterHeader}>🏟️ ĐỘI HÌNH CHÍNH</div>
                            {starters.map(p => renderPlayer(p, false))}
                            
                            <div className={styles.rosterHeader} style={{marginTop: '20px', color: '#64748b', borderColor: '#cbd5e1'}}>🔄 CẦU THỦ DỰ BỊ</div>
                            <div className={styles.benchListView}>
                              {bench.length === 0 ? (
                                <p style={{ fontSize: '12px', color: '#94a3b8', padding: '8px 12px', margin: 0, gridColumn: '1 / -1' }}>Không có cầu thủ dự bị</p>
                              ) : (
                                bench.map((player: any) => {
                                  const yellowCount = selectedMatch.suKien?.filter((ev: any) => ev.loai === 'THE_VANG' && ev.cauThuId === player.id).length || 0;
                                  const hasRedCard = selectedMatch.suKien?.some((ev: any) => ev.loai === 'THE_DO' && ev.cauThuId === player.id) || yellowCount >= 2;
                                  const goalCount = selectedMatch.suKien?.filter((ev: any) => ev.loai.startsWith('GOAL_') && ev.loai !== 'GOAL_OG' && ev.cauThuId === player.id).length || 0;
                                  const customEventCounts = customEvents.map(evt => ({
                                    ...evt,
                                    count: selectedMatch.suKien?.filter((ev: any) => ev.loai === `CUSTOM_${evt.id.toUpperCase()}` && ev.cauThuId === player.id).length || 0
                                  }));
                                  const isMotm = selectedMatch.suKien?.some((ev: any) => ev.loai === 'MOTM' && ev.cauThuId === player.id);

                                  return (
                                    <div key={player.id} className={styles.benchListRow}>
                                      <span className={styles.benchListNo}>#{player.soAo}</span>
                                      <span className={styles.benchListName}>{player.ten}</span>
                                      
                                      <div className={styles.benchListBadges}>
                                        {goalCount > 0 && <span title="Bàn thắng">⚽ {goalCount > 1 ? goalCount : ''}</span>}
                                        {customEventCounts.map((cEvt: any) => cEvt.count > 0 ? <span key={cEvt.id} title={cEvt.name}>{cEvt.icon} {cEvt.count > 1 ? cEvt.count : ''}</span> : null)}
                                        {yellowCount > 0 && <span style={{ background: '#fef08a', color: '#a16207' }} title="Thẻ vàng">🟨 {yellowCount > 1 ? yellowCount : ''}</span>}
                                        {hasRedCard && <span style={{ background: '#fee2e2', color: '#b91c1c' }} title="Thẻ đỏ">🟥</span>}
                                        {isMotm && <span style={{ background: '#faf5ff', color: '#7e22ce' }}>🏅 MVP</span>}
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </>
                        );
                      })()
                    )}
                  </div>
                    </div>

                    {/* CENTER — Scoreboard + Event Log */}
                    <div id="tour-referee-center-panel" className={styles.consoleCenterPanel}>
                      {/* Scoreboard Card */}
                      <div className={styles.consoleCentralHeaderCard}>
                        <div className={styles.consoleCentralTeam}>
                          <span className={styles.consoleCentralLogo}><TeamLogo logo={selectedMatch.doiNha?.logo} /></span>
                          <span className={styles.consoleCentralName}>{selectedMatch.doiNha?.ten || 'Chờ xác định'}</span>
                        </div>
                        <div className={styles.consoleCentralScoreWrapper}>
                          <div className={styles.consoleCentralScore}>
                            <span className={styles.consoleCentralBigScore}>{selectedMatch.tyNha || 0}</span>
                            <span className={styles.consoleCentralScoreSep}>-</span>
                            <span className={styles.consoleCentralBigScore}>{selectedMatch.tyKhach || 0}</span>
                          </div>
                        </div>
                        <div className={styles.consoleCentralTeam}>
                          <span className={styles.consoleCentralLogo}><TeamLogo logo={selectedMatch.doiKhach?.logo} /></span>
                          <span className={styles.consoleCentralName}>{selectedMatch.doiKhach?.ten || 'Chờ xác định'}</span>
                        </div>
                      </div>

                      {/* Timer */}
                      <div className={styles.consoleCentralTimerWrapper}>
                        <span className={styles.consoleCentralTimer}>{formatMatchTime(selectedMatch)}</span>
                        {selectedMatch.trangThai === 'DANG_DIEN_RA' && (
                          <span className={styles.consoleCentralHalfLabel}>
                            {getMatchHalfState(selectedMatch) === '2_active' ? 'Hiệp 2' : 'Hiệp 1'}
                          </span>
                        )}
                        {selectedMatch.trangThai === 'KET_THUC' && (
                          <span className={styles.consoleCentralHalfLabel}>Hết giờ</span>
                        )}
                        {selectedMatch.trangThai === 'SAP_DIEN_RA' && (
                          <span className={styles.consoleCentralHalfLabel}>Chưa bắt đầu</span>
                        )}
                      </div>

                      {/* Sequential Match State Machine Main CTA */}
                      <div className={styles.consoleMainCtaWrapper}>
                        {getMatchHalfState(selectedMatch) === '1_not_started' && (
                          <button 
                            className={`${styles.consoleMainCta} ${styles.ctaStartH1}`}
                            onClick={() => handleStartMatch(selectedMatch.id)}
                          >
                            ▶ BẮT ĐẦU HIỆP 1
                          </button>
                        )}

                        {getMatchHalfState(selectedMatch) === '1_active' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                            <button 
                              className={styles.consoleMainCta}
                              style={{ 
                                background: selectedMatch.dangTamDung ? '#10b981' : '#2563eb',
                                boxShadow: selectedMatch.dangTamDung ? '0 4px 14px rgba(16, 185, 129, 0.3)' : '0 4px 14px rgba(37, 99, 235, 0.3)'
                              }}
                              onClick={() => handleTemporaryPauseToggle(selectedMatch.id)}
                            >
                              {selectedMatch.dangTamDung ? '▶ TIẾP TỤC TRẬN ĐẤU' : '⏸ TẠM DỪNG TRẬN ĐẤU'}
                            </button>
                            <button 
                              className={`${styles.consoleMainCta} ${styles.ctaEndH1}`}
                              onClick={() => handlePauseMatch(selectedMatch.id)}
                            >
                              ⏸ KẾT THÚC HIỆP 1
                            </button>
                          </div>
                        )}

                        {getMatchHalfState(selectedMatch) === 'half_time' && (
                          <>
                            <span className={styles.halfTimeOverlayText}>Đang nghỉ giữa hiệp</span>
                            <button 
                              className={`${styles.consoleMainCta} ${styles.ctaStartH2}`}
                              onClick={() => handleResumeMatch(selectedMatch.id)}
                            >
                              ▶ BẮT ĐẦU HIỆP 2
                            </button>
                          </>
                        )}

                        {getMatchHalfState(selectedMatch) === '2_active' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                            <button 
                              className={styles.consoleMainCta}
                              style={{ 
                                background: selectedMatch.dangTamDung ? '#10b981' : '#2563eb',
                                boxShadow: selectedMatch.dangTamDung ? '0 4px 14px rgba(16, 185, 129, 0.3)' : '0 4px 14px rgba(37, 99, 235, 0.3)'
                              }}
                              onClick={() => handleTemporaryPauseToggle(selectedMatch.id)}
                            >
                              {selectedMatch.dangTamDung ? '▶ TIẾP TỤC TRẬN ĐẤU' : '⏸ TẠM DỪNG TRẬN ĐẤU'}
                            </button>
                            <button 
                              className={`${styles.consoleMainCta} ${styles.ctaEndMatch}`}
                              onClick={() => handleFinishMatch(selectedMatch.id)}
                            >
                              ⏹ KẾT THÚC TRẬN ĐẤU
                            </button>
                          </div>
                        )}

                        {getMatchHalfState(selectedMatch) === 'finished' && (
                          <button 
                            className={`${styles.consoleMainCta} ${styles.ctaReset}`}
                            onClick={() => handleResetMatch(selectedMatch.id)}
                          >
                            🔄 RESET TRẬN ĐẤU
                          </button>
                        )}
                      </div>

                      {/* Event Log */}
                      <div className={styles.consoleEventLog}>
                        <div className={styles.consoleEventLogTitle}>Nhat ky su kien</div>
                        <div className={styles.consoleEventLogList}>
                          {selectedMatch.suKien && selectedMatch.suKien.length > 0 ? (
                            [...selectedMatch.suKien].sort((a: any, b: any) => b.phut - a.phut).slice(0, 8).map((ev: any) => (
                              <div key={ev.id} className={styles.consoleEventRow}>
                                <span className={styles.consoleEventMin}>{ev.phut}&apos;</span>
                                <span className={styles.consoleEventDesc}>{ev.moTa}</span>
                                <button
                                  className={styles.consoleUndoBtn}
                                  onClick={() => handleUndoEvent(ev.id, ev.loai, ev.doiId, ev.cauThuId)}
                                  disabled={selectedMatch.trangThai === 'KET_THUC'}
                                >x</button>
                              </div>
                            ))
                          ) : (
                            <p className={styles.consoleEventEmpty}>Chua co su kien nao</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* RIGHT — Doi khach */}
                    <div className={styles.consoleTeamPanel}>
                      <div className={styles.consoleTeamHeader}>
                        <div style={{ flex: 1, minWidth: 0, textAlign: 'right' }}>
                          <div className={styles.consoleTeamName}>{selectedMatch.doiKhach?.ten || 'Chờ xác định'}</div>
                          <div className={styles.consoleTeamLabel} style={{ color: '#60a5fa', textAlign: 'right' }}>ĐỘI KHÁCH</div>
                        </div>
                        <span className={styles.consoleTeamEmoji}><TeamLogo logo={selectedMatch.doiKhach?.logo} /></span>
                      </div>
                      <div className={styles.consoleRosterGrid}>
                        {(!selectedMatch.doiKhach?.cauThu || selectedMatch.doiKhach.cauThu.length === 0) ? (
                          <p className={styles.consoleEmptyRoster}>Chua co cau thu nao</p>
                        ) : (
                          (() => {
                            const { starters, bench } = calculateCurrentRoster(selectedMatch.doiKhach, selectedMatch.suKien, starterCount);
                            const renderPlayer = (player: any, isBench: boolean) => {
                          const yellowCount = selectedMatch.suKien?.filter((ev: any) => ev.loai === 'THE_VANG' && ev.cauThuId === player.id).length || 0;
                          const hasRedCard = selectedMatch.suKien?.some((ev: any) => ev.loai === 'THE_DO' && ev.cauThuId === player.id) || yellowCount >= 2;
                          const goalCount = selectedMatch.suKien?.filter((ev: any) => ev.loai.startsWith('GOAL_') && ev.loai !== 'GOAL_OG' && ev.cauThuId === player.id).length || 0;
                          const customEventCounts = customEvents.map(evt => ({
                            ...evt,
                            count: selectedMatch.suKien?.filter((ev: any) => ev.loai === `CUSTOM_${evt.id.toUpperCase()}` && ev.cauThuId === player.id).length || 0
                          }));
                          const isMotm = selectedMatch.suKien?.some((ev: any) => ev.loai === 'MOTM' && ev.cauThuId === player.id);
                          const isClickable = !hasRedCard && (selectedMatch.trangThai === 'DANG_DIEN_RA' || selectedMatch.trangThai === 'KET_THUC');
                          
                          const isPendingSub = pendingSubOut?.player?.id === player.id;
                          const isOtherPending = pendingSubOut && pendingSubOut.teamId === selectedMatch.doiKhach.id && !isPendingSub;
                          const dimClass = isOtherPending && !isBench ? styles.consolePlayerDimmed : '';
                          const highlightClass = pendingSubOut && isBench && pendingSubOut.teamId === selectedMatch.doiKhach.id ? styles.consolePlayerHighlighted : '';
                          const benchClass = isBench ? styles.consolePlayerBench : '';
                          
                          const handleClick = () => {
                            if (!isClickable) return;
                            if (pendingSubOut) {
                              if (pendingSubOut.teamId !== selectedMatch.doiKhach.id) return;
                              if (isPendingSub) {
                                setPendingSubOut(null); // Cancel
                              } else if (isBench) {
                                handleExecuteSubstitution(player, pendingSubOut.player, pendingSubOut.teamId);
                              }
                            } else {
                              setActivePlayerParams({ matchId: selectedMatch.id, teamId: selectedMatch.doiKhach.id, player, isBench });
                            }
                          };

                          return (
                            <button
                              key={player.id}
                              className={`${styles.consolePlayerBtn} ${benchClass} ${hasRedCard ? styles.consolePlayerRedCarded : ''} ${isClickable ? styles.consolePlayerActive : ''} ${dimClass} ${highlightClass}`}
                              onClick={handleClick}
                              disabled={!isClickable && !isPendingSub}
                            >
                              <div className={styles.consolePlayerNo}>{player.soAo}</div>
                              <div className={styles.consolePlayerName}>{player.ten || 'Chưa đặt tên'}</div>
                              
                              {/* Action Badges */}
                              <div className={styles.consolePlayerBadges}>
                                {goalCount > 0 && <span>{goalCount > 1 ? goalCount : ''}&#x26BD;</span>}
                                {customEventCounts.map((cEvt: any) => cEvt.count > 0 ? <span key={cEvt.id} title={cEvt.name}>{cEvt.count > 1 ? cEvt.count : ''}{cEvt.icon}</span> : null)}
                                {yellowCount > 0 && <span>Y{yellowCount > 1 ? yellowCount : ''}</span>}
                                {hasRedCard && <span>R</span>}
                                {isMotm && <span>MVP</span>}
                              </div>
                            </button>
                          );
                        };
                        return (
                          <>
                            <div className={styles.rosterHeader}>🏟️ ĐỘI HÌNH CHÍNH</div>
                            {starters.map(p => renderPlayer(p, false))}
                            
                            <div className={styles.rosterHeader} style={{marginTop: '20px', color: '#64748b', borderColor: '#cbd5e1'}}>🔄 CẦU THỦ DỰ BỊ</div>
                            <div className={styles.benchListView}>
                              {bench.length === 0 ? (
                                <p style={{ fontSize: '12px', color: '#94a3b8', padding: '8px 12px', margin: 0, gridColumn: '1 / -1' }}>Không có cầu thủ dự bị</p>
                              ) : (
                                bench.map((player: any) => {
                                  const yellowCount = selectedMatch.suKien?.filter((ev: any) => ev.loai === 'THE_VANG' && ev.cauThuId === player.id).length || 0;
                                  const hasRedCard = selectedMatch.suKien?.some((ev: any) => ev.loai === 'THE_DO' && ev.cauThuId === player.id) || yellowCount >= 2;
                                  const goalCount = selectedMatch.suKien?.filter((ev: any) => ev.loai.startsWith('GOAL_') && ev.loai !== 'GOAL_OG' && ev.cauThuId === player.id).length || 0;
                                  const customEventCounts = customEvents.map(evt => ({
                                    ...evt,
                                    count: selectedMatch.suKien?.filter((ev: any) => ev.loai === `CUSTOM_${evt.id.toUpperCase()}` && ev.cauThuId === player.id).length || 0
                                  }));
                                  const isMotm = selectedMatch.suKien?.some((ev: any) => ev.loai === 'MOTM' && ev.cauThuId === player.id);

                                  return (
                                    <div key={player.id} className={styles.benchListRow}>
                                      <span className={styles.benchListNo}>#{player.soAo}</span>
                                      <span className={styles.benchListName}>{player.ten}</span>
                                      
                                      <div className={styles.benchListBadges}>
                                        {goalCount > 0 && <span title="Bàn thắng">⚽ {goalCount > 1 ? goalCount : ''}</span>}
                                        {customEventCounts.map((cEvt: any) => cEvt.count > 0 ? <span key={cEvt.id} title={cEvt.name}>{cEvt.icon} {cEvt.count > 1 ? cEvt.count : ''}</span> : null)}
                                        {yellowCount > 0 && <span style={{ background: '#fef08a', color: '#a16207' }} title="Thẻ vàng">🟨 {yellowCount > 1 ? yellowCount : ''}</span>}
                                        {hasRedCard && <span style={{ background: '#fee2e2', color: '#b91c1c' }} title="Thẻ đỏ">🟥</span>}
                                        {isMotm && <span style={{ background: '#faf5ff', color: '#7e22ce' }}>🏅 MVP</span>}
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </>
                        );
                      })()
                    )}
                  </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>

        {/* Toast */}
        {toast.visible && <div className={styles.toast}>{toast.message}</div>}

        {/* Action Selection Bottom Sheet */}
        {activePlayerParams && selectedMatch && (
          <>
            <div className={styles.bottomSheetOverlay} onClick={() => setActivePlayerParams(null)} />
            <div className={styles.bottomSheet}>
              <div className={styles.bottomSheetHeader}>
                <div className={styles.bottomSheetHandle} />
                <div className={styles.sheetPlayerInfoContainer}>
                  <span className={styles.sheetPlayerJersey}>#{activePlayerParams.player.soAo}</span>
                  <div>
                    <h3 className={styles.sheetPlayerFullName}>{activePlayerParams.player.ten}</h3>
                    <p className={styles.sheetPlayerTeamName}>
                      {activePlayerParams.teamId === selectedMatch.doiNha?.id ? selectedMatch.doiNha?.ten : selectedMatch.doiKhach?.ten}
                    </p>
                  </div>
                </div>
              </div>

              {isSelectingSubstitute ? (
                <div className={styles.bottomSheetActionsGrid} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{fontWeight: 600, fontSize: '14px', color: '#64748b'}}>Chọn người {activePlayerParams.isBench ? 'được thay ra' : 'vào thay'}</div>
                  {(() => {
                    const team = activePlayerParams.teamId === selectedMatch.doiNha?.id ? selectedMatch.doiNha : selectedMatch.doiKhach;
                    const { starters, bench } = calculateCurrentRoster(team, selectedMatch.suKien, starterCount);
                    const targetList = activePlayerParams.isBench ? starters : bench;
                    
                    return targetList.map((p: any) => (
                      <button 
                        key={p.id} 
                        className={styles.bsActionCard} 
                        onClick={() => {
                          if (activePlayerParams.isBench) {
                            handleExecuteSubstitution(activePlayerParams.player, p, activePlayerParams.teamId);
                          } else {
                            handleExecuteSubstitution(p, activePlayerParams.player, activePlayerParams.teamId);
                          }
                        }}
                        style={{justifyContent: 'flex-start', padding: '12px'}}
                      >
                        <span style={{marginRight: '10px', background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px', fontSize: '12px'}}>{p.soAo}</span>
                        <span style={{fontWeight: 600}}>{p.ten}</span>
                      </button>
                    ));
                  })()}
                  <button className={styles.bsCancelBtn} onClick={() => setIsSelectingSubstitute(false)}>
                    Hủy
                  </button>
                </div>
              ) : (
                <div className={styles.bottomSheetActionsGrid}>
                  {selectedMatch.trangThai === 'KET_THUC' ? (
                    <button 
                      className={`${styles.bsActionCard} ${styles.bsMotm}`} 
                      onClick={() => handleActionSelect('motm')}
                      style={{ gridColumn: 'span 2', background: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)', border: '1px solid #c084fc' }}
                    >
                      <span className={styles.bsActionIcon}>🏅</span>
                      <span className={styles.bsActionText} style={{ color: '#7e22ce', fontWeight: 700 }}>Chọn làm cầu thủ xuất sắc nhất (MOTM)</span>
                    </button>
                  ) : (
                    <>
                      <button className={`${styles.bsActionCard} ${styles.bsSub}`} onClick={() => setIsSelectingSubstitute(true)}>
                        <span className={styles.bsActionIcon}>🔄</span>
                        <span className={styles.bsActionText}>{activePlayerParams.isBench ? 'Vào sân' : 'Thay ra'}</span>
                      </button>
                      <button className={`${styles.bsActionCard} ${styles.bsGoalNormal}`} onClick={() => handleActionSelect('goal', 'normal')}>
                        <span className={styles.bsActionIcon}>⚽</span>
                        <span className={styles.bsActionText}>Bàn thắng</span>
                      </button>

                      <button className={`${styles.bsActionCard} ${styles.bsGoalPen}`} onClick={() => handleActionSelect('goal', 'pen')}>
                        <span className={styles.bsActionIcon}>🥅</span>
                        <span className={styles.bsActionText}>Penalty</span>
                      </button>

                      <button className={`${styles.bsActionCard} ${styles.bsGoalOg}`} onClick={() => handleActionSelect('goal', 'og')}>
                        <span className={styles.bsActionIcon}>😈</span>
                        <span className={styles.bsActionText}>Phản lưới</span>
                      </button>

                      {customEvents.map((evt) => (
                        <button key={evt.id} className={`${styles.bsActionCard} ${styles.bsChotDeal}`} onClick={() => handleActionSelect('custom', evt.id)}>
                          <span className={styles.bsActionIcon}>{evt.icon}</span>
                          <span className={styles.bsActionText}>{evt.name} {evt.points ? `(+${evt.points})` : ''}</span>
                        </button>
                      ))}

                      <button className={`${styles.bsActionCard} ${styles.bsYellow}`} onClick={() => handleActionSelect('card', 'yellow')}>
                        <span className={styles.bsActionIcon}>🟨</span>
                        <span className={styles.bsActionText}>Thẻ vàng</span>
                      </button>

                      <button className={`${styles.bsActionCard} ${styles.bsRed}`} onClick={() => handleActionSelect('card', 'red')}>
                        <span className={styles.bsActionIcon}>🟥</span>
                        <span className={styles.bsActionText}>Thẻ đỏ</span>
                      </button>
                    </>
                  )}
                </div>
              )}

              <div style={{ padding: '16px 0 8px 0', marginTop: '12px' }}>
                <button className={styles.finishBtn} style={{ width: '100%', margin: 0, background: '#d71920', color: '#ffffff' }} onClick={() => setActivePlayerParams(null)}>
                  Hủy bỏ
                </button>
              </div>
            </div>
          </>
        )}

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
                  <button
                    className={styles.editBtnCompact}
                    style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                    onClick={() => {
                      setImportPlayersTargetTeam(editingTeam);
                      setImportPlayersPreview([]);
                      setIsImportPlayersOpen(true);
                    }}
                  >
                    Thêm Cầu Thủ từ file Excel
                  </button>
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

        {/* Team Details Modal */}
        {viewingTeam && (
          <div className={styles.overlay} onClick={() => setViewingTeam(null)}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '550px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{ fontSize: '40px', background: '#f8fafc', width: '64px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                    <TeamLogo logo={viewingTeam.logo} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '22px', fontWeight: 800 }}>{viewingTeam.ten}</h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#64748b', display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <span className={styles.statusBadge} style={{ background: '#f1f5f9' }}>Bảng {viewingTeam.bang}</span>
                      <span>•</span>
                      <span>{viewingTeam.cauThu?.length || 0} cầu thủ</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setViewingTeam(null)}
                  style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#94a3b8' }}
                >
                  ×
                </button>
              </div>

              <div style={{ marginTop: '20px' }}>
                <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b', marginBottom: '12px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                  Danh sách cầu thủ đăng ký
                </h4>
                {(!viewingTeam.cauThu || viewingTeam.cauThu.length === 0) ? (
                  <p style={{ color: '#94a3b8', fontSize: '13px', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>
                    Chưa có cầu thủ nào được đăng ký cho đội bóng này.
                  </p>
                ) : (() => {
                  const chinhThuc = viewingTeam.cauThu.filter((p: any) => !p.viTri?.startsWith('Dự bị'));
                  const duBi = viewingTeam.cauThu.filter((p: any) => p.viTri?.startsWith('Dự bị'));

                  const posOrder: Record<string, number> = {
                    'Thủ môn': 1, 'GK': 1,
                    'Hậu vệ': 2, 'DF': 2,
                    'Tiền vệ': 3, 'MF': 3,
                    'Tiền đạo': 4, 'FW': 4,
                    'Chưa rõ': 99
                  };

                  const sortPlayers = (list: any[]) => {
                    return [...list].sort((a: any, b: any) => {
                      const cleanPosA = a.viTri?.replace('Dự bị - ', '') || 'Chưa rõ';
                      const cleanPosB = b.viTri?.replace('Dự bị - ', '') || 'Chưa rõ';
                      return (posOrder[cleanPosA] || 99) - (posOrder[cleanPosB] || 99) || (a.soAo - b.soAo);
                    });
                  };

                  const sortedChinhThuc = sortPlayers(chinhThuc);
                  const sortedDuBi = sortPlayers(duBi);

                  const getDisplayPos = (pos: string) => {
                    if (!pos) return 'Chưa rõ';
                    if (pos.startsWith('Dự bị - ')) return pos.replace('Dự bị - ', '') + ' (Dự bị)';
                    return pos === 'GK' ? 'Thủ môn' : pos === 'DF' ? 'Hậu vệ' : pos === 'MF' ? 'Tiền vệ' : pos === 'FW' ? 'Tiền đạo' : pos;
                  };

                  return (
                    <div style={{ maxHeight: '380px', overflowY: 'auto', paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      {/* Đội hình chính thức */}
                      <div>
                        <h5 style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#dc2626', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          🛡️ Đội hình chính thức ({chinhThuc.length})
                        </h5>
                        {chinhThuc.length === 0 ? (
                          <p style={{ color: '#94a3b8', fontSize: '12px', fontStyle: 'italic', margin: '4px 0 0 12px' }}>Không có cầu thủ chính thức</p>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {sortedChinhThuc.map((p: any) => (
                              <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(10px)', borderRadius: '10px', border: '1px solid rgba(226, 232, 240, 0.8)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', background: '#fee2e2', color: '#ef4444', borderRadius: '50%', fontSize: '11px', fontWeight: 700 }}>
                                    {p.soAo}
                                  </span>
                                  <div>
                                    <p style={{ margin: 0, fontWeight: 600, fontSize: '13.5px', color: '#1e293b' }}>{p.ten}</p>
                                    <p style={{ margin: 0, fontSize: '10.5px', color: '#3b82f6', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                                      {getDisplayPos(p.viTri)}
                                    </p>
                                  </div>
                                </div>
                                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>
                                  ⚽ {p.banThang || 0} bàn
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Danh sách dự bị */}
                      <div>
                        <h5 style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#4b5563', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          📋 Danh sách dự bị ({duBi.length})
                        </h5>
                        {duBi.length === 0 ? (
                          <p style={{ color: '#94a3b8', fontSize: '12px', fontStyle: 'italic', margin: '4px 0 0 12px' }}>Không có cầu thủ dự bị</p>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {sortedDuBi.map((p: any) => (
                              <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(248, 250, 252, 0.7)', backdropFilter: 'blur(10px)', borderRadius: '10px', border: '1px solid rgba(226, 232, 240, 0.8)', boxShadow: '0 2px 4px rgba(0,0,0,0.01)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', background: '#f1f5f9', color: '#475569', borderRadius: '50%', fontSize: '11px', fontWeight: 700 }}>
                                    {p.soAo}
                                  </span>
                                  <div>
                                    <p style={{ margin: 0, fontWeight: 600, fontSize: '13.5px', color: '#334155' }}>{p.ten}</p>
                                    <p style={{ margin: 0, fontSize: '10.5px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                                      {getDisplayPos(p.viTri)}
                                    </p>
                                  </div>
                                </div>
                                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>
                                  ⚽ {p.banThang || 0} bàn
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className={styles.modalFooter}>
                <button
                  className={`${styles.modalFooterBtn} ${styles.modalFooterPrimary}`}
                  onClick={() => {
                    const teamToEdit = viewingTeam;
                    setViewingTeam(null);
                    handleEditTeam(teamToEdit);
                  }}
                >
                  Chỉnh sửa thành viên
                </button>
                <button
                  className={`${styles.modalFooterBtn} ${styles.modalFooterSecondary}`}
                  onClick={() => setViewingTeam(null)}
                >
                  Đóng
                </button>
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
                      ngayBatDau: newTournamentData.ngayBatDau
                    };
                    const { error } = await createTournament(payload);
                    if (!error) {
                      setIsCreatingTournament(false);
                      showToast(`🏆 Đã khởi tạo thành công giải đấu: ${newTournamentData.ten}!`);
                      setNewTournamentData({ ten: '', muaGiai: '2025', ngayBatDau: '2025-05-01' });
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
            <div className={styles.modal} style={{ maxWidth: '500px' }}>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: 800, letterSpacing: '-0.02em', color: '#1e293b' }}>
                ⚙️ CẤU HÌNH SMART SCHEDULER
              </h3>
              <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#64748b' }}>
                Thiết lập các thông số rải lịch và blackout dates để tự động tạo lịch đấu tối ưu.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className={styles.formGroup}>
                  <label className={styles.label} style={{ color: '#475569', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Số trận / Tuần</label>
                  <input
                    type="number"
                    min="1"
                    className={styles.modalInput}
                    value={scheduleConfig.matchesPerWeek === 0 ? '' : scheduleConfig.matchesPerWeek}
                    onChange={(e) => {
                      const val = e.target.value === '' ? 0 : Number(e.target.value);
                      setScheduleConfig({ ...scheduleConfig, matchesPerWeek: val });
                    }}
                  />
                </div>

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
                        setBlackoutDates([...blackoutDates, newBlackoutDate].sort());
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
                              setBlackoutDates(blackoutDates.filter(d => d !== date));
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

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '25px' }}>
                <button
                  className={styles.finishBtn}
                  style={{ width: '100%', margin: 0, justifyContent: 'center' }}
                  onClick={async () => {
                    if (scheduleConfig.matchesPerWeek < 1) {
                      showToast("⚠️ Số trận / Tuần tối thiểu phải là 1!");
                      return;
                    }
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
                            const draftMatches = liveMatches.filter(m => m.trangThai === 'SAP_DIEN_RA');

                            for (const m of draftMatches) {
                              await supabase.from('su_kien').delete().eq('tran_dau_id', m.id);
                              await supabase.from('tran_dau').delete().eq('id', m.id);
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
        {isImportTeamsOpen && (
          <div className={styles.overlay} style={{ zIndex: 9998 }}>
            <div className={styles.modal} style={{ maxWidth: '650px', width: '100%', padding: '30px', position: 'relative' }}>
              {/* Close Button */}
              <button
                onClick={() => { setIsImportTeamsOpen(false); handleClearTeamsImport(); }}
                style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', fontSize: '20px', color: '#94a3b8', cursor: 'pointer', transition: 'color 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#1e293b'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
              >
                ✕
              </button>

              <h3 style={{ margin: '0 0 6px 0', fontSize: '20px', fontWeight: 800, letterSpacing: '-0.02em', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>📥</span> IMPORT DANH SÁCH ĐỘI BÓNG
              </h3>
              <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#64748b' }}>
                Tải lên danh sách câu lạc bộ của bạn để nhanh chóng chuẩn bị lịch đấu và quản lý cầu thủ.
              </p>

              {/* Guide and Download template */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', background: '#f8fafc', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap', fontSize: '13px', color: '#475569' }}>
                  <span style={{ fontWeight: 600 }}>Các cột bắt buộc:</span>
                  <span style={{ fontSize: '11px', fontWeight: 700, background: '#fee2e2', color: '#dc2626', padding: '2px 8px', borderRadius: '4px', border: '1px solid #fecaca', margin: '0 4px' }}>Tên đội</span>
                  <span style={{ fontWeight: 600, marginLeft: '6px' }}>. Cột tùy chọn:</span>
                  <span style={{ fontSize: '11px', fontWeight: 600, background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: '4px', border: '1px solid #e2e8f0', margin: '0 4px' }}>Logo</span>
                  <span style={{ fontSize: '11px', fontWeight: 600, background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: '4px', border: '1px solid #e2e8f0', margin: '0 4px' }}>Bảng</span>
                </div>
                <button
                  type="button"
                  onClick={downloadTeamsTemplate}
                  style={{ background: 'none', border: 'none', color: '#D71920', textDecoration: 'underline', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', padding: 0, transition: 'color 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#ae0011'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#D71920'}
                >
                  ⬇️ Tải file mẫu (.xlsx)
                </button>
              </div>

              {/* Upload Dropzone / File Selected State */}
              {selectedTeamsFile === null ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setIsTeamsDragActive(true); }}
                  onDragLeave={() => setIsTeamsDragActive(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsTeamsDragActive(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) processTeamsFile(file);
                  }}
                  style={{
                    background: isTeamsDragActive ? 'rgba(215, 25, 32, 0.04)' : '#fff',
                    border: isTeamsDragActive ? '2px dashed #D71920' : '2px dashed #cbd5e1',
                    borderRadius: '12px',
                    padding: '40px 24px',
                    textAlign: 'center',
                    marginBottom: '20px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: isTeamsDragActive ? '0 0 16px rgba(215, 25, 32, 0.1)' : 'none'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = '#D71920'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = isTeamsDragActive ? '#D71920' : '#cbd5e1'}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleImportTeamsFile}
                    style={{ display: 'none' }}
                  />
                  {/* Premium Cloud Upload Icon */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={isTeamsDragActive ? '#D71920' : '#10b981'}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      width: '56px',
                      height: '56px',
                      marginBottom: '16px',
                      transition: 'all 0.2s ease',
                      filter: isTeamsDragActive ? 'drop-shadow(0 4px 12px rgba(215, 25, 32, 0.15))' : 'drop-shadow(0 4px 12px rgba(16, 185, 129, 0.15))'
                    }}
                  >
                    <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
                    <path d="M12 12v9" />
                    <path d="m16 16-4-4-4 4" />
                  </svg>
                  <p style={{ fontSize: '16px', color: '#1e293b', fontWeight: 600, margin: '0 0 6px 0' }}>
                    Kéo thả file Excel vào đây
                  </p>
                  <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                    Hoặc bấm để chọn file từ máy tính <span style={{ fontWeight: 600, color: '#475569' }}>(Hỗ trợ .xls, .xlsx)</span>
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px 18px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {/* Green Excel File Icon */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e8f5e9', width: '38px', height: '38px', borderRadius: '8px' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#2e7d32" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '20px', height: '20px' }}>
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="8" y1="13" x2="16" y2="13" />
                        <line x1="8" y1="17" x2="16" y2="17" />
                        <line x1="10" y1="9" x2="9" y2="9" />
                      </svg>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#1e293b', wordBreak: 'break-all' }}>{selectedTeamsFile.name}</p>
                      <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>Dung lượng: {(selectedTeamsFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearTeamsImport}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '6px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#fef2f2'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                    title="Xóa file đã chọn"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      <line x1="10" y1="11" x2="10" y2="17" />
                      <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                  </button>
                </div>
              )}

              {/* Preview table */}
              {importTeamsPreview.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                    📋 XEM TRƯỚC DANH SÁCH ({importTeamsPreview.length} đội)
                  </label>
                  <div style={{ maxHeight: '180px', overflowY: 'auto', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#fff' }}>
                    <table className={styles.adminTable} style={{ marginBottom: 0, width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 10 }}>
                          <th style={{ padding: '8px 12px', fontSize: '12px', textAlign: 'left', color: '#475569', fontWeight: 700 }}>#</th>
                          <th style={{ padding: '8px 12px', fontSize: '12px', textAlign: 'left', color: '#475569', fontWeight: 700 }}>Logo</th>
                          <th style={{ padding: '8px 12px', fontSize: '12px', textAlign: 'left', color: '#475569', fontWeight: 700 }}>Tên đội bóng</th>
                          <th style={{ padding: '8px 12px', fontSize: '12px', textAlign: 'left', color: '#475569', fontWeight: 700 }}>Bảng</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importTeamsPreview.map((t, i) => (
                          <tr key={t.id} style={{ borderBottom: i === importTeamsPreview.length - 1 ? 'none' : '1px solid #f1f5f9' }}>
                            <td style={{ padding: '8px 12px', fontSize: '13px', color: '#64748b' }}>{i + 1}</td>
                            <td style={{ padding: '8px 12px', fontSize: '18px', display: 'flex' }}><TeamLogo logo={t.logo} /></td>
                            <td style={{ padding: '8px 12px', fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>{t.ten}</td>
                            <td style={{ padding: '8px 12px', fontSize: '13px', color: '#475569' }}>
                              <span style={{ background: '#f1f5f9', color: '#334155', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>
                                Bảng {t.bang}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button
                  type="button"
                  style={{
                    flex: 1,
                    margin: 0,
                    height: '44px',
                    fontWeight: 700,
                    fontSize: '14px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#fff',
                    color: '#64748b',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onClick={() => { setIsImportTeamsOpen(false); handleClearTeamsImport(); }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#94a3b8'; e.currentTarget.style.background = '#f8fafc'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.background = '#fff'; }}
                >
                  HỦY
                </button>
                <button
                  type="button"
                  style={{
                    flex: 1,
                    margin: 0,
                    height: '44px',
                    fontWeight: 700,
                    fontSize: '14px',
                    borderRadius: '8px',
                    background: importTeamsPreview.length === 0 || importLoading ? '#e2e8f0' : '#D71920',
                    color: importTeamsPreview.length === 0 || importLoading ? '#94a3b8' : '#fff',
                    cursor: importTeamsPreview.length === 0 || importLoading ? 'not-allowed' : 'pointer',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease',
                    boxShadow: importTeamsPreview.length === 0 || importLoading ? 'none' : '0 4px 14px rgba(215, 25, 32, 0.4)'
                  }}
                  disabled={importTeamsPreview.length === 0 || importLoading}
                  onClick={handleConfirmImportTeams}
                  onMouseEnter={(e) => {
                    if (importTeamsPreview.length > 0 && !importLoading) {
                      e.currentTarget.style.background = '#ae0011';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (importTeamsPreview.length > 0 && !importLoading) {
                      e.currentTarget.style.background = '#D71920';
                    }
                  }}
                >
                  {importLoading ? (
                    <>⏳ Đang import...</>
                  ) : importTeamsPreview.length === 0 ? (
                    <>IMPORT ĐỘI</>
                  ) : (
                    <>IMPORT {importTeamsPreview.length} ĐỘI</>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Import Players from Excel Modal */}
        {isImportPlayersOpen && (
          <div className={styles.overlay} style={{ zIndex: 9998 }}>
            <div className={styles.modal} style={{ maxWidth: '650px', width: '100%', padding: '30px', position: 'relative' }}>
              {/* Close Button */}
              <button
                onClick={() => { setIsImportPlayersOpen(false); handleClearPlayersImport(); setImportPlayersTargetTeam(null); }}
                style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', fontSize: '20px', color: '#94a3b8', cursor: 'pointer', transition: 'color 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#1e293b'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
              >
                ✕
              </button>

              <h3 style={{ margin: '0 0 6px 0', fontSize: '20px', fontWeight: 800, letterSpacing: '-0.02em', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>📥</span> IMPORT DANH SÁCH CẦU THỦ
              </h3>
              <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#64748b' }}>
                Tải lên danh sách cầu thủ cho đội <strong style={{ color: '#1e293b' }}>{importPlayersTargetTeam?.ten || '...'}</strong> để theo dõi kiến tạo và bàn thắng.
              </p>

              {/* Guide and Download template */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', background: '#f8fafc', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap', fontSize: '13px', color: '#475569' }}>
                  <span style={{ fontWeight: 600 }}>Các cột bắt buộc:</span>
                  <span style={{ fontSize: '11px', fontWeight: 700, background: '#fee2e2', color: '#dc2626', padding: '2px 8px', borderRadius: '4px', border: '1px solid #fecaca', margin: '0 4px' }}>Tên cầu thủ</span>
                  <span style={{ fontWeight: 600, marginLeft: '6px' }}>. Cột tùy chọn:</span>
                  <span style={{ fontSize: '11px', fontWeight: 600, background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: '4px', border: '1px solid #e2e8f0', margin: '0 4px' }}>Số áo</span>
                  <span style={{ fontSize: '11px', fontWeight: 600, background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: '4px', border: '1px solid #e2e8f0', margin: '0 4px' }}>Vị trí</span>
                </div>
                <button
                  type="button"
                  onClick={downloadPlayersTemplate}
                  style={{ background: 'none', border: 'none', color: '#D71920', textDecoration: 'underline', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', padding: 0, transition: 'color 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#ae0011'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#D71920'}
                >
                  ⬇️ Tải file mẫu (.xlsx)
                </button>
              </div>

              {/* Upload Dropzone / File Selected State */}
              {selectedPlayersFile === null ? (
                <div
                  onClick={() => playerFileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setIsPlayersDragActive(true); }}
                  onDragLeave={() => setIsPlayersDragActive(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsPlayersDragActive(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) processPlayersFile(file);
                  }}
                  style={{
                    background: isPlayersDragActive ? 'rgba(215, 25, 32, 0.04)' : '#fff',
                    border: isPlayersDragActive ? '2px dashed #D71920' : '2px dashed #cbd5e1',
                    borderRadius: '12px',
                    padding: '40px 24px',
                    textAlign: 'center',
                    marginBottom: '20px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: isPlayersDragActive ? '0 0 16px rgba(215, 25, 32, 0.1)' : 'none'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = '#D71920'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = isPlayersDragActive ? '#D71920' : '#cbd5e1'}
                >
                  <input
                    ref={playerFileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleImportPlayersFile}
                    style={{ display: 'none' }}
                  />
                  {/* Premium Cloud Upload Icon */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={isPlayersDragActive ? '#D71920' : '#10b981'}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      width: '56px',
                      height: '56px',
                      marginBottom: '16px',
                      transition: 'all 0.2s ease',
                      filter: isPlayersDragActive ? 'drop-shadow(0 4px 12px rgba(215, 25, 32, 0.15))' : 'drop-shadow(0 4px 12px rgba(16, 185, 129, 0.15))'
                    }}
                  >
                    <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
                    <path d="M12 12v9" />
                    <path d="m16 16-4-4-4 4" />
                  </svg>
                  <p style={{ fontSize: '16px', color: '#1e293b', fontWeight: 600, margin: '0 0 6px 0' }}>
                    Kéo thả file Excel vào đây
                  </p>
                  <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                    Hoặc bấm để chọn file từ máy tính <span style={{ fontWeight: 600, color: '#475569' }}>(Hỗ trợ .xls, .xlsx)</span>
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px 18px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {/* Green Excel File Icon */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e8f5e9', width: '38px', height: '38px', borderRadius: '8px' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#2e7d32" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '20px', height: '20px' }}>
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="8" y1="13" x2="16" y2="13" />
                        <line x1="8" y1="17" x2="16" y2="17" />
                        <line x1="10" y1="9" x2="9" y2="9" />
                      </svg>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#1e293b', wordBreak: 'break-all' }}>{selectedPlayersFile.name}</p>
                      <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>Dung lượng: {(selectedPlayersFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearPlayersImport}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '6px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#fef2f2'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                    title="Xóa file đã chọn"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      <line x1="10" y1="11" x2="10" y2="17" />
                      <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                  </button>
                </div>
              )}

              {/* Preview table */}
              {importPlayersPreview.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                    📋 XEM TRƯỚC DANH SÁCH ({importPlayersPreview.length} cầu thủ)
                  </label>
                  <div style={{ maxHeight: '180px', overflowY: 'auto', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#fff' }}>
                    <table className={styles.adminTable} style={{ marginBottom: 0, width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 10 }}>
                          <th style={{ padding: '8px 12px', fontSize: '12px', textAlign: 'left', color: '#475569', fontWeight: 700 }}>#</th>
                          <th style={{ padding: '8px 12px', fontSize: '12px', textAlign: 'left', color: '#475569', fontWeight: 700 }}>Số áo</th>
                          <th style={{ padding: '8px 12px', fontSize: '12px', textAlign: 'left', color: '#475569', fontWeight: 700 }}>Tên cầu thủ</th>
                          <th style={{ padding: '8px 12px', fontSize: '12px', textAlign: 'left', color: '#475569', fontWeight: 700 }}>Vị trí</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importPlayersPreview.map((p, i) => (
                          <tr key={p.id} style={{ borderBottom: i === importPlayersPreview.length - 1 ? 'none' : '1px solid #f1f5f9' }}>
                            <td style={{ padding: '8px 12px', fontSize: '13px', color: '#64748b' }}>{i + 1}</td>
                            <td style={{ padding: '8px 12px' }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', background: '#fee2e2', color: '#ef4444', borderRadius: '50%', fontSize: '11px', fontWeight: 700 }}>
                                {p.soAo}
                              </span>
                            </td>
                            <td style={{ padding: '8px 12px', fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>{p.ten}</td>
                            <td style={{ padding: '8px 12px', fontSize: '12px', color: '#64748b' }}>{p.viTri}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button
                  type="button"
                  style={{
                    flex: 1,
                    margin: 0,
                    height: '44px',
                    fontWeight: 700,
                    fontSize: '14px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#fff',
                    color: '#64748b',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onClick={() => { setIsImportPlayersOpen(false); handleClearPlayersImport(); setImportPlayersTargetTeam(null); }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#94a3b8'; e.currentTarget.style.background = '#f8fafc'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.background = '#fff'; }}
                >
                  HỦY
                </button>
                <button
                  type="button"
                  style={{
                    flex: 1,
                    margin: 0,
                    height: '44px',
                    fontWeight: 700,
                    fontSize: '14px',
                    borderRadius: '8px',
                    background: importPlayersPreview.length === 0 || importLoading ? '#e2e8f0' : '#D71920',
                    color: importPlayersPreview.length === 0 || importLoading ? '#94a3b8' : '#fff',
                    cursor: importPlayersPreview.length === 0 || importLoading ? 'not-allowed' : 'pointer',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease',
                    boxShadow: importPlayersPreview.length === 0 || importLoading ? 'none' : '0 4px 14px rgba(215, 25, 32, 0.4)'
                  }}
                  disabled={importPlayersPreview.length === 0 || importLoading}
                  onClick={handleConfirmImportPlayers}
                  onMouseEnter={(e) => {
                    if (importPlayersPreview.length > 0 && !importLoading) {
                      e.currentTarget.style.background = '#ae0011';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (importPlayersPreview.length > 0 && !importLoading) {
                      e.currentTarget.style.background = '#D71920';
                    }
                  }}
                >
                  {importLoading ? (
                    <>⏳ Đang import...</>
                  ) : importPlayersPreview.length === 0 ? (
                    <>IMPORT CẦU THỦ</>
                  ) : (
                    <>IMPORT {importPlayersPreview.length} CẦU THỦ</>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
