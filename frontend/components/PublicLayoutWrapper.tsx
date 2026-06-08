'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import PublicSidebar from './PublicSidebar';
import PublicBottomNav from './PublicBottomNav';
import { PublicTournamentProvider, usePublicTournament } from './PublicTournamentContext';
import { layDanhSachDoi } from '@/lib/api';
import { TrophyIcon, SoccerBallIcon, StarIcon, ChevronRightIcon } from '@/components/AppIcons';
import sidebarStyles from './PublicSidebar.module.css';
import styles from './PublicLayoutWrapper.module.css';

function PublicLayoutContent({ children, sidebarOpen, setSidebarOpen }: { children: React.ReactNode, sidebarOpen: boolean, setSidebarOpen: (o: boolean) => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const {
    selectedTournament,
    tournaments,
    setSelectedTournamentId,
    favoriteTeams,
    toggleFollowTeam,
    followedTournaments,
    toggleFollowTournament,
    tournamentsSheetOpen,
    setTournamentsSheetOpen
  } = usePublicTournament();

  const [teams, setTeams] = useState<any[]>([]);

  // Fetch teams for favorite list
  useEffect(() => {
    if (tournamentsSheetOpen) {
      layDanhSachDoi().then(setTeams).catch(err => console.error(err));
    }
  }, [tournamentsSheetOpen]);

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

  const closeSidebar = () => setSidebarOpen(false);

  const followedTourneysList = tournaments.filter(t => followedTournaments.includes(t.id));
  const followedTeamsList = teams.filter(team => favoriteTeams.includes(team.id));
  const hasFollowedItems = followedTourneysList.length > 0 || followedTeamsList.length > 0;

  return (
    <div className={styles.layoutContainer}>
      {/* Left Sidebar (Desktop) / Sidebar Drawer (Mobile) */}
      <PublicSidebar isOpen={sidebarOpen} onClose={closeSidebar} />
      
      {/* Main Content Area */}
      <div className={styles.mainArea}>
        {/* Streamlined Topbar removed as requested */}
        
        {/* Page Contents */}
        <main className={styles.contentBody}>
          {children}
        </main>
      </div>

      {/* Bottom Nav Bar for Mobile devices */}
      <PublicBottomNav />

      {/* Tournaments Bottom Sheet for Mobile */}
      {tournamentsSheetOpen && (
        <>
          <div 
            className={styles.bottomSheetBackdrop} 
            onClick={() => setTournamentsSheetOpen(false)} 
          />
          <div className={styles.bottomSheet}>
            <div className={styles.bottomSheetHandle} />
            <div className={styles.bottomSheetHeader}>
              <h3 className={styles.bottomSheetTitle}>Chọn giải đấu</h3>
              <button 
                className={styles.bottomSheetClose} 
                onClick={() => setTournamentsSheetOpen(false)}
              >
                ×
              </button>
            </div>
            
            <div className={styles.bottomSheetContent}>
              {/* Section 1: ⭐ ĐANG THEO DÕI */}
              <section className={sidebarStyles.sectionWrapper} style={{ marginBottom: '24px' }}>
                <div className={sidebarStyles.sectionHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <StarIcon size={14} filled />
                    <span className={sidebarStyles.sectionTitleText}>ĐANG THEO DÕI</span>
                  </div>
                  <Link href="/dang-theo-doi" onClick={() => setTournamentsSheetOpen(false)} title="Xem tất cả">
                    <ChevronRightIcon size={14} style={{ color: 'var(--color-text-muted)' }} />
                  </Link>
                </div>

                <div className={sidebarStyles.sectionContent}>
                  {!hasFollowedItems ? (
                    <div className={sidebarStyles.emptyFollowPlaceholder}>
                      Bạn chưa theo dõi đội bóng hay giải đấu nào
                    </div>
                  ) : (
                    <div className={sidebarStyles.followedList}>
                      {/* Followed Tournaments */}
                      {followedTourneysList.map(t => {
                        const isActive = selectedTournament?.id === t.id;
                        return (
                          <div
                            key={`sheet-fav-t-${t.id}`}
                            onClick={() => {
                              setSelectedTournamentId(t.id);
                              setTournamentsSheetOpen(false);
                              if (pathname !== '/') {
                                router.push('/');
                              }
                            }}
                            className={`${sidebarStyles.navEntityLink} ${isActive ? sidebarStyles.navEntityLinkActive : ''}`}
                            style={{ cursor: 'pointer' }}
                          >
                            <span className={sidebarStyles.entityLogo}>
                              <TrophyIcon size={16} />
                            </span>
                            <div className={sidebarStyles.entityInfo}>
                              <span className={sidebarStyles.entityName}>{t.ten}</span>
                              <span className={sidebarStyles.entitySub}>{t.mua_giai}</span>
                            </div>
                            <button
                              className={sidebarStyles.starBtnActive}
                              onClick={(e) => handleToggleFollowTournament(t.id, e)}
                              title="Bỏ theo dõi"
                            >
                              <StarIcon size={16} filled color={isActive ? "#FFFFFF" : "var(--color-primary)"} />
                            </button>
                          </div>
                        );
                      })}

                      {/* Followed Teams */}
                      {followedTeamsList.map(team => {
                        const isTeamActive = pathname === `/doi-bong/${team.id}`;
                        return (
                          <div
                            key={`sheet-fav-team-${team.id}`}
                            onClick={() => {
                              setTournamentsSheetOpen(false);
                              router.push(`/doi-bong/${team.id}`);
                            }}
                            className={`${sidebarStyles.navEntityLink} ${isTeamActive ? sidebarStyles.navEntityLinkActive : ''}`}
                            style={{ cursor: 'pointer' }}
                          >
                            <span className={sidebarStyles.entityLogo}>
                              {team.logo && (team.logo.startsWith('http') || team.logo.startsWith('/')) ? (
                                <img src={team.logo} alt={team.ten} className={sidebarStyles.teamLogoImgMini} />
                              ) : (
                                <SoccerBallIcon size={16} />
                              )}
                            </span>
                            <div className={sidebarStyles.entityInfo}>
                              <span className={sidebarStyles.entityName}>{team.ten}</span>
                              {team.vietTat && <span className={sidebarStyles.entitySub}>{team.vietTat}</span>}
                            </div>
                            <button
                              className={sidebarStyles.starBtnActive}
                              onClick={(e) => handleToggleFollowTeam(team.id, e)}
                              title="Bỏ theo dõi"
                            >
                              <StarIcon size={16} filled color={isTeamActive ? "#FFFFFF" : "var(--color-primary)"} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </section>

              {/* Section 2: 🏆 CÁC GIẢI ĐẤU */}
              <section className={sidebarStyles.sectionWrapper}>
                <div className={sidebarStyles.sectionHeader} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <TrophyIcon size={14} />
                  <span className={sidebarStyles.sectionTitleText}>CÁC GIẢI ĐẤU</span>
                </div>

                <div className={sidebarStyles.sectionContent}>
                  {tournaments.length === 0 ? (
                    <div className={sidebarStyles.emptyText}>Không có giải đấu nào</div>
                  ) : (
                    <div className={sidebarStyles.tournamentsList}>
                      {tournaments.map(t => {
                        const isActive = selectedTournament?.id === t.id;
                        const isFollowed = followedTournaments.includes(t.id);
                        return (
                          <div
                            key={`sheet-tourney-${t.id}`}
                            onClick={() => {
                              setSelectedTournamentId(t.id);
                              setTournamentsSheetOpen(false);
                              if (pathname !== '/') {
                                router.push('/');
                              }
                            }}
                            className={`${sidebarStyles.navEntityLink} ${isActive ? sidebarStyles.navEntityLinkActive : ''}`}
                            style={{ cursor: 'pointer' }}
                          >
                            <span className={sidebarStyles.entityLogo}>
                              <TrophyIcon size={16} />
                            </span>
                            <div className={sidebarStyles.entityInfo}>
                              <span className={sidebarStyles.entityName}>{t.ten}</span>
                              <span className={sidebarStyles.entitySub}>{t.mua_giai}</span>
                            </div>
                            <button
                              className={isFollowed ? sidebarStyles.starBtnActive : sidebarStyles.starBtnInactive}
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
          </div>
        </>
      )}
    </div>
  );
}

export default function PublicLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Exclude Admin dashboard and Login views from public sidebar layout
  const isExcluded = pathname.startsWith('/quan-tri') || pathname.startsWith('/login');

  if (isExcluded) {
    return <>{children}</>;
  }

  return (
    <PublicTournamentProvider>
      <PublicLayoutContent sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}>
        {children}
      </PublicLayoutContent>
    </PublicTournamentProvider>
  );
}
