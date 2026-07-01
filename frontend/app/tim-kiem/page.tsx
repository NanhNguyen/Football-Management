'use client';

import React from 'react';
import TeamSearchBar from '@/components/TeamSearchBar';
import styles from './page.module.css';

export default function TimKiemPage() {
  return (
    <div className={styles.pageWrapper}>
      <TeamSearchBar mobileListMode autoFocus className={styles.searchBarInner} />
    </div>
  );
}
