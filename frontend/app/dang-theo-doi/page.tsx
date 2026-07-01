'use client';

import React, { useState, useEffect } from 'react';
import { usePublicTournament } from '@/components/PublicTournamentContext';
import TeamSearchBar from '@/components/TeamSearchBar';
import FollowedTeamsList from '@/components/FollowedTeamsList';
import GlobalSkeletonLoader from '@/components/GlobalSkeletonLoader';
import { supabase } from '@/lib/supabase';
import styles from './page.module.css';

export default function DangTheoDoiPage() {
  const [authLoading, setAuthLoading] = useState(true);
  const { favoriteTeams, loading: contextLoading } = usePublicTournament();

  // Sync auth loading state
  useEffect(() => {
    supabase.auth.getSession().then(() => setAuthLoading(false));
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => setAuthLoading(false));
    return () => subscription.unsubscribe();
  }, []);

  if (contextLoading || authLoading) {
    return <GlobalSkeletonLoader />;
  }

  const hasFollowed = favoriteTeams.length > 0;

  return (
    <div className={styles.pageWrapper}>
      {/* Sticky Search Bar */}
      <div className={styles.searchBarWrap}>
        <TeamSearchBar mobileListMode className={styles.searchBarInner} />
      </div>

      {/* Body: followed list or empty state */}
      <div className={styles.bodyWrap}>
        {hasFollowed ? (
          <div className={styles.followedSection}>
            <div className={styles.followedHeader}>
              <span className={styles.followedIcon}>⭐</span>
              <span className={styles.followedTitle}>Đang theo dõi</span>
              <span className={styles.followedCount}>{favoriteTeams.length}</span>
            </div>
            <FollowedTeamsList mobileMode />
          </div>
        ) : (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>⭐</span>
            <h2 className={styles.emptyTitle}>Chưa theo dõi đội nào</h2>
            <p className={styles.emptySubtitle}>
              Tìm kiếm đội bóng yêu thích<br />để thêm vào đây
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
