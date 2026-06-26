'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { usePublicTournament } from './PublicTournamentContext';
import { layDanhSachDoi } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { 
  TrophyIcon, 
  SoccerBallIcon, 
  StarIcon, 
  ChevronRightIcon, 
  LogoutIcon 
} from '@/components/AppIcons';
import styles from './PublicSidebar.module.css';

interface PublicSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PublicSidebar({ isOpen, onClose }: PublicSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    selectedTournament,
    tournaments,
    setSelectedTournamentId,
    favoriteTeams,
    toggleFollowTeam,
    followedTournaments,
    toggleFollowTournament
  } = usePublicTournament();

  const [teams, setTeams] = useState<any[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [user, setUser] = useState<any>(null);

  const [userRole, setUserRole] = useState<string>('user');

  // Authentication status effect
  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
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

  const handleLogout = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn đăng xuất không?')) {
      return;
    }
    localStorage.removeItem('user_role');
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  // Fetch all teams for basic data
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const list = await layDanhSachDoi();
        setTeams(list);
      } catch (error) {
        console.error('Lỗi lấy danh sách đội bóng cho Sidebar:', error);
      } finally {
        setLoadingTeams(false);
      }
    };
    fetchTeams();
  }, []);

  // Close sidebar on path change
  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  const handleToggleFollowTournament = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFollowTournament(id);
  };

  const handleToggleFollowTeam = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFollowTeam(id);
  };

  // Show all tournaments
  const activeTournaments = tournaments;

  // Filter out followed objects to render from the active list
  const followedTourneysList = activeTournaments.filter(t => followedTournaments.includes(t.id));
  const followedTeamsList = teams.filter(team => favoriteTeams.includes(team.id));

  // Determine if Section "⭐ ĐANG THEO DÕI" should be shown or show a muted placeholder
  const hasFollowedItems = followedTourneysList.length > 0 || followedTeamsList.length > 0;

  const roleDisplayNames: Record<string, string> = {
    'admin': 'Admin',
    'ref': 'Trọng tài',
    'user': 'Người xem'
  };

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isOpen && <div className={styles.overlay} onClick={onClose} />}

      <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}>
        {/* Logo Section */}
        <div className={styles.logoSection}>
          <Link href="/" className={styles.logoLink}>
            <img src="/logo-violet.svg" alt="Sparta Logo" className={styles.logoImg} />
            <span className={styles.logoText}>SPARTA</span>
          </Link>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close sidebar">×</button>
        </div>

        {/* Scroll Container for Sidebar Content */}
        <div className={styles.scrollContainer}>

          {/* Section 1: ⭐ ĐANG THEO DÕI (Consumes Global State `favoriteTeams`) */}
          <section className={styles.sectionWrapper}>
            <div className={styles.sectionHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <StarIcon size={14} filled />
                <span className={styles.sectionTitleText}>ĐANG THEO DÕI</span>
              </div>
              <Link href="/dang-theo-doi" className={styles.sectionHeaderArrow} title="Xem tất cả" style={{ display: 'flex', alignItems: 'center' }}>
                <ChevronRightIcon size={14} style={{ color: 'var(--color-text-muted)' }} />
              </Link>
            </div>

            <div className={styles.sectionContent}>
              {!hasFollowedItems ? (
                <div className={styles.emptyFollowPlaceholder}>
                  Bạn chưa theo dõi đội bóng nào
                </div>
              ) : (
                <div className={styles.followedList}>
                  {/* Followed Tournaments */}
                  {followedTourneysList.map(t => {
                    const isActive = selectedTournament?.id === t.id;
                    return (
                      <div
                        key={`fav-t-${t.id}`}
                        onClick={() => {
                          setSelectedTournamentId(t.id);
                          if (pathname !== '/') {
                            router.push('/');
                          }
                          onClose();
                        }}
                        className={`${styles.navEntityLink} ${isActive ? styles.navEntityLinkActive : ''}`}
                      >
                        <span className={styles.entityLogo}>
                          <TrophyIcon size={16} />
                        </span>
                        <div className={styles.entityInfo}>
                          <span className={styles.entityName}>{t.ten}</span>
                          <span className={styles.entitySub}>{t.mua_giai}</span>
                        </div>
                        <button
                          className={styles.starBtnActive}
                          onClick={(e) => handleToggleFollowTournament(t.id, e)}
                          title="Bỏ theo dõi"
                        >
                          <StarIcon size={16} filled color={isActive ? "#FFFFFF" : "var(--color-primary)"} />
                        </button>
                      </div>
                    );
                  })}

                  {/* Followed Teams (Subscribes to favoriteTeams) */}
                  {followedTeamsList.map(team => {
                    const isTeamActive = pathname === `/doi-bong/${team.id}`;
                    return (
                      <Link
                        key={`fav-team-${team.id}`}
                        href={`/doi-bong/${team.id}`}
                        className={`${styles.navEntityLink} ${isTeamActive ? styles.navEntityLinkActive : ''}`}
                      >
                        <span className={styles.entityLogo}>
                          {team.logo && (team.logo.startsWith('http') || team.logo.startsWith('/')) ? (
                            <img src={team.logo} alt={team.ten} className={styles.teamLogoImgMini} />
                          ) : (
                            <SoccerBallIcon size={16} />
                          )}
                        </span>
                        <div className={styles.entityInfo}>
                          <span className={styles.entityName}>{team.ten}</span>
                          {team.vietTat && <span className={styles.entitySub}>{team.vietTat}</span>}
                        </div>
                        <button
                          className={styles.starBtnActive}
                          onClick={(e) => handleToggleFollowTeam(team.id, e)}
                          title="Bỏ theo dõi"
                        >
                          <StarIcon size={16} filled color={isTeamActive ? "#FFFFFF" : "var(--color-primary)"} />
                        </button>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* Section 2: 🏆 CÁC GIẢI ĐẤU */}
          <section className={styles.sectionWrapper}>
            <div className={styles.sectionHeader} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <TrophyIcon size={14} />
              <span className={styles.sectionTitleText}>CÁC GIẢI ĐẤU</span>
            </div>

            <div className={styles.sectionContent}>
              {activeTournaments.length === 0 ? (
                <div className={styles.emptyText}>Không có giải đấu nào</div>
              ) : (
                <div className={styles.tournamentsList}>
                  {activeTournaments.map(t => {
                    const isActive = selectedTournament?.id === t.id;
                    const isFollowed = followedTournaments.includes(t.id);
                    return (
                      <div
                        key={`tourney-${t.id}`}
                        onClick={() => {
                          setSelectedTournamentId(t.id);
                          if (pathname !== '/') {
                            router.push('/');
                          }
                          onClose();
                        }}
                        className={`${styles.navEntityLink} ${isActive ? styles.navEntityLinkActive : ''}`}
                      >
                        <span className={styles.entityLogo}>
                          <TrophyIcon size={16} />
                        </span>
                        <div className={styles.entityInfo}>
                          <span className={styles.entityName}>{t.ten}</span>
                          <span className={styles.entitySub}>{t.mua_giai}</span>
                        </div>
                        <button
                          className={isFollowed ? styles.starBtnActive : styles.starBtnInactive}
                          onClick={(e) => handleToggleFollowTournament(t.id, e)}
                          title={isFollowed ? "Bỏ theo dõi" : "Theo dõi"}
                        >
                          <StarIcon size={16} filled={isFollowed} color={isActive ? "#FFFFFF" : "var(--color-primary)"} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

        </div>

        {/* Auth / Profile Section at the bottom of the sidebar */}
        <div className={styles.authSection}>
          {user ? (
            <div className={styles.userProfile}>
              <div className={styles.userInfoWrapper}>
                <div className={styles.avatar}>
                  {user.user_metadata?.avatar_url ? (
                    <img 
                      src={user.user_metadata.avatar_url} 
                      alt="User Avatar" 
                      className={styles.avatarImg}
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    user.user_metadata?.full_name 
                      ? user.user_metadata.full_name[0].toUpperCase() 
                      : (user.email ? user.email[0].toUpperCase() : 'U')
                  )}
                  <span className={styles.onlineBadge} />
                </div>
                <div className={styles.userDetails}>
                  <span className={styles.userName}>
                    {user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User'}
                  </span>
                  <span className={styles.userRole}>{roleDisplayNames[userRole]}</span>
                </div>
              </div>
              <div className={styles.profileActions}>
                {(userRole === 'admin' || userRole === 'ref') && (
                  <Link href="/quan-tri" className={styles.actionBtn}>
                    Quản trị
                  </Link>
                )}
                <button onClick={handleLogout} className={`${styles.actionBtn} ${styles.logoutBtn}`}>
                  <LogoutIcon size={14} className={styles.logoutIcon} />
                  <span>Đăng xuất</span>
                </button>
              </div>
            </div>
          ) : (
            <Link href="/login" className={styles.loginBtn}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
              <span>Đăng nhập</span>
            </Link>
          )}
        </div>

      </aside>
    </>
  );
}
