'use client';

import { useState } from 'react';
import styles from '@/app/lich-dau/page.module.css';
import LiveMatchCard from '@/components/LiveMatchCard';

interface Props {
  groupedMatches: Record<string, any[]>;
}

export default function ScheduleClient({ groupedMatches }: Props) {
  const rounds = Object.keys(groupedMatches);
  const [activeRound, setActiveRound] = useState<string>(rounds[0] || '');

  if (rounds.length === 0) {
    return <div className={styles.emptyState}>Chưa có lịch thi đấu được cập nhật.</div>;
  }

  const currentMatches = groupedMatches[activeRound] || [];

  return (
    <section className={`${styles.section} animate-fade-up stagger-2`}>
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>Danh sách trận đấu theo vòng</h3>
        <div className={styles.pillTabs}>
          {rounds.map(round => (
            <button
              key={round}
              className={`${styles.pillTab} ${activeRound === round ? styles.pillTabActive : ''}`}
              onClick={() => setActiveRound(round)}
            >
              {round}
            </button>
          ))}
        </div>
      </div>
      
      <div className={styles.grid}>
        {currentMatches.map((t: any, i: number) => (
          <div key={t.id} className={`animate-fade-up stagger-${(i % 5) + 1}`}>
            <LiveMatchCard tran={t} />
          </div>
        ))}
      </div>
    </section>
  );
}
