'use client';

import { useState, useEffect } from 'react';
import GlobalSkeletonLoader from '@/components/GlobalSkeletonLoader';
import styles from './page.module.css';
import { layTongQuan } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { usePublicTournament } from '@/components/PublicTournamentContext';
import DateStrip from '@/components/DateStrip';
import MatchListFeed from '@/components/MatchListFeed';

export default function TongQuanPage() {
  const router = useRouter();
  const { selectedTournamentId } = usePublicTournament();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | 'LIVE' | 'ALL'>('ALL');
  const [selectedRound, setSelectedRound] = useState<string>('ALL');
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        const tqData = await layTongQuan(selectedTournamentId || undefined);
        setData(tqData);
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

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <GlobalSkeletonLoader />;
  }

  const formatYYYYMMDD = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getFilteredData = () => {
    if (!data) return null;
    
    const allMatches = data.allMatches || [
      ...(data.tranLive || []),
      ...(data.tranSapDienRa || []),
      ...(data.tranKetThuc || [])
    ];
    
    if (selectedDate === 'LIVE') {
      return {
        tranLive: allMatches.filter((m: any) => m.trangThai === 'DANG_DIEN_RA'),
        tranSapDienRa: [],
        tranKetThuc: []
      };
    } else if (selectedDate === 'ALL') {
      // Filter matches by round if a specific round is selected
      const filtered = selectedRound === 'ALL'
        ? allMatches
        : allMatches.filter((m: any) => m.vong === selectedRound);

      return {
        tranLive: filtered.filter((m: any) => m.trangThai === 'DANG_DIEN_RA'),
        tranSapDienRa: filtered.filter((m: any) => m.trangThai === 'SAP_DIEN_RA'),
        tranKetThuc: filtered.filter((m: any) => m.trangThai === 'KET_THUC')
      };
    } else if (selectedDate instanceof Date) {
      const dateStr = formatYYYYMMDD(selectedDate);
      const dayMatches = allMatches.filter((m: any) => m.date === dateStr || m.ngay === dateStr);
      return {
        tranLive: dayMatches.filter((m: any) => m.trangThai === 'DANG_DIEN_RA'),
        tranSapDienRa: dayMatches.filter((m: any) => m.trangThai === 'SAP_DIEN_RA'),
        tranKetThuc: dayMatches.filter((m: any) => m.trangThai === 'KET_THUC')
      };
    }
    
    return data;
  };

  const handleMatchClick = (match: any) => {
    // Lead UX Designer's recommendation implemented: Navigate to new page instead of modal
    router.push(`/tran-dau/${match.id}`);
  };

  // Extract unique and sorted list of rounds
  const allMatchesList = data?.allMatches || [
    ...(data?.tranLive || []),
    ...(data?.tranSapDienRa || []),
    ...(data?.tranKetThuc || [])
  ];
  const uniqueRounds = Array.from(new Set(allMatchesList.map((m: any) => m.vong).filter(Boolean))) as string[];
  const sortedRounds = uniqueRounds.sort((a, b) => {
    const numA = a.match(/\d+/);
    const numB = b.match(/\d+/);
    if (numA && numB) {
      return parseInt(numA[0], 10) - parseInt(numB[0], 10);
    }
    if (numA) return -1;
    if (numB) return 1;
    return a.localeCompare(b);
  });

  return (
    <div className={styles.page}>
      
      {/* 1. Date Strip Navigation */}
      <DateStrip 
        selectedDate={selectedDate}
        onSelectDate={(date) => {
          setSelectedDate(date);
          setSelectedRound('ALL'); // Reset round filter when switching date modes
        }} 
      />

      {/* 2. Round Filter (Only visible when viewing all matches and rounds exist) */}
      {selectedDate === 'ALL' && sortedRounds.length > 0 && (
        <div className={styles.roundFilterContainer}>
          <span className={styles.filterLabel}>Vòng đấu:</span>
          <div className={styles.roundSelectWrapper}>
            <select
              className={styles.roundSelect}
              value={selectedRound}
              onChange={(e) => setSelectedRound(e.target.value)}
            >
              <option value="ALL">Tất cả các vòng</option>
              {sortedRounds.map((round) => (
                <option key={round} value={round}>
                  {round}
                </option>
              ))}
            </select>
            <svg 
              className={styles.selectChevron} 
              xmlns="http://www.w3.org/2000/svg" 
              width="14" 
              height="14" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
        </div>
      )}

      {/* 3. Main Match Feed */}
      <div className={styles.mainFeedWrapper}>
        <MatchListFeed 
          data={getFilteredData()} 
          onMatchClick={handleMatchClick} 
        />
      </div>

    </div>
  );
}
