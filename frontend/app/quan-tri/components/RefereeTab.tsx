import React, { useState, useEffect } from 'react';
import TeamLogo from '@/components/TeamLogo';
import {
  IconGoal, IconCard, IconCardDouble, IconSwap, IconTimer, IconStop,
  IconReset, IconMedal, IconEvent, IconHome, IconAway, IconPlay, IconPause, IconCalendar, IconTrash
} from './RefereeIcons';
import { useMediaQuery } from '@/hooks/useMediaQuery';

const desktopStyles = {
  wrapper: {
    display: 'grid',
    gridTemplateColumns: 'repeat(12, 1fr)',
    gap: '24px',
    padding: '24px',
    background: 'var(--color-bg, #f8fafc)',
    minHeight: '100vh',
    position: 'relative' as const,
    fontFamily: "'Hanken Grotesk', 'Inter', sans-serif",
    boxSizing: 'border-box' as const,
  },
  backBtn: {
    position: 'absolute' as const,
    top: '16px',
    left: '24px',
    color: 'var(--color-text-muted, #94a3b8)',
    fontSize: '14px',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    transition: 'color 0.2s',
  },
  columnHomeAway: {
    gridColumn: 'span 3',
    display: 'flex',
    flexDirection: 'column' as const,
    paddingTop: '32px',
  },
  columnCenter: {
    gridColumn: 'span 6',
    display: 'flex',
    flexDirection: 'column' as const,
    paddingTop: '32px',
    gap: '24px',
  },
  card: {
    background: 'var(--color-surface, #ffffff)',
    padding: '24px',
    borderRadius: '8px',
    boxShadow: 'var(--shadow-sm, 0 1px 2px rgba(0, 0, 0, 0.05))',
    border: '1px solid var(--color-border-light, #f1f5f9)',
    minHeight: '600px',
    boxSizing: 'border-box' as const,
  },
  cardTitle: {
    fontSize: '13px',
    fontWeight: 700,
    color: 'var(--color-primary, #0F766E)',
    marginBottom: '24px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    textAlign: 'center' as const,
  },
  lineupSectionTitle: {
    fontSize: '11px',
    color: 'var(--color-text-muted, #94a3b8)',
    fontWeight: 600,
    marginBottom: '12px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  startersGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
    marginBottom: '24px',
  },
  benchGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
  },
  playerButton: (isPopoverOpen: boolean, isRedCarded: boolean) => ({
    width: '100%',
    background: 'var(--color-surface, #ffffff)',
    border: isPopoverOpen ? '2px solid var(--color-primary, #0F766E)' : '1px solid var(--color-border, #e2e8f0)',
    color: 'var(--color-text, #334155)',
    fontSize: '12px',
    fontWeight: 600,
    padding: '12px 8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center' as const,
    borderRadius: '4px',
    cursor: isRedCarded ? 'not-allowed' : 'pointer',
    opacity: isRedCarded ? 0.5 : 1,
    textDecoration: isRedCarded ? 'line-through' : 'none',
    boxSizing: 'border-box' as const,
    boxShadow: isPopoverOpen ? '0 0 0 3px rgba(15, 118, 110, 0.15)' : 'none',
    transition: 'all 0.15s ease-in-out',
  }),
  benchPlayerBox: {
    width: '100%',
    background: 'var(--color-surface-container, #f8fafc)',
    border: '1px solid var(--color-border-light, #f1f5f9)',
    color: 'var(--color-text-secondary, #334155)',
    fontSize: '12px',
    fontWeight: 500,
    padding: '12px 8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center' as const,
    borderRadius: '4px',
    opacity: 0.8,
    boxSizing: 'border-box' as const,
  },
  popover: (isHome: boolean) => ({
    position: 'absolute' as const,
    zIndex: 50,
    top: 0,
    ...(isHome ? { left: '105%' } : { right: '105%' }),
    width: '160px',
    background: 'var(--color-surface, #ffffff)',
    boxShadow: 'var(--shadow-lg, 0 10px 15px -3px rgba(0, 0, 0, 0.1))',
    borderRadius: '8px',
    border: '1px solid var(--color-border-light, #f1f5f9)',
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden',
  }),
  popoverActionBtn: (bgColor: string, hoverColor: string) => ({
    width: '100%',
    padding: '10px 12px',
    background: bgColor,
    color: '#ffffff',
    fontSize: '11px',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    border: 'none',
    cursor: 'pointer',
    transition: 'background 0.15s',
  }),
  scoreboardCard: {
    background: 'var(--color-surface, #ffffff)',
    padding: '32px',
    borderRadius: '8px',
    boxShadow: 'var(--shadow-sm, 0 1px 2px rgba(0, 0, 0, 0.05))',
    border: '1px solid var(--color-border-light, #f1f5f9)',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    boxSizing: 'border-box' as const,
  },
  roundHeader: {
    fontSize: '14px',
    fontWeight: 700,
    color: 'var(--color-text-secondary, #334155)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    marginBottom: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  timerText: (isLive: boolean) => ({
    fontWeight: 700,
    fontSize: '18px',
    marginBottom: '32px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: isLive ? 'var(--color-live, #EF4444)' : 'var(--color-text, #334155)',
  }),
  scoreboardTeamsRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '40px',
    width: '100%',
    marginBottom: '24px',
  },
  scoreboardTeamCode: (align: 'left' | 'right') => ({
    fontSize: '36px',
    fontWeight: 300,
    color: 'var(--color-text-heading, #0F172A)',
    flex: 1,
    textAlign: align,
  }),
  scoreboardBigScore: {
    fontSize: '60px',
    fontWeight: 400,
    color: 'var(--color-text-heading, #0F172A)',
    flexShrink: 0,
    letterSpacing: '-2px',
  },
  goalScorersRow: {
    display: 'flex',
    width: '100%',
    justifyContent: 'space-between',
    fontSize: '11px',
    color: 'var(--color-text-muted, #94a3b8)',
    marginBottom: '40px',
    paddingLeft: '48px',
    paddingRight: '48px',
    boxSizing: 'border-box' as const,
  },
  scorersColumn: (align: 'left' | 'right') => ({
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
    textAlign: align,
    flex: 1,
    alignItems: align === 'left' ? 'flex-start' : 'flex-end',
    ...(align === 'left' ? { paddingLeft: '32px' } : { paddingRight: '32px' }),
  }),
  ctaRow: {
    width: '100%',
    display: 'flex',
    gap: '12px',
  },
  ctaButton: (bgColor: string, flexValue: number = 1) => ({
    flex: flexValue,
    background: bgColor,
    color: '#ffffff',
    fontWeight: 600,
    padding: '12px 16px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '8px',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    transition: 'background 0.15s',
    fontSize: '13px',
  }),
  timelineCard: {
    background: 'var(--color-surface, #ffffff)',
    padding: '24px',
    borderRadius: '8px',
    boxShadow: 'var(--shadow-sm, 0 1px 2px rgba(0, 0, 0, 0.05))',
    border: '1px solid var(--color-border-light, #f1f5f9)',
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    boxSizing: 'border-box' as const,
  },
  timelineHeader: {
    fontSize: '14px',
    fontWeight: 700,
    color: 'var(--color-text-secondary, #334155)',
    textTransform: 'uppercase' as const,
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    paddingBottom: '12px',
    borderBottom: '1px solid var(--color-border-light, #f1f5f9)',
  },
  timelineList: {
    flex: 1,
    overflowY: 'auto' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  timelineRow: {
    fontSize: '13px',
    color: 'var(--color-text, #334155)',
    fontWeight: 500,
    padding: '6px 0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: '1px solid var(--color-border-light, #f1f5f9)',
  },
  timelineText: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  timelineDeleteBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--color-text-muted, #94a3b8)',
    cursor: 'pointer',
    padding: '0 8px',
    fontSize: '14px',
    transition: 'color 0.15s',
  }
};

interface RefereeTabProps {
  styles: any;
  selectedMatchId: string | null;
  setSelectedMatchId: (id: string | null) => void;
  refereeFilterVong: string;
  setRefereeFilterVong: (val: string) => void;
  refereeFilterBang: string;
  setRefereeFilterBang: (val: string) => void;
  uniqueRounds: string[];
  uniqueGroups: string[];
  isKnockoutActive: boolean;
  filteredAndSortedRefereeMatches: any[];
  calculateMatchMinute: (match: any) => number;
  formatMatchTime: (match: any) => string;
  selectedMatch: any;
  starterCount: number;
  calculateCurrentRoster: (team: any, suKien: any[], limit: number) => { starters: any[]; bench: any[] };
  pendingSubOut: any;
  setPendingSubOut: (val: any) => void;
  handleExecuteSubstitution: (inPlayer: any, outPlayer: any, teamId: string, minute?: number | string) => void;
  setActivePlayerParams: (val: any) => void;
  activePlayerParams: any;
  customEvents: any[];
  handleStartMatch: (id: string) => void;
  handleTemporaryPauseToggle: (id: string) => void;
  handlePauseMatch: (id: string) => void;
  handleResumeMatch: (id: string) => void;
  handleFinishMatch: (id: string) => void;
  handleResetMatch: (id: string) => void;
  handleDeleteEvent: (evtId: string, type: string, points?: number, isIndividual?: boolean, playerId?: string) => void;
  isSelectingSubstitute: boolean;
  setIsSelectingSubstitute: (val: boolean) => void;
  handleActionSelect: (type: string, detail?: string, overrideParams?: any) => void;
  getMatchHalfState: (match: any) => '1_not_started' | '1_active' | 'half_time' | '2_active' | 'finished';
  handleDelayMatchSchedule?: (id: string, date: string, time: string, strategy: 'single' | 'shift' | 'postpone') => void;
}

