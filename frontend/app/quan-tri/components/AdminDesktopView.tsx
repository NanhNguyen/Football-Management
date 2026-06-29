import React from 'react';
import Link from 'next/link';
import styles from '../quan-tri.module.css';
import GlobalSkeletonLoader from '@/components/GlobalSkeletonLoader';
import dynamic from 'next/dynamic';
const AdminOnboardingTour = dynamic(() => import('@/components/AdminOnboardingTour'), { ssr: false });
const RefereeGuideOverlay = dynamic(() => import('@/components/RefereeGuideOverlay'), { ssr: false });

import SettingsTab from './SettingsTab';
import TeamsTab from './TeamsTab';
import SchedulerTab from './SchedulerTab';
import RefereeTab from './RefereeTab';
import TeamDetailView from './TeamDetailView';
import TeamLogo from '@/components/TeamLogo';
import { IconTrophy } from './RefereeIcons';
import { supabase } from '@/lib/supabase';
import RoleManagementTab from './RoleManagementTab';
import RescheduleDashboard from './RescheduleDashboard';

export default function AdminDesktopView(props: any) {
  const { data, actions } = props;
  const {
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

    // Expose additional variables
    selectedMatch,
    uniqueRounds,
    uniqueGroups,
    isKnockoutActive,
    filteredAndSortedRefereeMatches,
    scheduleUniqueRounds,
    filteredAndSortedScheduleMatches,
    teamSuggestion,
    isSyncingLogos,
    syncProgress,
    userRole,
    isPostponeModalOpen,
    postponeTargetDate,
    isRescheduleDashboardOpen
  } = data;

  const {
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
    handleDownloadBulkTemplate, handleClearBulkImport, processBulkFile, handleImportBulkFile,

    // Expose additional action handlers
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
    handleDelayMatchSchedule,
    handleDeleteEvent,
    handleActionSelect,
    handleInlineUpdateMatch,
    calculateMatchMinute,
    handleClearDraftSchedule,
    handleTeamNameBlur,
    handleBulkSyncLogos,
    setTeamSuggestion,
    setIsPostponeModalOpen,
    setPostponeTargetDate,
    setIsRescheduleDashboardOpen,
    handlePostponeMatchday,
    handleRescheduleRolling,
    handleMoveToPool,
    handleQuickAddPlayerSuccess
  } = actions;

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
          <Link href="/quan-tri" className={styles.topbarLogo}>
            <img src="/logo-sparta-football.png" alt="Logo" className={styles.topbarLogoImg} />
            <span className={styles.topbarLogoText}>SPARTA</span>
          </Link>
          <div className={styles.switcherContainer}>
            <div id="tour-tournament-switcher" className={styles.tournamentSwitcher} onClick={() => setIsSwitcherOpen(!isSwitcherOpen)}>
              <IconTrophy size={18} color="var(--color-primary)" /> <span className={styles.tournamentSwitcherText}>{selectedTournament?.ten || 'Chọn giải đấu...'}</span>
              <svg className={`${styles.switcherArrow} ${isSwitcherOpen ? styles.switcherArrowOpen : ''}`} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </div>
            {isSwitcherOpen && (
              <div className={styles.switcherDropdown}>
                {tournaments.map((t: any) => (
                  <div
                    key={t.id}
                    className={`${styles.switcherOption} ${selectedTournament?.id === t.id ? styles.switcherOptionActive : ''}`}
                    onClick={() => {
                      setSelectedTournament(t);
                      setIsSwitcherOpen(false);
                      fetchData(t.id);
                      showToast(`Đã chuyển sang giải đấu: ${t.ten}`);
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    <IconTrophy size={16} color={selectedTournament?.id === t.id ? 'var(--color-primary)' : 'var(--color-text-muted)'} /> {t.ten}
                  </div>
                ))}
                {userRole === 'admin' && (
                  <>
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
                  </>
                )}
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
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>{userRole === 'admin' ? 'AD' : 'RF'}</div>
              <span className={styles.adminNameText} style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>{userRole === 'admin' ? 'Admin' : 'Trọng tài'}</span>
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
            {sidebarItems.map((item: any) => (
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
        <main className={styles.main} style={activeTab === 'referee' ? { padding: 0 } : {}}>

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
                    {teams.map((t: any, idx: number) => (
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
              selectedTournamentId={selectedTournament?.id || 'giai-1'}
              selectedTournament={selectedTournament}
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
              handleDeleteTournament={handleDeleteTournament}
            />
          )}

          {activeTab === 'role-management' && (
            <RoleManagementTab showToast={showToast} />
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
                isSyncingLogos={isSyncingLogos}
                handleBulkSyncLogos={handleBulkSyncLogos}
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
              handleClearDraftSchedule={handleClearDraftSchedule}
              setIsPostponeModalOpen={setIsPostponeModalOpen}
            />
          )}

          {/* Modals are simplified versions for brevity in this response, but keep full logic from previous version */}
          {/* ... Modal implementations (isAddingTeam, editingTeam, editingMatch) using handleSaveTeam, handleSaveMatch ... */}
          {/* I will keep the modals logic consistent with the previous version but using the new save handlers */}

          {isPostponeModalOpen && (
            <div className={styles.overlay}>
              <div className={styles.modal}>
                <h3 style={{ color: '#e11d48' }}>❄️ Xác nhận hoãn toàn bộ ngày thi đấu</h3>
                <p style={{ fontSize: '14px', color: '#475569', marginBottom: '16px' }}>
                  Tính năng này sẽ đình chỉ <strong>tất cả</strong> các trận đấu trong một ngày cụ thể (do thiên tai, sự cố).
                  Vui lòng chọn ngày muốn hoãn:
                </p>
                <input
                  type="date"
                  className={styles.modalInput}
                  value={postponeTargetDate}
                  onChange={(e) => setPostponeTargetDate(e.target.value)}
                />
                <div className={styles.modalActions}>
                  <button className={styles.cancelBtn} onClick={() => setIsPostponeModalOpen(false)}>Hủy</button>
                  <button className={styles.saveBtn} style={{ background: '#e11d48' }} onClick={handlePostponeMatchday} disabled={!postponeTargetDate}>
                    Xác nhận Hoãn
                  </button>
                </div>
              </div>
            </div>
          )}

          {isRescheduleDashboardOpen && (
            <RescheduleDashboard 
              onClose={() => setIsRescheduleDashboardOpen(false)}
              onRescheduleRolling={handleRescheduleRolling}
              onMoveToPool={handleMoveToPool}
              postponeTargetDate={postponeTargetDate}
              filteredAndSortedScheduleMatches={filteredAndSortedScheduleMatches}
            />
          )}

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
              handleDelayMatchSchedule={handleDelayMatchSchedule}
              handleDeleteEvent={handleDeleteEvent}
              isSelectingSubstitute={isSelectingSubstitute}
              setIsSelectingSubstitute={setIsSelectingSubstitute}
              handleActionSelect={handleActionSelect}
              getMatchHalfState={getMatchHalfState}
              schedulerConfig={schedulerConfig}
              handleQuickAddPlayerSuccess={handleQuickAddPlayerSuccess}
            />
          )}
        </main>

        {/* Toast */}
        {toast.visible && <div className={styles.toast}>{toast.message}</div>}

        {/* Sync Progress Card */}
        {syncProgress && (
          <div className={styles.syncProgressCard}>
            <div className={styles.syncProgressHeader}>
              <div className={styles.syncProgressSpinner}></div>
              <span className={styles.syncProgressTitle}>Đang đồng bộ logo đội bóng</span>
            </div>
            <div className={styles.syncProgressDetails}>
              <span className={styles.syncProgressText}>
                Đang xử lý: <strong>{syncProgress.currentTeamName || '...'}</strong>
              </span>
              <span className={styles.syncProgressPercent}>
                {syncProgress.current}/{syncProgress.total}
              </span>
            </div>
            <div className={styles.syncProgressBarBg}>
              <div 
                className={styles.syncProgressBarFill} 
                style={{ width: `${(syncProgress.current / syncProgress.total) * 100}%` }}
              />
            </div>
          </div>
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
                onBlur={() => handleTeamNameBlur(newTeamData.ten)}
              />
              {teamSuggestion && (
                <div style={{
                  marginTop: '12px',
                  padding: '12px 16px',
                  backgroundColor: 'rgba(59, 130, 246, 0.08)',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  borderRadius: '12px',
                  fontSize: '13px',
                  color: '#1e3a8a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <img src={teamSuggestion.logo} alt={teamSuggestion.name} style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
                    <span style={{ textAlign: 'left' }}>
                      💡 Tìm thấy dữ liệu quốc tế: <strong>{teamSuggestion.name}</strong>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setNewTeamData({
                        ...newTeamData,
                        logo: teamSuggestion.logo,
                        externalApiId: teamSuggestion.id,
                        logoSource: 'EXTERNAL_API'
                      });
                      setTeamSuggestion(null);
                    }}
                    style={{
                      background: '#3b82f6',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '6px 12px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      fontSize: '12px',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Áp dụng ngay
                  </button>
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <label style={{ cursor: 'pointer', display: 'inline-block', position: 'relative' }}>
                  <input 
                    type="file" 
                    accept="image/*" 
                    style={{ display: 'none' }} 
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        showToast("⏳ Đang tải ảnh lên...");
                        const fileExt = file.name.split('.').pop();
                        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
                        const { data, error } = await supabase.storage.from('team-logos').upload(fileName, file);
                        if (error) throw error;
                        const { data: publicData } = supabase.storage.from('team-logos').getPublicUrl(fileName);
                        setNewTeamData({ 
                          ...newTeamData, 
                          logo: publicData.publicUrl,
                          logoSource: 'SUPABASE_BUCKET',
                          externalApiId: null
                        });
                        showToast("✅ Đã cập nhật logo!");
                      } catch (err) {
                        console.error("Upload error:", err);
                        showToast("❌ Lỗi khi tải ảnh lên");
                      }
                    }}
                  />
                  <TeamLogo logo={newTeamData.logo} teamName={newTeamData.ten} className="w-12 h-12 rounded-full object-cover shadow-sm border border-slate-200" style={{ width: '48px', height: '48px', cursor: 'pointer' }} />
                  <div style={{ position: 'absolute', bottom: -2, right: -2, background: '#ffffff', borderRadius: '50%', padding: '3px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', display: 'flex' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" color="#475569"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                  </div>
                </label>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  Nhấn vào ảnh để tải lên<br/>logo từ thiết bị của bạn.
                </div>
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
                <button className={styles.undoBtn} onClick={() => { setIsAddingTeam(false); setTeamSuggestion(null); }}>HỦY</button>
              </div>
            </div>
          </div>
        )}

        {/* Editing Team Modal */}
        {editingTeam && (
          <div className={styles.overlay}>
            <div className={styles.modal} style={{ maxWidth: '650px', width: '100%', padding: '30px' }}>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--color-text-heading, #E8F4F8)' }}>
                ⚙️ CHỈNH SỬA ĐỘI BÓNG
              </h3>
              <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: 'var(--color-text-secondary, #A0B4C8)' }}>
                Cập nhật tên đội bóng và quản lý danh sách thành viên đăng ký thi đấu.
              </p>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary, #A0B4C8)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                  📛 Tên đội bóng
                </label>
                <input
                  type="text"
                  className={styles.modalInput}
                  style={{ background: 'var(--color-surface-container, #0A0F18)', border: '2px solid var(--color-border, rgba(167, 139, 250, 0.15))', borderRadius: '12px', padding: '12px 16px', fontSize: '15px', color: 'var(--color-text-heading, #ffffff)' }}
                  value={editingTeam.ten}
                  onChange={(e) => setEditingTeam({ ...editingTeam, ten: e.target.value })}
                  onBlur={() => handleTeamNameBlur(editingTeam.ten)}
                />
                {teamSuggestion && (
                  <div style={{
                    marginTop: '12px',
                    padding: '12px 16px',
                    backgroundColor: 'rgba(59, 130, 246, 0.08)',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    borderRadius: '12px',
                    fontSize: '13px',
                    color: '#1e3a8a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <img src={teamSuggestion.logo} alt={teamSuggestion.name} style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
                      <span style={{ textAlign: 'left' }}>
                        💡 Tìm thấy dữ liệu quốc tế: <strong>{teamSuggestion.name}</strong>
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTeam({
                          ...editingTeam,
                          logo: teamSuggestion.logo,
                          externalApiId: teamSuggestion.id,
                          logoSource: 'EXTERNAL_API'
                        });
                        setTeamSuggestion(null);
                      }}
                      style={{
                        background: '#3b82f6',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '6px 12px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        fontSize: '12px',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      Áp dụng ngay
                    </button>
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                  🖼️ Logo đội bóng
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                  <label style={{ cursor: 'pointer', display: 'inline-block', position: 'relative' }}>
                    <input 
                      type="file" 
                      accept="image/*" 
                      style={{ display: 'none' }} 
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          showToast("⏳ Đang tải ảnh lên...");
                          const fileExt = file.name.split('.').pop();
                          const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
                          const { data, error } = await supabase.storage.from('team-logos').upload(fileName, file);
                          if (error) throw error;
                          const { data: publicData } = supabase.storage.from('team-logos').getPublicUrl(fileName);
                          setEditingTeam({ 
                            ...editingTeam, 
                            logo: publicData.publicUrl,
                            logoSource: 'SUPABASE_BUCKET',
                            externalApiId: null
                          });
                          showToast("✅ Đã cập nhật logo!");
                        } catch (err) {
                          console.error("Upload error:", err);
                          showToast("❌ Lỗi khi tải ảnh lên");
                        }
                      }}
                    />
                    <TeamLogo logo={editingTeam.logo} teamName={editingTeam.ten} className="w-16 h-16 rounded-full object-cover shadow-sm border border-slate-200" style={{ width: '64px', height: '64px', cursor: 'pointer' }} />
                    <div style={{ position: 'absolute', bottom: 0, right: 0, background: '#ffffff', borderRadius: '50%', padding: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', display: 'flex' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" color="#475569"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                    </div>
                  </label>
                  <div style={{ fontSize: '13px', color: '#64748b' }}>
                    Nhấn vào ảnh để tải lên logo từ thiết bị.
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '20px' }}>
                <div style={{ background: 'var(--color-surface-sidebar, #0A0F18)', border: '1px dashed var(--color-border, rgba(167, 139, 250, 0.2))', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary, #A0B4C8)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                    ➕ Thêm cầu thủ mới
                  </label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      className={styles.modalInput}
                      style={{ flex: 3, padding: '10px 14px', borderRadius: '10px', background: 'var(--color-surface-container, #0A0F18)', border: '1px solid var(--color-border, rgba(167, 139, 250, 0.15))', fontSize: '14px', color: 'var(--color-text-heading, #ffffff)' }}
                      placeholder="Tên cầu thủ"
                      value={newPlayerName}
                      onChange={e => setNewPlayerName(e.target.value)}
                    />
                    <input
                      className={styles.modalInput}
                      style={{ width: '65px', padding: '10px 10px', textAlign: 'center', borderRadius: '10px', background: 'var(--color-surface-container, #0A0F18)', border: '1px solid var(--color-border, rgba(167, 139, 250, 0.15))', fontSize: '14px', color: 'var(--color-text-heading, #ffffff)' }}
                      placeholder="Số"
                      value={newPlayerNumber}
                      onChange={e => setNewPlayerNumber(e.target.value)}
                    />
                    <select
                      className={styles.modalInput}
                      style={{ width: '150px', padding: '10px 10px', borderRadius: '10px', background: 'var(--color-surface-container, #0A0F18)', border: '1px solid var(--color-border, rgba(167, 139, 250, 0.15))', fontSize: '13px', cursor: 'pointer', color: 'var(--color-text-heading, #ffffff)' }}
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
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary, #A0B4C8)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    👥 Danh sách thành viên ({editingTeam.cauThu?.length || 0})
                  </label>
                </div>

                <div style={{ maxHeight: '240px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
                  {(!editingTeam.cauThu || editingTeam.cauThu.length === 0) ? (
                    <p style={{ color: '#94a3b8', fontSize: '13px', fontStyle: 'italic', textAlign: 'center', padding: '15px' }}>Chương có cầu thủ nào. Hãy thêm cầu thủ ở trên!</p>
                  ) : (
                    editingTeam.cauThu.map((p: any) => (
                      <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 14px', background: 'var(--color-surface-container, #0A0F18)', borderRadius: '10px', border: '1px solid var(--color-border-light, rgba(167, 139, 250, 0.08))', transition: 'all 0.2s' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', background: p.viTri?.startsWith('Dự bị') ? 'rgba(148, 163, 184, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: p.viTri?.startsWith('Dự bị') ? '#94a3b8' : '#ef4444', borderRadius: '50%', fontSize: '11px', fontWeight: 700 }}>
                            {p.soAo}
                          </span>
                          <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-heading, #E8F4F8)' }}>{p.ten}</span>
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
                            style={{ padding: '4px 8px', fontSize: '12px', borderRadius: '6px', border: '1px solid var(--color-border, rgba(167, 139, 250, 0.15))', background: 'var(--color-surface-sidebar, #0A0F18)', color: 'var(--color-text, #C8D8E8)', fontWeight: 500, cursor: 'pointer' }}
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
              <h3 style={{ margin: '0 0 15px 0', fontSize: '20px', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--color-text-heading, #E8F4F8)' }}>🏆 TẠO TRẬN ĐẤU MỚI</h3>
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
              <h3 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--color-text-heading, #E8F4F8)' }}>CHỈNH SỬA LỊCH THI ĐẤU</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '15px' }}>
                <p style={{ color: 'var(--color-text-secondary, #A0B4C8)', fontSize: '13px', margin: '0 0 10px 0' }}>
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
              <h3 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--color-text-heading, #E8F4F8)' }}>
                🏆 TẠO GIẢI ĐẤU MỚI
              </h3>
              <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: 'var(--color-text-secondary, #A0B4C8)' }}>
                Nhập các thông tin cơ bản để khởi tạo một giải đấu mới trên nền tảng.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div className={styles.formGroup}>
                  <label className={styles.label} style={{ color: 'var(--color-text-secondary, #A0B4C8)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Tên giải đấu</label>
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
                    <label className={styles.label} style={{ color: 'var(--color-text-secondary, #A0B4C8)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Mùa giải</label>
                    <input
                      type="text"
                      placeholder="Ví dụ: 2025"
                      className={styles.modalInput}
                      value={newTournamentData.muaGiai}
                      onChange={(e) => setNewTournamentData({ ...newTournamentData, muaGiai: e.target.value })}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label} style={{ color: 'var(--color-text-secondary, #A0B4C8)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Ngày dự kiến bắt đầu</label>
                    <input
                      type="date"
                      className={styles.modalInput}
                      value={newTournamentData.ngayBatDau}
                      onChange={(e) => setNewTournamentData({ ...newTournamentData, ngayBatDau: e.target.value })}
                    />
                  </div>
                  </div>

                <div className={styles.formGroup} style={{ marginTop: '0px' }}>
                  <label className={styles.label} style={{ color: 'var(--color-text-secondary, #A0B4C8)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                    Loại giải đấu (Template) <span style={{ color: 'red' }}>*</span>
                  </label>
                  <select
                    className={styles.modalInput}
                    value={newTournamentData.templateCode}
                    onChange={(e) => setNewTournamentData({ ...newTournamentData, templateCode: e.target.value })}
                  >
                    <option value="">--- Chọn loại giải đấu ---</option>
                    {tournamentTemplates.length > 0 ? (
                      tournamentTemplates.map((t: any) => (
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
                  {tournamentTemplates.length > 0 && newTournamentData.templateCode && (
                    <p style={{ fontSize: '12px', color: 'var(--color-text-muted, #4A6070)', marginTop: '6px', fontStyle: 'italic' }}>
                      {tournamentTemplates.find((t: any) => t.code === newTournamentData.templateCode)?.description}
                    </p>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '25px' }}>
                <button
                  className={styles.undoBtn}
                  style={{ flex: 1, margin: 0, background: 'var(--color-surface-hover, #141C2A)', color: 'var(--color-text, #C8D8E8)', border: '1px solid var(--color-border, rgba(167, 139, 250, 0.15))' }}
                  onClick={() => setIsCreatingTournament(false)}
                >
                  HỦY BỎ
                </button>
                <button
                  className={styles.finishBtn}
                  style={{ flex: 1, margin: 0, background: '#ef4444', color: '#fff', border: 'none' }}
                  onClick={handleCreateTournament}
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
              <h3 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--color-text-heading, #E8F4F8)' }}>
                ⚙️ CẤU HÌNH SMART SCHEDULER
              </h3>
              <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: 'var(--color-text-secondary, #A0B4C8)' }}>
                Thiết lập các thông số rải lịch và blackout dates để tự động tạo lịch đấu tối ưu.
              </p>

              {/* Scrollable Form Content */}
              <div style={{ flex: 1, overflowY: 'auto', paddingRight: '6px', display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '15px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className={styles.formGroup}>
                    <label className={styles.label} style={{ color: 'var(--color-text-secondary, #A0B4C8)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Ngày bắt đầu</label>
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
                    <label className={styles.label} style={{ color: 'var(--color-text-secondary, #A0B4C8)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Ngày kết thúc dự kiến</label>
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
                    <label className={styles.label} style={{ color: 'var(--color-text-secondary, #A0B4C8)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Thời lượng trận (phút)</label>
                    <input
                      type="number"
                      min="1"
                      className={styles.modalInput}
                      value={schedulerConfig.matchDurationMinutes}
                      onChange={(e) => updateSchedulerConfig({ matchDurationMinutes: Number(e.target.value) })}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label} style={{ color: 'var(--color-text-secondary, #A0B4C8)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Nghỉ giữa các trận (phút)</label>
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
                    <label className={styles.label} style={{ color: 'var(--color-text-secondary, #A0B4C8)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Khoảng cách trận tối thiểu (giờ)</label>
                    <input
                      type="number"
                      min="0"
                      className={styles.modalInput}
                      value={schedulerConfig.minRestHours}
                      onChange={(e) => updateSchedulerConfig({ minRestHours: Number(e.target.value) })}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label} style={{ color: 'var(--color-text-secondary, #A0B4C8)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Số trận cùng giờ (Sân khả dụng)</label>
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
                  <label className={styles.label} style={{ color: 'var(--color-text-secondary, #A0B4C8)', fontWeight: 600, display: 'block', marginBottom: '8px' }}>Ngày thi đấu trong tuần</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                    {['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'].map((dayName, idx) => {
                      const dayOfWeek = idx; 
                      const isChecked = schedulerConfig.playDays.find((d: any) => d.dayOfWeek === dayOfWeek)?.enabled || false;
                      return (
                        <button
                          key={dayName}
                          type="button"
                          onClick={() => {
                            let updatedPlayDays = [...schedulerConfig.playDays];
                            const existingIdx = updatedPlayDays.findIndex(d => d.dayOfWeek === dayOfWeek);
                            if (existingIdx >= 0) {
                              updatedPlayDays[existingIdx].enabled = !isChecked;
                            } else {
                              updatedPlayDays.push({ dayOfWeek, enabled: true });
                            }
                            updateSchedulerConfig({ playDays: updatedPlayDays });
                          }}
                          style={{
                            padding: '8px 10px',
                            borderRadius: '8px',
                            border: '1px solid',
                            borderColor: isChecked ? 'var(--color-primary)' : 'var(--color-border, rgba(167, 139, 250, 0.2))',
                            background: isChecked ? 'var(--color-primary-light)' : 'var(--color-surface-container, #0A0F18)',
                            color: isChecked ? 'var(--color-primary)' : 'var(--color-text, #C8D8E8)',
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
                    <label className={styles.label} style={{ color: 'var(--color-text-secondary, #A0B4C8)', fontWeight: 600, margin: 0 }}>Cấu hình Khung giờ (Time Slots)</label>
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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--color-surface-sidebar, #0A0F18)', padding: '8px', borderRadius: '8px', border: '1px solid var(--color-border, rgba(167, 139, 250, 0.15))' }}>
                    {schedulerConfig.timeSlots.length === 0 ? (
                      <span style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>Chưa cấu hình khung giờ nào.</span>
                    ) : (
                      schedulerConfig.timeSlots.map((slot: any, sIdx: number) => (
                        <div key={slot.id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontSize: '12px', color: 'var(--color-text-secondary, #A0B4C8)', minWidth: '40px' }}>Ca {sIdx + 1}:</span>
                          <input
                            type="time"
                            className={styles.modalInput}
                            style={{ margin: 0, padding: '4px 8px', width: '150px' }}
                            value={slot.startTime}
                            onChange={(e) => {
                              const updatedSlots = schedulerConfig.timeSlots.map((s: any) => 
                                s.id === slot.id ? { ...s, startTime: e.target.value } : s
                              );
                              updateSchedulerConfig({ timeSlots: updatedSlots });
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              updateSchedulerConfig({
                                timeSlots: schedulerConfig.timeSlots.filter((s: any) => s.id !== slot.id)
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
                  <label className={styles.label} style={{ color: 'var(--color-text-secondary, #A0B4C8)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Blackout Dates (Ngày nghỉ)</label>
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
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '120px', overflowY: 'auto', background: 'var(--color-surface-sidebar, #0A0F18)', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border-light, rgba(167, 139, 250, 0.08))' }}>
                      {blackoutDates.map((date: any) => (
                        <div key={date} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: 'var(--color-text, #C8D8E8)', fontWeight: 500 }}>
                          <span>📅 {date}</span>
                          <button
                            style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '16px', padding: '0 4px' }}
                            onClick={() => {
                              saveBlackoutDates(blackoutDates.filter((d: any) => d !== date));
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px', borderTop: '1px solid var(--color-border, rgba(167, 139, 250, 0.15))', paddingTop: '15px' }}>
                <button
                  className={styles.finishBtn}
                  style={{ width: '100%', margin: 0, justifyContent: 'center' }}
                  onClick={async () => {
                    await handleAutoSchedule();
                  }}
                >
                  ✨ SINH LỊCH ĐỀ XUẤT
                </button>

                <div style={{ display: 'flex', gap: '10px' }}>
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
              <h3 style={{ margin: '0 0 10px 0', fontSize: '20px', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--color-text-heading, #E8F4F8)' }}>
                {confirmDialog.title}
              </h3>
              <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: 'var(--color-text-secondary, #A0B4C8)', lineHeight: 1.5 }}>
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
                  onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
                >
                  ✕
                </button>
              )}

              <h3 style={{ margin: '0 0 6px 0', fontSize: '20px', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--color-text-heading, #E8F4F8)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>📥</span> NHẬP DỮ LIỆU TỔNG HỢP (EXCEL)
              </h3>
              <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: 'var(--color-text-secondary, #A0B4C8)' }}>
                Tải lên một file Excel duy nhất chứa cả thông tin <strong>Đội Bóng</strong> và <strong>Cầu Thủ</strong> để thiết lập nhanh chóng.
              </p>

              {/* Guide and Download template */}
              {!bulkImportProgress && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', background: 'var(--color-surface-sidebar, #0A0F18)', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--color-border-light, rgba(167, 139, 250, 0.08))', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap', fontSize: '13px', color: 'var(--color-text-secondary, #A0B4C8)' }}>
                    <span style={{ fontWeight: 600 }}>Lưu ý:</span>
                    <span>Sử dụng cấu trúc nhiều sheet (Đội Bóng, Cầu Thủ) như trong file mẫu.</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadBulkTemplate}
                    style={{ background: 'none', border: 'none', color: 'var(--color-primary, #a78bfa)', textDecoration: 'underline', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', padding: 0, transition: 'color 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-accent, #818cf8)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-primary, #a78bfa)'}
                  >
                    ⬇️ Tải file mẫu (.xlsx)
                  </button>
                </div>
              )}

              {/* Progress Bar Section */}
              {bulkImportProgress ? (
                <div style={{ padding: '20px', background: 'var(--color-surface-sidebar, #0A0F18)', borderRadius: '12px', border: '1px solid var(--color-border-light, rgba(167, 139, 250, 0.08))' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: bulkImportProgress.step === 'error' ? '#ef4444' : 'var(--color-text, #C8D8E8)' }}>
                      {bulkImportProgress.message}
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-primary)' }}>
                      {bulkImportProgress.percent}%
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'var(--color-surface-hover, #141C2A)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div 
                      style={{ 
                        width: `${bulkImportProgress.percent}%`, 
                        height: '100%', 
                        background: bulkImportProgress.step === 'error' ? '#ef4444' : (bulkImportProgress.step === 'done' ? '#10b981' : 'var(--color-primary)'),
                        transition: 'width 0.3s ease-out, background-color 0.3s ease'
                      }} 
                    />
                  </div>
                  {bulkImportProgress.step === 'error' && (
                    <button 
                      onClick={handleClearBulkImport}
                      style={{ marginTop: '16px', padding: '8px 16px', background: 'var(--color-surface-hover, #141C2A)', border: '1px solid var(--color-border, rgba(167, 139, 250, 0.15))', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-heading, #ffffff)' }}
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
                      background: isBulkDragActive ? 'rgba(167, 139, 250, 0.08)' : 'var(--color-surface-sidebar, #0A0F18)',
                      border: isBulkDragActive ? '2px dashed var(--color-primary)' : '2px dashed var(--color-border, rgba(167, 139, 250, 0.25))',
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
                      stroke={isBulkDragActive ? 'var(--color-primary)' : '#10b981'}
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
                    <p style={{ fontSize: '16px', color: 'var(--color-text-heading, #E8F4F8)', fontWeight: 600, margin: '0 0 6px 0' }}>
                      Kéo thả file Excel vào đây để tự động import
                    </p>
                    <p style={{ fontSize: '13px', color: 'var(--color-text-secondary, #A0B4C8)', margin: 0 }}>
                      Hoặc bấm để chọn file từ máy tính <span style={{ fontWeight: 600, color: 'var(--color-text-muted, #4A6070)' }}>(Hỗ trợ .xls, .xlsx)</span>
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
