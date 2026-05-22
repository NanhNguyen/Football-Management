'use client';

import { useState } from 'react';
import styles from '@/app/lich-dau/page.module.css';
import LiveMatchCard from '@/components/LiveMatchCard';

interface Props {
  groupedMatches: Record<string, any[]>;
}

// Custom sort comparator for rounds
function compareRounds(a: string, b: string): number {
  const parseRound = (s: string) => {
    // Check knockout names first
    let knockoutInfo = null;
    if (s.includes("Chung kết")) knockoutInfo = { type: 5, num: 5 };
    else if (s.includes("Tranh hạng ba")) knockoutInfo = { type: 5, num: 4 };
    else if (s.includes("Bán kết")) knockoutInfo = { type: 5, num: 3 };
    else if (s.includes("Tứ kết")) knockoutInfo = { type: 5, num: 2 };
    else if (s.includes("1/8") || s.includes("16")) knockoutInfo = { type: 5, num: 1 };

    if (knockoutInfo) {
      const matchMatch = s.match(/Trận\s+(\d+)/i);
      const subNum = matchMatch ? parseInt(matchMatch[1], 10) : 0;
      return {
        type: knockoutInfo.type,
        num: knockoutInfo.num,
        sub: '',
        subNum
      };
    }

    // Group stage pattern: "Bảng A - Vòng 1" or similar
    const groupMatch = s.match(/Bảng\s+([A-H])\s+-\s+Vòng\s+(\d+)/i);
    if (groupMatch) {
      return {
        type: 1,
        num: parseInt(groupMatch[2], 10),
        sub: groupMatch[1],
        subNum: 0
      };
    }

    // League pattern: "Vòng 1", "Vòng 2", etc.
    const roundMatch = s.match(/Vòng\s+(\d+)/i);
    if (roundMatch) {
      return {
        type: 2,
        num: parseInt(roundMatch[1], 10),
        sub: '',
        subNum: 0
      };
    }

    // Default fallback
    return { type: 9, num: 999, sub: s, subNum: 0 };
  };

  const infoA = parseRound(a);
  const infoB = parseRound(b);

  if (infoA.type <= 2 && infoB.type <= 2) {
    if (infoA.num !== infoB.num) {
      return infoA.num - infoB.num;
    }
    if (infoA.sub !== infoB.sub) {
      return infoA.sub.localeCompare(infoB.sub);
    }
    return a.localeCompare(b);
  }

  if (infoA.type <= 2 && infoB.type > 2) return -1;
  if (infoA.type > 2 && infoB.type <= 2) return 1;

  if (infoA.type === 5 && infoB.type === 5) {
    if (infoA.num !== infoB.num) {
      return infoA.num - infoB.num;
    }
    if (infoA.subNum !== infoB.subNum) {
      return infoA.subNum - infoB.subNum;
    }
    return a.localeCompare(b);
  }

  return a.localeCompare(b);
}

export default function ScheduleClient({ groupedMatches }: Props) {
  const rounds = Object.keys(groupedMatches).sort(compareRounds);
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
