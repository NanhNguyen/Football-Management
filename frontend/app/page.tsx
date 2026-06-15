'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import GlobalSkeletonLoader from '@/components/GlobalSkeletonLoader';
import styles from './page.module.css';
import { layTongQuan, layDanhSachDoi } from '@/lib/api';
import { useRouter, useSearchParams } from 'next/navigation';
import { usePublicTournament } from '@/components/PublicTournamentContext';
import MatchListFeed from '@/components/MatchListFeed';
import StandingsTab from '@/components/StandingsTab';
import StatsTab from '@/components/StatsTab';

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

function TongQuanContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const { selectedTournamentId, selectedTournament, tournaments, setSelectedTournamentId } = usePublicTournament();
  const [data, setData] = useState<any>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Tab State: 'matches' | 'standings' | 'stats'
  const [activeTab, setActiveTab] = useState<'matches' | 'standings' | 'stats'>('matches');

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
  }, [selectedTournamentId]);

  // Save selectedMatchweek to localStorage when it changes (excluding 'DEFAULT')
  useEffect(() => {
    if (selectedTournamentId && selectedMatchweek !== 'DEFAULT') {
      localStorage.setItem(`public_selected_matchweek_${selectedTournamentId}`, selectedMatchweek);
    }
  }, [selectedMatchweek, selectedTournamentId]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [tqData, tData] = await Promise.all([
          layTongQuan(selectedTournamentId || undefined),
          layDanhSachDoi(selectedTournamentId || undefined)
        ]);
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
  }, [selectedTournamentId]);

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

  // Set default active matchweek based on custom logic sequence:
  // 1. Matchweek containing matches today
  // 2. Matchweek containing matches this calendar week (Mon - Sun)
  // 3. Matchweek containing the nearest upcoming match
  // 4. Matchweek containing the nearest past match (fallback)
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
      const currentDay = today.getDay(); // 0 is Sunday, 1 is Monday, etc.
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
        // Sort by closest date to today within this week
        matchesThisWeek.sort((a: any, b: any) => {
          const tA = new Date(a.date || a.batDauLuc).getTime();
          const tB = new Date(b.date || b.batDauLuc).getTime();
          return Math.abs(tA - today.getTime()) - Math.abs(tB - today.getTime());
        });
        setSelectedMatchweek(getGenericRoundKey(matchesThisWeek[0].vong));
        return;
      }

      // 3. Nearest upcoming matches (DANG_DIEN_RA or SAP_DIEN_RA)
      const upcomingMatches = allMatchesList.filter((m: any) => m.trangThai === 'DANG_DIEN_RA' || m.trangThai === 'SAP_DIEN_RA');
      if (upcomingMatches.length > 0) {
        upcomingMatches.sort((a: any, b: any) => {
          const tA = new Date(a.batDauLuc || a.date).getTime();
          const tB = new Date(b.batDauLuc || b.date).getTime();
          return tA - tB; // Earliest upcoming match first
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
          return tB - tA; // Latest finished match first
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
  
  // Find the closest date to display below matchweek if available
  const getActiveWeekDate = () => {
    const matchesInWeek = allMatchesList.filter((m: any) => getGenericRoundKey(m.vong) === selectedMatchweek);
    if (matchesInWeek.length === 0) return '';
    
    // Sort by date to get the first date of the week
    matchesInWeek.sort((a: any, b: any) => {
      const tA = new Date(a.batDauLuc || a.date).getTime();
      const tB = new Date(b.batDauLuc || b.date).getTime();
      return tA - tB;
    });

    const firstMatch = matchesInWeek[0];
    if (!firstMatch.date) return '';

    try {
      const dateObj = new Date(firstMatch.date);
      const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
      return `${dayNames[dateObj.getDay()]}, ${dateObj.getDate()} Thg ${dateObj.getMonth() + 1}`;
    } catch (e) {
      return firstMatch.date;
    }
  };

  return (
    <div className={styles.page}>
      
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.logoTitleWrapper}>
            <img src="/logo-premium-transparent.png" alt="Sparta Logo" className={styles.logoImg} />
            <h1 className={styles.appName}>SPARTA</h1>
          </div>
          <p className={styles.slogan}>Hệ thống Quản lý Giải đấu Chuyên nghiệp</p>
        </div>

        {/* Tournament Switcher in Header */}
        <div className={styles.headerSelectWrapper}>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="18" 
            height="18" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="var(--color-primary, #0f766e)" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            className={styles.trophyIcon}
          >
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
            <path d="M4 22h16"></path>
            <path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34"></path>
            <path d="M12 2a6 6 0 0 1 6 6v5a6 6 0 0 1-6 6 6 6 0 0 1-6-6V8a6 6 0 0 1 6-6z"></path>
          </svg>
          <select 
            className={styles.headerSelect}
            value={selectedTournamentId || ''}
            onChange={(e) => setSelectedTournamentId(e.target.value)}
          >
            {tournaments.map(t => (
              <option key={t.id} value={t.id}>{t.ten}</option>
            ))}
          </select>
          <svg className={styles.headerSelectChevron} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </div>
      </div>


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
          {/* Filters Container */}
          <div className={styles.filtersContainer}>


            {/* Dropdown Matchweek selector to match Premier League filters */}
            {uniqueRounds.length > 0 && (
              <div className={styles.filterSelectWrapper}>
                <select 
                  className={styles.filterSelect}
                  value={selectedMatchweek}
                  onChange={(e) => setSelectedMatchweek(e.target.value)}
                >
                  {uniqueRounds.map((rn) => (
                    <option key={rn} value={rn}>{rn}</option>
                  ))}
                </select>
                <svg className={styles.selectChevron} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </div>
            )}

            <div className={styles.filterSelectWrapper}>
              <select 
                className={styles.filterSelect}
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
              >
                <option value="ALL">Tất cả Đội bóng</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>{team.ten}</option>
                ))}
              </select>
              <svg className={styles.selectChevron} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </div>

            <button 
              className={styles.resetBtn}
              onClick={() => {
                setSelectedMatchweek(uniqueRounds[0] || 'NONE');
                setSelectedTeamId('ALL');
              }}
            >
              Đặt lại <span>↺</span>
            </button>
          </div>

          {/* Matchweek Navigator - Always show Premier League-style navigator on all screens */}
          {uniqueRounds.length > 0 && (
            <div className={styles.weekNavigator}>
              <button 
                className={styles.navBtn} 
                onClick={handlePrevWeek}
                disabled={currentMatchweekIndex <= 0}
                aria-label="Vòng trước"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
              </button>

              <div className={styles.weekInfo}>
                <span className={styles.weekTitle}>
                  {selectedMatchweek === 'NONE' ? 'Không có trận đấu' : selectedMatchweek}
                </span>
                <span className={styles.weekDate}>
                  {selectedMatchweek === 'NONE' ? 'Chưa xếp lịch thi đấu' : getActiveWeekDate()}
                </span>
              </div>

              <button 
                className={styles.navBtn} 
                onClick={handleNextWeek}
                disabled={currentMatchweekIndex >= navigationSequence.length - 1}
                aria-label="Vòng sau"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </button>
            </div>
          )}

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

export default function TongQuanPage() {
  return (
    <Suspense fallback={<GlobalSkeletonLoader />}>
      <TongQuanContent />
    </Suspense>
  );
}

