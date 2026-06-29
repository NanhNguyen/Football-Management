'use client';

import { useState } from 'react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import AdminDesktopView from './components/AdminDesktopView';
import AdminMobileView from './components/AdminMobileView';
import dynamic from 'next/dynamic';
import GlobalSkeletonLoader from '@/components/GlobalSkeletonLoader';
import { calculateMatchMinute, updatePlayerGoals } from '@/lib/api';

// Hooks
import { useAdminUIState } from './hooks/useAdminUIState';
import { useAdminData } from './hooks/useAdminData';
import { useAdminAuth } from './hooks/useAdminAuth';
import { useTournamentManagement } from './hooks/useTournamentManagement';
import { useTeamManagement } from './hooks/useTeamManagement';
import { useMatchManagement } from './hooks/useMatchManagement';
import { useMatchLifecycle } from './hooks/useMatchLifecycle';
import { useMatchEvents } from './hooks/useMatchEvents';
import { useScheduler } from './hooks/useScheduler';
import { useBulkImport } from './hooks/useBulkImport';

const AdminOnboardingTour = dynamic(() => import('@/components/AdminOnboardingTour'), { ssr: false });
const RefereeGuideOverlay = dynamic(() => import('@/components/RefereeGuideOverlay'), { ssr: false });

const sidebarItems = [
  { label: 'Lịch đấu', id: 'lich' },
  { label: 'Quản lý đội', id: 'doi' },
  { label: 'Trọng tài', id: 'referee' },
  { label: 'Quản trị tài khoản', id: 'role-management' },
  { label: 'Cài đặt giải đấu', id: 'cai-dat' },
];

