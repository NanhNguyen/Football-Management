'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { usePublicTournament } from './PublicTournamentContext';
import { layDanhSachDoi } from '@/lib/api';
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
    toggleFollowTeam 
  } = usePublicTournament();

  const [teams, setTeams] = useState<any[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [followedTournaments, setFollowedTournaments] = useState<string[]>([]);

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

  // Synchronize followed tournaments list from localStorage on mount and when custom events fire
  useEffect(() => {
    const syncFollowed = () => {
      const savedTourneysStr = localStorage.getItem('followedTournaments');
      const tourneys = savedTourneysStr ? JSON.parse(savedTourneysStr) : [];
      setFollowedTournaments(tourneys);
    };

    syncFollowed();
    window.addEventListener('storage', syncFollowed);
    window.addEventListener('follow-update', syncFollowed);
    return () => {
      window.removeEventListener('storage', syncFollowed);
      window.removeEventListener('follow-update', syncFollowed);
    };
  }, []);

  // Seed default follow items if completely empty on first initialization
  useEffect(() => {
    if (loadingTeams || tournaments.length === 0 || teams.length === 0) return;

    const savedTourneysStr = localStorage.getItem('followedTournaments');
    const savedTeamsStr = localStorage.getItem('followedTeams');

    let updatedTourneys = savedTourneysStr ? JSON.parse(savedTourneysStr) : null;
    let updatedTeams = savedTeamsStr ? JSON.parse(savedTeamsStr) : null;

    let didUpdate = false;

    if (updatedTourneys === null) {
      // Seed first tournament as default followed
      const defaultId = tournaments[0]?.id;
      updatedTourneys = defaultId ? [defaultId] : [];
      localStorage.setItem('followedTournaments', JSON.stringify(updatedTourneys));
      setFollowedTournaments(updatedTourneys);
      didUpdate = true;
    }

    if (updatedTeams === null) {
      // Seed first 2 teams as default followed in the global store
      const defaultIds = teams.slice(0, 2).map((t: any) => t.id);
      localStorage.setItem('followedTeams', JSON.stringify(defaultIds));
      didUpdate = true;
    }

    if (didUpdate) {
      window.dispatchEvent(new Event('follow-update'));
    }
  }, [loadingTeams, tournaments, teams]);

  // Toggle follow status for Tournament
  const toggleFollowTournament = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const updated = followedTournaments.includes(id)
      ? followedTournaments.filter(x => x !== id)
      : [...followedTournaments, id];
    
    localStorage.setItem('followedTournaments', JSON.stringify(updated));
    setFollowedTournaments(updated);
    window.dispatchEvent(new Event('follow-update'));
  };

  // Toggle follow status for Team consuming global store action
  const handleToggleFollowTeam = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFollowTeam(id);
  };

  // Close sidebar on path change
  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  // Show all tournaments regardless of whether they have teams yet
  const activeTournaments = tournaments;

  // Filter out followed objects to render from the active list
  const followedTourneysList = activeTournaments.filter(t => followedTournaments.includes(t.id));
  const followedTeamsList = teams.filter(team => favoriteTeams.includes(team.id));

  // Determine if Section "⭐ ĐANG THEO DÕI" should be shown or show a muted placeholder
  const hasFollowedItems = followedTourneysList.length > 0 || followedTeamsList.length > 0;

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isOpen && <div className={styles.overlay} onClick={onClose} />}

      <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}>
        {/* Logo Section */}
        <div className={styles.logoSection}>
          <Link href="/" className={styles.logoLink}>
            <img src="/logo-premium-transparent.png" alt="TKScore Logo" className={styles.logoImg} />
            <span className={styles.logoText}>TKSCORE</span>
          </Link>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close sidebar">×</button>
        </div>

        {/* Scroll Container for Sidebar Content */}
        <div className={styles.scrollContainer}>
          
          {/* Section 1: ⭐ ĐANG THEO DÕI (Consumes Global State `favoriteTeams`) */}
          <section className={styles.sectionWrapper}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionTitleIcon} style={{color: '#d71920'}}>★</span>
              <span className={styles.sectionTitleText}>ĐANG THEO DÕI</span>
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
                        <span className={styles.entityLogo}>🏆</span>
                        <div className={styles.entityInfo}>
                          <span className={styles.entityName}>{t.ten}</span>
                          <span className={styles.entitySub}>{t.mua_giai}</span>
                        </div>
                        <button
                          className={styles.starBtnActive}
                          onClick={(e) => toggleFollowTournament(t.id, e)}
                          title="Bỏ theo dõi"
                        >
                          <span style={{color: '#d71920'}}>★</span>
                        </button>
                      </div>
                    );
                  })}

                  {/* Followed Teams (Subscribes to favoriteTeams) */}
                  {followedTeamsList.map(team => {
                    return (
                      <Link
                        key={`fav-team-${team.id}`}
                        href={`/doi-bong/${team.id}`}
                        className={styles.navEntityLink}
                      >
                        <span className={styles.entityLogo}>
                          {team.logo && (team.logo.startsWith('http') || team.logo.startsWith('/')) ? (
                            <img src={team.logo} alt={team.ten} className={styles.teamLogoImgMini} />
                          ) : (
                            team.logo || '⚽'
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
                          <span style={{color: '#d71920'}}>★</span>
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
            <div className={styles.sectionHeader}>
              <span className={styles.sectionTitleIcon}>🏆</span>
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
                        <span className={styles.entityLogo}>🏆</span>
                        <div className={styles.entityInfo}>
                          <span className={styles.entityName}>{t.ten}</span>
                          <span className={styles.entitySub}>{t.mua_giai}</span>
                        </div>
                        <button
                          className={isFollowed ? styles.starBtnActive : styles.starBtnInactive}
                          onClick={(e) => toggleFollowTournament(t.id, e)}
                          title={isFollowed ? "Bỏ theo dõi" : "Theo dõi"}
                        >
                          {isFollowed ? <span style={{color: '#d71920'}}>★</span> : '☆'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

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
