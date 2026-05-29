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
      return {
        tranLive: allMatches.filter((m: any) => m.trangThai === 'DANG_DIEN_RA'),
        tranSapDienRa: allMatches.filter((m: any) => m.trangThai === 'SAP_DIEN_RA'),
        tranKetThuc: allMatches.filter((m: any) => m.trangThai === 'KET_THUC')
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

  return (
    <div className={styles.page}>
      
      {/* 1. Date Strip Navigation */}
      <DateStrip 
        selectedDate={selectedDate}
        onSelectDate={(date) => {
          setSelectedDate(date);
        }} 
      />

      {/* 2. Main Match Feed */}
      <div className={styles.mainFeedWrapper}>
        <MatchListFeed 
          data={getFilteredData()} 
          onMatchClick={handleMatchClick} 
        />
      </div>

    </div>
  );
}