export default function QuanTriPage() {
  // Tournament settings states needed before other hooks
  const [maxTeams, setMaxTeams] = useState(16);
  const [standingsConfig, setStandingsConfig] = useState({ phongDo: true, thePhat: false });
  const [schedulerConfig, setSchedulerConfig] = useState<any>({
    startDate: '', endDate: '',
    matchDurationMinutes: 90, breakTimeMinutes: 15, maxExtraTimeMinutes: 15,
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
  });
  const [blackoutDates, setBlackoutDates] = useState<string[]>([]);
  const [customEvents, setCustomEvents] = useState<any[]>([]);
  const [starterCount, setStarterCount] = useState<number>(7);
  const [benchCount, setBenchCount] = useState<number>(7);
  const [tournamentType, setTournamentType] = useState<'tournament' | 'league'>('tournament');
  const [tournamentGroupLegs, setTournamentGroupLegs] = useState<1 | 2>(1);
  const [tournamentLeagueRounds, setTournamentLeagueRounds] = useState<number>(5);
  const [tournamentTemplates, setTournamentTemplates] = useState<any[]>([]);

  // Match ID state (needed by multiple hooks)
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('adminSelectedMatchId') || null;
    return null;
  });

  // UI State
  const ui = useAdminUIState(selectedMatchId);

  // Data (admin data hook needs to call setters from tournament management)
  const {
    tournamentName, setTournamentName,
    tournamentSeason, setTournamentSeason,
    tournamentStartDate, setTournamentStartDate,
    tournamentVenueType, setTournamentVenueType,
    tournamentEndDate, setTournamentEndDate,
    tournamentMaxPlayers, setTournamentMaxPlayers,
    isCreatingTournament, setIsCreatingTournament,
    newTournamentData, setNewTournamentData,
    addCustomEvent, removeCustomEvent, updateCustomEvent,
    handleSaveTournamentConfig, handleDeleteTournament, handleCreateTournament,
  } = useTournamentManagement(
    null, schedulerConfig, starterCount, benchCount, tournamentType,
    tournamentGroupLegs, tournamentLeagueRounds, standingsConfig,
    customEvents, async () => {}, ui.showToast, ui.showConfirm,
    () => {}, () => {}, setCustomEvents, setStarterCount, tournamentTemplates
  );

  const adminData = useAdminData(
    ui.showToast,
    setTournamentName, setTournamentSeason, setTournamentStartDate, setTournamentVenueType,
    setTournamentEndDate, setMaxTeams, setTournamentMaxPlayers, setStarterCount, setBenchCount,
    setTournamentType, setTournamentGroupLegs, setTournamentLeagueRounds,
    setStandingsConfig, setCustomEvents, setSchedulerConfig, setBlackoutDates,
    selectedMatchId, setSelectedMatchId
  );

  const { userRole, handleLogout } = useAdminAuth(
    adminData.fetchData,
    ui.activeTab,
    ui.setActiveTab,
    setTournamentTemplates
  );

  const { selectedMatch, ...matchMgmt } = useMatchManagement(
    adminData.liveMatches,
    adminData.setLiveMatches,
    adminData.selectedTournament,
    adminData.fetchData,
    ui.showToast,
    ui.showConfirm
  );

  const teamMgmt = useTeamManagement(
    adminData.teams, maxTeams, setMaxTeams,
    adminData.selectedTournament, adminData.fetchData,
    ui.showToast, ui.showConfirm
  );

  const lifecycle = useMatchLifecycle(
    adminData.liveMatches, adminData.setLiveMatches,
    adminData.selectedTournament, schedulerConfig,
    adminData.fetchData, ui.showToast, ui.showConfirm,
    async (playerId: string, increment: number) => { await updatePlayerGoals(playerId, increment); }
  );

  const events = useMatchEvents(
    selectedMatch, adminData.liveMatches, adminData.setLiveMatches,
    adminData.selectedTournament, customEvents, schedulerConfig,
    adminData.fetchData, ui.showToast, ui.showConfirm
  );

  const scheduler = useScheduler(
    adminData.liveMatches, adminData.teams,
    adminData.selectedTournament, schedulerConfig, setSchedulerConfig,
    blackoutDates, setBlackoutDates, adminData.loading,
    adminData.fetchData, ui.showToast, ui.showConfirm
  );

  const bulkImport = useBulkImport(
    adminData.selectedTournament, adminData.fetchData, ui.showToast
  );

  const isMobile = useMediaQuery('(max-width: 768px)');

  if (adminData.loading) return <GlobalSkeletonLoader />;

  const filteredSidebarItems = sidebarItems.filter(item => {
    if (userRole === 'ref') return item.id === 'lich' || item.id === 'referee';
    if (item.id === 'role-management' && userRole !== 'admin') return false;
    return true;
  });

  const data = {
    activeTab: ui.activeTab, mobileMenuOpen: ui.mobileMenuOpen,
    runTour: ui.runTour, runRefereeTour: ui.runRefereeTour,
    liveMatches: adminData.liveMatches, teams: adminData.teams,
    loading: adminData.loading, selectedMatchId,
    activePlayerParams: events.activePlayerParams, pendingSubOut: events.pendingSubOut,
    toast: ui.toast, isSwitcherOpen: ui.isSwitcherOpen,
    tournaments: adminData.tournaments, selectedTournament: adminData.selectedTournament,
    tournamentTemplates, isCreatingTournament, newTournamentData,
    editingTeam: teamMgmt.editingTeam, viewingTeam: teamMgmt.viewingTeam,
    isAddingTeam: teamMgmt.isAddingTeam, fetchingLogo: teamMgmt.fetchingLogo,
    newTeamData: teamMgmt.newTeamData,
    editingMatch: matchMgmt.editingMatch, isAddingMatch: matchMgmt.isAddingMatch,
    newMatchData: matchMgmt.newMatchData,
    newPlayerName: teamMgmt.newPlayerName, newPlayerNumber: teamMgmt.newPlayerNumber,
    newPlayerPosition: teamMgmt.newPlayerPosition, maxTeams,
    standingsConfig, scheduleConfig: { matchesPerWeek: 8 },
    blackoutDates, newBlackoutDate: scheduler.newBlackoutDate,
    isSchedulerConfigOpen: scheduler.isSchedulerConfigOpen, schedulerConfig,
    scheduleFilterVong: scheduler.scheduleFilterVong,
    refereeFilterVong: scheduler.refereeFilterVong,
    refereeFilterBang: scheduler.refereeFilterBang,
    customEvents, tournamentName, tournamentSeason, tournamentStartDate,
    tournamentVenueType, tournamentEndDate, tournamentMaxPlayers,
    starterCount, benchCount,
    isSelectingSubstitute: events.isSelectingSubstitute,
    tournamentType, tournamentGroupLegs, tournamentLeagueRounds,
    confirmDialog: ui.confirmDialog,
    isBulkImportOpen: bulkImport.isBulkImportOpen,
    bulkImportProgress: bulkImport.bulkImportProgress,
    selectedBulkFile: bulkImport.selectedBulkFile,
    isBulkDragActive: bulkImport.isBulkDragActive,
    bulkFileInputRef: bulkImport.bulkFileInputRef,
    sidebarItems: filteredSidebarItems,
    selectedMatch,
    uniqueRounds: scheduler.uniqueRounds,
    uniqueGroups: scheduler.uniqueGroups,
    isKnockoutActive: scheduler.isKnockoutActive,
    filteredAndSortedRefereeMatches: scheduler.filteredAndSortedRefereeMatches,
    scheduleUniqueRounds: scheduler.scheduleUniqueRounds,
    filteredAndSortedScheduleMatches: scheduler.filteredAndSortedScheduleMatches,
    teamSuggestion: teamMgmt.teamSuggestion,
    isSyncingLogos: teamMgmt.isSyncingLogos,
    syncProgress: teamMgmt.syncProgress,
    userRole,
    isPostponeModalOpen: scheduler.isPostponeModalOpen,
    postponeTargetDate: scheduler.postponeTargetDate,
    isRescheduleDashboardOpen: scheduler.isRescheduleDashboardOpen,
  };

  const actions = {
    setActiveTab: ui.setActiveTab, setMobileMenuOpen: ui.setMobileMenuOpen,
    setRunTour: ui.setRunTour, setRunRefereeTour: ui.setRunRefereeTour,
    setLiveMatches: adminData.setLiveMatches, setTeams: adminData.setTeams,
    setLoading: adminData.setLoading, setSelectedMatchId,
    setActivePlayerParams: events.setActivePlayerParams,
    setPendingSubOut: events.setPendingSubOut, setToast: ui.setToast,
    setIsSwitcherOpen: ui.setIsSwitcherOpen,
    setTournaments: adminData.setTournaments,
    setSelectedTournament: adminData.setSelectedTournament,
    setTournamentTemplates, setIsCreatingTournament, setNewTournamentData,
    setEditingTeam: teamMgmt.setEditingTeam, setViewingTeam: teamMgmt.setViewingTeam,
    setIsAddingTeam: teamMgmt.setIsAddingTeam, setFetchingLogo: () => {},
    setNewTeamData: teamMgmt.setNewTeamData,
    setEditingMatch: matchMgmt.setEditingMatch, setIsAddingMatch: matchMgmt.setIsAddingMatch,
    setNewMatchData: matchMgmt.setNewMatchData,
    setNewPlayerName: teamMgmt.setNewPlayerName, setNewPlayerNumber: teamMgmt.setNewPlayerNumber,
    setNewPlayerPosition: teamMgmt.setNewPlayerPosition, setMaxTeams,
    setStandingsConfig, setScheduleConfig: () => {},
    saveBlackoutDates: scheduler.saveBlackoutDates,
    setNewBlackoutDate: scheduler.setNewBlackoutDate,
    setIsSchedulerConfigOpen: scheduler.setIsSchedulerConfigOpen,
    setSchedulerConfig, updateSchedulerConfig: scheduler.updateSchedulerConfig,
    setScheduleFilterVong: scheduler.setScheduleFilterVong,
    setRefereeFilterVong: scheduler.setRefereeFilterVong,
    setRefereeFilterBang: scheduler.setRefereeFilterBang,
    setCustomEvents, setTournamentName, setTournamentSeason, setTournamentStartDate,
    setTournamentVenueType, setTournamentEndDate, setTournamentMaxPlayers,
    setStarterCount, setBenchCount,
    setIsSelectingSubstitute: events.setIsSelectingSubstitute,
    setTournamentType, setTournamentGroupLegs, setTournamentLeagueRounds,
    showConfirm: ui.showConfirm,
    setIsBulkImportOpen: bulkImport.setIsBulkImportOpen,
    setBulkImportProgress: bulkImport.setBulkImportProgress,
    setSelectedBulkFile: bulkImport.setSelectedBulkFile,
    setIsBulkDragActive: bulkImport.setIsBulkDragActive,
    handleAutoFetchLogo: teamMgmt.handleAutoFetchLogo,
    handleAddTeam: teamMgmt.handleAddTeam,
    confirmAddTeam: teamMgmt.confirmAddTeam,
    handleEditTeam: teamMgmt.handleEditTeam,
    handleSaveTeam: teamMgmt.handleSaveTeam,
    handleAddPlayer: teamMgmt.handleAddPlayer,
    handleDeletePlayer: teamMgmt.handleDeletePlayer,
    handleDeleteTeam: teamMgmt.handleDeleteTeam,
    handleDeleteAllTeams: teamMgmt.handleDeleteAllTeams,
    handleSaveTournamentConfig, handleDeleteTournament,
    handleAutoSchedule: scheduler.handleAutoSchedule,
    handleEditMatch: matchMgmt.handleEditMatch,
    handleSaveMatch: matchMgmt.handleSaveMatch,
    handleCreateMatch: matchMgmt.handleCreateMatch,
    handleDeleteMatch: matchMgmt.handleDeleteMatch,
    formatMatchTime: lifecycle.formatMatchTime,
    getMatchHalfState: lifecycle.getMatchHalfState,
    calculateCurrentRoster: lifecycle.calculateCurrentRoster,
    fetchData: adminData.fetchData,
    addCustomEvent, removeCustomEvent, updateCustomEvent,
    handleDownloadBulkTemplate: bulkImport.handleDownloadBulkTemplate,
    handleClearDraftSchedule: scheduler.handleClearDraftSchedule,
    processBulkFile: bulkImport.processBulkFile,
    handleImportBulkFile: bulkImport.handleImportBulkFile,
    handleCreateTournament,
    showToast: ui.showToast, handleLogout,
    handleExecuteSubstitution: events.handleExecuteSubstitution,
    handleStartMatch: lifecycle.handleStartMatch,
    handleTemporaryPauseToggle: lifecycle.handleTemporaryPauseToggle,
    handlePauseMatch: lifecycle.handlePauseMatch,
    handleResumeMatch: lifecycle.handleResumeMatch,
    handleFinishMatch: lifecycle.handleFinishMatch,
    handleResetMatch: lifecycle.handleResetMatch,
    handleDeleteEvent: events.handleDeleteEvent,
    handleActionSelect: events.handleActionSelect,
    handleInlineUpdateMatch: matchMgmt.handleInlineUpdateMatch,
    handleDelayMatchSchedule: scheduler.handleDelayMatchSchedule,
    calculateMatchMinute,
    handleTeamNameBlur: teamMgmt.handleTeamNameBlur,
    handleBulkSyncLogos: teamMgmt.handleBulkSyncLogos,
    setTeamSuggestion: teamMgmt.setTeamSuggestion,
    setIsPostponeModalOpen: scheduler.setIsPostponeModalOpen,
    setPostponeTargetDate: scheduler.setPostponeTargetDate,
    setIsRescheduleDashboardOpen: scheduler.setIsRescheduleDashboardOpen,
    handlePostponeMatchday: scheduler.handlePostponeMatchday,
    handleRescheduleRolling: scheduler.handleRescheduleRolling,
    handleMoveToPool: scheduler.handleMoveToPool,
    handleQuickAddPlayerSuccess: events.handleQuickAddPlayerSuccess,
  };

  if (isMobile) return <AdminMobileView data={data} actions={actions} />;
  return <AdminDesktopView data={data} actions={actions} />;
}