export default function RefereeTab({
  styles,
  selectedMatchId,
  setSelectedMatchId,
  refereeFilterVong,
  setRefereeFilterVong,
  refereeFilterBang,
  setRefereeFilterBang,
  uniqueRounds,
  uniqueGroups,
  isKnockoutActive,
  filteredAndSortedRefereeMatches,
  calculateMatchMinute,
  formatMatchTime,
  selectedMatch,
  starterCount,
  calculateCurrentRoster,
  handleExecuteSubstitution,
  customEvents,
  handleStartMatch,
  handleTemporaryPauseToggle,
  handlePauseMatch,
  handleResumeMatch,
  handleFinishMatch,
  handleResetMatch,
  handleDeleteEvent,
  handleActionSelect,
  getMatchHalfState,
  handleDelayMatchSchedule
}: RefereeTabProps) {

  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
    const roundMatches = filteredAndSortedRefereeMatches.filter(m => {
      if (refereeFilterVong === 'NONE') return true;
      const { vong } = parseVongDetails(m.vong);
      return vong === refereeFilterVong;
    });

    const dates = roundMatches
      .map(m => m.date)
      .filter(Boolean)
      .sort();

    if (dates.length === 0) return 'Chưa xếp lịch';
    if (dates.length === 1) {
      return formatDateLabel(dates[0]);
    }
    return `${formatDateLabel(dates[0])} - ${formatDateLabel(dates[dates.length - 1])}`;
  };

  const handlePrevRound = () => {
    if (uniqueRounds.length === 0) return;
    const idx = uniqueRounds.indexOf(refereeFilterVong);
    if (idx > 0) {
      setRefereeFilterVong(uniqueRounds[idx - 1]);
    }
  };

  const handleNextRound = () => {
    if (uniqueRounds.length === 0) return;
    const idx = uniqueRounds.indexOf(refereeFilterVong);
    if (idx < uniqueRounds.length - 1 && idx !== -1) {
      setRefereeFilterVong(uniqueRounds[idx + 1]);
    }
  };

  const [wizardState, setWizardState] = useState<{
    isOpen: boolean;
    action: 'goal' | 'card' | 'sub' | 'custom' | 'motm' | null;
    customActionId?: string;
    teamId: string;
    subType: string; // 'normal' | 'pen' | 'og' | 'yellow' | 'red'
    step: 1 | 2; // For substitution
    subOutPlayer?: any;
    minute?: number | string;
  }>({
    isOpen: false,
    action: null,
    teamId: '',
    subType: 'normal',
    step: 1
  });

  const [delayModalState, setDelayModalState] = useState<{ isOpen: boolean, date: string, time: string, strategy: 'single' | 'shift' | 'postpone' }>({ isOpen: false, date: '', time: '', strategy: 'single' });

  const [quickAddState, setQuickAddState] = useState<{
    isOpen: boolean;
    action: 'goal' | 'card' | 'sub';
    teamId: string;
    subType: string;
    playerId: string;
    subOutPlayerId: string;
    minute: string;
  }>({
    isOpen: false,
    action: 'goal',
    teamId: '',
    subType: 'normal',
    playerId: '',
    subOutPlayerId: '',
    minute: ''
  });

  useEffect(() => {
    // When match changes, ensure wizard resets
    if (selectedMatch) {
      setWizardState(prev => ({ ...prev, isOpen: false, teamId: selectedMatch.doiNha?.id || '' }));
    }
  }, [selectedMatch]);

  const openWizard = (action: 'goal' | 'card' | 'sub' | 'custom' | 'motm', subType: string = 'normal', customId?: string) => {
    if (!selectedMatch) return;
    setWizardState({
      isOpen: true,
      action,
      teamId: selectedMatch.doiNha?.id,
      subType,
      customActionId: customId,
      step: 1,
      subOutPlayer: undefined
    });
  };

  const closeWizard = () => {
    setWizardState(prev => ({ ...prev, isOpen: false }));
  };

  const handlePlayerSelect = (player: any) => {
    if (!selectedMatch) return;

    if (wizardState.action === 'sub') {
      if (wizardState.step === 1) {
        setWizardState({ ...wizardState, step: 2, subOutPlayer: player });
      } else {
        handleExecuteSubstitution(player, wizardState.subOutPlayer, wizardState.teamId, wizardState.minute);
        closeWizard();
      }
    } else {
      // Goal, Card, Custom
      const overrideParams: any = {
        matchId: selectedMatch.id,
        teamId: wizardState.teamId,
        player
      };

      let detail = wizardState.subType;
      if (wizardState.action === 'custom') detail = wizardState.customActionId || '';
      
      overrideParams.minute = wizardState.minute;
      handleActionSelect(wizardState.action!, detail, overrideParams);
      closeWizard();
    }
  };

  const [activePopover, setActivePopover] = useState<{ playerId: string, teamId: string } | null>(null);

  const handlePlayerActionDesktop = (player: any, teamId: string, action: string, subType?: string) => {
    if (!selectedMatch) return;
    if (action === 'goal') {
      handleActionSelect('goal', 'normal', { matchId: selectedMatch.id, teamId, player });
    } else if (action === 'yellow') {
      handleActionSelect('card', 'yellow', { matchId: selectedMatch.id, teamId, player });
    } else if (action === 'red') {
      handleActionSelect('card', 'red', { matchId: selectedMatch.id, teamId, player });
    } else if (action === 'custom' && subType) {
      handleActionSelect('custom', subType, { matchId: selectedMatch.id, teamId, player });
    }
    setActivePopover(null);
  };

  const renderDesktopLineupImageStyle = (team: any, isHome: boolean) => {
    if (!team) return null;
    const { starters, bench } = calculateCurrentRoster(team, selectedMatch.suKien, starterCount);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
        <div>
          <div style={desktopStyles.lineupSectionTitle}>ĐỘI HÌNH CHÍNH (Click Player to Action)</div>
          <div style={desktopStyles.startersGrid}>
            {starters.length > 0 ? starters.map((p: any) => {
              const isPopoverOpen = activePopover?.playerId === p.id && activePopover?.teamId === team.id;
              const isRedCarded = selectedMatch.suKien?.some((ev: any) => ev.loai === 'THE_DO' && ev.cauThuId === p.id);

              return (
                <div key={p.id} style={{ position: 'relative' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isRedCarded && selectedMatch.trangThai !== 'KET_THUC') {
                        setActivePopover(isPopoverOpen ? null : { playerId: p.id, teamId: team.id });
                      }
                    }}
                    disabled={isRedCarded || selectedMatch.trangThai === 'KET_THUC'}
                    className="desktop-player-btn"
                    style={{ ...desktopStyles.playerButton(isPopoverOpen, isRedCarded), opacity: (isRedCarded || selectedMatch.trangThai === 'KET_THUC') ? 0.5 : 1, cursor: (isRedCarded || selectedMatch.trangThai === 'KET_THUC') ? 'not-allowed' : 'pointer' }}
                  >
                    #{p.soAo} {p.ten}
                  </button>
                  {isPopoverOpen && (
                    <div style={desktopStyles.popover(isHome)} onClick={e => e.stopPropagation()}>
                      <button
                        className="desktop-popover-btn-goal"
                        style={desktopStyles.popoverActionBtn('var(--color-success, #22C55E)', 'var(--color-success-dark, #16a34a)')}
                        onClick={() => handlePlayerActionDesktop(p, team.id, 'goal')}
                      >
                        <IconGoal size={14} /> GHI BÀN
                      </button>
                      <button
                        className="desktop-popover-btn-yellow"
                        style={desktopStyles.popoverActionBtn('var(--color-warning, #F59E0B)', 'var(--color-warning-dark, #d97706)')}
                        onClick={() => handlePlayerActionDesktop(p, team.id, 'yellow')}
                      >
                        <IconCard size={14} /> THẺ VÀNG
                      </button>
                      <button
                        className="desktop-popover-btn-red"
                        style={desktopStyles.popoverActionBtn('var(--color-danger, #EF4444)', 'var(--color-danger-dark, #dc2626)')}
                        onClick={() => handlePlayerActionDesktop(p, team.id, 'red')}
                      >
                        <IconCard size={14} /> THẺ ĐỎ
                      </button>
                      <button
                        className="desktop-popover-btn-sub"
                        style={desktopStyles.popoverActionBtn('var(--color-primary, #0F766E)', 'var(--color-primary-dark, #115E59)')}
                        onClick={() => {
                          setWizardState({
                            isOpen: true,
                            action: 'sub',
                            teamId: team.id,
                            subType: 'normal',
                            step: 2,
                            subOutPlayer: p
                          });
                          setActivePopover(null);
                        }}
                      >
                        <IconSwap size={14} /> THAY NGƯỜI
                      </button>
                      
                      {customEvents?.filter((evt: any) => evt.target_scope !== 'none').map((evt: any) => (
                        <button
                          key={evt.code}
                          className={`desktop-popover-btn-${evt.code.toLowerCase()}`}
                          style={desktopStyles.popoverActionBtn(evt.color || '#3b82f6', evt.color || '#2563eb')}
                          onClick={() => handlePlayerActionDesktop(p, team.id, 'custom', evt.code)}
                        >
                          <span style={{ marginRight: '4px' }}>{evt.icon}</span> {evt.name.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            }) : <div style={{ gridColumn: 'span 2', textAlign: 'center', fontSize: '14px', color: '#64748b', padding: '16px 0' }}>Chưa có đội hình</div>}
          </div>
        </div>

        {bench.length > 0 && (
          <div>
            <div style={desktopStyles.lineupSectionTitle}>DỰ BỊ</div>
            <div style={desktopStyles.benchGrid}>
              {bench.map((p: any) => (
                <div key={p.id} style={desktopStyles.benchPlayerBox}>
                  #{p.soAo} {p.ten}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (!mounted) {
    return <div style={{ minHeight: '100vh', background: '#f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '14px', fontWeight: 600 }}>Đang tải giao diện điều khiển...</div>;
  }

  return (
    <div className={`${styles.refereeConsoleWrapper} animate-fade-in`}>
      {!selectedMatchId ? (
        <div className={styles.content}>
          <h2 className={styles.pageTitle}>Trung tâm Điều khiển</h2>
          <p className={styles.pageDesc}>Chọn một trận đấu để bắt đầu điều khiển và cập nhật tỉ số</p>

          {/* Referee Filter Bar */}
          {uniqueRounds.length > 0 && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 0 24px 0',
              padding: '20px',
              background: 'var(--color-surface, #ffffff)',
              borderRadius: '16px',
              border: '1px solid var(--color-border-light, #e2e8f0)',
              boxShadow: '0 4px 10px rgba(0, 0, 0, 0.03)',
              gap: '16px'
            }}>
              {/* Filter Dropdown on Top */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Chọn nhanh vòng:</span>
                <select
                  value={refereeFilterVong}
                  onChange={(e) => setRefereeFilterVong(e.target.value)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '10px',
                    border: '1px solid var(--color-border, #1e293b)',
                    background: 'var(--color-surface, #141C2A)',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'var(--color-text, #f8fafc)',
                    outline: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                  }}
                >
                  {uniqueRounds.map(r => (
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
                        border: '1px solid var(--color-border, #1e293b)',
                        background: 'var(--color-surface, #141C2A)',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -1px rgba(0, 0, 0, 0.04)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: isFirstRound ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s',
                        outline: 'none',
                        opacity: isFirstRound ? 0.5 : 1
                      }}
                      title="Vòng trước"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={isFirstRound ? 'var(--color-text-muted, #475569)' : 'var(--color-text, #f8fafc)'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6"></polyline>
                      </svg>
                    </button>
                    <div style={{ textAlign: 'center', minWidth: '160px' }}>
                      <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-text-heading, #f8fafc)' }}>
                        {refereeFilterVong === 'NONE' ? 'Không có vòng đấu' : refereeFilterVong}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-muted, #94a3b8)', fontWeight: 600, marginTop: '4px' }}>
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
                        border: '1px solid var(--color-border, #1e293b)',
                        background: 'var(--color-surface, #141C2A)',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -1px rgba(0, 0, 0, 0.04)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: isLastRound ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s',
                        outline: 'none',
                        opacity: isLastRound ? 0.5 : 1
                      }}
                      title="Vòng sau"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={isLastRound ? 'var(--color-text-muted, #475569)' : 'var(--color-text, #f8fafc)'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6"></polyline>
                      </svg>
                    </button>
                  </div>
                );
              })()}
            </div>
          )}

          <div className={styles.adminMatchList}>
            {filteredAndSortedRefereeMatches.length > 0 ? (
              filteredAndSortedRefereeMatches.map(m => (
                <div
                  key={m.id}
                  className={`${styles.adminMatchItem} ${m.trangThai === 'DANG_DIEN_RA' ? styles.adminMatchItemLive : ''}`}
                  onClick={() => setSelectedMatchId(m.id)}
                >
                  <div className={styles.matchListInfo}>
                    <span style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 700, width: '80px', flexShrink: 0 }}>{m.vong}</span>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', flex: 1, minWidth: 0 }}>
                        <span style={{ fontWeight: 700, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.doiNha?.ten || 'Chờ xác định'}</span>
                        <span style={{ display: 'flex', flexShrink: 0 }}><TeamLogo logo={m.doiNha?.logo} teamName={m.doiNha?.ten} /></span>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', fontWeight: 800, fontSize: '18px', width: '60px', justifyContent: 'center', flexShrink: 0 }}>
                        <span>{m.tyNha}</span>
                        <span>-</span>
                        <span>{m.tyKhach}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '12px', flex: 1, minWidth: 0 }}>
                        <span style={{ display: 'flex', flexShrink: 0 }}><TeamLogo logo={m.doiKhach?.logo} teamName={m.doiKhach?.ten} /></span>
                        <span style={{ fontWeight: 700, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.doiKhach?.ten || 'Chờ xác định'}</span>
                      </div>
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
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      border: '1px solid var(--color-border, #1e293b)',
                      background: 'var(--color-surface, #141C2A)',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-text, #1e293b)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6"></polyline>
                      </svg>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.consoleEmptyRoster} style={{ padding: '40px', background: 'var(--color-surface, #141C2A)', borderRadius: '16px', border: '1px dashed var(--color-border, #1e293b)' }}>
                Không tìm thấy trận đấu nào thỏa mãn bộ lọc.
              </div>
            )}
          </div>
        </div>
      ) : selectedMatch && (
        <>
          <style>{`
          .desktop-player-btn:hover {
            border-color: var(--color-primary, #0F766E) !important;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03) !important;
          }
          .desktop-popover-btn-goal:hover {
            background-color: var(--color-success-dark, #16a34a) !important;
            filter: brightness(0.95);
          }
          .desktop-popover-btn-yellow:hover {
            background-color: var(--color-warning-dark, #d97706) !important;
            filter: brightness(0.95);
          }
          .desktop-popover-btn-red:hover {
            background-color: var(--color-danger-dark, #dc2626) !important;
            filter: brightness(0.95);
          }
          .desktop-popover-btn-sub:hover {
            background-color: var(--color-primary-dark, #115E59) !important;
            filter: brightness(0.95);
          }
          .desktop-cta-btn:hover {
            opacity: 0.9;
            filter: brightness(0.95);
          }
          .desktop-back-btn:hover {
            color: var(--color-text-heading, #0F172A) !important;
          }
          .desktop-timeline-row:hover .desktop-undo-btn {
            opacity: 1 !important;
          }
          
          /* Split Template Styles */
          .ref-timeline-container {
            display: flex;
            flex-direction: column;
            background: #080c14; /* Sleek dark card background */
            border: 1px solid #1e293b;
            border-radius: 12px;
            overflow: hidden;
            width: 100%;
          }
          .ref-timeline-row {
            display: flex;
            align-items: center;
            padding: 10px 14px;
            border-bottom: 1px solid #1e293b;
            min-height: 52px;
            position: relative;
          }
          .ref-timeline-row:last-child {
            border-bottom: none;
          }
          .ref-min-col {
            width: 44px;
            font-size: 13px;
            font-weight: 700;
            color: #94a3b8;
            flex-shrink: 0;
          }
          .ref-home-col {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            text-align: right;
            padding-right: 12px;
          }
          .ref-center-col {
            width: 96px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            flex-shrink: 0;
          }
          .ref-away-col {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            text-align: left;
            padding-left: 12px;
          }
          .ref-player-name {
            font-size: 13px;
            font-weight: 700;
            color: #f1f5f9;
          }
          .ref-player-sub {
            font-size: 10px;
            color: #64748b;
            margin-top: 2px;
          }
          .ref-score-badge {
            font-family: 'Poppins', sans-serif;
            font-size: 11px;
            font-weight: 800;
            color: #ffffff;
            background: rgba(239, 68, 68, 0.15);
            border: 1px solid rgba(239, 68, 68, 0.2);
            padding: 1px 6px;
            border-radius: 4px;
            min-width: 38px;
            text-align: center;
          }
          .ref-delete-col {
            width: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }
          .ref-period-row {
            background: rgba(30, 41, 59, 0.2);
            border-top: 1px solid #1e293b;
            border-bottom: 1px solid #1e293b;
          }
          .ref-period-row:first-child {
            border-top: none;
          }
          .ref-period-score {
            font-family: 'Poppins', sans-serif;
            font-size: 12px;
            font-weight: 800;
            color: #f1f5f9;
            background: #1e293b;
            padding: 2px 8px;
            border-radius: 4px;
          }
        `}</style>
          {isDesktop ? (
            /* DESKTOP VIEW (>= 1024px) */
            <div style={desktopStyles.wrapper} onClick={() => setActivePopover(null)}>
              {/* Absolute back button */}
              <button className="desktop-back-btn" style={desktopStyles.backBtn} onClick={() => setSelectedMatchId(null)}>
                ← Trở về
              </button>

              {/* LEFT COLUMN: HOME TEAM */}
              <div style={desktopStyles.columnHomeAway}>
                <div style={desktopStyles.card}>
                  <h3 style={desktopStyles.cardTitle}>
                    <span style={{ width: '20px', height: '20px', display: 'flex' }}>
                      <TeamLogo logo={selectedMatch.doiNha?.logo} teamName={selectedMatch.doiNha?.ten} />
                    </span>
                    <strong style={{ fontWeight: 800 }}>{selectedMatch.doiNha?.ten?.toUpperCase()}</strong>
                    <span style={{ fontWeight: 500, opacity: 0.8 }}> (ĐỘI NHÀ)</span>
                  </h3>
                  <div onClick={e => e.stopPropagation()}>{renderDesktopLineupImageStyle(selectedMatch.doiNha, true)}</div>
                </div>
              </div>

              {/* CENTER COLUMN: BẢNG ĐIỀU KHIỂN & NHẬT KÝ */}
              <div style={desktopStyles.columnCenter}>
                {/* MAIN SCOREBOARD CARD */}
                <div style={desktopStyles.scoreboardCard}>
                  <div style={desktopStyles.roundHeader}>
                    <IconMedal size={16} /> {selectedMatch.vong}
                  </div>
                  <div style={desktopStyles.timerText(selectedMatch.trangThai === 'DANG_DIEN_RA')}>
                    <IconTimer size={20} /> {formatMatchTime(selectedMatch)} | {selectedMatch.trangThai === 'DANG_DIEN_RA' ? 'LIVE' : (selectedMatch.trangThai === 'KET_THUC' ? 'KẾT THÚC' : 'CHƯA ĐÁ')}
                  </div>

                  <div style={desktopStyles.scoreboardTeamsRow}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', justifyContent: 'flex-end', flex: 1 }}>
                      <span style={{ width: '40px', height: '40px', display: 'flex', fontSize: '40px' }}>
                        <TeamLogo logo={selectedMatch.doiNha?.logo} teamName={selectedMatch.doiNha?.ten} />
                      </span>
                      <span style={{ fontSize: '36px', fontWeight: 800, color: 'var(--color-text-heading, #0F172A)' }}>
                        {selectedMatch.doiNha?.ma || selectedMatch.doiNha?.ten?.substring(0, 3).toUpperCase()}
                      </span>
                    </div>
                    <div style={desktopStyles.scoreboardBigScore}>{selectedMatch.tyNha} - {selectedMatch.tyKhach}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', justifyContent: 'flex-start', flex: 1 }}>
                      <span style={{ fontSize: '36px', fontWeight: 800, color: 'var(--color-text-heading, #0F172A)' }}>
                        {selectedMatch.doiKhach?.ma || selectedMatch.doiKhach?.ten?.substring(0, 3).toUpperCase()}
                      </span>
                      <span style={{ width: '40px', height: '40px', display: 'flex', fontSize: '40px' }}>
                        <TeamLogo logo={selectedMatch.doiKhach?.logo} teamName={selectedMatch.doiKhach?.ten} />
                      </span>
                    </div>
                  </div>

                  {/* GOAL SCORERS */}
                  <div style={desktopStyles.goalScorersRow}>
                    <div style={desktopStyles.scorersColumn('right')}>
                      {selectedMatch.suKien?.filter((e: any) => e.teamId === selectedMatch.doiNha?.id && e.loai.startsWith('GOAL')).map((e: any) => (
                        <div key={e.id}>{e.phut}' {e.cauThu?.ten} ⚽</div>
                      ))}
                    </div>
                    <div style={desktopStyles.scorersColumn('left')}>
                      {selectedMatch.suKien?.filter((e: any) => e.teamId === selectedMatch.doiKhach?.id && e.loai.startsWith('GOAL')).map((e: any) => (
                        <div key={e.id}>⚽ {e.phut}' {e.cauThu?.ten}</div>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
                    {/* ROW 1: MATCH CONTROL */}
                    <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                      {getMatchHalfState(selectedMatch) === '1_not_started' && (
                        <>
                          <button className="desktop-cta-btn" style={desktopStyles.ctaButton('var(--color-success, #22C55E)')} onClick={() => handleStartMatch(selectedMatch.id)}>
                            <IconPlay size={18} /> BẮT ĐẦU HIỆP 1
                          </button>
                          {handleDelayMatchSchedule && (
                            <button className="desktop-cta-btn" style={{ ...desktopStyles.ctaButton('var(--color-warning, #F59E0B)'), flex: 0.5 }} onClick={() => setDelayModalState({ isOpen: true, date: selectedMatch.date || '', time: selectedMatch.time || '', strategy: 'single' })}>
                              <IconCalendar size={18} /> LÙI LỊCH
                            </button>
                          )}
                        </>
                      )}
                      {(getMatchHalfState(selectedMatch) === '1_active' || getMatchHalfState(selectedMatch) === '2_active') && (
                        <>
                          <button className="desktop-cta-btn" style={desktopStyles.ctaButton(selectedMatch.dangTamDung ? 'var(--color-success, #22C55E)' : 'var(--color-primary, #0F766E)')} onClick={() => handleTemporaryPauseToggle(selectedMatch.id)}>
                            {selectedMatch.dangTamDung ? <><IconPlay size={18} /> TIẾP TỤC</> : <><IconPause size={18} /> TẠM DỪNG</>}
                          </button>
                          <button className="desktop-cta-btn" style={desktopStyles.ctaButton('var(--color-warning, #F59E0B)')} onClick={() => getMatchHalfState(selectedMatch) === '1_active' ? handlePauseMatch(selectedMatch.id) : handleFinishMatch(selectedMatch.id)}>
                            <IconStop size={18} /> {getMatchHalfState(selectedMatch) === '1_active' ? 'HẾT HIỆP 1' : 'KẾT THÚC'}
                          </button>
                        </>
                      )}
                      {getMatchHalfState(selectedMatch) === 'half_time' && (
                        <button className="desktop-cta-btn" style={desktopStyles.ctaButton('var(--color-success, #22C55E)')} onClick={() => handleResumeMatch(selectedMatch.id)}>
                          <IconPlay size={18} /> BẮT ĐẦU HIỆP 2
                        </button>
                      )}
                      {getMatchHalfState(selectedMatch) === 'finished' && (
                        <div style={{ fontSize: '14px', color: 'var(--color-text-muted, #94a3b8)', fontWeight: 600, padding: '12px 0', textAlign: 'center', width: '100%' }}>
                          Trận đấu đã kết thúc
                        </div>
                      )}
                    </div>

                    {/* ROW 2: ACTIONS */}
                    <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                      {selectedMatch.trangThai !== 'SAP_DIEN_RA' && (
                        <button
                          className="desktop-cta-btn"
                          style={desktopStyles.ctaButton('var(--color-danger, #EF4444)')}
                          onClick={() => {
                            handleResetMatch(selectedMatch.id);
                          }}
                        >
                          <IconReset size={18} /> THIẾT LẬP LẠI
                        </button>
                      )}
                    </div>

                    {/* CUSTOM TEAM ACTIONS */}
                    {customEvents?.filter((evt: any) => evt.target_scope === 'none').length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', marginTop: '8px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-muted)', textAlign: 'center', textTransform: 'uppercase' }}>
                          Thao tác sự kiện chung (Không gán cầu thủ)
                        </div>
                        {customEvents?.filter((evt: any) => evt.target_scope === 'none').map((evt: any) => (
                          <div key={evt.code} style={{ display: 'flex', gap: '8px' }}>
                            <button 
                              className="desktop-cta-btn"
                              disabled={selectedMatch.trangThai !== 'DANG_DIEN_RA'}
                              style={{ ...desktopStyles.ctaButton(evt.color || '#3b82f6'), opacity: selectedMatch.trangThai !== 'DANG_DIEN_RA' ? 0.5 : 1 }}
                              onClick={() => handleActionSelect('custom', evt.code, { matchId: selectedMatch.id, teamId: selectedMatch.doiNha?.id, player: { id: null, ten: 'Toàn Đội' } })}
                            >
                              <span style={{ fontSize: '16px' }}>{evt.icon}</span> {evt.name.toUpperCase()} (ĐỘI NHÀ)
                            </button>
                            <button 
                              className="desktop-cta-btn"
                              disabled={selectedMatch.trangThai !== 'DANG_DIEN_RA'}
                              style={{ ...desktopStyles.ctaButton(evt.color || '#3b82f6'), opacity: selectedMatch.trangThai !== 'DANG_DIEN_RA' ? 0.5 : 1 }}
                              onClick={() => handleActionSelect('custom', evt.code, { matchId: selectedMatch.id, teamId: selectedMatch.doiKhach?.id, player: { id: null, ten: 'Toàn Đội' } })}
                            >
                              <span style={{ fontSize: '16px' }}>{evt.icon}</span> {evt.name.toUpperCase()} (ĐỘI KHÁCH)
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* POST MATCH QUICK ADD */}
                    {selectedMatch.trangThai === 'KET_THUC' && (
                      <div style={{ display: 'flex', width: '100%', marginTop: '16px' }}>
                        <button
                          className="desktop-cta-btn"
                          style={{ ...desktopStyles.ctaButton('var(--color-primary, #0F766E)'), width: '100%', background: '#f8fafc', color: 'var(--color-primary, #0F766E)', border: '2px dashed var(--color-primary, #0F766E)' }}
                          onClick={() => setQuickAddState({ ...quickAddState, isOpen: true, teamId: selectedMatch.doiNha?.id || '' })}
                        >
                          <IconEvent size={18} /> NHẬP NHANH SỰ KIỆN (SAU TRẬN)
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* TIMELINE */}
                <div style={desktopStyles.timelineCard}>
                  <div style={desktopStyles.timelineHeader}>
                    <IconEvent size={16} /> Diễn biến trận đấu
                  </div>
                  <div style={{ flex: 1, overflowY: 'auto' }}>
                    {(!selectedMatch.suKien || selectedMatch.suKien.length === 0) ? (
                      <div style={{ textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', padding: '32px 0' }}>Chưa có sự kiện nào</div>
                    ) : (
                      <div className="ref-timeline-container">
                        {(() => {
                          const chronologicalEvents = selectedMatch.suKien
                            .slice()
                            .sort((a: any, b: any) => a.phut - b.phut || a.id.localeCompare(b.id));

                          let homeScore = 0;
                          let awayScore = 0;

                          const eventsWithScores = chronologicalEvents.map((sk: any) => {
                            const isGoal = sk.loai?.startsWith('GOAL') || sk.loai === 'BAN_THANG';
                            const isOwnGoal = sk.loai === 'GOAL_OG';
                            
                            if (isGoal) {
                              const isHomeScorer = sk.doiId === selectedMatch.doiNha?.id || sk.doi?.ten === selectedMatch.doiNha?.ten;
                              if (isOwnGoal) {
                                if (isHomeScorer) awayScore++; else homeScore++;
                              } else {
                                if (isHomeScorer) homeScore++; else awayScore++;
                              }
                            }
                            
                            return {
                              ...sk,
                              score: `${homeScore} - ${awayScore}`
                            };
                          });

                          const listItems: any[] = [];
                          let htInserted = false;

                          eventsWithScores.forEach((sk: any) => {
                            if (sk.phut > 45 && !htInserted) {
                              const goalsBeforeHT = eventsWithScores.filter((e: any) => e.phut <= 45 && (e.loai?.startsWith('GOAL') || e.loai === 'BAN_THANG'));
                              let htHome = 0;
                              let htAway = 0;
                              goalsBeforeHT.forEach((g: any) => {
                                const isHomeScorer = g.doiId === selectedMatch.doiNha?.id || g.doi?.ten === selectedMatch.doiNha?.ten;
                                const isOG = g.loai === 'GOAL_OG';
                                if (isOG) {
                                  if (isHomeScorer) htAway++; else htHome++;
                                } else {
                                  if (isHomeScorer) htHome++; else htAway++;
                                }
                              });
                              listItems.push({
                                type: 'PERIOD',
                                id: 'ht-row',
                                label: 'HT',
                                score: `${htHome} - ${htAway}`
                              });
                              htInserted = true;
                            }
                            listItems.push({
                              type: 'EVENT',
                              ...sk
                            });
                          });

                          if (!htInserted && (selectedMatch.trangThai === 'KET_THUC' || (selectedMatch.trangThai === 'DANG_DIEN_RA' && selectedMatch.phut > 45))) {
                            const goalsBeforeHT = eventsWithScores.filter((e: any) => e.phut <= 45 && (e.loai?.startsWith('GOAL') || e.loai === 'BAN_THANG'));
                            let htHome = 0;
                            let htAway = 0;
                            goalsBeforeHT.forEach((g: any) => {
                              const isHomeScorer = g.doiId === selectedMatch.doiNha?.id || g.doi?.ten === selectedMatch.doiNha?.ten;
                              const isOG = g.loai === 'GOAL_OG';
                              if (isOG) {
                                if (isHomeScorer) htAway++; else htHome++;
                              } else {
                                if (isHomeScorer) htHome++; else htAway++;
                              }
                            });
                            listItems.push({
                              type: 'PERIOD',
                              id: 'ht-row',
                              label: 'HT',
                              score: `${htHome} - ${htAway}`
                            });
                          }

                          if (selectedMatch.trangThai === 'KET_THUC') {
                            listItems.push({
                              type: 'PERIOD',
                              id: 'ft-row',
                              label: 'FT',
                              score: `${selectedMatch.tyNha ?? 0} - ${selectedMatch.tyKhach ?? 0}`
                            });
                          }

                          const eventIconsMap: Record<string, string> = {
                            'BAN_THANG': '⚽',
                            'GOAL_NORMAL': '⚽',
                            'GOAL_PEN': '⚽',
                            'GOAL_OG': '⚽',
                            'THE_VANG': '🟨',
                            'THE_DO': '🟥',
                            'THAY_NGUOI': '🔄',
                            'SUB': '🔄',
                            'CARD': '🟨',
                          };

                          return listItems.map((item: any) => {
                            if (item.type === 'PERIOD') {
                              return (
                                <div key={item.id} className="ref-timeline-row ref-period-row">
                                  <div className="ref-min-col">{item.label}</div>
                                  <div className="ref-home-col"></div>
                                  <div className="ref-center-col">
                                    <span className="ref-period-score">{item.score}</span>
                                  </div>
                                  <div className="ref-away-col"></div>
                                  <div className="ref-delete-col"></div>
                                </div>
                              );
                            }

                            const sk = item;
                            const isGoal = sk.loai?.startsWith('GOAL') || sk.loai === 'BAN_THANG';
                            const isOwnGoal = sk.loai === 'GOAL_OG';
                            const isSub = sk.loai === 'SUB' || sk.loai === 'THAY_NGUOI';

                            const isHomeTeamEvent = isOwnGoal
                              ? !(sk.doiId === selectedMatch.doiNha?.id || sk.doi?.ten === selectedMatch.doiNha?.ten)
                              : (sk.doiId === selectedMatch.doiNha?.id || sk.doi?.ten === selectedMatch.doiNha?.ten);

                            let actionDesc = sk.moTa || '';
                            if (sk.cauThu?.ten && actionDesc.startsWith(sk.cauThu.ten)) {
                              actionDesc = actionDesc.substring(sk.cauThu.ten.length).trim();
                              actionDesc = actionDesc.replace(/^[\s—\-\(\)]+/, '').replace(/[\(\)]+$/, '');
                            }

                            const playerDisplay = (
                              <div>
                                <div className="ref-player-name">
                                  {sk.cauThu?.ten || 'Cầu thủ'}
                                  {sk.cauThu?.soAo && <span style={{ color: '#94a3b8', marginLeft: '4px', fontSize: '11px' }}>(#{sk.cauThu.soAo})</span>}
                                </div>
                                {isSub ? (
                                  <div className="ref-player-sub">
                                    <span style={{ color: '#10b981' }}>▲</span> Vào sân
                                    {sk.moTa && (
                                      <span style={{ marginLeft: '4px', color: '#64748b' }}>
                                        (ra: {sk.moTa.replace('Vào sân thay cho ', '')})
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  actionDesc && <div className="ref-player-sub">{actionDesc}</div>
                                )}
                              </div>
                            );

                            return (
                              <div key={sk.id} className="ref-timeline-row">
                                <div className="ref-min-col">{sk.phut}&apos;</div>

                                <div className="ref-home-col">
                                  {isHomeTeamEvent && playerDisplay}
                                </div>

                                <div className="ref-center-col">
                                  {isGoal ? (
                                    isHomeTeamEvent ? (
                                      <>
                                        <span>{eventIconsMap[sk.loai] ?? '⚽'}</span>
                                        <span className="ref-score-badge">{sk.score}</span>
                                      </>
                                    ) : (
                                      <>
                                        <span className="ref-score-badge">{sk.score}</span>
                                        <span>{eventIconsMap[sk.loai] ?? '⚽'}</span>
                                      </>
                                    )
                                  ) : (
                                    <span>{eventIconsMap[sk.loai] ?? '⚡'}</span>
                                  )}
                                </div>

                                <div className="ref-away-col">
                                  {!isHomeTeamEvent && playerDisplay}
                                </div>

                                <div className="ref-delete-col">
                                  <button
                                    className="desktop-undo-btn"
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      color: '#ef4444',
                                      cursor: 'pointer',
                                      opacity: 0.7,
                                      transition: 'opacity 0.15s, color 0.15s',
                                      padding: '4px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center'
                                    }}
                                    onClick={() => handleDeleteEvent(sk.id, sk.loai, sk.diemCong, sk.isIndividual, sk.cauThuId)}
                                    title="Xóa sự kiện"
                                  >
                                    <IconTrash size={15} />
                                  </button>
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: AWAY TEAM */}
              <div style={desktopStyles.columnHomeAway}>
                <div style={desktopStyles.card}>
                  <h3 style={desktopStyles.cardTitle}>
                    <span style={{ width: '20px', height: '20px', display: 'flex' }}>
                      <TeamLogo logo={selectedMatch.doiKhach?.logo} teamName={selectedMatch.doiKhach?.ten} />
                    </span>
                    <strong style={{ fontWeight: 800 }}>{selectedMatch.doiKhach?.ten?.toUpperCase()}</strong>
                    <span style={{ fontWeight: 500, opacity: 0.8 }}> (ĐỘI KHÁCH)</span>
                  </h3>
                  <div onClick={e => e.stopPropagation()}>{renderDesktopLineupImageStyle(selectedMatch.doiKhach, false)}</div>
                </div>
              </div>
            </div>
          ) : (
            /* MOBILE VIEW (< 1024px) */
            <div className={styles.liveConsole}>
              {/* TOP BAR */}
              <div className={styles.consoleTopBar} style={{ marginBottom: 0, paddingBottom: '16px' }}>
                <button className={styles.consoleBackBtn} onClick={() => setSelectedMatchId(null)}>
                  ← Trở về
                </button>
                <div className={styles.consoleMatchMeta}>
                  <span className={styles.consoleVong}>{selectedMatch.vong}</span>
                  {selectedMatch.trangThai === 'DANG_DIEN_RA' && (
                    <div className={styles.consoleLiveBadge}>
                      <span className={styles.liveDot}></span>
                      LIVE - HIỆP {selectedMatch.hiepHienTai || 1}
                    </div>
                  )}
                  {selectedMatch.trangThai === 'KET_THUC' && (
                    <span className={styles.consoleFinishedBadge}>ĐÃ KẾT THÚC</span>
                  )}
                </div>
              </div>

              {/* 1. STICKY SCOREBOARD */}
              <div className={styles.stickyScoreboard}>
                <div className={styles.consoleCentralHeaderCard} style={{ background: 'transparent', boxShadow: 'none', padding: 0 }}>
                  <div className={styles.consoleCentralTeam}>
                    <span className={styles.consoleCentralLogo} style={{ display: 'flex', width: '40px', height: '40px' }}><TeamLogo logo={selectedMatch.doiNha?.logo} teamName={selectedMatch.doiNha?.ten} /></span>
                    <span className={styles.consoleCentralName}>{selectedMatch.doiNha?.ten}</span>
                  </div>

                  <div className={styles.consoleCentralScoreWrapper}>
                    <div className={styles.consoleCentralScore}>
                      <span className={styles.consoleCentralBigScore}>{selectedMatch.tyNha}</span>
                      <span className={styles.consoleCentralScoreSep}>:</span>
                      <span className={styles.consoleCentralBigScore}>{selectedMatch.tyKhach}</span>
                    </div>
                  </div>

                  <div className={styles.consoleCentralTeam}>
                    <span className={styles.consoleCentralLogo} style={{ display: 'flex', width: '40px', height: '40px' }}><TeamLogo logo={selectedMatch.doiKhach?.logo} teamName={selectedMatch.doiKhach?.ten} /></span>
                    <span className={styles.consoleCentralName}>{selectedMatch.doiKhach?.ten}</span>
                  </div>
                </div>

                <div className={styles.consoleCentralTimerWrapper} style={{ marginTop: '12px' }}>
                  <div className={styles.consoleCentralTimer} style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
                    <IconTimer size={18} /> {formatMatchTime(selectedMatch)}
                  </div>
                  <div className={styles.consoleCentralHalfLabel}>
                    Hiệp {selectedMatch.hiepHienTai || 1}
                  </div>
                </div>
              </div>

              {/* MAIN FIELD CONTROLLER (MOBILE FIRST) */}
              <div style={{ padding: '0 16px' }}>

                {/* MATCH STATE MACHINE MAIN CTA (START / PAUSE / RESUME) */}
                <div className={styles.consoleMainCtaWrapper} style={{ marginBottom: '24px' }}>
                  {getMatchHalfState(selectedMatch) === '1_not_started' && (
                    <button className={`${styles.consoleMainCta} ${styles.ctaStartH1}`} onClick={() => handleStartMatch(selectedMatch.id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <IconPlay size={20} /> BẮT ĐẦU HIỆP 1
                    </button>
                  )}

                  {getMatchHalfState(selectedMatch) === '1_active' && (
                    <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                      <button className={styles.consoleMainCta} style={{ background: selectedMatch.dangTamDung ? '#10b981' : '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }} onClick={() => handleTemporaryPauseToggle(selectedMatch.id)}>
                        {selectedMatch.dangTamDung ? <><IconPlay size={20} /> TIẾP TỤC</> : <><IconPause size={20} /> TẠM DỪNG</>}
                      </button>
                      <button className={`${styles.consoleMainCta} ${styles.ctaEndH1}`} onClick={() => handlePauseMatch(selectedMatch.id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <IconPause size={20} /> HẾT H1
                      </button>
                    </div>
                  )}

                  {getMatchHalfState(selectedMatch) === 'half_time' && (
                    <>
                      <span className={styles.halfTimeOverlayText}>Đang nghỉ giữa hiệp</span>
                      <button className={`${styles.consoleMainCta} ${styles.ctaStartH2}`} onClick={() => handleResumeMatch(selectedMatch.id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <IconPlay size={20} /> BẮT ĐẦU HIỆP 2
                      </button>
                    </>
                  )}

                  {getMatchHalfState(selectedMatch) === '2_active' && (
                    <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                      <button className={styles.consoleMainCta} style={{ background: selectedMatch.dangTamDung ? '#10b981' : '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }} onClick={() => handleTemporaryPauseToggle(selectedMatch.id)}>
                        {selectedMatch.dangTamDung ? <><IconPlay size={20} /> TIẾP TỤC</> : <><IconPause size={20} /> TẠM DỪNG</>}
                      </button>
                      <button className={`${styles.consoleMainCta} ${styles.ctaEndMatch}`} onClick={() => handleFinishMatch(selectedMatch.id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <IconStop size={20} /> KẾT THÚC
                      </button>
                    </div>
                  )}

                  {getMatchHalfState(selectedMatch) === 'finished' && (
                    <button className={`${styles.consoleMainCta} ${styles.ctaReset}`} onClick={() => handleResetMatch(selectedMatch.id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <IconReset size={20} /> THIẾT LẬP LẠI
                    </button>
                  )}
                </div>

                {/* 2. HUGE ACTION BUTTONS (EVENT WIZARD FLOW) */}
                <div className={styles.mobileMainActionArea}>
                  <button
                    className={`${styles.hugeActionBtn} ${styles.hugeActionGoal}`}
                    onClick={() => openWizard('goal')}
                    disabled={selectedMatch.trangThai !== 'DANG_DIEN_RA'}
                    style={{ opacity: (selectedMatch.trangThai !== 'DANG_DIEN_RA') ? 0.5 : 1 }}
                  >
                    <span className={styles.hugeActionIcon} style={{ display: 'flex', justifyContent: 'center' }}><IconGoal size={40} /></span>
                    <span>Bàn thắng</span>
                  </button>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <button
                      className={`${styles.hugeActionBtn} ${styles.hugeActionCard}`}
                      onClick={() => openWizard('card')}
                      disabled={selectedMatch.trangThai !== 'DANG_DIEN_RA'}
                      style={{ opacity: (selectedMatch.trangThai !== 'DANG_DIEN_RA') ? 0.5 : 1 }}
                    >
                      <span className={styles.hugeActionIcon} style={{ display: 'flex', justifyContent: 'center' }}><IconCardDouble size={40} /></span>
                      <span>Thẻ phạt</span>
                    </button>

                    <button
                      className={`${styles.hugeActionBtn} ${styles.hugeActionSub}`}
                      onClick={() => openWizard('sub')}
                      disabled={selectedMatch.trangThai !== 'DANG_DIEN_RA'}
                      style={{ opacity: (selectedMatch.trangThai !== 'DANG_DIEN_RA') ? 0.5 : 1 }}
                    >
                      <span className={styles.hugeActionIcon} style={{ display: 'flex', justifyContent: 'center' }}><IconSwap size={40} /></span>
                      <span>Thay người</span>
                    </button>
                  </div>
                </div>

                {/* SECONDARY ACTION BUTTONS (CUSTOM EVENTS & MOTM) */}
                {(customEvents.length > 0 || selectedMatch.trangThai === 'KET_THUC') && (
                  <div className={styles.mobileSecondaryActionArea}>
                    {selectedMatch.trangThai === 'KET_THUC' && (
                      <>
                        <button
                          className={styles.secondaryActionBtn}
                          onClick={() => setQuickAddState({ ...quickAddState, isOpen: true, teamId: selectedMatch.doiNha?.id || '' })}
                          style={{ gridColumn: '1 / -1', background: '#f3f4f6', borderColor: '#9ca3af', color: '#1f2937', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontWeight: 700, padding: '16px', borderStyle: 'dashed' }}
                        >
                          <IconEvent size={20} /> NHẬP NHANH SỰ KIỆN (SAU TRẬN)
                        </button>
                        <button
                          className={styles.secondaryActionBtn}
                          onClick={() => openWizard('motm', 'normal')}
                          style={{ gridColumn: '1 / -1', background: '#faf5ff', borderColor: '#c084fc', color: '#7e22ce', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                        >
                          <IconMedal size={20} /> Bầu xuất sắc nhất (MOTM)
                        </button>
                      </>
                    )}
                    {customEvents.map((evt) => (
                      <button
                        key={evt.id}
                        className={styles.secondaryActionBtn}
                        onClick={() => openWizard('custom', 'normal', evt.id)}
                        disabled={selectedMatch.trangThai !== 'DANG_DIEN_RA'}
                      >
                        <span>{evt.icon}</span> {evt.name} {evt.points ? `(+${evt.points})` : ''}
                      </button>
                    ))}
                  </div>
                )}

                {/* 3. EVENT TIMELINE LOG (COMPACT) */}
                <div className={styles.consoleEventLog}>
                  <div className={styles.consoleEventLogTitle}>NHẬT KÝ SỰ KIỆN</div>
                  <div className={styles.consoleEventLogList}>
                    {(!selectedMatch.suKien || selectedMatch.suKien.length === 0) ? (
                      <div className={styles.consoleEventEmpty}>Chưa ghi nhận sự kiện nào</div>
                    ) : (
                      selectedMatch.suKien.slice().sort((a: any, b: any) => b.phut - a.phut || b.id.localeCompare(a.id)).slice(0, 5).map((ev: any) => {
                        const pointsLabel = ev.diemCong ? ` (${ev.diemCong > 0 ? '+' : ''}${ev.diemCong}đ)` : '';
                        return (
                          <div key={ev.id} className={styles.consoleEventRow}>
                            <span className={styles.consoleEventMin}>{ev.phut || 0}&apos;</span>
                            <span className={styles.consoleEventDesc} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              {ev.teamId === selectedMatch.doiNha?.id ? <IconHome size={14} /> : <IconAway size={14} />}
                              <strong>{ev.cauThu?.ten || 'Cầu thủ'}</strong> ({ev.moTa || ev.loai}){pointsLabel}
                            </span>
                            <button
                              className={styles.consoleUndoBtn}
                              style={{
                                color: '#ef4444',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '4px',
                                border: 'none',
                                background: 'none'
                              }}
                              onClick={() => handleDeleteEvent(ev.id, ev.loai, ev.diemCong, ev.isIndividual, ev.cauThuId)}
                              title="Xóa sự kiện"
                            >
                              <IconTrash size={16} />
                            </button>
                          </div>
                        );
                      })
                    )}
                    {selectedMatch.suKien?.length > 5 && (
                      <div style={{ textAlign: 'center', fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>
                        Hiển thị 5 sự kiện gần nhất...
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* BOTTOM SHEET WIZARD OVERLAY */}
      {wizardState.isOpen && selectedMatch && (
        <div className={styles.mobileBottomSheetOverlay} onClick={closeWizard}>
          <div className={styles.mobileBottomSheet} onClick={(e) => e.stopPropagation()}>
            <div className={styles.bottomSheetHandle}></div>

            <div className={styles.bsHeaderTitle} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              {wizardState.action === 'goal' && <><IconGoal size={20} /> XÁC NHẬN BÀN THẮNG</>}
              {wizardState.action === 'card' && <><IconCardDouble size={20} /> XÁC NHẬN THẺ PHẠT</>}
              {wizardState.action === 'sub' && (wizardState.step === 1 ? <><IconSwap size={20} /> CHỌN NGƯỜI RA SÂN</> : <><IconSwap size={20} /> CHỌN NGƯỜI VÀO SÂN</>)}
              {wizardState.action === 'custom' && <><IconEvent size={20} /> GHI NHẬN SỰ KIỆN</>}
              {wizardState.action === 'motm' && <><IconMedal size={20} /> BẦU MVP</>}
            </div>

            {/* TEAM SEGMENTED CONTROL */}
            {wizardState.step === 1 && wizardState.action !== 'motm' && (
              <div className={styles.segmentedControl}>
                <button
                  className={`${styles.segmentBtn} ${wizardState.teamId === selectedMatch.doiNha?.id ? styles.segmentBtnActive : ''}`}
                  onClick={() => setWizardState(prev => ({ ...prev, teamId: selectedMatch.doiNha?.id }))}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <IconHome size={16} /> {selectedMatch.doiNha?.ten}
                </button>
                <button
                  className={`${styles.segmentBtn} ${wizardState.teamId === selectedMatch.doiKhach?.id ? styles.segmentBtnActive : ''}`}
                  onClick={() => setWizardState(prev => ({ ...prev, teamId: selectedMatch.doiKhach?.id }))}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <IconAway size={16} /> {selectedMatch.doiKhach?.ten}
                </button>
              </div>
            )}

            {wizardState.action !== 'motm' && (
              <div style={{ padding: '0 20px', marginTop: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <label style={{ fontSize: '14px', fontWeight: 600, color: '#475569', minWidth: '100px' }}>Phút thi đấu:</label>
                <input 
                  type="number" 
                  placeholder={selectedMatch.trangThai === 'DANG_DIEN_RA' ? String(selectedMatch.phut || 0) : 'Ví dụ: 45'}
                  value={wizardState.minute || ''}
                  onChange={e => setWizardState(prev => ({...prev, minute: e.target.value}))}
                  style={{ flex: 1, padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '16px' }}
                />
              </div>
            )}

            {/* ACTION CHIPS FOR SPECIFIC TYPES */}
            {wizardState.action === 'goal' && (
              <div className={styles.actionOptionsChips}>
                <button
                  className={`${styles.actionChip} ${wizardState.subType === 'normal' ? styles.actionChipActive : ''}`}
                  onClick={() => setWizardState(prev => ({ ...prev, subType: 'normal' }))}
                >Bàn thắng thường</button>
                <button
                  className={`${styles.actionChip} ${wizardState.subType === 'pen' ? styles.actionChipActive : ''}`}
                  onClick={() => setWizardState(prev => ({ ...prev, subType: 'pen' }))}
                >Penalty</button>
                <button
                  className={`${styles.actionChip} ${wizardState.subType === 'og' ? styles.actionChipActive : ''}`}
                  onClick={() => setWizardState(prev => ({ ...prev, subType: 'og' }))}
                >Phản lưới nhà</button>
              </div>
            )}

            {wizardState.action === 'card' && (
              <div className={styles.actionOptionsChips} style={{ justifyContent: 'center' }}>
                <button
                  className={`${styles.actionChip} ${wizardState.subType === 'yellow' ? styles.actionChipActive : ''}`}
                  onClick={() => setWizardState(prev => ({ ...prev, subType: 'yellow' }))}
                  style={{ ...(wizardState.subType === 'yellow' ? { background: '#f59e0b', borderColor: '#f59e0b' } : {}), display: 'flex', alignItems: 'center', gap: '4px' }}
                ><IconCard size={16} /> Thẻ Vàng</button>
                <button
                  className={`${styles.actionChip} ${wizardState.subType === 'red' ? styles.actionChipActive : ''}`}
                  onClick={() => setWizardState(prev => ({ ...prev, subType: 'red' }))}
                  style={{ ...(wizardState.subType === 'red' ? { background: '#ef4444', borderColor: '#ef4444' } : {}), display: 'flex', alignItems: 'center', gap: '4px' }}
                ><IconCard size={16} /> Thẻ Đỏ</button>
              </div>
            )}

            {/* PLAYER LIST */}
            <div className={styles.mobilePlayerList}>
              {(() => {
                const team = wizardState.teamId === selectedMatch.doiNha?.id ? selectedMatch.doiNha : selectedMatch.doiKhach;
                const { starters, bench } = calculateCurrentRoster(team, selectedMatch.suKien, starterCount);

                // Determine which list to show based on action
                let listToShow = starters;
                if (wizardState.action === 'sub') {
                  listToShow = wizardState.step === 1 ? starters : bench;
                } else if (wizardState.action === 'motm') {
                  // For MOTM show everyone from both teams
                  const homePlayers = selectedMatch.doiNha?.cauThu || [];
                  const awayPlayers = selectedMatch.doiKhach?.cauThu || [];
                  return [...homePlayers, ...awayPlayers].map(p => (
                    <button key={p.id} className={styles.mobilePlayerItem} onClick={() => handlePlayerSelect(p)}>
                      <div className={styles.mobilePlayerNo}>{p.soAo}</div>
                      <div className={styles.mobilePlayerInfo}>
                        <div className={styles.mobilePlayerName}>{p.ten}</div>
                        <div className={styles.mobilePlayerMeta}>{p.teamId === selectedMatch.doiNha?.id ? selectedMatch.doiNha?.ten : selectedMatch.doiKhach?.ten}</div>
                      </div>
                    </button>
                  ));
                }

                if (!listToShow || listToShow.length === 0) {
                  return <div className={styles.consoleEmptyRoster}>Không có cầu thủ nào</div>;
                }

                return listToShow.map((player: any) => {
                  const yellowCount = selectedMatch.suKien?.filter((ev: any) => ev.loai === 'THE_VANG' && ev.cauThuId === player.id).length || 0;
                  const hasRedCard = selectedMatch.suKien?.some((ev: any) => ev.loai === 'THE_DO' && ev.cauThuId === player.id) || yellowCount >= 2;
                  const goalCount = selectedMatch.suKien?.filter((ev: any) => ev.loai.startsWith('GOAL_') && ev.loai !== 'GOAL_OG' && ev.cauThuId === player.id).length || 0;

                  // Disabled logic
                  const isRedCarded = hasRedCard;
                  const disabled = isRedCarded && wizardState.action !== 'sub'; // Can't score/card red carded, but maybe can sub out? Actually, red carded players usually can't be subbed out. Let's disable them.

                  return (
                    <button
                      key={player.id}
                      className={styles.mobilePlayerItem}
                      onClick={() => handlePlayerSelect(player)}
                      disabled={disabled || (isRedCarded && wizardState.action === 'sub')}
                      style={{ opacity: disabled || (isRedCarded && wizardState.action === 'sub') ? 0.5 : 1 }}
                    >
                      <div className={styles.mobilePlayerNo}>{player.soAo}</div>
                      <div className={styles.mobilePlayerInfo}>
                        <div className={styles.mobilePlayerName}>{player.ten}</div>
                        <div className={styles.mobilePlayerBadges} style={{ display: 'flex', gap: '4px' }}>
                          {goalCount > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>{goalCount > 1 ? goalCount : ''}<IconGoal size={14} /></span>}
                          {yellowCount > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>{yellowCount > 1 ? yellowCount : ''}<IconCard size={14} /></span>}
                          {hasRedCard && <span style={{ display: 'flex', alignItems: 'center' }}><IconCard size={14} /></span>}
                        </div>
                      </div>
                    </button>
                  );
                });
              })()}
            </div>

          </div>
        </div>
      )}

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
                      name="postponeStrategyDesktop"
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
                      name="postponeStrategyDesktop"
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
                      name="postponeStrategyDesktop"
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

      {/* QUICK ADD MODAL */}
      {quickAddState.isOpen && selectedMatch && (
        <div className="fixed inset-0 bg-[#050810]/85 backdrop-blur-md z-[1000] flex flex-col justify-end md:justify-center md:items-center p-0 md:p-4 animate-fade-in" onClick={() => setQuickAddState(prev => ({ ...prev, isOpen: false }))}>
          <div className="w-full max-w-md mx-auto rounded-t-2xl md:rounded-2xl bg-[#0b1320] border-t md:border border-slate-800 p-6 shadow-2xl flex flex-col text-slate-200" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center pb-4 border-b border-slate-800 mb-6">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                📝 Nhập sự kiện bổ sung (Sau trận)
              </h3>
              <button className="text-slate-400 hover:text-slate-200 text-lg font-semibold cursor-pointer" onClick={() => setQuickAddState(prev => ({ ...prev, isOpen: false }))}>✕</button>
            </div>
            
            <div className="flex flex-col gap-4">
              {/* TEAM SELECT */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400">Đội bóng</label>
                <select
                  className="w-full bg-[#141d2f] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-[#00D4B8] transition-colors cursor-pointer"
                  value={quickAddState.teamId}
                  onChange={(e) => setQuickAddState(prev => ({ ...prev, teamId: e.target.value, playerId: '', subOutPlayerId: '' }))}
                >
                  <option value="">-- Chọn đội bóng --</option>
                  <option value={selectedMatch.doiNha?.id}>{selectedMatch.doiNha?.ten}</option>
                  <option value={selectedMatch.doiKhach?.id}>{selectedMatch.doiKhach?.ten}</option>
                </select>
              </div>

              {/* ACTION TYPE */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400">Loại sự kiện</label>
                <select
                  className="w-full bg-[#141d2f] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-[#00D4B8] transition-colors cursor-pointer"
                  value={quickAddState.action}
                  onChange={(e) => {
                    const val = e.target.value as any;
                    setQuickAddState(prev => ({ 
                      ...prev, 
                      action: val, 
                      subType: val === 'card' ? 'yellow' : val === 'goal' ? 'normal' : '' 
                    }));
                  }}
                >
                  <option value="goal">Bàn thắng</option>
                  <option value="card">Thẻ phạt</option>
                  <option value="sub">Thay người</option>
                </select>
              </div>

              {quickAddState.action === 'card' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-400">Loại thẻ</label>
                  <select
                    className="w-full bg-[#141d2f] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-[#00D4B8] transition-colors cursor-pointer"
                    value={quickAddState.subType}
                    onChange={(e) => setQuickAddState(prev => ({ ...prev, subType: e.target.value }))}
                  >
                    <option value="yellow">Thẻ vàng 🟨</option>
                    <option value="red">Thẻ đỏ 🟥</option>
                  </select>
                </div>
              )}

              {quickAddState.action === 'goal' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-400">Chi tiết bàn thắng</label>
                  <select
                    className="w-full bg-[#141d2f] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-[#00D4B8] transition-colors cursor-pointer"
                    value={quickAddState.subType}
                    onChange={(e) => setQuickAddState(prev => ({ ...prev, subType: e.target.value }))}
                  >
                    <option value="normal">Bình thường</option>
                    <option value="pen">Penalty</option>
                    <option value="og">Phản lưới nhà</option>
                  </select>
                </div>
              )}

              {/* MINUTE */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400">Phút thi đấu</label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  placeholder="Ví dụ: 90"
                  className="w-full bg-[#141d2f] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-[#00D4B8] transition-colors"
                  value={quickAddState.minute}
                  onChange={(e) => setQuickAddState(prev => ({ ...prev, minute: e.target.value }))}
                />
              </div>

              {/* PLAYERS */}
              {(() => {
                const team = quickAddState.teamId === selectedMatch.doiNha?.id ? selectedMatch.doiNha : selectedMatch.doiKhach;
                if (!team) {
                  return (
                    <div className="text-xs text-slate-400 italic bg-[#141d2f]/50 border border-dashed border-slate-800 rounded-xl p-4 text-center mt-2">
                      Vui lòng chọn đội bóng trước để chọn danh sách cầu thủ.
                    </div>
                  );
                }
                const { starters, bench } = calculateCurrentRoster(team, selectedMatch.suKien, starterCount);
                const allPlayers = [...starters, ...bench];

                return (
                  <div className="flex flex-col gap-4">
                    {quickAddState.action === 'sub' ? (
                      <>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-semibold text-slate-400">Cầu thủ ra sân</label>
                          <select
                            className="w-full bg-[#141d2f] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-[#00D4B8] transition-colors cursor-pointer"
                            value={quickAddState.subOutPlayerId}
                            onChange={(e) => setQuickAddState(prev => ({ ...prev, subOutPlayerId: e.target.value }))}
                          >
                            <option value="">-- Chọn cầu thủ ra sân --</option>
                            {starters.map((p: any) => <option key={p.id} value={p.id}>#{p.soAo} {p.ten}</option>)}
                          </select>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-semibold text-slate-400">Cầu thủ vào sân</label>
                          <select
                            className="w-full bg-[#141d2f] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-[#00D4B8] transition-colors cursor-pointer"
                            value={quickAddState.playerId}
                            onChange={(e) => setQuickAddState(prev => ({ ...prev, playerId: e.target.value }))}
                          >
                            <option value="">-- Chọn cầu thủ vào sân --</option>
                            {bench.map((p: any) => <option key={p.id} value={p.id}>#{p.soAo} {p.ten}</option>)}
                          </select>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-slate-400">Cầu thủ thực hiện</label>
                        <select
                          className="w-full bg-[#141d2f] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-[#00D4B8] transition-colors cursor-pointer"
                          value={quickAddState.playerId}
                          onChange={(e) => setQuickAddState(prev => ({ ...prev, playerId: e.target.value }))}
                        >
                          <option value="">-- Chọn cầu thủ --</option>
                          {allPlayers.map((p: any) => <option key={p.id} value={p.id}>#{p.soAo} {p.ten}</option>)}
                        </select>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            <div className="flex flex-col-reverse md:flex-row md:justify-end gap-3 mt-8 pt-4 border-t border-slate-800">
              <button 
                className="w-full md:w-auto px-6 py-2.5 rounded-xl font-semibold text-sm border border-slate-700 hover:bg-slate-800 text-slate-300 transition-colors cursor-pointer text-center" 
                onClick={() => setQuickAddState(prev => ({ ...prev, isOpen: false, minute: '', playerId: '', subOutPlayerId: '' }))}
              >
                Hủy bỏ
              </button>
              <button 
                className="w-full md:w-auto px-6 py-2.5 rounded-xl font-bold text-sm bg-[#00D4B8] hover:bg-[#00bda3] text-[#080C10] transition-colors cursor-pointer text-center" 
                onClick={() => {
                  const team = quickAddState.teamId === selectedMatch.doiNha?.id ? selectedMatch.doiNha : selectedMatch.doiKhach;
                  if (!team) {
                    alert('Vui lòng chọn đội bóng!');
                    return;
                  }
                  const { starters, bench } = calculateCurrentRoster(team, selectedMatch.suKien, starterCount);
                  const allPlayers = [...starters, ...bench];
                  
                  const targetPlayer = allPlayers.find((p: any) => p.id === quickAddState.playerId);
                  
                  if (!targetPlayer || !quickAddState.minute) {
                    alert('Vui lòng chọn cầu thủ và điền phút thi đấu!');
                    return;
                  }

                  if (quickAddState.action === 'sub') {
                    const outPlayer = starters.find((p: any) => p.id === quickAddState.subOutPlayerId);
                    if (!outPlayer) {
                      alert('Vui lòng chọn cầu thủ ra sân!');
                      return;
                    }
                    handleExecuteSubstitution(targetPlayer, outPlayer, team.id, quickAddState.minute);
                  } else {
                    handleActionSelect(quickAddState.action, quickAddState.subType, {
                      matchId: selectedMatch.id,
                      teamId: quickAddState.teamId,
                      player: targetPlayer,
                      minute: quickAddState.minute
                    });
                  }
                  
                  setQuickAddState(prev => ({ ...prev, isOpen: false, minute: '', playerId: '', subOutPlayerId: '' }));
                }}
              >
                Xác nhận lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
