'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePublicTournament } from './PublicTournamentContext';
import styles from './PublicSidebar.module.css';

interface PublicSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const menuItems = [
  { label: 'Tổng quan', href: '/', icon: '🏠' },
  { label: 'Lịch đấu', href: '/lich-dau', icon: '📅' },
  { label: 'BXH', href: '/bang-xep-hang', icon: '📊' },
  { label: 'Knock-out', href: '/knock-out', icon: '🏆' },
  { label: 'Thống kê', href: '/thong-ke', icon: '📈' },
];

export default function PublicSidebar({ isOpen, onClose }: PublicSidebarProps) {
  const pathname = usePathname();
  const { selectedTournament, tournaments, setSelectedTournamentId } = usePublicTournament();

  // Close sidebar on path change (useful for mobile navigation)
  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isOpen && <div className={styles.overlay} onClick={onClose} />}

      <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}>
        {/* logo section */}
        <div className={styles.logoSection}>
          <Link href="/" className={styles.logoLink}>
            <img src="/logo-premium-transparent.png" alt="TKScore Logo" className={styles.logoImg} />
            <span className={styles.logoText}>TKSCORE</span>
          </Link>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close sidebar">×</button>
        </div>

        {/* Scroll Container for Sidebar Content */}
        <div className={styles.scrollContainer}>
          {/* ĐỘI BÓNG */}
          <nav className={styles.navMenu}>
            <div className={styles.navHeaderWithArrow}>
              <p className={styles.navLabel}>ĐỘI BÓNG</p>
              <span className={styles.navArrow}>›</span>
            </div>
            <div className={styles.menuItemsList}>
              {[
                { name: 'Manchester United', sub: 'Anh', logo: '🔴' },
                { name: 'Liverpool', sub: 'Anh', logo: '🦅' },
                { name: 'Arsenal', sub: 'Anh', logo: '🛡️' },
                { name: 'Manchester City', sub: 'Anh', logo: '⛵' },
                { name: 'Real Madrid', sub: 'Tây Ban Nha', logo: '👑' }
              ].map(team => (
                <Link key={team.name} href="#" className={styles.navEntityLink}>
                  <span className={styles.entityLogo}>{team.logo}</span>
                  <div className={styles.entityInfo}>
                    <span className={styles.entityName}>{team.name}</span>
                    <span className={styles.entitySub}>{team.sub}</span>
                  </div>
                </Link>
              ))}
            </div>
          </nav>

          {/* GIẢI ĐẤU */}
          <nav className={styles.navMenu}>
            <div className={styles.navHeaderWithArrow}>
              <p className={styles.navLabel}>GIẢI ĐẤU</p>
              <span className={styles.navArrow}>›</span>
            </div>
            <div className={styles.menuItemsList}>
              {tournaments.length === 0 ? (
                <div className={styles.emptyText}>Không có giải đấu nào</div>
              ) : (
                tournaments.map(t => {
                  const isActive = selectedTournament?.id === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTournamentId(t.id)}
                      className={`${styles.navEntityLink} ${isActive ? styles.navEntityLinkActive : ''}`}
                    >
                      <span className={styles.entityLogo}>🏆</span>
                      <div className={styles.entityInfo}>
                        <span className={styles.entityName}>{t.ten}</span>
                        <span className={styles.entitySub}>{t.mua_giai}</span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className={styles.sidebarFooter}>
          <p className={styles.footerBrand}>TKScore Premium v2.0</p>
          <p className={styles.footerCopyright}>© 2026 Thiên Khôi Group</p>
        </div>
      </aside>
    </>
  );
}
