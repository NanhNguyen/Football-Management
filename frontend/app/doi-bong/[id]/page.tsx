'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import styles from './page.module.css';
import MatchListFeed from '@/components/MatchListFeed';
import PublicLayoutWrapper from '@/components/PublicLayoutWrapper';

export default function TeamDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTeam() {
      try {
        const res = await fetch(`http://localhost:3001/public/teams/${params.id}`);
        if (!res.ok) throw new Error('Không thể tải dữ liệu đội bóng');
        const json = await res.json();
        if (json.error) throw new Error(json.error);
        setData(json);
      } catch (err: any) {
        setError(err.message || 'Có lỗi xảy ra');
      } finally {
        setLoading(false);
      }
    }
    if (params.id) {
      fetchTeam();
    }
  }, [params.id]);

  if (loading) {
    return (
      <PublicLayoutWrapper>
        <div className={styles.container}>
          <div className={styles.loadingWrapper}>Đang tải dữ liệu đội bóng...</div>
        </div>
      </PublicLayoutWrapper>
    );
  }

  if (error || !data || !data.doi) {
    return (
      <PublicLayoutWrapper>
        <div className={styles.container}>
          <div className={styles.errorWrapper}>{error || 'Không tìm thấy đội bóng'}</div>
        </div>
      </PublicLayoutWrapper>
    );
  }

  const { doi, thongKe, phongDo, cauThu, tranDauSapToi, lichSuTranDau } = data;

  const renderOverview = () => (
    <div className={styles.contentArea}>
      {/* Form Guide */}
      <h3 className={styles.sectionTitle}>Phong độ</h3>
      <div className={styles.card}>
        <div className={styles.formWrapper}>
          {phongDo && phongDo.length > 0 ? (
            phongDo.map((f: string, i: number) => (
              <div
                key={i}
                className={`${styles.formBadge} ${f === 'W' ? styles.formW : f === 'D' ? styles.formD : styles.formL}`}
              >
                {f}
              </div>
            ))
          ) : (
            <div className={styles.emptyState}>Chưa có dữ liệu phong độ</div>
          )}
        </div>
      </div>

      {/* Next Match */}
      {tranDauSapToi && (
        <>
          <h3 className={styles.sectionTitle}>Trận tiếp theo</h3>
          <div className={styles.card}>
            <div className={styles.nextMatchInfo}>
              <div className={styles.nextMatchTeam}>
                <span className={styles.teamLogoSm}>{tranDauSapToi.doiNha?.logo || '🛡️'}</span>
                <span className={styles.teamNameSm}>{tranDauSapToi.doiNha?.ten || 'Home'}</span>
              </div>
              <div className={styles.matchCenter}>
                <div className={styles.vsText}>VS</div>
                <div className={styles.matchDate}>
                  {tranDauSapToi.ngay} {tranDauSapToi.gio}
                </div>
              </div>
              <div className={styles.nextMatchTeam}>
                <span className={styles.teamLogoSm}>{tranDauSapToi.doiKhach?.logo || '🛡️'}</span>
                <span className={styles.teamNameSm}>{tranDauSapToi.doiKhach?.ten || 'Away'}</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Key Stats */}
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
      return <div className={styles.emptyState}>Chưa có trận đấu nào</div>;
    }
    const matchDataFormat = {
      tranKetThuc: lichSuTranDau
    };
    return (
      <div style={{ padding: '0 20px' }}>
        <MatchListFeed 
          data={matchDataFormat} 
          onMatchClick={(match) => router.push(`/tran-dau/${match.id}`)} 
        />
      </div>
    );
  };

  const renderSquad = () => {
    if (!cauThu || cauThu.length === 0) {
      return <div className={styles.emptyState}>Chưa có thông tin đội hình</div>;
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
            <div className={styles.card} style={{ padding: 0 }}>
              {grouped[pos].map((ct: any) => (
                <div key={ct.id} className={styles.playerItem}>
                  <div style={{ padding: '0 16px' }} className={styles.playerNumber}>{ct.soAo || '-'}</div>
                  <div className={styles.playerName}>{ct.ten}</div>
                  <div style={{ padding: '0 16px' }} className={styles.playerStat}>⚽ {ct.banThang || 0}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <PublicLayoutWrapper>
      <div className={styles.container}>
        {/* Header Section */}
        <div className={styles.headerSection}>
          <div className={styles.logoWrapper}>
            {doi.logo || '🛡️'}
          </div>
          <h1 className={styles.teamName}>{doi.ten}</h1>
          <div className={styles.teamSubtitle}>
            Bảng {doi.bang || '-'}
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
    </PublicLayoutWrapper>
  );
}
