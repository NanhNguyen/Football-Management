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
  const [selectedMatchweek, setSelectedMatchweek] = useState<string>('ALL');
  const [selectedTeamId, setSelectedTeamId] = useState<string>('ALL');

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
    
    const knockoutOrder: Record<string, number> = {
      'vòng bảng': 1,
      'vòng 1/16': 2,
      'vòng 1/8': 3,
      'tứ kết': 4,
      'bán kết': 5,
      'chung kết & tranh hạng ba': 6,
      'chung kết': 6,
    };

    return rounds.sort((a, b) => {
      const aLower = a.toLowerCase();
      const bLower = b.toLowerCase();
      
      const orderA = knockoutOrder[aLower];
      const orderB = knockoutOrder[bLower];
      
      if (orderA && orderB) return orderA - orderB;
      if (orderA) return -1;
      if (orderB) return 1;

      const numA = a.match(/\d+/);
      const numB = b.match(/\d+/);
      if (numA && numB) {
        return parseInt(numA[0], 10) - parseInt(numB[0], 10);
      }
      if (numA) return -1;
      if (numB) return 1;
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
    if (uniqueRounds.length === 0) {
      if (selectedMatchweek !== 'ALL') setSelectedMatchweek('ALL');
      return;
    }

    if (selectedMatchweek === 'ALL' || !uniqueRounds.includes(selectedMatchweek)) {
      // Find the nearest upcoming/live match's round
      const upcomingMatches = allMatchesList.filter((m: any) => m.trangThai === 'DANG_DIEN_RA' || m.trangThai === 'SAP_DIEN_RA');
      // Sort upcoming by date ascending
      upcomingMatches.sort((a: any, b: any) => {
        const tA = new Date(a.batDauLuc || a.date).getTime();
        const tB = new Date(b.batDauLuc || b.date).getTime();
        return tA - tB;
      });

      if (upcomingMatches.length > 0 && upcomingMatches[0].vong) {
        const genRound = getGenericRoundKey(upcomingMatches[0].vong);
        setSelectedMatchweek(genRound);
      } else {
        // Fallback to the last round or first round if all finished
        const lastMatch = allMatchesList.filter((m: any) => m.trangThai === 'KET_THUC').pop();
        if (lastMatch && lastMatch.vong) {
          const genRound = getGenericRoundKey(lastMatch.vong);
          setSelectedMatchweek(genRound);
        } else {
          setSelectedMatchweek(uniqueRounds[0]);
        }
      }
    }
  }, [uniqueRounds, allMatchesList, selectedMatchweek]);

  if (loading) {
    return <GlobalSkeletonLoader />;
  }

  const handleMatchClick = (match: any) => {
    router.push(`/tran-dau/${match.id}`);
  };

  const getFilteredData = () => {
    if (!data) return null;
    let filtered = allMatchesList;

    if (selectedMatchweek !== 'ALL') {
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

  const handlePrevWeek = () => {
    const idx = uniqueRounds.indexOf(selectedMatchweek);
    if (idx > 0) {
      setSelectedMatchweek(uniqueRounds[idx - 1]);
    }
  };

  const handleNextWeek = () => {
    const idx = uniqueRounds.indexOf(selectedMatchweek);
    if (idx < uniqueRounds.length - 1 && idx !== -1) {
      setSelectedMatchweek(uniqueRounds[idx + 1]);
    }
  };

  const currentMatchweekIndex = uniqueRounds.indexOf(selectedMatchweek);
  
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
            value={selectedMatchweek}
            onChange={(e) => setSelectedMatchweek(e.target.value)}
          >
            <option value="ALL">Tất cả Vòng đấu</option>
            {uniqueRounds.map((round) => (
              <option key={round} value={round}>{round}</option>
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

      {/* Matchweek Navigator */}
      {selectedMatchweek !== 'ALL' && (
        <div className={styles.weekNavigator}>
          <button 
            className={styles.navBtn} 
            onClick={handlePrevWeek}
            disabled={currentMatchweekIndex <= 0}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </button>

          <div className={styles.weekInfo}>
            <span className={styles.weekTitle}>{selectedMatchweek}</span>
            <span className={styles.weekDate}>{getActiveWeekDate()}</span>
          </div>

          <button 
            className={styles.navBtn} 
            onClick={handleNextWeek}
            disabled={currentMatchweekIndex >= uniqueRounds.length - 1}
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
