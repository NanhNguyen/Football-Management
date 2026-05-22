'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './PublicBottomNav.module.css';

const bottomMenuItems = [
  { label: 'Tổng quan', href: '/', icon: '🏠' },
  { label: 'Lịch đấu', href: '/lich-dau', icon: '📅' },
  { label: 'BXH', href: '/bang-xep-hang', icon: '📊' },
  { label: 'Knock-out', href: '/knock-out', icon: '🏆' },
];

export default function PublicBottomNav() {
  const pathname = usePathname();

  return (
    <nav className={styles.bottomNav}>
      {bottomMenuItems.map((item) => {
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
