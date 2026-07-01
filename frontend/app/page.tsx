'use client';

import { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import GlobalSkeletonLoader from '@/components/GlobalSkeletonLoader';
import styles from './page.module.css';
import { layTongQuan, layDanhSachDoi } from '@/lib/api';
import { useRouter, useSearchParams } from 'next/navigation';
import { usePublicTournament } from '@/components/PublicTournamentContext';
import MatchListFeed from '@/components/MatchListFeed';
import StandingsTab from '@/components/StandingsTab';
import StatsTab from '@/components/StatsTab';
import { TrophyIcon } from '@/components/AppIcons';

function getGenericRoundKey(roundName: string): string {
  if (!roundName) return '';
  const groupVongMatch = roundName.match(/Bảng\s+[A-Z]\s+-\s+(Vòng\s+\d+)/i) || roundName.match(/(Vòng\s+\d+)\s+-\s+Bảng\s+[A-Z]/i);
  if (groupVongMatch) {
    return groupVongMatch[1];
  }
  if (roundName === 'Chung kết' || roundName === 'Tranh hạng ba') {
    return 'Chung kết & Tranh hạng ba';
  }
  return roundName.split(' - ')[0];
}

// ─── Helper: calculate live match minute ───────────────────────────────────
function calcLiveMinute(match: any): string {
  if (match.dangTamDung || match.currentPeriod === 'BREAK') return 'HT';

  const now = Date.now();

  if (match.currentPeriod === 'HALF_2' && match.half2StartTime) {
    const elapsed = Math.floor((now - new Date(match.half2StartTime).getTime()) / 60000);
    const minute = 45 + elapsed;
    return `${Math.min(minute, 90)}'`;
  }

  if (match.half1StartTime) {
    const elapsed = Math.floor((now - new Date(match.half1StartTime).getTime()) / 60000);
    const minute = elapsed + 1;
    return `${Math.min(minute, 45)}'`;
  }

  if (match.batDauLuc) {
    const elapsed = Math.floor((now - new Date(match.batDauLuc).getTime()) / 60000);
    return `${Math.max(1, Math.min(elapsed, 90))}'`;
  }

  return 'LIVE';
}

function TongQuanContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const { selectedTournamentId, selectedTournament, tournaments, setSelectedTournamentId, loading: contextLoading } = usePublicTournament();
  const [data, setData] = useState<any>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Tab State: 'matches' | 'standings' | 'stats'
  const [activeTab, setActiveTab] = useState<'matches' | 'standings' | 'stats'>('matches');

  // ─── Live panel state ───────────────────────────────────────────────────────
  const [livePanelOpen, setLivePanelOpen] = useState(false);
  const [showNotifTooltip, setShowNotifTooltip] = useState(false);
  const livePanelRef = useRef<HTMLDivElement>(null);

  // Close live panel on outside click (web dropdown)
  useEffect(() => {
    if (!livePanelOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (livePanelRef.current && !livePanelRef.current.contains(e.target as Node)) {
        setLivePanelOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [livePanelOpen]);

  // Sync tab from search params
  useEffect(() => {
    if (tabParam === 'standings' || tabParam === 'stats' || tabParam === 'matches') {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (newTab: 'matches' | 'standings' | 'stats') => {
    setActiveTab(newTab);
    router.push(`/?tab=${newTab}`);
  };

  // Filters state
  const [selectedMatchweek, setSelectedMatchweek] = useState<string>('DEFAULT');
  const [selectedTeamId, setSelectedTeamId] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'DANG_DIEN_RA' | 'SAP_DIEN_RA' | 'KET_THUC'>('ALL');

  // Load selectedMatchweek from localStorage when tournament changes
  useEffect(() => {
    if (selectedTournamentId) {
      const savedVal = localStorage.getItem(`public_selected_matchweek_${selectedTournamentId}`);
      setSelectedMatchweek(savedVal || 'DEFAULT');
    } else {
      setSelectedMatchweek('DEFAULT');
    }
    // Also reset team selection when tournament changes, as team lists will change
    setSelectedTeamId('ALL');
    setSelectedStatus('ALL');
  }, [selectedTournamentId]);

  // Save selectedMatchweek to localStorage when it changes (excluding 'DEFAULT')
  useEffect(() => {
    if (selectedTournamentId && selectedMatchweek !== 'DEFAULT') {
      localStorage.setItem(`public_selected_matchweek_${selectedTournamentId}`, selectedMatchweek);
    }
  }, [selectedMatchweek, selectedTournamentId]);

  useEffect(() => {
    if (contextLoading) return;

    const loadData = async () => {
      try {
        const [tqData, tData] = await Promise.all([
          layTongQuan(selectedTournamentId || undefined),
          layDanhSachDoi(selectedTournamentId || undefined)
        ]);

        // ═══════════════════════════════════════════════════════
        // MOCK LIVE MATCHES FOR DEMONSTRATION — DELETE BEFORE PROD
        // ═══════════════════════════════════════════════════════
        if (tqData && (!tqData.tranLive || tqData.tranLive.length === 0)) {
          const upcoming = tqData.tranSapDienRa || [];
          const nowIso = new Date().toISOString();
          const half1Start = new Date(Date.now() - 23 * 60 * 1000).toISOString(); // 23 min ago → 24'
          const half2Start = new Date(Date.now() - 18 * 60 * 1000 + 45 * 60 * 1000).toISOString(); // HT+18 min → 63'
          const mockLive: any[] = [];

          if (upcoming[0]) {
            // Mock 1: HALF_1 — phút 24'
            mockLive.push({ ...upcoming[0], trangThai: 'DANG_DIEN_RA', tyNha: 1, tyKhach: 0, dangTamDung: false, matchDurationMinutes: 90, currentPeriod: 'HALF_1', half1StartTime: half1Start });
          }
          if (upcoming[1]) {
            // Mock 2: HALF_2 — phút ~63'
            mockLive.push({ ...upcoming[1], trangThai: 'DANG_DIEN_RA', tyNha: 2, tyKhach: 2, dangTamDung: false, matchDurationMinutes: 90, currentPeriod: 'HALF_2', half1StartTime: half1Start, half2StartTime: half2Start });
          }
          if (upcoming[2]) {
            // Mock 3: HT (nghỉ giữa giờ)
            mockLive.push({ ...upcoming[2], trangThai: 'DANG_DIEN_RA', tyNha: 0, tyKhach: 1, dangTamDung: true, matchDurationMinutes: 90, currentPeriod: 'BREAK' });
          }

          tqData.tranLive = mockLive;
          tqData.tranSapDienRa = upcoming.slice(mockLive.length);
        }
        // ═══════════════════════════════════════════════════════

        setData(tqData);
        setTeams(tData);
      } catch (error) {
        console.error("Lỗi lấy dữ liệu tổng quan:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    const interval = setInterval(loadData, 5000); // 5 seconds polling
    return () => clearInterval(interval);
  }, [selectedTournamentId, contextLoading]);

  const allMatchesList = data?.allMatches || [
    ...(data?.tranLive || []),
    ...(data?.tranSapDienRa || []),
    ...(data?.tranKetThuc || [])
  ];

  // Extract unique and sorted list of rounds
  const uniqueRounds = useMemo(() => {
    const genericRounds = allMatchesList.map((m: any) => getGenericRoundKey(m.vong)).filter(Boolean);
    const rounds = Array.from(new Set(genericRounds)) as string[];
    
    return rounds.sort((a, b) => {
      const parseRoundName = (name: string) => {
        const nameLower = name.toLowerCase();
        if (nameLower.includes("chung kết") && nameLower.includes("tranh hạng ba")) return { type: 5, num: 6 };
        if (nameLower.includes("chung kết")) return { type: 5, num: 5 };
        if (nameLower.includes("tranh hạng ba") || nameLower.includes("hạng ba")) return { type: 5, num: 4 };
        if (nameLower.includes("bán kết")) return { type: 5, num: 3 };
        if (nameLower.includes("tứ kết")) return { type: 5, num: 2 };
        if (nameLower.includes("1/8") || nameLower.includes("1/16") || nameLower.includes("16")) return { type: 5, num: 1 };

        const roundMatch = name.match(/Vòng\s+(\d+)/i);
        if (roundMatch) {
          return { type: 1, num: parseInt(roundMatch[1], 10) };
        }

        return { type: 9, num: 999 };
      };

      const infoA = parseRoundName(a);
      const infoB = parseRoundName(b);

      if (infoA.type !== infoB.type) {
        return infoA.type - infoB.type;
      }
      if (infoA.num !== infoB.num) {
        return infoA.num - infoB.num;
      }
      return a.localeCompare(b);
    });
  }, [allMatchesList]);

  // Determine if it's tournament or league
  const tournamentType = useMemo(() => {
    if (!selectedTournamentId) return 'league';
    const configStr = localStorage.getItem(`giai_dau_config_${selectedTournamentId}`);
    if (configStr) {
      try {
        const config = JSON.parse(configStr);
        if (config.theThuc) return config.theThuc;
      } catch (e) {}
    }
    if (selectedTournament) {
      const nameLower = selectedTournament.ten.toLowerCase();
      if (nameLower.includes('epl') || nameLower.includes('league') || nameLower.includes('vòng tròn') || nameLower.includes('vđqg')) {
        return 'league';
      }
      if (nameLower.includes('cúp') || nameLower.includes('cup') || nameLower.includes('tournament') || nameLower.includes('knockout') || nameLower.includes('loại trực tiếp')) {
        return 'tournament';
      }
    }
    return 'league';
  }, [selectedTournamentId, selectedTournament]);

  // Set default active matchweek based on custom logic sequence
  useEffect(() => {
    if (loading) return;

    if (uniqueRounds.length === 0) {
      if (selectedMatchweek !== 'NONE') setSelectedMatchweek('NONE');
      return;
    }

    if (selectedMatchweek === 'DEFAULT' || selectedMatchweek === 'NONE' || !uniqueRounds.includes(selectedMatchweek)) {
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
      const todayEnd = todayStart + 24 * 60 * 60 * 1000;

      // 1. Matches today
      const matchesToday = allMatchesList.filter((m: any) => {
        const mDateStr = m.date || m.batDauLuc;
        if (!mDateStr) return false;
        try {
          const mTime = new Date(mDateStr).getTime();
          return mTime >= todayStart && mTime < todayEnd;
        } catch (e) {
          return false;
        }
      });

      if (matchesToday.length > 0 && matchesToday[0].vong) {
        setSelectedMatchweek(getGenericRoundKey(matchesToday[0].vong));
        return;
      }

      // 2. Matches this week (Mon to Sun)
      const currentDay = today.getDay();
      const distanceToMon = currentDay === 0 ? -6 : 1 - currentDay;
      const monday = new Date(today);
      monday.setDate(today.getDate() + distanceToMon);
      monday.setHours(0, 0, 0, 0);
      const monTime = monday.getTime();
      const sunTime = monTime + 7 * 24 * 60 * 60 * 1000;

      const matchesThisWeek = allMatchesList.filter((m: any) => {
        const mDateStr = m.date || m.batDauLuc;
        if (!mDateStr) return false;
        try {
          const mTime = new Date(mDateStr).getTime();
          return mTime >= monTime && mTime < sunTime;
        } catch (e) {
          return false;
        }
      });

      if (matchesThisWeek.length > 0 && matchesThisWeek[0].vong) {
        matchesThisWeek.sort((a: any, b: any) => {
          const tA = new Date(a.date || a.batDauLuc).getTime();
          const tB = new Date(b.date || b.batDauLuc).getTime();
          return Math.abs(tA - today.getTime()) - Math.abs(tB - today.getTime());
        });
        setSelectedMatchweek(getGenericRoundKey(matchesThisWeek[0].vong));
        return;
      }

      // 3. Nearest upcoming matches
      const upcomingMatches = allMatchesList.filter((m: any) => m.trangThai === 'DANG_DIEN_RA' || m.trangThai === 'SAP_DIEN_RA');
      if (upcomingMatches.length > 0) {
        upcomingMatches.sort((a: any, b: any) => {
          const tA = new Date(a.batDauLuc || a.date).getTime();
          const tB = new Date(b.batDauLuc || b.date).getTime();
          return tA - tB;
        });
        if (upcomingMatches[0].vong) {
          setSelectedMatchweek(getGenericRoundKey(upcomingMatches[0].vong));
          return;
        }
      }

      // 4. Fallback to the nearest past match
      const finishedMatches = allMatchesList.filter((m: any) => m.trangThai === 'KET_THUC');
      if (finishedMatches.length > 0) {
        finishedMatches.sort((a: any, b: any) => {
          const tA = new Date(a.batDauLuc || a.date).getTime();
          const tB = new Date(b.batDauLuc || b.date).getTime();
          return tB - tA;
        });
        if (finishedMatches[0].vong) {
          setSelectedMatchweek(getGenericRoundKey(finishedMatches[0].vong));
          return;
        }
      }

      // 5. Ultimate fallback
      setSelectedMatchweek(uniqueRounds[0]);
    }
  }, [uniqueRounds, allMatchesList, selectedMatchweek, loading]);

  if (loading) {
    return <GlobalSkeletonLoader />;
  }

  const handleMatchClick = (match: any) => {
    router.push(`/tran-dau/${match.id}`);
  };

  const getFilteredData = () => {
    if (!data) return null;
    let filtered = allMatchesList;

    if (selectedMatchweek !== 'DEFAULT' && selectedMatchweek !== 'NONE') {
      filtered = filtered.filter((m: any) => getGenericRoundKey(m.vong) === selectedMatchweek);
    }

    if (selectedTeamId !== 'ALL') {
      filtered = filtered.filter((m: any) => m.doiNha?.id === selectedTeamId || m.doiKhach?.id === selectedTeamId);
    }

    if (selectedStatus !== 'ALL') {
      filtered = filtered.filter((m: any) => m.trangThai === selectedStatus);
    }

    return {
      tranLive: filtered.filter((m: any) => m.trangThai === 'DANG_DIEN_RA'),
      tranSapDienRa: filtered.filter((m: any) => m.trangThai === 'SAP_DIEN_RA'),
      tranKetThuc: filtered.filter((m: any) => m.trangThai === 'KET_THUC')
    };
  };

  const navigationSequence = uniqueRounds;
  const currentMatchweekIndex = navigationSequence.indexOf(selectedMatchweek);

  const handlePrevWeek = () => {
    if (currentMatchweekIndex > 0) {
      setSelectedMatchweek(navigationSequence[currentMatchweekIndex - 1]);
    }
  };

  const handleNextWeek = () => {
    if (currentMatchweekIndex < navigationSequence.length - 1 && currentMatchweekIndex !== -1) {
      setSelectedMatchweek(navigationSequence[currentMatchweekIndex + 1]);
    }
  };
  
  // Find the date range of the active week to display below matchweek
  const getActiveWeekDate = () => {
    const matchesInWeek = allMatchesList.filter((m: any) => getGenericRoundKey(m.vong) === selectedMatchweek);
    if (matchesInWeek.length === 0) return 'Chưa xếp lịch';
    
    const dates = matchesInWeek
      .map((m: any) => m.date || m.batDauLuc)
      .filter(Boolean)
      .map((dStr: string) => {
        try {
          const d = new Date(dStr);
          return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
        } catch (e) {
          return 0;
        }
      })
      .filter((t: number) => t > 0)
      .sort((a: number, b: number) => a - b);

    if (dates.length === 0) return 'Chưa xếp lịch';

    const formatDateLabel = (timeMs: number) => {
      const dateObj = new Date(timeMs);
      const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
      return `${dayNames[dateObj.getDay()]}, ${dateObj.getDate()} Thg ${dateObj.getMonth() + 1}`;
    };

    if (dates.length === 1) {
      return formatDateLabel(dates[0]);
    }

    return `${formatDateLabel(dates[0])} - ${formatDateLabel(dates[dates.length - 1])}`;
  };

  // ─── Live matches list (from data) ─────────────────────────────────────────
  const liveMatches: any[] = data?.tranLive || [];
  const liveCount = liveMatches.length;

  return (
    <div className={styles.page}>

      {/* ─── Slim Topbar ─── */}
      <div className={styles.topbar}>
        {/* Left: Tournament badge */}
        <div className={styles.topbarLeft}>
          <div className={styles.tournamentBadge}>
            <TrophyIcon size={14} className={styles.trophyIcon} />
            <select
              className={styles.headerSelect}
              value={selectedTournamentId || ''}
              onChange={(e) => setSelectedTournamentId(e.target.value)}
            >
              {tournaments.map(t => (
                <option key={t.id} value={t.id}>{t.ten}</option>
              ))}
            </select>
            <svg className={styles.headerSelectChevron} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </div>
        </div>

        {/* Right: Live Badge + Notification Bell */}
        <div className={styles.topbarRight} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>

          {/* ── Live Badge (hidden when no live matches) ── */}
          {liveCount > 0 && (
            <div className={styles.livePanelWrapper} ref={livePanelRef}>
              <button
                className={`${styles.liveBadge} ${livePanelOpen ? styles.liveBadgeActive : ''}`}
                onClick={() => setLivePanelOpen(prev => !prev)}
                aria-label={`${liveCount} trận đang diễn ra`}
              >
                <span className={styles.liveDot} />
                {/* Desktop label */}
                <span className={styles.liveLabelWeb}>● {liveCount} live</span>
                {/* Mobile label (shorter) */}
                <span className={styles.liveLabelMobile}>● {liveCount}</span>
              </button>

              {/* Web: Dropdown */}
              {livePanelOpen && (
                <div className={styles.liveDropdown}>
                  <LivePanel
                    matches={liveMatches}
                    onMatchClick={(m) => { router.push(`/tran-dau/${m.id}`); setLivePanelOpen(false); }}
                    onClose={() => setLivePanelOpen(false)}
                    onViewAll={() => { setSelectedStatus('DANG_DIEN_RA'); setActiveTab('matches'); setLivePanelOpen(false); }}
                    showCloseBtn={false}
                  />
                </div>
              )}
            </div>
          )}

          {/* ── Notification Bell ── */}
          <div style={{ position: 'relative' }}>
            <button
              className={styles.notifBell}
              onClick={() => setShowNotifTooltip(prev => !prev)}
              onBlur={() => setTimeout(() => setShowNotifTooltip(false), 150)}
              aria-label="Thông báo"
            >
              {/* Bell icon */}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </button>
            {showNotifTooltip && (
              <div className={styles.notifTooltip}>Tính năng thông báo sắp ra mắt</div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile: Bottom Sheet for live matches */}
      {livePanelOpen && liveCount > 0 && (
        <>
          <div className={styles.liveSheetBackdrop} onClick={() => setLivePanelOpen(false)} />
          <div className={styles.liveBottomSheet}>
            <div className={styles.sheetDragHandle} />
            <LivePanel
              matches={liveMatches}
              onMatchClick={(m) => { router.push(`/tran-dau/${m.id}`); setLivePanelOpen(false); }}
              onClose={() => setLivePanelOpen(false)}
              onViewAll={() => { setSelectedStatus('DANG_DIEN_RA'); setActiveTab('matches'); setLivePanelOpen(false); }}
              showCloseBtn={true}
            />
          </div>
        </>
      )}

      {/* Tabs */}
      <div className={styles.tabsContainer}>
        <button 
          onClick={() => handleTabChange('matches')} 
          className={`${styles.tabLink} ${activeTab === 'matches' ? styles.tabLinkActive : ''}`}
        >
          Trận đấu
        </button>
        <button 
          onClick={() => handleTabChange('standings')} 
          className={`${styles.tabLink} ${activeTab === 'standings' ? styles.tabLinkActive : ''}`}
        >
          Bảng xếp hạng
        </button>
        <button 
          onClick={() => handleTabChange('stats')} 
          className={`${styles.tabLink} ${activeTab === 'stats' ? styles.tabLinkActive : ''}`}
        >
          Thống kê
        </button>
      </div>

      {activeTab === 'matches' && (
        <>
          {/* ─── Unified Filter Bar: [Round Nav] [Team] [Status] [Reset] ─── */}
          <div className={styles.filterBar}>

            {/* Round Navigator */}
            {uniqueRounds.length > 0 && (
              <div className={styles.weekNavigator}>
                <button 
                  className={styles.navBtn} 
                  onClick={handlePrevWeek}
                  disabled={currentMatchweekIndex <= 0}
                  aria-label="Vòng trước"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                </button>

                <div className={styles.weekInfo}>
                  <span className={styles.weekTitle}>
                    {selectedMatchweek === 'NONE' ? 'Không có trận' : selectedMatchweek}
                  </span>
                  <span className={styles.weekDate}>
                    {selectedMatchweek === 'NONE' ? 'Chưa xếp lịch' : getActiveWeekDate()}
                  </span>
                </div>

                <button 
                  className={styles.navBtn} 
                  onClick={handleNextWeek}
                  disabled={currentMatchweekIndex >= navigationSequence.length - 1}
                  aria-label="Vòng sau"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </button>
              </div>
            )}

            <div className={styles.filterDivider} />

            {/* Team selector */}
            <div className={styles.filterSelectWrapper}>
              <select 
                className={styles.filterSelect}
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
              >
                <option value="ALL">Tất cả đội</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>{team.ten}</option>
                ))}
              </select>
              <svg className={styles.selectChevron} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </div>

            {/* Status selector */}
            <div className={styles.filterSelectWrapper}>
              <select 
                className={`${styles.filterSelect} ${styles.filterSelectStatus}`}
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as any)}
              >
                <option value="ALL">Tất cả</option>
                <option value="SAP_DIEN_RA">Chưa đá</option>
                <option value="DANG_DIEN_RA">Đang đá</option>
                <option value="KET_THUC">Kết thúc</option>
              </select>
              <svg className={styles.selectChevron} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </div>

            {/* Reset button — icon only */}
            <button 
              className={styles.resetBtn}
              onClick={() => {
                setSelectedMatchweek(uniqueRounds[0] || 'NONE');
                setSelectedTeamId('ALL');
                setSelectedStatus('ALL');
              }}
              aria-label="Đặt lại bộ lọc"
              title="Đặt lại bộ lọc"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="1 4 1 10 7 10"></polyline>
                <path d="M3.51 15a9 9 0 1 0 .49-3.79"></path>
              </svg>
            </button>
          </div>

          {/* Main Feed */}
          <div className={styles.mainFeedWrapper}>
            <MatchListFeed 
              data={getFilteredData()} 
              onMatchClick={handleMatchClick} 
              tournamentType={tournamentType}
            />
          </div>
        </>
      )}

      {activeTab === 'standings' && (
        <div className={styles.mainFeedWrapper}>
          <StandingsTab />
        </div>
      )}

      {activeTab === 'stats' && (
        <div className={styles.mainFeedWrapper}>
          <StatsTab />
        </div>
      )}

    </div>
  );
}


// ─── LivePanel: shared UI for dropdown + bottom sheet ────────────────────────
interface LivePanelProps {
  matches: any[];
  onMatchClick: (m: any) => void;
  onClose: () => void;
  onViewAll: () => void;
  showCloseBtn: boolean;
}

function LivePanel({ matches, onMatchClick, onClose, onViewAll, showCloseBtn }: LivePanelProps) {
  return (
    <>
      {/* Header */}
      <div className={styles.livePanelHeader}>
        <span className={styles.livePanelTitle}>🔴 Đang diễn ra</span>
        {showCloseBtn && (
          <button className={styles.livePanelClose} onClick={onClose} aria-label="Đóng">×</button>
        )}
      </div>

      {/* Match list */}
      {matches.length === 0 ? (
        <div className={styles.livePanelEmpty}>Hiện không có trận nào đang diễn ra</div>
      ) : (
        matches.map((match: any) => {
          const minute = calcLiveMinute(match);
          return (
            <div
              key={match.id}
              className={styles.livePanelItem}
              onClick={() => onMatchClick(match)}
            >
              {/* Home team name */}
              <span className={`${styles.liveTeamName} ${styles.liveTeamHome}`}>
                {match.doiNha?.ten || match.tenDoiNha || '?'}
              </span>

              {/* Score + minute */}
              <div className={styles.liveScoreBlock}>
                <span className={styles.liveScore}>
                  {match.tyNha ?? 0} – {match.tyKhach ?? 0}
                </span>
                <div className={styles.liveMinuteRow}>
                  <span className={styles.liveMinuteDot} />
                  <span>{minute}</span>
                </div>
              </div>

              {/* Away team name */}
              <span className={`${styles.liveTeamName} ${styles.liveTeamAway}`}>
                {match.doiKhach?.ten || match.tenDoiKhach || '?'}
              </span>
            </div>
          );
        })
      )}

      {/* Footer */}
      <div className={styles.livePanelFooter}>
        <button className={styles.liveViewAllBtn} onClick={onViewAll}>
          Xem tất cả trận live →
        </button>
      </div>
    </>
  );
}

export default function TongQuanPage() {
  return (
    <Suspense fallback={<GlobalSkeletonLoader />}>
      <TongQuanContent />
    </Suspense>
  );
}
