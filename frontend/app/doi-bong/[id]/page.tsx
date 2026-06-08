'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';
import MatchListFeed from '@/components/MatchListFeed';
import { usePublicTournament } from '@/components/PublicTournamentContext';
import { layDanhSachDoi, layDanhSachTranDau, layBangXepHang } from '@/lib/api';

import GlobalSkeletonLoader from '@/components/GlobalSkeletonLoader';
import TeamLogo from '@/components/TeamLogo';
import { 
  ArrowLeftIcon, 
  StarIcon, 
  SoccerBallIcon, 
  ShieldIcon, 
  HelpIcon 
} from '@/components/AppIcons';

export default function TeamDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { favoriteTeams, toggleFollowTeam } = usePublicTournament();
  const isFollowed = params.id ? favoriteTeams.includes(params.id as string) : false;

  const handleFollowToggle = () => {
    if (params.id) {
      toggleFollowTeam(params.id as string);
    }
  };

  useEffect(() => {
    async function fetchTeam() {
      try {
        if (!params.id) return;
        
        // 1. Fetch all teams to extract basic details and players
        const allTeams = await layDanhSachDoi();
        const doi = allTeams.find((t: any) => t.id === params.id);
        if (!doi) throw new Error('Không tìm thấy đội bóng trong hệ thống giải đấu');

        // 2. Fetch standings to get statistics & form (phongDo)
        const standings = await layBangXepHang();
        const teamStandings = standings.find((s: any) => s.id === params.id);
        
        const thongKe = teamStandings ? {
          soTran: teamStandings.soTran || 0,
          banThang: teamStandings.banThang || 0,
          diem: teamStandings.diem || 0
        } : { soTran: 0, banThang: 0, diem: 0 };

        // Convert T, H, B (Thắng, Hòa, Bại) from backend to W, D, L for consistency in UI display
        const rawPhongDo = teamStandings?.phongDo || [];
        const phongDo = rawPhongDo.map((p: string) => {
          if (p === 'T') return 'W';
          if (p === 'H') return 'D';
          return 'L';
        });

        // 3. Fetch matches list to get upcoming and past matches
        const allMatches = await layDanhSachTranDau();
        const myMatches = allMatches.filter((m: any) => 
          m.doiNha?.id === params.id || m.doiKhach?.id === params.id
        );

        // Filter past matches (KET_THUC) sorted by date descending
        const lichSuTranDau = myMatches
          .filter((m: any) => m.trangThai === 'KET_THUC')
          .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

        // Extract upcoming match (SAP_DIEN_RA or DANG_DIEN_RA) sorted by date ascending (nearest first)
        const tranDauSapToi = myMatches
          .filter((m: any) => m.trangThai === 'SAP_DIEN_RA' || m.trangThai === 'DANG_DIEN_RA')
          .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())[0] || null;

        setData({
          doi,
          thongKe,
          phongDo,
          cauThu: doi.cauThu || [],
          tranDauSapToi,
          lichSuTranDau
        });
      } catch (err: any) {
        setError(err.message || 'Có lỗi xảy ra khi tải thông tin đội bóng');
      } finally {
        setLoading(false);
      }
    }
    if (params.id) {
      fetchTeam();
    }
  }, [params.id]);

  if (loading) {
    return <GlobalSkeletonLoader />;
  }

  if (error || !data || !data.doi) {
    return (
      <div className={styles.container} style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div className={styles.errorCard}>
          <div className={styles.errorIcon} style={{ display: 'flex', justifyContent: 'center' }}>
            <HelpIcon size={48} color="var(--color-danger)" />
          </div>
          <h2 className={styles.errorTitle}>Đã xảy ra lỗi</h2>
          <p className={styles.errorMsg}>{error || 'Không tìm thấy đội bóng trong hệ thống giải đấu'}</p>
          <button className={styles.errorBtn} onClick={() => router.push('/')}>
            Quay lại Trang chủ
          </button>
        </div>
      </div>
    );
  }

  const { doi, thongKe, phongDo, cauThu, tranDauSapToi, lichSuTranDau } = data;

  const renderOverview = () => (
    <div className={styles.contentArea}>
      {/* Phong độ */}
      <h3 className={styles.sectionTitle}>Phong độ</h3>
      <div className={styles.card}>
        <div className={styles.formWrapper}>
          {phongDo && phongDo.length > 0 ? (
            phongDo.map((f: string, i: number) => (
              <div
                key={i}
                className={`${styles.formBadge} ${f === 'W' ? styles.formW : f === 'D' ? styles.formD : styles.formL}`}
                title={`Trận ${i + 1}`}
              >
                {f}
              </div>
            ))
          ) : (
            <div className={styles.emptyState}>Chưa có dữ liệu phong độ</div>
          )}
        </div>
      </div>

      {/* Trận tiếp theo */}
      {tranDauSapToi && (
        <>
          <h3 className={styles.sectionTitle}>Trận tiếp theo</h3>
          <div className={styles.card}>
            <div className={styles.nextMatchTeams}>
              <div className={styles.nextMatchTeam}>
                <span className={styles.teamLogoSm} style={{ display: 'flex' }}>
                  <TeamLogo logo={tranDauSapToi.doiNha?.logo} fallback={<ShieldIcon size={16} />} />
                </span>
                <span className={styles.teamNameSm}>{tranDauSapToi.doiNha?.ten || 'Home'}</span>
              </div>
              <div className={styles.matchCenter}>
                <div className={styles.vsText}>VS</div>
                <div className={styles.matchDate}>
                  {tranDauSapToi.date} {tranDauSapToi.time}
                </div>
              </div>
              <div className={styles.nextMatchTeam}>
                <span className={styles.teamLogoSm} style={{ display: 'flex' }}>
                  <TeamLogo logo={tranDauSapToi.doiKhach?.logo} fallback={<ShieldIcon size={16} />} />
                </span>
                <span className={styles.teamNameSm}>{tranDauSapToi.doiKhach?.ten || 'Away'}</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Thống kê chính */}
      {thongKe && (
        <>
          <h3 className={styles.sectionTitle}>Thống kê chính</h3>
          <div className={styles.card}>
            <div className={styles.statsGrid}>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Số trận</span>
                <span className={styles.statValue}>{thongKe.soTran || 0}</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Bàn thắng</span>
                <span className={styles.statValue}>{thongKe.banThang || 0}</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Điểm</span>
                <span className={styles.statValue}>{thongKe.diem || 0}</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );

  const renderMatches = () => {
    if (!lichSuTranDau || lichSuTranDau.length === 0) {
      return (
        <div className={styles.contentArea}>
          <div className={styles.emptyState}>Chưa có trận đấu nào</div>
        </div>
      );
    }
    const matchDataFormat = {
      tranKetThuc: lichSuTranDau
    };
    return (
      <div className={styles.contentArea}>
        <MatchListFeed 
          data={matchDataFormat} 
          onMatchClick={(match) => router.push(`/tran-dau/${match.id}`)} 
        />
      </div>
    );
  };

  const renderSquad = () => {
    if (!cauThu || cauThu.length === 0) {
      return (
        <div className={styles.contentArea}>
          <div className={styles.emptyState}>Chưa có thông tin đội hình</div>
        </div>
      );
    }
    
    // Group by position
    const grouped = cauThu.reduce((acc: any, ct: any) => {
      const pos = ct.viTri || 'Khác';
      if (!acc[pos]) acc[pos] = [];
      acc[pos].push(ct);
      return acc;
    }, {});

    return (
      <div className={styles.contentArea}>
        {Object.keys(grouped).map((pos) => (
          <div key={pos} className={styles.squadGroup}>
            <h4 className={styles.squadGroupTitle}>{pos}</h4>
            <div className={styles.playersGrid}>
              {grouped[pos].map((ct: any) => (
                <div key={ct.id} className={styles.playerCard}>
                  <div className={styles.playerNumberBadge}>{ct.soAo || '-'}</div>
                  <div className={styles.playerInfo}>
                    <div className={playerNameClass(ct.ten)}>{ct.ten}</div>
                    <div className={styles.playerStat} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <SoccerBallIcon size={12} />
                      <span>{ct.banThang || 0} Bàn thắng</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const playerNameClass = (name: string) => {
    return styles.playerName;
  };

  return (
    <div className={styles.container}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', padding: 0, fontWeight: 600, color: '#334155' }}>
          <ArrowLeftIcon size={16} /> Quay lại
        </button>
        <Link href="/" style={{ color: '#64748b', textDecoration: 'none', fontSize: '14px' }}>
          Về Trang chủ
        </Link>
      </div>

      {/* Header Section */}
      <div className={styles.headerSection}>
        <div className={styles.logoWrapper}>
          <TeamLogo logo={data.doi.logo} fallback={<ShieldIcon size={40} />} />
        </div>
        <div className={styles.headerInfo}>
          <div className={styles.teamNameRow}>
            <h1 className={styles.teamName}>{doi.ten}</h1>
            <button 
              className={`${styles.followBtn} ${isFollowed ? styles.followBtnActive : ''}`} 
              onClick={handleFollowToggle}
              title={isFollowed ? "Bỏ theo dõi" : "Theo dõi đội bóng"}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <StarIcon size={18} filled={isFollowed} />
            </button>
          </div>
          <div className={styles.teamSubtitle}>
            Bảng {doi.bang || '-'}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className={styles.tabsWrapper}>
        <div className={styles.tabsList}>
          <button 
            className={`${styles.tabBtn} ${activeTab === 'overview' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Tổng quan
          </button>
          <button 
            className={`${styles.tabBtn} ${activeTab === 'matches' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('matches')}
          >
            Lịch thi đấu
          </button>
          <button 
            className={`${styles.tabBtn} ${activeTab === 'squad' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('squad')}
          >
            Đội hình
          </button>
        </div>
      </div>

      {/* Tab Content Area */}
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'matches' && renderMatches()}
      {activeTab === 'squad' && renderSquad()}
    </div>
  );
}
