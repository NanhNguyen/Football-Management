'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
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
  const [userRole, setUserRole] = useState<string>('user');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isLeague, setIsLeague] = useState(false);

  useEffect(() => {
    const selectedId = localStorage.getItem('public_selected_tournament_id');
    if (selectedId) {
      const configStr = localStorage.getItem(`giai_dau_config_${selectedId}`);
      let isLeagueVal = false;
      if (configStr) {
        try {
          const config = JSON.parse(configStr);
          isLeagueVal = config.theThuc === 'league';
        } catch (e) {
          isLeagueVal = false;
        }
      }
      
      // Fallback: fetch selected tournament from Supabase to check the name
      const checkLeagueFallback = async () => {
        try {
          const { data, error } = await supabase
            .from('giai_dau')
            .select('ten')
            .eq('id', selectedId)
            .single();
          if (data && !error) {
            const nameLower = data.ten?.toLowerCase() || '';
            const isLeagueName = nameLower.includes('epl') || nameLower.includes('league');
            setIsLeague(isLeagueVal || isLeagueName);
          } else {
            setIsLeague(isLeagueVal);
          }
        } catch (err) {
          setIsLeague(isLeagueVal);
        }
      };
      
      checkLeagueFallback();
    } else {
      setIsLeague(false);
    }
  }, [pathname]);

  useEffect(() => {
    // Check initial session and handle auto-refresh
    const initAuth = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        
        // Fetch role
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role_id')
          .eq('user_id', session.user.id)
          .single();
        const roleId = roleData?.role_id || 3;
        const roleMap: Record<number, string> = { 1: 'admin', 2: 'ref', 3: 'user' };
        const role = roleMap[roleId] || 'user';
        setUserRole(role);
        localStorage.setItem('user_role', role);

        const expiresAt = session.expires_at ? session.expires_at * 1000 : 0;
        const now = Date.now();
        if (expiresAt - now < 5 * 60 * 1000) {
          await supabase.auth.refreshSession();
        }
      } else {
        setUser(null);
        setUserRole('user');
      }
    };
    
    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setUser(session.user);
        const storedRole = localStorage.getItem('user_role');
        if (storedRole) setUserRole(storedRole);
      } else {
        setUser(null);
        setUserRole('user');
        localStorage.removeItem('user_role');
        if (pathname.startsWith('/quan-tri') && event === 'SIGNED_OUT') {
          window.location.href = '/login';
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [pathname]);

  // Handle click outside to close user dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn đăng xuất không?')) {
      return;
    }
    localStorage.removeItem('user_role');
    await supabase.auth.signOut();
    setDropdownOpen(false);
    window.location.href = '/login';
  };

  // Admin pages use their own layout
  if (pathname.startsWith('/quan-tri')) return null;

  const getInitials = () => {
    if (user?.user_metadata?.full_name) {
      const parts = user.user_metadata.full_name.split(' ');
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return user.user_metadata.full_name.substring(0, 2).toUpperCase();
    }
    return user?.email ? user.email.substring(0, 2).toUpperCase() : 'US';
  };
  const initials = getInitials();
  
  const roleDisplayNames: Record<string, string> = {
    'admin': 'Admin',
    'ref': 'Trọng tài',
    'user': 'Người xem'
  };

  return (
    <header className={styles.header}>
      {/* LEFT — Logo & Season */}
      <div className={styles.left}>
        <Link href="/" className={styles.logo}>
          <img src="/logo-premium-transparent.png" alt="SPARTA Logo" className={styles.logoImg} />
        </Link>
      </div>

      {/* CENTER — Menu */}
      <nav className={styles.centerNav}>
        {menuItems
          .filter((item) => !(item.href === '/knock-out' && isLeague))
          .map((item) => (
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
        <button className={styles.followTeamBtn}>
          <span className={styles.followTeamText}>Chọn Đội Của Bạn</span>
        </button>

        {user ? (
          <div className={styles.profileWrapper} ref={dropdownRef}>
            <div 
              className={styles.profileBox} 
              onClick={() => setDropdownOpen(!dropdownOpen)}
              title={user.email}
            >
              <div className={styles.avatar}>
                {user.user_metadata?.avatar_url ? (
                  <img 
                    src={user.user_metadata.avatar_url} 
                    alt="User Avatar" 
                    className={styles.avatarImg}
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  initials
                )}
                <span className={styles.onlineBadge}></span>
              </div>
            </div>

            {/* User Profile Dropdown Menu */}
            {dropdownOpen && (
              <div className={styles.dropdownMenu}>
                {/* Part 1: User Info */}
                <div className={styles.userInfo}>
                  <div className={styles.userAvatar}>
                    {user.user_metadata?.avatar_url ? (
                      <img 
                        src={user.user_metadata.avatar_url} 
                        alt="User Avatar" 
                        className={styles.avatarImg}
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      initials
                    )}
                  </div>
                  <div className={styles.userDetails}>
                    <p className={styles.userName}>
                      {user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User'}
                    </p>
                    <p className={styles.userRole}>{roleDisplayNames[userRole]}</p>
                  </div>
                </div>

                {/* Part 2: Admin Shortcut (Only for admin or ref) */}
                {(userRole === 'admin' || userRole === 'ref') && (
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
                )}

                {/* Part 3: Logout */}
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
