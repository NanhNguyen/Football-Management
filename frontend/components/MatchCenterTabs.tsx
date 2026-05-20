'use client';

import { useState } from 'react';
import LiveMatchCard from './LiveMatchCard';
import styles from './MatchCenterTabs.module.css';

interface MatchCenterTabsProps {
  liveMatches: any[];
  upcomingMatches: any[];
  completedMatches: any[];
  onCardClick?: (match: any) => void;
}

export default function MatchCenterTabs({ liveMatches, upcomingMatches, completedMatches, onCardClick }: MatchCenterTabsProps) {
  const [activeTab, setActiveTab] = useState<'LIVE' | 'TODAY' | 'RESULT'>('LIVE');

  let currentMatches = [];
  if (activeTab === 'LIVE') currentMatches = liveMatches;
  if (activeTab === 'TODAY') currentMatches = upcomingMatches;
  if (activeTab === 'RESULT') currentMatches = completedMatches;

  return (
    <div className={styles.container}>
      <div className={styles.tabList}>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'LIVE' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('LIVE')}
        >
          {activeTab === 'LIVE' && <span className={styles.blinkDot}></span>}
          Đang đá (LIVE) ({liveMatches.length})
        </button>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'TODAY' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('TODAY')}
        >
          Hôm nay ({upcomingMatches.length})
        </button>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'RESULT' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('RESULT')}
        >
          Kết quả ({completedMatches.length})
        </button>
      </div>

      <div className={styles.matchGrid}>
        {currentMatches.length > 0 ? (
          currentMatches.map(tran => (
            <LiveMatchCard key={tran.id} tran={tran} onClick={() => onCardClick?.(tran)} />
          ))
        ) : (
          <div className={styles.emptyState}>
            Không có trận đấu nào trong danh mục này.
          </div>
        )}
      </div>
    </div>
  );
}
