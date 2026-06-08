'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePublicTournament } from '@/components/PublicTournamentContext';
import { layDanhSachDoi } from '@/lib/api';
import { 
  ArrowLeftIcon, 
  StarIcon, 
  TrophyIcon, 
  SoccerBallIcon 
} from '@/components/AppIcons';
import GlobalSkeletonLoader from '@/components/GlobalSkeletonLoader';
import styles from './page.module.css';

export default function DangTheoDoiPage() {
  const router = useRouter();
  const {
    tournaments,
    favoriteTeams,
    toggleFollowTeam,
    followedTournaments,
    toggleFollowTournament,
    loading: contextLoading
  } = usePublicTournament();

  const [teams, setTeams] = useState<any[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(true);

  // Fetch all teams to map IDs to details
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const list = await layDanhSachDoi();
        setTeams(list);
      } catch (error) {
        console.error('Lỗi lấy danh sách đội:', error);
      } finally {
        setLoadingTeams(false);
      }
    };
    fetchTeams();
  }, []);

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

  if (contextLoading || loadingTeams) {
    return <GlobalSkeletonLoader />;
  }

  // Filter followed entities
  const followedTourneysList = tournaments.filter(t => followedTournaments.includes(t.id));
  const followedTeamsList = teams.filter(team => favoriteTeams.includes(team.id));
  const hasFollowedItems = followedTourneysList.length > 0 || followedTeamsList.length > 0;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <button onClick={() => router.back()} className={styles.backBtn}>
          <ArrowLeftIcon size={16} />
          <span>Quay lại</span>
        </button>
        <h1 className={styles.title}>Danh sách Đang Theo Dõi</h1>
        <p className={styles.subtitle}>Quản lý các giải đấu và đội bóng mà bạn đang quan tâm theo dõi.</p>
      </div>

      {!hasFollowedItems ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <StarIcon size={48} />
          </div>
          <h3 className={styles.emptyTitle}>Chưa theo dõi mục nào</h3>
          <p className={styles.emptyText}>Hãy quay lại trang chủ, chọn các đội bóng hoặc giải đấu yêu thích và bấm vào hình ngôi sao để theo dõi sát sao hơn.</p>
          <Link href="/" className={styles.homeBtn}>
            Về Trang Chủ
          </Link>
        </div>
      ) : (
        <>
          {/* Followed Tournaments */}
          {followedTourneysList.length > 0 && (
            <div className={styles.card}>
              <h2 className={styles.sectionTitle}>
                <TrophyIcon size={18} />
                <span>Giải Đấu Đang Theo Dõi ({followedTourneysList.length})</span>
              </h2>
              <div className={styles.list}>
                {followedTourneysList.map(t => (
                  <Link 
                    key={`fav-page-t-${t.id}`}
                    href={`/?tab=matches`}
                    onClick={() => {
                      localStorage.setItem('public_selected_tournament_id', t.id);
                      window.dispatchEvent(new Event('follow-update'));
                    }}
                    className={styles.item}
                  >
                    <div className={styles.logoWrapper}>
                      <TrophyIcon size={20} />
                    </div>
                    <div className={styles.info}>
                      <span className={styles.itemName}>{t.ten}</span>
                      <span className={styles.itemSub}>Mùa giải: {t.mua_giai}</span>
                    </div>
                    <button
                      className={styles.starBtn}
                      onClick={(e) => handleToggleFollowTournament(t.id, e)}
                      title="Bỏ theo dõi"
                    >
                      <StarIcon size={18} filled />
                    </button>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Followed Teams */}
          {followedTeamsList.length > 0 && (
            <div className={styles.card}>
              <h2 className={styles.sectionTitle}>
                <SoccerBallIcon size={18} />
                <span>Đội Bóng Đang Theo Dõi ({followedTeamsList.length})</span>
              </h2>
              <div className={styles.list}>
                {followedTeamsList.map(team => (
                  <Link 
                    key={`fav-page-team-${team.id}`}
                    href={`/doi-bong/${team.id}`}
                    className={styles.item}
                  >
                    <div className={styles.logoWrapper}>
                      {team.logo && (team.logo.startsWith('http') || team.logo.startsWith('/')) ? (
                        <img src={team.logo} alt={team.ten} className={styles.logoImg} />
                      ) : (
                        <SoccerBallIcon size={20} />
                      )}
                    </div>
                    <div className={styles.info}>
                      <span className={styles.itemName}>{team.ten}</span>
                      {team.vietTat && <span className={styles.itemSub}>Viết tắt: {team.vietTat}</span>}
                    </div>
                    <button
                      className={styles.starBtn}
                      onClick={(e) => handleToggleFollowTeam(team.id, e)}
                      title="Bỏ theo dõi"
                    >
                      <StarIcon size={18} filled />
                    </button>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
