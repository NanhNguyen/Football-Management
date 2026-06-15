import React, { useState } from 'react';
import TeamLogo from '@/components/TeamLogo';
import {
  IconGoal,
  IconCard,
  IconSwap,
  IconPlay,
  IconPause,
  IconStop,
  IconReset
} from './RefereeIcons';

export default function RefereeMobileView({ data, actions }: any) {
  const {
    selectedMatch,
    filteredAndSortedRefereeMatches,
    refereeFilterVong,
    uniqueRounds,
    starterCount,
    customEvents,
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
  } | null>(null);
  const [activeTeamTab, setActiveTeamTab] = useState<'nha' | 'khach'>('nha');

  // React inline styles mapped directly from your Tailwind design specs
  const styles = {
    container: {
      background: '#f8fafc', // bg-slate-50
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
      color: '#0f172a',
      marginTop: '8px',
      marginBottom: '4px'
    },
    subtitle: {
      fontSize: '13px',
      color: '#64748b',
      marginBottom: '16px'
    },
    listContainer: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '16px', // gap-4
      paddingBottom: '80px',
      boxSizing: 'border-box' as const
    },
    matchCard: {
      background: '#ffffff',
      padding: '20px', // p-5
      borderRadius: '16px', // rounded-2xl
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)', // shadow-sm
      border: '1px solid #f1f5f9',
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
      background: '#eff6ff',
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
      background: '#f8fafc',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      border: '1px solid #e2e8f0'
    },
    teamName: {
      textAlign: 'center' as const,
      fontSize: '13px',
      fontWeight: 600,
      color: '#1e293b',
      maxWidth: '100px',
      whiteSpace: 'nowrap' as const,
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    },
    scoreText: {
      padding: '6px 12px',
      fontSize: '22px',
      fontWeight: 900,
      color: 'var(--color-primary, #0f766e)', // Synchronized
      background: '#f1f5f9',
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
      background: '#ffffff', // bg-white
      borderRadius: '16px', // rounded-2xl
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)', // shadow-sm
      padding: '24px', // p-6
      marginBottom: '24px', // mb-6
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
      color: '#475569',
      fontSize: '12px',
      fontWeight: 700,
      padding: '6px 12px',
      background: '#f1f5f9',
      borderRadius: '8px',
      cursor: 'pointer',
      border: 'none'
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
      color: 'var(--color-primary, #0f766e)', // Synchronized score color
      letterSpacing: '1px'
    },
    timerPeriod: {
      color: '#64748b', // text-slate-500
      fontWeight: 500, // font-medium
      fontSize: '14px',
      marginBottom: '8px' // mb-2
    },
    timerClock: {
      fontSize: '48px', // text-5xl
      fontWeight: 900, // font-black
      color: '#1e293b', // text-slate-800
      marginBottom: '24px', // mb-6
      fontFamily: 'monospace'
    },
    controlButtonFull: (bgColor: string, textColor: string = '#ffffff') => ({
      width: '100%',
      padding: '12px 0', // py-3
      background: bgColor,
      color: textColor,
      borderRadius: '12px', // rounded-xl
      fontWeight: 700, // font-bold
      fontSize: '18px', // text-lg
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
      background: '#ffffff',
      color: '#64748b',
      borderRadius: '12px',
      fontWeight: 600,
      fontSize: '13px',
      border: '1px solid #e2e8f0',
      cursor: 'pointer',
      marginTop: '8px',
      boxSizing: 'border-box' as const
    },

    // 3. Action Grid layout
    actionZoneGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr', // grid-cols-2
      gap: '16px', // gap-4
      marginBottom: '24px', // mb-6
      boxSizing: 'border-box' as const
    },
    actionButton: (bgColor: string, textColor: string = '#ffffff') => ({
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      borderRadius: '16px', // rounded-2xl (16px)
      fontWeight: 'bold' as const,
      color: textColor,
      minHeight: '110px', // min-h-[110px]
      background: bgColor,
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)', // shadow-sm
      cursor: 'pointer',
      border: 'none',
      transition: 'transform 0.1s ease',
      boxSizing: 'border-box' as const
    }),
    actionButtonLabel: {
      marginTop: '8px',
      fontSize: '15px', // text-lg mapping for action title
      fontWeight: 700
    },

    // 4. Timeline layout
    timelineSection: {
      background: '#ffffff', // bg-white
      borderRadius: '16px', // rounded-2xl
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)', // shadow-sm
      padding: '20px', // p-5 (20px)
      marginBottom: '60px',
      boxSizing: 'border-box' as const
    },
    timelineTitle: {
      color: '#334155', // text-slate-700
      fontWeight: 700, // font-bold
      fontSize: '18px', // text-lg
      marginBottom: '16px', // mb-4
      borderBottom: '1px solid #f1f5f9', // border-slate-100
      paddingBottom: '12px' // pb-3
    },
    timelineList: {
      listStyleType: 'none',
      padding: 0,
      margin: 0
    },
    timelineItem: {
      borderBottom: '1px solid #f1f5f9',
      padding: '12px 0',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      boxSizing: 'border-box' as const
    },
    timelineTime: {
      fontWeight: 700,
      color: '#475569',
      width: '32px',
      fontSize: '13px',
      flexShrink: 0
    },
    timelineIcon: {
      fontSize: '18px',
      flexShrink: 0
    },
    timelineText: {
      color: '#334155',
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
      background: 'rgba(15, 23, 42, 0.6)', // slate-900 with opacity
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column' as const,
      justifyContent: 'flex-end',
      backdropFilter: 'blur(4px)'
    },
    modalContent: {
      background: '#ffffff',
      borderTopLeftRadius: '24px',
      borderTopRightRadius: '24px',
      padding: '24px 20px',
      maxHeight: '80vh',
      display: 'flex',
      flexDirection: 'column' as const,
      boxShadow: '0 -10px 25px -5px rgba(0, 0, 0, 0.1)',
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
      color: '#0f172a',
      margin: 0,
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    modalCloseBtn: {
      fontSize: '13px',
      fontWeight: 700,
      color: '#475569',
      background: '#f1f5f9',
      border: 'none',
      padding: '8px 16px',
      borderRadius: '8px',
      cursor: 'pointer'
    },
    segmentControl: {
      display: 'flex',
      background: '#f1f5f9',
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
      color: isActive ? 'var(--color-primary, #0f766e)' : '#475569',
      background: isActive ? '#ffffff' : 'transparent',
      borderRadius: '8px',
      border: 'none',
      cursor: 'pointer',
      boxShadow: isActive ? '0 2px 4px rgba(0,0,0,0.04)' : 'none',
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
      background: '#ffffff',
      border: '1px solid #f1f5f9',
      cursor: 'pointer',
      transition: 'all 0.1s ease',
      boxSizing: 'border-box' as const
    },
    playerJersey: {
      width: '28px',
      height: '28px',
      borderRadius: '50%',
      background: '#eff6ff',
      color: 'var(--color-primary, #0f766e)',
      fontWeight: 700,
      fontSize: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    playerName: {
      fontSize: '14px',
      fontWeight: 600,
      color: '#1e293b'
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
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            gap: '12px'
          }}>
            {/* Filter Dropdown on Top */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Chọn nhanh vòng:</span>
              <select
                value={refereeFilterVong}
                onChange={(e) => setRefereeFilterVong(e.target.value)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#fff',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#1e293b',
                  outline: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
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
                      border: '1px solid #e2e8f0',
                      background: '#ffffff',
                      color: isFirstRound ? '#cbd5e1' : '#1e293b',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: isFirstRound ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                      outline: 'none',
                      fontWeight: 'bold',
                      opacity: isFirstRound ? 0.4 : 1,
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.08)'
                    }}
                    title="Vòng trước"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                  </button>
                  <div style={{ textAlign: 'center', minWidth: '130px' }}>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: '#1e293b' }}>
                      {refereeFilterVong === 'NONE' ? 'Không có vòng đấu' : refereeFilterVong}
                    </div>
                    <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600, marginTop: '4px' }}>
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
                      border: '1px solid #e2e8f0',
                      background: '#ffffff',
                      color: isLastRound ? '#cbd5e1' : '#1e293b',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: isLastRound ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                      outline: 'none',
                      fontWeight: 'bold',
                      opacity: isLastRound ? 0.4 : 1,
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.08)'
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
        <button
          style={styles.controlButtonFull('#10b981')} // bg-emerald-500
          onClick={() => handleStartMatch(selectedMatch.id)}
        >
          <IconPlay size={18} color="#ffffff" />
          Bắt đầu hiệp 1
        </button>
      );
    }

    if (halfState === '1_active') {
      return (
        <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
          <button
            style={{ ...styles.controlButtonFull(selectedMatch.dangTamDung ? '#10b981' : 'var(--color-primary)'), flex: 1 }}
            onClick={() => handleTemporaryPauseToggle(selectedMatch.id)}
          >
            {selectedMatch.dangTamDung ? (
              <><IconPlay size={18} color="#ffffff" /> Tiếp tục</>
            ) : (
              <><IconPause size={18} color="#ffffff" /> Tạm dừng</>
            )}
          </button>

          <button
            style={{ ...styles.controlButtonFull('#f59e0b'), flex: 1 }} // bg-amber-500
            onClick={() => handlePauseMatch(selectedMatch.id)}
          >
            <IconPause size={18} color="#ffffff" />
            Hết H1
          </button>
        </div>
      );
    }

    if (halfState === 'half_time') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
          <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600, marginBottom: '8px', display: 'block', textAlign: 'center' }}>
            Đang nghỉ giữa hiệp
          </span>
          <button
            style={styles.controlButtonFull('#10b981')} // bg-emerald-500
            onClick={() => handleResumeMatch(selectedMatch.id)}
          >
            <IconPlay size={18} color="#ffffff" />
            Bắt đầu hiệp 2
          </button>
        </div>
      );
    }

    if (halfState === '2_active') {
      return (
        <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
          <button
            style={{ ...styles.controlButtonFull(selectedMatch.dangTamDung ? '#10b981' : 'var(--color-primary)'), flex: 1 }}
            onClick={() => handleTemporaryPauseToggle(selectedMatch.id)}
          >
            {selectedMatch.dangTamDung ? (
              <><IconPlay size={18} color="#ffffff" /> Tiếp tục</>
            ) : (
              <><IconPause size={18} color="#ffffff" /> Tạm dừng</>
            )}
          </button>

          <button
            style={{ ...styles.controlButtonFull('#ef4444'), flex: 1 }} // bg-red-500
            onClick={() => handleFinishMatch(selectedMatch.id)}
          >
            <IconStop size={18} color="#ffffff" />
            Kết thúc
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
          await handleActionSelect('goal', 'normal', { teamId, matchId: selectedMatch.id, player });
          setActiveWizard(null);
        } else if (type === 'yellow') {
          await handleActionSelect('card', 'yellow', { teamId, matchId: selectedMatch.id, player });
          setActiveWizard(null);
        } else if (type === 'red') {
          await handleActionSelect('card', 'red', { teamId, matchId: selectedMatch.id, player });
          setActiveWizard(null);
        } else if (type === 'custom') {
          await handleActionSelect('custom', activeWizard.subType, { teamId, matchId: selectedMatch.id, player });
          setActiveWizard(null);
        } else if (type === 'sub') {
          if (step === 1) {
            setActiveWizard({
              type: 'sub',
              step: 2,
              subOutPlayer: player
            });
          } else {
            await handleExecuteSubstitution(player, subOutPlayer, teamId);
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
          await handleActionSelect('custom', activeWizard.subType, { teamId, matchId: selectedMatch.id, player: { id: null, ten: 'Toàn Đội' } });
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

          {/* Segment Control / Tabs */}
          {showSegmentControl ? (
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
          ) : (
            <div style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: '16px', color: 'var(--color-primary, #0f766e)' }}>
              Đội bóng: {activeTeam?.ten} (Thay {subOutPlayer?.ten} ra)
            </div>
          )}

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
                      border: '1px solid #f1f5f9',
                      background: '#ffffff',
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
                          <span style={{ fontSize: '12px', background: '#e1f5fe', padding: '2px 6px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '2px' }}>
                            ⚽ {goalCount}
                          </span>
                        )}
                        {yellowCount > 0 && (
                          <span style={{ fontSize: '12px', background: '#fff9c4', padding: '2px 6px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '2px', border: '1px solid #fbc02d' }}>
                            🟨 {yellowCount}
                          </span>
                        )}
                        {hasRedCard && (
                          <span style={{ fontSize: '12px', background: '#ffebee', padding: '2px 6px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '2px', border: '1px solid #e53935', color: '#c62828', fontWeight: 'bold' }}>
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
        <div style={{ width: '100%', height: '1px', background: '#f1f5f9', margin: '20px 0' }} />

        {/* Timer State & Clock */}
        <div style={styles.timerPeriod}>
          {selectedMatch.trangThai === 'DANG_DIEN_RA'
            ? `Hiệp ${selectedMatch.hiepHienTai || 1} ${selectedMatch.dangTamDung ? '(Tạm dừng)' : '(Đang đá)'}`
            : isFinished
              ? 'Trận đấu kết thúc'
              : 'Chưa bắt đầu'
          }
        </div>
        <div style={styles.timerClock}>
          {formatMatchTime(selectedMatch)}
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

      {/* 3. Khu vực Nút Thao tác (Action Grid) */}
      {(() => {
        const actionsDisabled = selectedMatch.trangThai !== 'DANG_DIEN_RA';
        return (
          <div style={styles.actionZoneGrid}>
            <button
              disabled={actionsDisabled}
              style={{
                ...styles.actionButton('#10b981'),
                opacity: actionsDisabled ? 0.5 : 1,
                cursor: actionsDisabled ? 'not-allowed' : 'pointer'
              }}
              onClick={() => setActiveWizard({ type: 'goal' })}
            >
              <IconGoal size={32} color="#ffffff" />
              <span style={styles.actionButtonLabel}>GHI BÀN</span>
            </button>

            <button
              disabled={actionsDisabled}
              style={{
                ...styles.actionButton('#fbbf24', '#0f172a'),
                opacity: actionsDisabled ? 0.5 : 1,
                cursor: actionsDisabled ? 'not-allowed' : 'pointer'
              }}
              onClick={() => setActiveWizard({ type: 'yellow' })}
            >
              <IconCard size={32} color="#0f172a" />
              <span style={styles.actionButtonLabel}>THẺ VÀNG</span>
            </button>

            <button
              disabled={actionsDisabled}
              style={{
                ...styles.actionButton('#f43f5e'),
                opacity: actionsDisabled ? 0.5 : 1,
                cursor: actionsDisabled ? 'not-allowed' : 'pointer'
              }}
              onClick={() => setActiveWizard({ type: 'red' })}
            >
              <IconCard size={32} color="#ffffff" />
              <span style={styles.actionButtonLabel}>THẺ ĐỎ</span>
            </button>

            <button
              disabled={actionsDisabled}
              style={{
                ...styles.actionButton('var(--color-primary)'),
                opacity: actionsDisabled ? 0.5 : 1,
                cursor: actionsDisabled ? 'not-allowed' : 'pointer'
              }}
              onClick={() => setActiveWizard({ type: 'sub', step: 1 })}
            >
              <IconSwap size={32} color="#ffffff" />
              <span style={styles.actionButtonLabel}>THAY NGƯỜI</span>
            </button>

            {customEvents?.map((evt: any) => (
              <button
                key={evt.code}
                disabled={actionsDisabled}
                style={{
                  ...styles.actionButton(evt.color || '#3b82f6', '#ffffff'),
                  opacity: actionsDisabled ? 0.5 : 1,
                  cursor: actionsDisabled ? 'not-allowed' : 'pointer'
                }}
                onClick={() => setActiveWizard({ type: 'custom', subType: evt.code, requiresPlayer: evt.target_scope !== 'none' })}
              >
                <div style={{ fontSize: '32px' }}>{evt.icon}</div>
                <span style={{ ...styles.actionButtonLabel, textAlign: 'center' }}>{evt.name?.toUpperCase()}</span>
              </button>
            ))}
          </div>
        );
      })()}

      {/* 4. Khối Biên niên sự kiện (Timeline) */}
      <div style={styles.timelineSection}>
        <div style={styles.timelineTitle}>Diễn biến trận đấu</div>
        <ul style={styles.timelineList}>
          {selectedMatch.suKien && selectedMatch.suKien.length > 0 ? (
            selectedMatch.suKien.slice().sort((a: any, b: any) => b.phut - a.phut).map((ev: any) => (
              <li key={ev.id} style={styles.timelineItem}>
                <span style={styles.timelineTime}>{ev.phut || 0}'</span>
                <span style={styles.timelineIcon}>
                  {ev.loai?.includes('GOAL') ? '⚽' : ev.loai?.includes('VANG') ? '🟨' : ev.loai?.includes('DO') ? '🟥' : ev.loai?.includes('SUB') || ev.loai?.includes('THAY') ? '🔄' : '📌'}
                </span>
                <span style={styles.timelineText}>
                  <strong>{ev.cauThu?.ten || 'Cầu thủ'}</strong> - {ev.moTa || ev.loai}
                </span>
              </li>
            ))
          ) : (
            <li style={{ ...styles.noMatches, padding: '24px 0' }}>Chưa có sự kiện nào diễn ra</li>
          )}
        </ul>
      </div>

      {/* Render the Player Selector Overlay Modal */}
      {renderPlayerSelectorModal()}

    </div>
  );
}
