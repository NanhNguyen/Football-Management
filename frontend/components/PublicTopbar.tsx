'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import styles from './PublicTopbar.module.css';

interface PublicTopbarProps {
  onMenuClick: () => void;
}

export default function PublicTopbar({ onMenuClick }: PublicTopbarProps) {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Check initial auth state
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
      }
    };
    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setUser(session.user);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setDropdownOpen(false);
    window.location.href = '/login';
  };

  const initials = user?.email ? user.email.substring(0, 2).toUpperCase() : 'AD';

  return (
    <header className={styles.topbar}>
      {/* Left: Hamburger & Search */}
      <div className={styles.left}>
        <button
          className={styles.hamburgerBtn}
          onClick={onMenuClick}
          aria-label="Open sidebar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>

        <div className={styles.searchWrapper}>
          <svg className={styles.searchIcon} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            placeholder="Tìm trận đấu, đội bóng..."
            className={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Right: Actions & User Avatar */}
      <div className={styles.right}>
        <button className={styles.followTeamBtn}>
          <span className={styles.followTeamText}>Chọn Đội Của Bạn</span>
        </button>

        {user ? (
          <div className={styles.profileWrapper} ref={dropdownRef}>
            <button
              className={styles.profileBox}
              onClick={() => setDropdownOpen(!dropdownOpen)}
              title={user.email}
            >
              <div className={styles.avatar}>
                {initials}
                <span className={styles.onlineBadge}></span>
              </div>
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className={styles.dropdownMenu}>
                <div className={styles.userInfo}>
                  <div className={styles.userAvatar}>{initials}</div>
                  <div className={styles.userDetails}>
                    <p className={styles.userName}>Nguyễn Nam Anh</p>
                    <p className={styles.userRole}>Ban Tổ Chức</p>
                  </div>
                </div>

                <Link
                  href="/quan-tri"
                  className={styles.dropdownItem}
                  onClick={() => setDropdownOpen(false)}
                >
                  <span className={styles.dropdownItemIcon}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="3"></circle>
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                    </svg>
                  </span>
                  <span>Trang Quản trị</span>
                </Link>

                <button
                  className={`${styles.dropdownItem} ${styles.logoutItem}`}
                  onClick={handleLogout}
                >
                  <span className={styles.dropdownItemIcon}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                      <polyline points="16 17 21 12 16 7"></polyline>
                      <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                  </span>
                  <span>Đăng xuất</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link href="/login" className={styles.loginBtn}>
            Đăng nhập
          </Link>
        )}
      </div>
    </header>
  );
}
