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
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close sidebar on path change (useful for mobile navigation)
  useEffect(() => {
    onClose();
  }, [pathname]);

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

        {/* Tournament Switcher */}
        <div className={styles.switcherSection}>
          <p className={styles.switcherLabel}>GIẢI ĐẤU ĐANG XEM</p>
          <div className={styles.dropdownWrapper} ref={dropdownRef}>
            <button 
              className={styles.switcherBtn} 
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <span className={styles.switcherIcon}>🏆</span>
              <span className={styles.switcherText}>
                {selectedTournament ? selectedTournament.ten : 'Đang tải...'}
              </span>
              <span className={`${styles.arrow} ${dropdownOpen ? styles.arrowUp : ''}`}>▼</span>
            </button>

            {dropdownOpen && (
              <div className={styles.dropdownMenu}>
                {tournaments.length === 0 ? (
                  <div className={styles.dropdownItemEmpty}>Không có giải đấu nào</div>
                ) : (
                  tournaments.map((t) => (
                    <button
                      key={t.id}
                      className={`${styles.dropdownItem} ${
                        selectedTournament?.id === t.id ? styles.dropdownItemActive : ''
                      }`}
                      onClick={() => {
                        setSelectedTournamentId(t.id);
                        setDropdownOpen(false);
                      }}
                    >
                      <span className={styles.itemIcon}>⚽</span>
                      <div className={styles.itemDetails}>
                        <p className={styles.itemName}>{t.ten}</p>
                        <p className={styles.itemSub}>{t.mua_giai}</p>
                      </div>
                      {selectedTournament?.id === t.id && (
                        <span className={styles.checkmark}>✓</span>
                      )}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Main Navigation Menu */}
        <nav className={styles.navMenu}>
          <p className={styles.navLabel}>MENU ĐIỀU HƯỚNG</p>
          <div className={styles.menuItemsList}>
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
                >
                  <span className={styles.menuLabel}>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div className={styles.sidebarFooter}>
          <p className={styles.footerBrand}>TKScore Premium v2.0</p>
          <p className={styles.footerCopyright}>© 2026 Thiên Khôi Group</p>
        </div>
      </aside>
    </>
  );
}
