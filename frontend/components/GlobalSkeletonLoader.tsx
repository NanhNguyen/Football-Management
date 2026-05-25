import React from 'react';
import styles from './GlobalSkeletonLoader.module.css';

export default function GlobalSkeletonLoader() {
  return (
    <div className={`${styles.skeletonWrapper} ${styles.skeletonPulse}`}>
      {/* Spotlight Hero Card Skeleton */}
      <div className={styles.skeletonHero}>
        <div className={styles.skeletonShimmer}></div>
        {/* Beautiful custom vector mountain-sun SVG mimicking user reference photo */}
        <svg viewBox="0 0 200 170" width="120" height="100" style={{ opacity: 0.35 }}>
          <rect x="10" y="10" width="180" height="150" rx="16" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="4" />
          <circle cx="145" cy="45" r="15" fill="#94a3b8" />
          <polygon points="20,150 75,70 130,150" fill="#94a3b8" />
          <polygon points="100,150 145,100 180,150" fill="#cbd5e1" />
        </svg>
      </div>

      {/* Match Center Section Skeleton */}
      <div className={styles.skeletonSection}>
        <div className={styles.skeletonSectionHeader}>
          <div className={styles.skeletonTitle}></div>
          <div className={styles.skeletonLink}></div>
        </div>
        <div className={styles.skeletonTabs}>
          <div className={styles.skeletonTab}></div>
          <div className={styles.skeletonTab}></div>
          <div className={styles.skeletonTab}></div>
        </div>
        <div className={styles.skeletonMatchesGrid}>
          {[1, 2, 3].map((i) => (
            <div key={i} className={styles.skeletonMatchCard}>
              <div className={styles.skeletonShimmer}></div>
              <div className={styles.skeletonMatchTeams}>
                <div className={styles.skeletonMatchTeamRow}>
                  <div className={styles.skeletonLogoCircle}></div>
                  <div className={`${styles.skeletonTextLine} ${styles.skeletonTextLineMedium}`}></div>
                </div>
                <div className={styles.skeletonMatchTeamRow}>
                  <div className={styles.skeletonLogoCircle}></div>
                  <div className={`${styles.skeletonTextLine} ${styles.skeletonTextLineShort}`}></div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                <div className={`${styles.skeletonTextLine} ${styles.skeletonTextLineShort}`}></div>
                <div className={styles.skeletonLogoCircle} style={{ width: '40px', borderRadius: '4px', height: '18px' }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Leaderboard Section Skeleton */}
      <div className={styles.skeletonSection}>
        <div className={styles.skeletonSectionHeader}>
          <div className={styles.skeletonTitle}></div>
        </div>
        <div className={styles.skeletonLeaderboardGrid}>
          {/* Table Standing Card */}
          <div className={styles.skeletonLbCard}>
            <div className={styles.skeletonShimmer}></div>
            <div className={styles.skeletonSectionHeader} style={{ marginBottom: '8px' }}>
              <div className={`${styles.skeletonTextLine} ${styles.skeletonTextLineMedium}`}></div>
              <div className={styles.skeletonLink}></div>
            </div>
            {[1, 2, 3].map((i) => (
              <div key={i} className={styles.skeletonLbRow}>
                <div className={styles.skeletonLbRowLeft}>
                  <div className={styles.skeletonBadge}></div>
                  <div className={styles.skeletonLogoCircle}></div>
                  <div className={`${styles.skeletonTextLine} ${styles.skeletonTextLineMedium}`}></div>
                </div>
                <div className={styles.skeletonPoints}></div>
              </div>
            ))}
          </div>

          {/* Top Scorer Card */}
          <div className={styles.skeletonLbCard}>
            <div className={styles.skeletonShimmer}></div>
            <div className={styles.skeletonSectionHeader} style={{ marginBottom: '8px' }}>
              <div className={`${styles.skeletonTextLine} ${styles.skeletonTextLineMedium}`}></div>
              <div className={styles.skeletonLink}></div>
            </div>
            {[1, 2, 3].map((i) => (
              <div key={i} className={styles.skeletonLbRow}>
                <div className={styles.skeletonLbRowLeft}>
                  <div className={styles.skeletonBadge}></div>
                  <div className={styles.skeletonLogoCircle}></div>
                  <div className={`${styles.skeletonTextLine} ${styles.skeletonTextLineMedium}`}></div>
                </div>
                <div className={styles.skeletonPoints}></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
