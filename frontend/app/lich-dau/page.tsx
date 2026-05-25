'use client';

import { useState, useEffect } from 'react';
import GlobalSkeletonLoader from '@/components/GlobalSkeletonLoader';
import styles from './page.module.css';
import { layDanhSachTranDau } from '@/lib/api';
import LiveMatchCard from '@/components/LiveMatchCard';
import ScheduleClient from '@/components/ScheduleClient';
import { usePublicTournament } from '@/components/PublicTournamentContext';

export default function LichDauPage() {
  const { selectedTournamentId, selectedTournament } = usePublicTournament();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMatches = async () => {
      try {
        const matches = await layDanhSachTranDau(selectedTournamentId || undefined);
        setData(matches);
      } catch (error) {
        console.error("Lỗi lấy lịch thi đấu:", error);
      } finally {
        setLoading(false);
      }
    };

    loadMatches();
    const interval = setInterval(loadMatches, 5000); // Poll matches every 5 seconds for real-time scores
    return () => clearInterval(interval);
  }, [selectedTournamentId]);

  if (loading) {
    return <GlobalSkeletonLoader />;
  }

  const live = data.filter((t: any) => t.trangThai === 'DANG_DIEN_RA');
  const nonLive = data.filter((t: any) => t.trangThai !== 'DANG_DIEN_RA');

  // Grouping helper
  const groupByRound = (matches: any[]) => {
    return matches.reduce((acc, match) => {
      const round = match.vong || 'Khác';
      if (!acc[round]) acc[round] = [];
      acc[round].push(match);
      return acc;
    }, {} as Record<string, any[]>);
  };

  const nonLiveGrouped = groupByRound(nonLive);

  return (
    <div className={styles.page}>
      <div className={`${styles.header} animate-fade-up`}>
        <h2 className={styles.title}>Lịch thi đấu & Kết quả</h2>
        <p className={styles.subtitle}>{selectedTournament?.ten || 'Giải đấu'} {selectedTournament?.mua_giai || ''}</p>
      </div>

      {/* LIVE SECTION */}
      {live.length > 0 && (
        <section className={`${styles.section} animate-fade-up stagger-1`}>
          <h3 className={styles.sectionTitle}>
            <span className={styles.liveDot} />
            Đang diễn ra
          </h3>
          <div className={styles.grid}>
            {live.map((t: any, i: number) => (
              <div key={t.id} className={`animate-fade-up stagger-${(i % 5) + 1}`}>
                <LiveMatchCard tran={t} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* UNIFIED SCHEDULE BY ROUND */}
      <ScheduleClient groupedMatches={nonLiveGrouped} />
    </div>
  );
}
