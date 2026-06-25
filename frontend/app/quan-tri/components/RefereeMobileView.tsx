import React, { useState } from 'react';
import { getDisplayTime, quickAddPlayer } from '@/lib/api';
import TeamLogo from '@/components/TeamLogo';
import {
  IconGoal,
  IconCard,
  IconSwap,
  IconPlay,
  IconPause,
  IconStop,
  IconReset,
  IconCalendar,
  IconTrash,
  IconHome,
  IconAway
} from './RefereeIcons';

export default function RefereeMobileView({ data, actions }: any) {
  const {
    selectedMatch,
    filteredAndSortedRefereeMatches,
    refereeFilterVong,
    uniqueRounds,
    starterCount,
    customEvents,
    schedulerConfig,
  } = data;

  const {
    setSelectedMatchId,
    formatMatchTime,
    handleStartMatch,
    handlePauseMatch,
    handleResumeMatch,
    handleFinishMatch,
    handleResetMatch,
    handleInlineUpdateMatch,
    handleActionSelect,
    setRefereeFilterVong,
    calculateCurrentRoster,
    handleExecuteSubstitution,
    handleTemporaryPauseToggle,
    getMatchHalfState,
    handleDelayMatchSchedule,
    handleDeleteEvent,
    handleQuickAddPlayerSuccess,
  } = actions;

  const parseVongDetails = (vongStr: string = '') => {
    const str = vongStr.trim();
    const matchNew = str.match(/Vòng\s+(\d+)\s+-\s+Bảng\s+([A-Z])/i);
    if (matchNew) return { bang: `Bảng ${matchNew[2]}`, vong: `Vòng ${matchNew[1]}` };
    const matchOld = str.match(/Bảng\s+([A-Z])\s+-\s+Vòng\s+(\d+)/i);
    if (matchOld) return { bang: `Bảng ${matchOld[1]}`, vong: `Vòng ${matchOld[2]}` };
    return { bang: '', vong: str };
  };

  const formatDateLabel = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const day = d.getDate();
      const month = d.getMonth() + 1;
      const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
      const dayName = days[d.getDay()];
      return `${dayName}, ${day} Thg ${month}`;
    } catch (e) {
      return dateStr;
    }
  };

  const getRoundDateRange = () => {
    const roundMatches = filteredAndSortedRefereeMatches?.filter((m: any) => {
      if (refereeFilterVong === 'NONE') return true;
      const { vong } = parseVongDetails(m.vong);
      return vong === refereeFilterVong;
    }) || [];

    const dates = roundMatches
      .map((m: any) => m.date)
      .filter(Boolean)
      .sort();

    if (dates.length === 0) return 'Chưa xếp lịch';
    if (dates.length === 1) {
      return formatDateLabel(dates[0]);
    }
    return `${formatDateLabel(dates[0])} - ${formatDateLabel(dates[dates.length - 1])}`;
  };

  const handlePrevRound = () => {
    if (!uniqueRounds || uniqueRounds.length === 0) return;
    const idx = uniqueRounds.indexOf(refereeFilterVong);
    if (idx > 0) {
      setRefereeFilterVong(uniqueRounds[idx - 1]);
    }
  };

  const handleNextRound = () => {
    if (!uniqueRounds || uniqueRounds.length === 0) return;
    const idx = uniqueRounds.indexOf(refereeFilterVong);
    if (idx < uniqueRounds.length - 1 && idx !== -1) {
      setRefereeFilterVong(uniqueRounds[idx + 1]);
    }
  };

  // Wizard state for action selections (goal, yellow card, red card, sub)
  const [activeWizard, setActiveWizard] = useState<{
    type: 'goal' | 'yellow' | 'red' | 'sub' | 'custom';
    step?: 1 | 2;
    subOutPlayer?: any;
    subType?: string;
    requiresPlayer?: boolean;
    minute?: number | string;
    presetTeamId?: string; // auto-locked team when opened from team row button
  } | null>(null);

  const [delayModalState, setDelayModalState] = useState<{ isOpen: boolean, date: string, time: string, strategy: 'single' | 'shift' | 'postpone' }>({ isOpen: false, date: '', time: '', strategy: 'single' });
  const [activeTeamTab, setActiveTeamTab] = useState<'nha' | 'khach'>('nha');

  const [quickAddPlayerModalState, setQuickAddPlayerModalState] = useState<{
    isOpen: boolean;
    teamId: string;
    name: string;
    jerseyNumber: string;
    isSaving: boolean;
  }>({
    isOpen: false,
    teamId: '',
    name: '',
    jerseyNumber: '',
    isSaving: false
  });

  const handleSaveQuickPlayer = async () => {
    if (!quickAddPlayerModalState.name || !quickAddPlayerModalState.jerseyNumber) return;
    if (!selectedMatch) return;
    setQuickAddPlayerModalState(prev => ({ ...prev, isSaving: true }));
    try {
      const { data } = await quickAddPlayer(
        selectedMatch.id,
        quickAddPlayerModalState.teamId,
        quickAddPlayerModalState.name,
        parseInt(quickAddPlayerModalState.jerseyNumber)
      );
      if (handleQuickAddPlayerSuccess) {
        handleQuickAddPlayerSuccess(quickAddPlayerModalState.teamId, data);
      }
      setQuickAddPlayerModalState(prev => ({ ...prev, isOpen: false, name: '', jerseyNumber: '' }));
    } catch (err) {
      console.error(err);
      alert("Lỗi khi thêm nhanh cầu thủ");
    } finally {
      setQuickAddPlayerModalState(prev => ({ ...prev, isSaving: false }));
    }
  };

  // React inline styles mapped directly from your Tailwind design specs
  const styles = {
    container: {
      background: 'var(--color-bg, #080C10)',
      minHeight: 'calc(100vh - 80px)',
      display: 'flex',
      flexDirection: 'column' as const,
      padding: '24px 16px 80px 16px', // py-6 px-4 (with bottom tab bar spacing)
      margin: '-16px -16px 0 -16px', // offset default main tab padding
      fontFamily: 'Inter, sans-serif',
      boxSizing: 'border-box' as const
    },
    title: {
      fontSize: '20px',
      fontWeight: 800,
      color: 'var(--color-text-heading, #E8F4F8)',
      marginTop: '8px',
      marginBottom: '4px'
    },
    subtitle: {
      fontSize: '13px',
      color: 'var(--color-text-secondary, #A0B4C8)',
      marginBottom: '16px'
    },
    listContainer: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '16px',
      paddingBottom: '80px',
      boxSizing: 'border-box' as const
    },
    matchCard: {
      background: '#141C2A',
      padding: '20px',
      borderRadius: '16px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
      border: '1px solid #1e293b',
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '12px',
      cursor: 'pointer',
      transition: 'transform 0.1s ease',
      boxSizing: 'border-box' as const
    },
    cardHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    roundBadge: {
      fontSize: '11px',
      fontWeight: 700,
      color: 'var(--color-primary, #0f766e)',
      background: '#064e3b',
      padding: '4px 8px',
      borderRadius: '6px'
    },
    statusText: (trangThai: string) => ({
      fontSize: '11px',
      fontWeight: 700,
      color: trangThai === 'DANG_DIEN_RA' ? '#ef4444' : '#94a3b8'
    }),
    matchInfo: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontWeight: 'bold',
      fontSize: '15px'
    },
    teamCol: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      flex: 1,
      gap: '6px'
    },
    logoContainer: {
      width: '44px',
      height: '44px',
      background: '#1e293b',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      border: '1px solid #334155'
    },
    teamName: {
      textAlign: 'center' as const,
      fontSize: '13px',
      fontWeight: 600,
      color: '#e2e8f0',
      maxWidth: '100px',
      whiteSpace: 'nowrap' as const,
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    },
    scoreText: {
      padding: '6px 12px',
      fontSize: '22px',
      fontWeight: 900,
      color: '#f8fafc',
      background: '#1e293b',
      borderRadius: '10px',
      minWidth: '64px',
      textAlign: 'center' as const
    },
    noMatches: {
      textAlign: 'center' as const,
      padding: '40px 0',
      color: '#94a3b8',
      fontSize: '14px'
    },

    // 2. Scoreboard Card layout
    scoreboardCard: {
      background: '#141C2A',
      borderRadius: '16px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
      padding: '24px',
      marginBottom: '24px',
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      textAlign: 'center' as const,
      boxSizing: 'border-box' as const
    },
    scoreboardHeader: {
      display: 'flex',
      justifyContent: 'flex-start',
      width: '100%',
      marginBottom: '16px'
    },
    backButton: {
      color: 'var(--color-text, #C8D8E8)',
      fontSize: '12px',
      fontWeight: 700,
      padding: '6px 12px',
      background: 'var(--color-surface-hover, #141C2A)',
      border: '1px solid var(--color-border-light, rgba(0, 212, 184, 0.08))',
      borderRadius: '8px',
      cursor: 'pointer'
    },
    teamsRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      width: '100%',
      marginBottom: '8px'
    },
    scoreContainer: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      gap: '8px'
    },
    scoreboardScore: {
      fontSize: '36px',
      fontWeight: 900,
      color: '#f8fafc',
      letterSpacing: '1px'
    },
    timerPeriod: {
      color: '#94a3b8',
      fontWeight: 500,
      fontSize: '14px',
      marginBottom: '8px'
    },
    timerClock: {
      fontSize: '48px',
      fontWeight: 900,
      color: '#f8fafc',
      marginBottom: '24px',
      fontFamily: 'monospace'
    },
    controlButtonFull: (bgColor: string, textColor: string = '#ffffff') => ({
      width: '100%',
      padding: '12px 0',
      background: bgColor,
      color: textColor,
      borderRadius: '12px',
      fontWeight: 700,
      fontSize: '18px',
      border: 'none',
      cursor: 'pointer',
      transition: 'transform 0.1s ease',
      boxSizing: 'border-box' as const,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px'
    }),
    controlButtonSecondaryFull: {
      width: '100%',
      padding: '10px 0',
      background: 'var(--color-surface-hover, #141C2A)',
      color: 'var(--color-text-secondary, #A0B4C8)',
      borderRadius: '12px',
      fontWeight: 600,
      fontSize: '13px',
      border: '1px solid var(--color-border-light, rgba(0, 212, 184, 0.08))',
      cursor: 'pointer',
      marginTop: '8px',
      boxSizing: 'border-box' as const
    },

    // 3. Action Grid layout
    actionZoneGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '16px',
      marginBottom: '24px',
      boxSizing: 'border-box' as const
    },
    actionButton: (bg: string, color: string, border: string) => ({
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      borderRadius: '16px',
      fontWeight: 'bold' as const,
      color: color,
      minHeight: '110px',
      background: bg,
      border: border,
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      boxSizing: 'border-box' as const
    }),
    actionButtonLabel: {
      marginTop: '8px',
      fontSize: '15px',
      fontWeight: 700,
      color: 'inherit'
    },

    // 4. Timeline layout
    timelineSection: {
      background: '#141C2A',
      borderRadius: '16px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
      padding: '20px',
      marginBottom: '60px',
      boxSizing: 'border-box' as const
    },
    timelineTitle: {
      color: '#e2e8f0',
      fontWeight: 700,
      fontSize: '18px',
      marginBottom: '16px',
      borderBottom: '1px solid #1e293b',
      paddingBottom: '12px'
    },
    timelineList: {
      listStyleType: 'none',
      padding: 0,
      margin: 0
    },
    timelineItem: {
      borderBottom: '1px solid #1e293b',
      padding: '12px 0',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      boxSizing: 'border-box' as const
    },
    timelineTime: {
      fontWeight: 700,
      color: '#94a3b8',
      width: '32px',
      fontSize: '13px',
      flexShrink: 0
    },
    timelineIcon: {
      fontSize: '18px',
      flexShrink: 0
    },
    timelineText: {
      color: '#cbd5e1',
      fontSize: '13px',
      fontWeight: 500
    },

    // 5. Modal / Bottom Sheet layout
    modalOverlay: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(5, 8, 16, 0.8)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column' as const,
      justifyContent: 'flex-end',
      backdropFilter: 'blur(8px)'
    },
    modalContent: {
      background: 'var(--color-surface, #0E1421)',
      borderTopLeftRadius: '24px',
      borderTopRightRadius: '24px',
      padding: '24px 20px',
      maxHeight: '80vh',
      display: 'flex',
      flexDirection: 'column' as const,
      boxShadow: '0 -10px 25px -5px rgba(0, 0, 0, 0.5)',
      borderTop: '1px solid var(--color-border, rgba(0, 212, 184, 0.15))',
      borderLeft: '1px solid var(--color-border, rgba(0, 212, 184, 0.15))',
      borderRight: '1px solid var(--color-border, rgba(0, 212, 184, 0.15))',
      boxSizing: 'border-box' as const
    },
    modalHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px'
    },
    modalTitle: {
      fontSize: '18px',
      fontWeight: 800,
      color: 'var(--color-text-heading, #E8F4F8)',
      margin: 0,
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    modalCloseBtn: {
      fontSize: '13px',
      fontWeight: 700,
      color: 'var(--color-text, #C8D8E8)',
      background: 'var(--color-surface-hover, #141C2A)',
      border: '1px solid var(--color-border-light, rgba(0, 212, 184, 0.08))',
      padding: '8px 16px',
      borderRadius: '8px',
      cursor: 'pointer'
    },
    segmentControl: {
      display: 'flex',
      background: 'var(--color-surface-hover, #141C2A)',
      border: '1px solid var(--color-border-light, rgba(0, 212, 184, 0.08))',
      padding: '4px',
      borderRadius: '12px',
      marginBottom: '20px',
      boxSizing: 'border-box' as const
    },
    segmentBtn: (isActive: boolean) => ({
      flex: 1,
      padding: '10px 4px',
      textAlign: 'center' as const,
      fontSize: '13px',
      fontWeight: isActive ? 700 : 500,
      color: isActive ? '#080C10' : 'var(--color-text-secondary, #A0B4C8)',
      background: isActive ? 'var(--color-primary, #00D4B8)' : 'transparent',
      borderRadius: '8px',
      border: 'none',
      cursor: 'pointer',
      boxShadow: isActive ? '0 2px 8px rgba(0, 212, 184, 0.2)' : 'none',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap' as const,
      overflow: 'hidden'
    }),
    playerList: {
      overflowY: 'auto' as const,
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '8px',
      paddingBottom: '20px',
      boxSizing: 'border-box' as const
    },
    playerRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px',
      borderRadius: '12px',
      background: 'var(--color-surface, #0E1421)',
      borderBottom: '1px solid var(--color-border-light, rgba(0, 212, 184, 0.08))',
      cursor: 'pointer',
      transition: 'all 0.1s ease',
      boxSizing: 'border-box' as const
    },
    playerJersey: {
      width: '28px',
      height: '28px',
      borderRadius: '50%',
      background: 'var(--color-surface-hover, #141C2A)',
      color: 'var(--color-text, #C8D8E8)',
      fontWeight: 700,
      fontSize: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    playerName: {
      fontSize: '14px',
      fontWeight: 600,
      color: 'var(--color-text, #C8D8E8)'
    }
  };

  // 1. Nếu chưa chọn trận đấu -> Hiển thị danh sách trận đấu
  if (!selectedMatch) {
    return (
      <div style={styles.container}>
        <h2 style={styles.title}>Trung tâm Điều khiển</h2>
        <p style={styles.subtitle}>Chọn một trận đấu để bắt đầu điều khiển và cập nhật tỉ số</p>

        {uniqueRounds && uniqueRounds.length > 0 && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 0 20px 0',
            padding: '12px 16px',
            background: '#141C2A',
            borderRadius: '16px',
            border: '1px solid #1e293b',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            gap: '12px'
          }}>
            {/* Filter Dropdown on Top */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Chọn nhanh vòng:</span>
              <select
                value={refereeFilterVong}
                onChange={(e) => setRefereeFilterVong(e.target.value)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: '1px solid #334155',
                  background: '#1e293b',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#f1f5f9',
                  outline: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                }}
              >
                {uniqueRounds.map((r: string) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {(() => {
              const currentIdx = uniqueRounds.indexOf(refereeFilterVong);
              const isFirstRound = currentIdx <= 0;
              const isLastRound = currentIdx >= uniqueRounds.length - 1 || currentIdx === -1;
              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                  <button
                    onClick={handlePrevRound}
                    disabled={isFirstRound}
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      border: '1px solid #334155',
                      background: '#1e293b',
                      color: isFirstRound ? '#475569' : '#f1f5f9',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: isFirstRound ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                      outline: 'none',
                      fontWeight: 'bold',
                      opacity: isFirstRound ? 0.4 : 1,
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)'
                    }}
                    title="Vòng trước"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                  </button>
                  <div style={{ textAlign: 'center', minWidth: '130px' }}>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: '#f1f5f9' }}>
                      {refereeFilterVong === 'NONE' ? 'Không có vòng đấu' : refereeFilterVong}
                    </div>
                    <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 600, marginTop: '4px' }}>
                      {getRoundDateRange()}
                    </div>
                  </div>
                  <button
                    onClick={handleNextRound}
                    disabled={isLastRound}
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      border: '1px solid #334155',
                      background: '#1e293b',
                      color: isLastRound ? '#475569' : '#f1f5f9',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: isLastRound ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                      outline: 'none',
                      fontWeight: 'bold',
                      opacity: isLastRound ? 0.4 : 1,
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)'
                    }}
                    title="Vòng sau"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </button>
                </div>
              );
            })()}
          </div>
        )}

        <div style={styles.listContainer}>
          {filteredAndSortedRefereeMatches?.map((m: any) => (
            <div
              key={m.id}
              style={styles.matchCard}
              onClick={() => setSelectedMatchId(m.id)}
            >
              <div style={styles.cardHeader}>
                <span style={styles.roundBadge}>{m.vong}</span>
                <span style={styles.statusText(m.trangThai)}>
                  {m.trangThai === 'DANG_DIEN_RA' ? 'LIVE' : m.trangThai === 'KET_THUC' ? 'KẾT THÚC' : 'CHƯA ĐÁ'}
                </span>
              </div>
              <div style={styles.matchInfo}>
                <div style={styles.teamCol}>
                  <div style={styles.logoContainer}>
                    <TeamLogo logo={m.doiNha?.logo} />
                  </div>
                  <span style={styles.teamName}>{m.doiNha?.ten || 'Đội nhà'}</span>
                </div>
                <div style={styles.scoreText}>
                  {m.tyNha} - {m.tyKhach}
                </div>
                <div style={styles.teamCol}>
                  <div style={styles.logoContainer}>
                    <TeamLogo logo={m.doiKhach?.logo} />
                  </div>
                  <span style={styles.teamName}>{m.doiKhach?.ten || 'Đội khách'}</span>
                </div>
              </div>
            </div>
          ))}
          {(!filteredAndSortedRefereeMatches || filteredAndSortedRefereeMatches.length === 0) && (
            <div style={styles.noMatches}>Không có trận đấu nào</div>
          )}
        </div>
      </div>
    );
  }

  const isFinished = selectedMatch.trangThai === 'KET_THUC';

  // Render the Start / Pause / Finish control button
  const renderControlButton = () => {
    const halfState = getMatchHalfState(selectedMatch);

    if (halfState === '1_not_started') {
      return (
        <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
          <button
            style={{ ...styles.controlButtonFull('#10b981'), flex: 1 }}
            onClick={() => handleStartMatch(selectedMatch.id)}
          >
            <IconPlay size={18} color="#ffffff" />
            Bắt đầu hiệp 1
          </button>
          {handleDelayMatchSchedule && (
            <button
              style={{ ...styles.controlButtonFull('#f59e0b'), flex: 0.5 }}
              onClick={() => setDelayModalState({ isOpen: true, date: selectedMatch.date || '', time: selectedMatch.time || '', strategy: 'single' })}
            >
              <IconCalendar size={18} color="#ffffff" />
              Lùi lịch
            </button>
          )}
        </div>
      );
    }

    if (halfState === '1_active') {
      return (
        <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
          <button
            style={{ ...styles.controlButtonFull('#f59e0b'), flex: 1 }}
            onClick={() => handlePauseMatch(selectedMatch.id)}
          >
            <IconPause size={18} color="#ffffff" />
            Kết thúc Hiệp 1
          </button>
        </div>
      );
    }

    if (halfState === 'half_time') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
          <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 600, marginBottom: '8px', display: 'block', textAlign: 'center' }}>
            Đang nghỉ giữa hiệp
          </span>
          <button
            style={styles.controlButtonFull('#10b981')}
            onClick={() => handleResumeMatch(selectedMatch.id)}
          >
            <IconPlay size={18} color="#ffffff" />
            Bắt đầu Hiệp 2
          </button>
        </div>
      );
    }

    if (halfState === '2_active') {
      return (
        <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
          <button
            style={{ ...styles.controlButtonFull('#ef4444'), flex: 1 }}
            onClick={() => handleFinishMatch(selectedMatch.id)}
          >
            <IconStop size={18} color="#ffffff" />
            Kết thúc trận đấu
          </button>
        </div>
      );
    }

    return null;
  };

  // Render player selection modal when logging events
  const renderPlayerSelectorModal = () => {
    if (!activeWizard) return null;

    const { type, step, subOutPlayer } = activeWizard;
    const homeTeam = selectedMatch.doiNha;
    const awayTeam = selectedMatch.doiKhach;

    const activeTeam = activeTeamTab === 'nha' ? homeTeam : awayTeam;
    
    // Calculate starters and bench dynamically
    const { starters, bench } = calculateCurrentRoster(activeTeam, selectedMatch.suKien, starterCount);

    let playersToShow = starters;
    if (type === 'sub') {
      playersToShow = step === 2 ? bench : starters;
    }

    const getTitle = () => {
      if (type === 'goal') return '⚽ Ghi nhận Bàn thắng';
      if (type === 'yellow') return '🟨 Phạt Thẻ vàng';
      if (type === 'red') return '🟥 Phạt Thẻ đỏ';
      if (type === 'sub') {
        return step === 1 ? '🔄 Thay người: Chọn cầu thủ RA SÂN' : '🔄 Thay người: Chọn cầu thủ VÀO SÂN';
      }
      if (type === 'custom') {
        const customEvt = customEvents?.find((e: any) => e.code === activeWizard.subType);
        return `${customEvt?.icon} ${customEvt?.name}`;
      }
      return 'Chọn cầu thủ';
    };

    const handlePlayerSelect = async (player: any) => {
      const teamId = activeTeam?.id;
      if (!teamId) return;

      try {
        if (type === 'goal') {
          await handleActionSelect('goal', 'normal', { teamId, matchId: selectedMatch.id, player, minute: activeWizard.minute });
          setActiveWizard(null);
        } else if (type === 'yellow') {
          await handleActionSelect('card', 'yellow', { teamId, matchId: selectedMatch.id, player, minute: activeWizard.minute });
          setActiveWizard(null);
        } else if (type === 'red') {
          await handleActionSelect('card', 'red', { teamId, matchId: selectedMatch.id, player, minute: activeWizard.minute });
          setActiveWizard(null);
        } else if (type === 'custom') {
          await handleActionSelect('custom', activeWizard.subType, { teamId, matchId: selectedMatch.id, player, minute: activeWizard.minute });
          setActiveWizard(null);
        } else if (type === 'sub') {
          if (step === 1) {
            setActiveWizard({
              ...activeWizard,
              type: 'sub',
              step: 2,
              subOutPlayer: player
            });
          } else {
            await handleExecuteSubstitution(player, subOutPlayer, teamId, activeWizard.minute);
            setActiveWizard(null);
          }
        }
      } catch (e) {
        console.error(e);
      }
    };

    const handleTeamActionSelect = async () => {
      const teamId = activeTeam?.id;
      if (!teamId) return;
      try {
        if (type === 'custom') {
          // Send a dummy player since requires_player is false
          await handleActionSelect('custom', activeWizard.subType, { teamId, matchId: selectedMatch.id, player: { id: null, ten: 'Toàn Đội' }, minute: activeWizard.minute });
          setActiveWizard(null);
        }
      } catch (e) {
        console.error(e);
      }
    };

    const showSegmentControl = type !== 'sub' || step === 1;
    const isCustomNoPlayer = type === 'custom' && activeWizard.requiresPlayer === false;

    return (
      <div style={styles.modalOverlay} onClick={() => setActiveWizard(null)}>
        <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
          {/* Modal Header */}
          <div style={styles.modalHeader}>
            <h3 style={styles.modalTitle}>{getTitle()}</h3>
            <button style={styles.modalCloseBtn} onClick={() => setActiveWizard(null)}>
              Đóng
            </button>
          </div>

          {/* Segment Control / Tabs - chỉ hiện khi chưa lock team */}
          {showSegmentControl && !activeWizard.presetTeamId ? (
            <div style={styles.segmentControl}>
              <button
                style={styles.segmentBtn(activeTeamTab === 'nha')}
                onClick={() => setActiveTeamTab('nha')}
              >
                {homeTeam?.ten || 'Đội nhà'}
              </button>
              <button
                style={styles.segmentBtn(activeTeamTab === 'khach')}
                onClick={() => setActiveTeamTab('khach')}
              >
                {awayTeam?.ten || 'Đội khách'}
              </button>
            </div>
          ) : showSegmentControl && activeWizard.presetTeamId ? (
            // Locked pill - show which team is pre-selected
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px 16px',
              borderRadius: '10px',
              background: activeTeamTab === 'nha' ? 'rgba(59,130,246,0.12)' : 'rgba(249,115,22,0.12)',
              border: `1px solid ${activeTeamTab === 'nha' ? 'rgba(59,130,246,0.3)' : 'rgba(249,115,22,0.3)'}`,
              gap: '8px',
              fontSize: '13px',
              fontWeight: 700,
              color: activeTeamTab === 'nha' ? '#93c5fd' : '#fdba74',
              marginBottom: '12px',
            }}>
              {activeTeamTab === 'nha'
                ? <>{homeTeam?.ten || 'Đội nhà'}</>
                : <>{awayTeam?.ten || 'Đội khách'}</>}
            </div>
          ) : (
            <div style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: '16px', color: 'var(--color-primary, #0f766e)' }}>
              Đội bóng: {activeTeam?.ten} (Thay {subOutPlayer?.ten} ra)
            </div>
          )}

          {/* Nút Thêm Nhanh Cầu Thủ */}
          {showSegmentControl && selectedMatch.trangThai !== 'KET_THUC' && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px', padding: '0 4px' }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setQuickAddPlayerModalState({
                    isOpen: true,
                    teamId: activeTeam?.id || '',
                    name: '',
                    jerseyNumber: '',
                    isSaving: false
                  });
                }}
                style={{
                  background: 'none', border: 'none', color: 'var(--color-primary, #00D4B8)',
                  fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                }}
              >
                ➕ Thêm nhanh cầu thủ
              </button>
            </div>
          )}

          <div style={{ padding: '0 16px', marginTop: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <label style={{ fontSize: '14px', fontWeight: 600, color: '#475569', minWidth: '90px' }}>Phút thi đấu:</label>
            <input 
              type="number" 
              placeholder={selectedMatch.trangThai === 'DANG_DIEN_RA' ? String(selectedMatch.phut || 0) : 'Ví dụ: 45'}
              value={activeWizard.minute || ''}
              onChange={e => setActiveWizard({...activeWizard, minute: e.target.value} as any)}
              style={{ flex: 1, padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '16px', backgroundColor: '#fff' }}
            />
          </div>

          {/* Player List or Apply Button */}
          {isCustomNoPlayer ? (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '24px' }}>
              <button
                style={styles.controlButtonFull('var(--color-primary, #0f766e)')}
                onClick={handleTeamActionSelect}
              >
                Áp dụng cho {activeTeam?.ten}
              </button>
            </div>
          ) : (
            <div style={styles.playerList}>
              {playersToShow.map((p: any) => {
                const yellowCount = selectedMatch.suKien?.filter((ev: any) => ev.loai === 'THE_VANG' && ev.cauThuId === p.id).length || 0;
                const hasRedCard = selectedMatch.suKien?.some((ev: any) => ev.loai === 'THE_DO' && ev.cauThuId === p.id) || yellowCount >= 2;
                const goalCount = selectedMatch.suKien?.filter((ev: any) => ev.loai.startsWith('GOAL_') && ev.loai !== 'GOAL_OG' && ev.cauThuId === p.id).length || 0;

                const isRedCarded = hasRedCard;
                const isDisabled = isRedCarded;

                return (
                  <button
                    key={p.id}
                    style={{
                      ...styles.playerRow,
                      opacity: isDisabled ? 0.5 : 1,
                      cursor: isDisabled ? 'not-allowed' : 'pointer',
                      width: '100%',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      borderBottom: '1px solid #1e293b',
                      background: '#141C2A',
                      outline: 'none'
                    }}
                    onClick={() => !isDisabled && handlePlayerSelect(p)}
                    disabled={isDisabled}
                  >
                    <div style={styles.playerJersey}>
                      {p.soAo || '#'}
                    </div>
                    <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={styles.playerName}>{p.ten}</span>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        {goalCount > 0 && (
                          <span style={{ fontSize: '12px', background: 'rgba(0, 212, 184, 0.15)', color: 'var(--color-primary, #00D4B8)', padding: '2px 6px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '2px', border: '1px solid rgba(0, 212, 184, 0.3)' }}>
                            ⚽ {goalCount}
                          </span>
                        )}
                        {yellowCount > 0 && (
                          <span style={{ fontSize: '12px', background: 'rgba(251, 191, 36, 0.15)', color: '#fbbf24', padding: '2px 6px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '2px', border: '1px solid rgba(251, 191, 36, 0.3)' }}>
                            🟨 {yellowCount}
                          </span>
                        )}
                        {hasRedCard && (
                          <span style={{ fontSize: '12px', background: 'rgba(244, 63, 94, 0.15)', color: '#f43f5e', padding: '2px 6px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '2px', border: '1px solid rgba(244, 63, 94, 0.3)', fontWeight: 'bold' }}>
                            🟥 Thẻ đỏ
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
              {playersToShow.length === 0 && (
                <div style={styles.noMatches}>
                  Chưa có danh sách cầu thủ của đội bóng này.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // 2. Màn hình Console khi đã chọn trận (Chuẩn thao tác hiện trường)
  return (
    <div style={styles.container}>

      {/* 2. Khối Đồng hồ & Tỷ số (Scoreboard Card) */}
      <div style={styles.scoreboardCard}>
        {/* Back button row */}
        <div style={styles.scoreboardHeader}>
          <button onClick={() => setSelectedMatchId(null)} style={styles.backButton}>
            ← Trở về
          </button>
        </div>

        {/* Teams and score display */}
        <div style={styles.teamsRow}>
          <div style={styles.teamCol}>
            <div style={styles.logoContainer}>
              <TeamLogo logo={selectedMatch.doiNha?.logo} />
            </div>
            <span style={styles.teamName}>{selectedMatch.doiNha?.ten}</span>
          </div>

          <div style={styles.scoreContainer}>
            <div style={styles.scoreboardScore}>
              {selectedMatch.tyNha} - {selectedMatch.tyKhach}
            </div>
          </div>

          <div style={styles.teamCol}>
            <div style={styles.logoContainer}>
              <TeamLogo logo={selectedMatch.doiKhach?.logo} />
            </div>
            <span style={styles.teamName}>{selectedMatch.doiKhach?.ten}</span>
          </div>
        </div>

        {/* Divider Line */}
        <div style={{ width: '100%', height: '1px', background: '#1e293b', margin: '20px 0' }} />

        {/* Timer State & Clock */}
        <div style={styles.timerPeriod}>
          {selectedMatch.currentPeriod === 'HALF_1' ? 'Hiệp 1'
            : selectedMatch.currentPeriod === 'BREAK' ? 'Nghỉ giữa hiệp'
            : selectedMatch.currentPeriod === 'HALF_2' ? 'Hiệp 2'
            : isFinished ? 'Trận đấu kết thúc' : 'Chưa bắt đầu'}
        </div>
        <div style={styles.timerClock}>
          {getDisplayTime(selectedMatch, schedulerConfig?.matchDurationMinutes || 90)}
        </div>

        {/* Controls Container */}
        <div style={{ width: '100%' }}>
          {renderControlButton()}

          {/* Reset Button (Demo Mode - always available below primary controls) */}
          <button
            style={styles.controlButtonSecondaryFull}
            onClick={() => handleResetMatch(selectedMatch.id)}
          >
            <IconReset size={13} color="#64748b" />
            Reset (Đặt lại trận đấu)
          </button>
        </div>
      </div>

      {/* 3. Khu vực Nút Thao tác - Chia theo từng Đội */}
      {(() => {
        const actionsDisabled = selectedMatch.trangThai !== 'DANG_DIEN_RA';

        const renderTeamRow = (team: any, isHome: boolean) => {
          const teamId = team?.id;
          const teamName = team?.ten || (isHome ? 'Đội nhà' : 'Đội khách');
          const accentColor = isHome ? '#60a5fa' : '#fb923c';
          const accentBg = isHome ? 'rgba(59,130,246,0.07)' : 'rgba(249,115,22,0.07)';
          const accentBorder = isHome ? 'rgba(59,130,246,0.18)' : 'rgba(249,115,22,0.18)';

          const openTeamWizard = (type: 'goal' | 'yellow' | 'red' | 'sub', subType?: string) => {
            // Set the team tab to match the team row clicked
            setActiveTeamTab(isHome ? 'nha' : 'khach');
            setActiveWizard({
              type,
              subType,
              step: type === 'sub' ? 1 : undefined,
              presetTeamId: teamId,
            });
          };

          const btnStyle = (borderColor: string, bgColor: string): React.CSSProperties => ({
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '5px',
            padding: '10px 4px',
            borderRadius: '10px',
            border: `1px solid ${actionsDisabled ? 'transparent' : borderColor}`,
            background: actionsDisabled ? 'rgba(255,255,255,0.03)' : bgColor,
            cursor: actionsDisabled ? 'not-allowed' : 'pointer',
            opacity: actionsDisabled ? 0.38 : 1,
            fontSize: '9px',
            fontWeight: 800,
            letterSpacing: '0.04em',
            color: '#94a3b8',
            transition: 'all 0.15s',
          });

          return (
            <div style={{
              background: accentBg,
              border: `1px solid ${accentBorder}`,
              borderRadius: '14px',
              padding: '10px 10px 10px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}>
              {/* Team header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '10px',
                fontWeight: 800,
                color: accentColor,
                textTransform: 'uppercase',
                letterSpacing: '0.07em',
              }}>
                {isHome ? <IconHome size={12} /> : <IconAway size={12} />}
                {teamName}
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: '6px' }}>
                {/* GOAL */}
                <button
                  disabled={actionsDisabled}
                  style={btnStyle('rgba(34,197,94,0.3)', 'rgba(34,197,94,0.1)')}
                  onClick={() => openTeamWizard('goal')}
                >
                  <IconGoal size={22} color={actionsDisabled ? '#475569' : '#4ade80'} />
                  <span style={{ color: actionsDisabled ? '#475569' : '#4ade80' }}>GHI BÀN</span>
                </button>

                {/* YELLOW */}
                <button
                  disabled={actionsDisabled}
                  style={btnStyle('rgba(234,179,8,0.3)', 'rgba(234,179,8,0.1)')}
                  onClick={() => openTeamWizard('yellow')}
                >
                  <IconCard size={22} color={actionsDisabled ? '#475569' : '#facc15'} />
                  <span style={{ color: actionsDisabled ? '#475569' : '#facc15' }}>THẺ VÀNG</span>
                </button>

                {/* RED */}
                <button
                  disabled={actionsDisabled}
                  style={btnStyle('rgba(239,68,68,0.3)', 'rgba(239,68,68,0.1)')}
                  onClick={() => openTeamWizard('red')}
                >
                  <IconCard size={22} color={actionsDisabled ? '#475569' : '#f87171'} />
                  <span style={{ color: actionsDisabled ? '#475569' : '#f87171' }}>THẺ ĐỎ</span>
                </button>

                {/* SUB */}
                <button
                  disabled={actionsDisabled}
                  style={btnStyle('rgba(0,212,184,0.25)', 'rgba(0,212,184,0.08)')}
                  onClick={() => openTeamWizard('sub')}
                >
                  <IconSwap size={22} color={actionsDisabled ? '#475569' : '#2dd4bf'} />
                  <span style={{ color: actionsDisabled ? '#475569' : '#2dd4bf' }}>THAY NGƯỜI</span>
                </button>
              </div>
            </div>
          );
        };

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '8px' }}>
            {renderTeamRow(selectedMatch.doiNha, true)}
            {renderTeamRow(selectedMatch.doiKhach, false)}

            {/* Custom events (still shared, below team rows) */}
            {customEvents && customEvents.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginTop: '4px' }}>
                {customEvents.map((evt: any) => {
                  const themeColor = evt.color || '#3b82f6';
                  const transparentBg = `${themeColor}1a`;
                  const borderStyle = `1px solid ${themeColor}4d`;
                  return (
                    <button
                      key={evt.code}
                      disabled={actionsDisabled}
                      style={{
                        ...styles.actionButton(transparentBg, themeColor, borderStyle),
                        opacity: actionsDisabled ? 0.5 : 1,
                        cursor: actionsDisabled ? 'not-allowed' : 'pointer'
                      }}
                      onClick={() => setActiveWizard({ type: 'custom', subType: evt.code, requiresPlayer: evt.target_scope !== 'none' })}
                    >
                      <div style={{ fontSize: '28px' }}>{evt.icon}</div>
                      <span style={{ ...styles.actionButtonLabel, textAlign: 'center' }}>{evt.name?.toUpperCase()}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

      {/* 4. Khối Biên niên sự kiện (Timeline) */}
      <div style={styles.timelineSection}>
        <div style={styles.timelineTitle}>Diễn biến trận đấu</div>
        <ul style={styles.timelineList}>
          {selectedMatch.suKien && selectedMatch.suKien.length > 0 ? (
            selectedMatch.suKien.slice().sort((a: any, b: any) => b.phut - a.phut).map((ev: any) => (
              <li key={ev.id} style={{ ...styles.timelineItem, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                  <span style={styles.timelineTime}>{ev.phut || 0}'</span>
                  <span style={styles.timelineIcon}>
                    {(() => {
                      if (ev.loai?.includes('GOAL')) return '⚽';
                      if (ev.loai?.includes('VANG')) return '🟨';
                      if (ev.loai?.includes('DO')) return '🟥';
                      if (ev.loai?.includes('SUB') || ev.loai?.includes('THAY')) return '🔄';
                      if (ev.loai?.startsWith('CUSTOM_')) {
                        const code = ev.loai.replace('CUSTOM_', '');
                        const customEvt = customEvents?.find((e: any) => e.code === code);
                        return customEvt?.icon || '📌';
                      }
                      return '📌';
                    })()}
                  </span>
                  <span style={styles.timelineText}>
                    <strong>{ev.cauThu?.ten || 'Cầu thủ'}</strong> - {ev.moTa || ev.loai}
                  </span>
                </div>
                <button
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#ef4444',
                    cursor: 'pointer',
                    opacity: 0.8,
                    padding: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '4px',
                    flexShrink: 0
                  }}
                  onClick={() => handleDeleteEvent(ev.id, ev.loai, ev.diemCong, ev.isIndividual, ev.cauThuId)}
                  title="Xóa sự kiện"
                >
                  <IconTrash size={16} />
                </button>
              </li>
            ))
          ) : (
            <li style={{ ...styles.noMatches, padding: '24px 0' }}>Chưa có sự kiện nào diễn ra</li>
          )}
        </ul>
      </div>

      {/* Render the Player Selector Overlay Modal */}
      {renderPlayerSelectorModal()}

      {/* DELAY MATCH MODAL */}
      {delayModalState.isOpen && selectedMatch && (
        <div className="fixed inset-0 bg-[#050810]/85 backdrop-blur-md z-[1000] flex flex-col justify-end md:justify-center md:items-center p-0 md:p-4 animate-fade-in" onClick={() => setDelayModalState(prev => ({ ...prev, isOpen: false }))}>
          <div className="w-full max-w-lg md:max-w-xl mx-auto rounded-t-2xl md:rounded-2xl bg-[#0b1320] border-t md:border border-slate-800 p-6 shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto mb-4 md:hidden"></div>
            <div className="text-lg font-extrabold text-slate-100 flex items-center justify-center gap-2 mb-6 text-center">
              <IconCalendar size={20} /> LÙI LỊCH THI ĐẤU
            </div>
            
            <div className="flex flex-col gap-4">
              {/* Form Layout: columns grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 mb-2 block">Ngày thi đấu mới</label>
                  <input
                    type="date"
                    value={delayModalState.date}
                    onChange={(e) => setDelayModalState(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-[#080c10] text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
                <div style={{ opacity: delayModalState.strategy === 'postpone' ? 0.5 : 1, transition: 'opacity 0.2s' }}>
                  <label className="text-xs font-semibold text-slate-400 mb-2 block">Giờ thi đấu mới</label>
                  <input
                    type="time"
                    disabled={delayModalState.strategy === 'postpone'}
                    value={delayModalState.time}
                    onChange={(e) => setDelayModalState(prev => ({ ...prev, time: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-[#080c10] text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ cursor: delayModalState.strategy === 'postpone' ? 'not-allowed' : 'text' }}
                  />
                </div>
              </div>

              {/* Rescheduling Strategy Radio Group */}
              <div>
                <span className="text-xs text-slate-400 mb-2 font-semibold block">
                  Phương thức lùi lịch:
                </span>
                <div className="flex flex-col gap-3.5 bg-[#080c10] p-4 rounded-xl border border-slate-800">
                  <label className="flex items-start gap-2.5 cursor-pointer text-slate-200 text-sm select-none">
                    <input
                      type="radio"
                      name="postponeStrategyMobile"
                      checked={delayModalState.strategy === 'single'}
                      onChange={() => setDelayModalState(prev => ({ ...prev, strategy: 'single' }))}
                      className="mt-1 accent-emerald-400"
                    />
                    <div>
                      <span className="font-semibold text-slate-200">Chỉ lùi giờ trận đấu này</span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer text-slate-200 text-sm select-none">
                    <input
                      type="radio"
                      name="postponeStrategyMobile"
                      checked={delayModalState.strategy === 'shift'}
                      onChange={() => setDelayModalState(prev => ({ ...prev, strategy: 'shift' }))}
                      className="mt-1 accent-emerald-400"
                    />
                    <div>
                      <span className="font-semibold text-slate-200">Tự động lùi tịnh tiến các trận sau (Cùng sân)</span>
                      <p className="text-xs text-slate-400 mt-1 leading-normal">
                        Hệ thống sẽ tự động cộng thêm số phút chênh lệch cho các trận ca sau diễn ra trên cùng sân này.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer text-slate-200 text-sm select-none">
                    <input
                      type="radio"
                      name="postponeStrategyMobile"
                      checked={delayModalState.strategy === 'postpone'}
                      onChange={() => setDelayModalState(prev => ({ ...prev, strategy: 'postpone' }))}
                      className="mt-1 accent-emerald-400"
                    />
                    <div>
                      <span className="font-semibold text-slate-200">Hoãn toàn bộ ngày thi đấu</span>
                    </div>
                  </label>
                </div>
              </div>
              
              {/* Action Buttons wrapper */}
              <div className="flex flex-col-reverse md:flex-row md:justify-end gap-3 mt-6">
                <button
                  onClick={() => setDelayModalState(prev => ({ ...prev, isOpen: false }))}
                  className="w-full md:w-auto px-6 py-2.5 rounded-xl font-semibold text-sm border border-slate-700 hover:bg-slate-800 text-slate-300 transition-colors cursor-pointer text-center"
                >
                  Hủy
                </button>
                <button
                  onClick={() => {
                    if (handleDelayMatchSchedule) {
                      handleDelayMatchSchedule(selectedMatch.id, delayModalState.date, delayModalState.time, delayModalState.strategy);
                    }
                    setDelayModalState(prev => ({ ...prev, isOpen: false }));
                  }}
                  className="w-full md:w-auto px-6 py-2.5 rounded-xl font-bold text-sm bg-[#00D4B8] hover:bg-[#00bda3] text-[#080C10] transition-colors cursor-pointer text-center"
                >
                  Xác nhận lùi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Add Player Modal */}
      {quickAddPlayerModalState.isOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(5, 8, 16, 0.85)', backdropFilter: 'blur(4px)',
          zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}>
          <div style={{
            background: 'var(--color-surface, #0E1421)', width: '100%', maxWidth: '340px', borderRadius: '16px', padding: '24px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
            border: '1px solid var(--color-border-light, rgba(0, 212, 184, 0.15))',
            display: 'flex', flexDirection: 'column', gap: '16px'
          }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--color-text-heading, #E8F4F8)' }}>Thêm Nhanh Cầu Thủ</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-secondary, #A0B4C8)' }}>Số áo</label>
              <input
                type="number"
                placeholder="Ví dụ: 10"
                value={quickAddPlayerModalState.jerseyNumber}
                onChange={e => setQuickAddPlayerModalState(prev => ({ ...prev, jerseyNumber: e.target.value }))}
                style={{
                  padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--color-border, rgba(0, 212, 184, 0.15))',
                  fontSize: '15px', outline: 'none', background: 'var(--color-surface-container, #0A0F18)',
                  color: 'var(--color-text-heading, #ffffff)'
                }}
              />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-secondary, #A0B4C8)' }}>Tên cầu thủ</label>
              <input
                type="text"
                placeholder="Ví dụ: Nguyễn Văn A"
                value={quickAddPlayerModalState.name}
                onChange={e => setQuickAddPlayerModalState(prev => ({ ...prev, name: e.target.value }))}
                style={{
                  padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--color-border, rgba(0, 212, 184, 0.15))',
                  fontSize: '15px', outline: 'none', background: 'var(--color-surface-container, #0A0F18)',
                  color: 'var(--color-text-heading, #ffffff)'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
              <button
                onClick={() => setQuickAddPlayerModalState(prev => ({ ...prev, isOpen: false }))}
                style={{
                  flex: 1, padding: '12px', background: 'var(--color-surface-hover, #141C2A)',
                  color: 'var(--color-text, #C8D8E8)', border: '1px solid var(--color-border-light, rgba(0, 212, 184, 0.08))', borderRadius: '12px',
                  fontWeight: 700, fontSize: '14px', cursor: 'pointer'
                }}
              >
                Hủy
              </button>
              <button
                onClick={handleSaveQuickPlayer}
                disabled={quickAddPlayerModalState.isSaving || !quickAddPlayerModalState.name || !quickAddPlayerModalState.jerseyNumber}
                style={{
                  flex: 1, padding: '12px', background: 'var(--color-primary, #00D4B8)',
                  color: '#080C10', border: 'none', borderRadius: '12px',
                  fontWeight: 800, fontSize: '14px', cursor: quickAddPlayerModalState.isSaving ? 'not-allowed' : 'pointer',
                  opacity: (quickAddPlayerModalState.isSaving || !quickAddPlayerModalState.name || !quickAddPlayerModalState.jerseyNumber) ? 0.7 : 1
                }}
              >
                {quickAddPlayerModalState.isSaving ? 'Đang lưu...' : '💾 Lưu lại'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
