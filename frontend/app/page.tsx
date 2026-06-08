'use client';

import { useState, useEffect, useMemo } from 'react';
import GlobalSkeletonLoader from '@/components/GlobalSkeletonLoader';
import styles from './page.module.css';
import { layTongQuan, layDanhSachDoi } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { usePublicTournament } from '@/components/PublicTournamentContext';
import MatchListFeed from '@/components/MatchListFeed';
import Link from 'next/link';

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

export default function TongQuanPage() {
  const router = useRouter();
  const { selectedTournamentId, selectedTournament, tournaments, setSelectedTournamentId } = usePublicTournament();
  const [data, setData] = useState<any>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  // Set default active matchweek and fix sync
  useEffect(() => {
    if (loading) return;

    if (uniqueRounds.length === 0) {
      if (selectedMatchweek !== 'ALL') setSelectedMatchweek('ALL');
      return;
    }

    if (selectedMatchweek === 'DEFAULT' || (selectedMatchweek !== 'ALL' && !uniqueRounds.includes(selectedMatchweek))) {
      if (tournamentType === 'league') {
        // League format: display matches in the week corresponding to the match day (closest match day to today)
        const todayMs = new Date().getTime();
        let closestMatch = null;
        let minDiff = Infinity;
        
        for (const m of allMatchesList) {
          const mDateStr = m.date || m.batDauLuc;
          if (!mDateStr) continue;
          try {
            const mTime = new Date(mDateStr).getTime();
            if (isNaN(mTime)) continue;
            const diff = Math.abs(mTime - todayMs);
            if (diff < minDiff) {
              minDiff = diff;
              closestMatch = m;
            }
          } catch (e) {}
        }

        if (closestMatch && closestMatch.vong) {
          const genRound = getGenericRoundKey(closestMatch.vong);
          setSelectedMatchweek(genRound);
        } else {
          setSelectedMatchweek(uniqueRounds[0]);
        }
      } else {
        // Tournament format: find the nearest date with the next match (live or upcoming)
        const upcomingMatches = allMatchesList.filter((m: any) => m.trangThai === 'DANG_DIEN_RA' || m.trangThai === 'SAP_DIEN_RA');
        upcomingMatches.sort((a: any, b: any) => {
          const tA = new Date(a.batDauLuc || a.date).getTime();
          const tB = new Date(b.batDauLuc || b.date).getTime();
          return tA - tB;
        });

        if (upcomingMatches.length > 0 && upcomingMatches[0].vong) {
          const genRound = getGenericRoundKey(upcomingMatches[0].vong);
          setSelectedMatchweek(genRound);
        } else {
          // Fallback to the last finished match
          const lastMatch = allMatchesList.filter((m: any) => m.trangThai === 'KET_THUC').pop();
          if (lastMatch && lastMatch.vong) {
            const genRound = getGenericRoundKey(lastMatch.vong);
            setSelectedMatchweek(genRound);
          } else {
            setSelectedMatchweek(uniqueRounds[0]);
          }
        }
      }
    }
  }, [uniqueRounds, allMatchesList, selectedMatchweek, loading, tournamentType]);

  if (loading) {
    return <GlobalSkeletonLoader />;
  }

  const handleMatchClick = (match: any) => {
    router.push(`/tran-dau/${match.id}`);
  };

  const getFilteredData = () => {
    if (!data) return null;
    let filtered = allMatchesList;

    if (selectedMatchweek !== 'ALL' && selectedMatchweek !== 'DEFAULT') {
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

  const navigationSequence = ['ALL', ...uniqueRounds];
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
        <h1 className={styles.appName}>SPARTA</h1>
        <p className={styles.slogan}>Hệ thống Quản lý Giải đấu Chuyên nghiệp</p>
      </div>

      {/* Tabs */}
      <div className={styles.tabsContainer}>
        <Link href="/" className={`${styles.tabLink} ${styles.tabLinkActive}`}>Trận đấu</Link>
        <Link href="/bang-xep-hang" className={styles.tabLink}>Bảng xếp hạng</Link>
        <Link href="/thong-ke" className={styles.tabLink}>Thống kê</Link>
      </div>

      {/* Filters Container */}
      <div className={styles.filtersContainer}>
        <div className={styles.filterSelectWrapper}>
          <select 
            className={styles.filterSelect}
            value={selectedTournamentId || ''}
            onChange={(e) => setSelectedTournamentId(e.target.value)}
          >
            {tournaments.map(t => (
              <option key={t.id} value={t.id}>{t.ten}</option>
            ))}
          </select>
          <svg className={styles.selectChevron} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </div>



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
            setSelectedMatchweek(uniqueRounds[0] || 'ALL');
            setSelectedTeamId('ALL');
          }}
        >
          Đặt lại <span>↺</span>
        </button>
      </div>

      {/* Pill Tabs for Desktop view */}
      {uniqueRounds.length > 0 && (
        <div className={styles.pillTabs}>
          <button
            className={`${styles.pillTab} ${selectedMatchweek === 'ALL' ? styles.pillTabActive : ''}`}
            onClick={() => setSelectedMatchweek('ALL')}
          >
            Tất cả vòng đấu
          </button>
          {uniqueRounds.map((rn) => (
            <button
              key={rn}
              className={`${styles.pillTab} ${selectedMatchweek === rn ? styles.pillTabActive : ''}`}
              onClick={() => setSelectedMatchweek(rn)}
            >
              {rn}
            </button>
          ))}
        </div>
      )}

      {/* Matchweek Navigator for Mobile view (responsive via CSS) */}
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
              {selectedMatchweek === 'ALL' ? 'Tất cả vòng đấu' : selectedMatchweek}
            </span>
            <span className={styles.weekDate}>
              {selectedMatchweek === 'ALL' ? 'Hiển thị tất cả trận đấu' : getActiveWeekDate()}
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

    </div>
  );
}
