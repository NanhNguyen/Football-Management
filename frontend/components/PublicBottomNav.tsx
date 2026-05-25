'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePublicTournament } from './PublicTournamentContext';
import styles from './PublicBottomNav.module.css';

const bottomMenuItems = [
  { label: 'Tổng quan', href: '/', icon: '🏠' },
  { label: 'Lịch đấu', href: '/lich-dau', icon: '📅' },
  { label: 'BXH', href: '/bang-xep-hang', icon: '📊' },
  { label: 'Knock-out', href: '/knock-out', icon: '🏆' },
];

export default function PublicBottomNav() {
  const pathname = usePathname();
  const { selectedTournamentId, selectedTournament } = usePublicTournament();
  const [isLeague, setIsLeague] = useState(false);

  useEffect(() => {
    if (selectedTournamentId) {
      const isLeagueName = !!(selectedTournament?.ten?.toLowerCase().includes('epl') || 
                            selectedTournament?.ten?.toLowerCase().includes('league'));
      const configStr = localStorage.getItem(`giai_dau_config_${selectedTournamentId}`);
      if (configStr) {
        try {
          const config = JSON.parse(configStr);
          setIsLeague(config.theThuc === 'league' || (config.theThuc !== 'tournament' && isLeagueName));
        } catch (e) {
          setIsLeague(isLeagueName);
        }
      } else {
        setIsLeague(isLeagueName);
      }
    }
  }, [selectedTournamentId, selectedTournament]);

  const filteredMenuItems = bottomMenuItems.filter(item => {
    if (item.href === '/knock-out') {
      return !isLeague;
    }
    return true;
  });

  return (
    <nav className={styles.bottomNav}>
      {filteredMenuItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
          >
            <span className={styles.icon}>{item.icon}</span>
            <span className={styles.label}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
