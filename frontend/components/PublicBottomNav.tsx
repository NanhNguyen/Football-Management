'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { usePublicTournament } from './PublicTournamentContext';
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

const StarIcon = ({ active }: { active: boolean }) => (
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
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
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

const SearchIcon = ({ active }: { active: boolean }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="20" 
    height="20" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={active ? "var(--color-primary)" : "currentColor"} 
    strokeWidth={active ? "2.5" : "2.2"} 
    strokeLinecap="round" 
    strokeLinejoin="round"
    style={{ transition: 'all 0.2s ease' }}
  >
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

function BottomNavContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab');
  const { tournamentsSheetOpen, setTournamentsSheetOpen } = usePublicTournament();

  const bottomMenuItems = [
    { 
      label: 'Trận đấu', 
      href: '/?tab=matches', 
      isActive: pathname === '/' && (tab === 'matches' || !tab) && !tournamentsSheetOpen,
      renderIcon: (active: boolean) => <MatchesIcon active={active} />,
      onClick: () => setTournamentsSheetOpen(false)
    },
    { 
      label: 'Yêu thích', 
      href: '/dang-theo-doi', 
      isActive: pathname === '/dang-theo-doi' && !tournamentsSheetOpen,
      renderIcon: (active: boolean) => <StarIcon active={active} />,
      onClick: () => setTournamentsSheetOpen(false)
    },
    { 
      label: 'Tìm kiếm', 
      href: '/tim-kiem', 
      isActive: pathname === '/tim-kiem' && !tournamentsSheetOpen,
      renderIcon: (active: boolean) => <SearchIcon active={active} />,
      onClick: () => setTournamentsSheetOpen(false)
    },
    { 
      label: 'Cá nhân', 
      href: '/ca-nhan', 
      isActive: pathname === '/ca-nhan' && !tournamentsSheetOpen,
      renderIcon: (active: boolean) => <ProfileIcon active={active} />,
      onClick: () => setTournamentsSheetOpen(false)
    },
  ];

  return (
    <nav className={styles.bottomNav}>
      {bottomMenuItems.map((item) => {
        const content = (
          <>
            <span className={styles.icon}>
              {item.renderIcon(item.isActive)}
            </span>
            <span className={styles.label}>{item.label}</span>
          </>
        );

        if (item.href === '#') {
          return (
            <button
              key={item.label}
              onClick={item.onClick}
              className={`${styles.navItem} ${item.isActive ? styles.navItemActive : ''}`}
              style={{ background: 'none', border: 'none', outline: 'none', cursor: 'pointer', padding: 0 }}
            >
              {content}
            </button>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={item.onClick}
            className={`${styles.navItem} ${item.isActive ? styles.navItemActive : ''}`}
          >
            {content}
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
