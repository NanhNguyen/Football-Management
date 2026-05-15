'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import styles from './TopNav.module.css';

const menuItems = [
  { label: 'Tổng quan', href: '/' },
  { label: 'Lịch đấu', href: '/lich-dau' },
  { label: 'BXH', href: '/bang-xep-hang' },
  { label: 'Knock-out', href: '/knock-out' },
  { label: 'Thống kê', href: '/thong-ke' },
];

export default function TopNav() {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Check initial session and handle auto-refresh
    const initAuth = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        
        // Optional: Check if we need to force a refresh (Supabase handles this usually)
        // But we can manually trigger refresh if token is close to expiry
        const expiresAt = session.expires_at ? session.expires_at * 1000 : 0;
        const now = Date.now();
        // If less than 5 mins left, refresh now
        if (expiresAt - now < 5 * 60 * 1000) {
          await supabase.auth.refreshSession();
        }
      } else {
        setUser(null);
      }
    };
    
    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth event:', event);
      if (session) {
        setUser(session.user);
      } else {
        setUser(null);
        // If token expires (TOKEN_REFRESHED fails or SIGNED_OUT), 
        // and we are on an admin page, redirect to login
        if (pathname.startsWith('/quan-tri') && event === 'SIGNED_OUT') {
          window.location.href = '/login';
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [pathname]);


  // Admin pages use their own layout
  if (pathname.startsWith('/quan-tri')) return null;

  return (
    <header className={styles.header}>
      {/* LEFT — Logo & Season */}
      <div className={styles.left}>
        <div className={styles.logo}>
          <img src="/logo.svg" alt="TKSCORE Logo" style={{ width: '40px', height: '40px' }} />
          <div>
            <h1 className={styles.brandName}>TKSCORE</h1>
            <p className={styles.seasonName}>Cúp Siêu Chốt</p>
          </div>
        </div>
      </div>

      {/* CENTER — Menu */}
      <nav className={styles.centerNav}>
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles.navLink} ${pathname === item.href ? styles.navLinkActive : ''}`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {/* RIGHT — Profile & Actions */}
      <div className={styles.right}>
        {user ? (
          <>
            <Link href="/quan-tri" className={styles.adminBtn}>
              Quản trị
            </Link>
            <div className={styles.profileBox} title={user.email}>
              <div className={styles.avatar}>
                {user.email?.substring(0, 2).toUpperCase()}
                <span className={styles.onlineBadge}></span>
              </div>
            </div>
          </>
        ) : (
          <Link href="/login" className={styles.loginBtn}>
            Đăng nhập
          </Link>
        )}
      </div>
    </header>
  );
}

