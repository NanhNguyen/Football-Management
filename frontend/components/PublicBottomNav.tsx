'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import styles from './PublicBottomNav.module.css';

const MatchesIcon = ({ active }: { active: boolean }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="20" 
    height="20" 
    viewBox="0 0 24 24" 
    fill={active ? "var(--color-primary)" : "none"} 
    stroke={active ? "var(--color-primary)" : "currentColor"} 
    strokeWidth="2.2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    style={{ transition: 'all 0.2s ease' }}
  >
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
    <path d="M8 14h.01" />
    <path d="M12 14h.01" />
    <path d="M16 14h.01" />
    <path d="M8 18h.01" />
    <path d="M12 18h.01" />
    <path d="M16 18h.01" />
  </svg>
);

const TrophyIcon = ({ active }: { active: boolean }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="20" 
    height="20" 
    viewBox="0 0 24 24" 
    fill={active ? "var(--color-primary)" : "none"} 
    stroke={active ? "var(--color-primary)" : "currentColor"} 
    strokeWidth="2.2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    style={{ transition: 'all 0.2s ease' }}
  >
    <line x1="18" y1="20" x2="18" y2="16" />
    <line x1="6" y1="20" x2="6" y2="16" />
    <line x1="12" y1="20" x2="12" y2="16" />
    <rect x="2" y="2" width="20" height="14" rx="2" fill={active ? "var(--color-primary)" : "none"} />
    <line x1="2" y1="10" x2="22" y2="10" />
  </svg>
);

const ProfileIcon = ({ active }: { active: boolean }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="20" 
    height="20" 
    viewBox="0 0 24 24" 
    fill={active ? "var(--color-primary)" : "none"} 
    stroke={active ? "var(--color-primary)" : "currentColor"} 
    strokeWidth="2.2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    style={{ transition: 'all 0.2s ease' }}
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" fill={active ? "var(--color-primary)" : "none"} />
  </svg>
);

function BottomNavContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab');

  const bottomMenuItems = [
    { 
      label: 'Trận đấu', 
      href: '/?tab=matches', 
      isActive: pathname === '/' && (tab === 'matches' || !tab),
      renderIcon: (active: boolean) => <MatchesIcon active={active} /> 
    },
    { 
      label: 'Số liệu', 
      href: '/?tab=standings', 
      isActive: pathname === '/' && (tab === 'standings' || tab === 'stats'),
      renderIcon: (active: boolean) => <TrophyIcon active={active} /> 
    },
    { 
      label: 'Cá nhân', 
      href: '/ca-nhan', 
      isActive: pathname === '/ca-nhan',
      renderIcon: (active: boolean) => <ProfileIcon active={active} /> 
    },
  ];

  return (
    <nav className={styles.bottomNav}>
      {bottomMenuItems.map((item) => {
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles.navItem} ${item.isActive ? styles.navItemActive : ''}`}
          >
            <span className={styles.icon}>
              {item.renderIcon(item.isActive)}
            </span>
            <span className={styles.label}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export default function PublicBottomNav() {
  return (
    <Suspense fallback={null}>
      <BottomNavContent />
    </Suspense>
  );
}
