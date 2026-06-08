'use client';

import { useState, useEffect } from 'react';
import GlobalSkeletonLoader from '@/components/GlobalSkeletonLoader';
import styles from '@/app/thong-ke/page.module.css';
import { layTopGhiBan, layTopKienTao, layTopGangTayVang, layTopThePhat } from '@/lib/api';
import { usePublicTournament } from '@/components/PublicTournamentContext';

export default function StatsTab() {
  const { selectedTournamentId } = usePublicTournament();
  const [topGhiBan, setTopGhiBan] = useState<any[]>([]);
  const [topKienTao, setTopKienTao] = useState<any[]>([]);
  const [topGangTay, setTopGangTay] = useState<any[]>([]);
  const [topThePhat, setTopThePhat] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const id = selectedTournamentId || undefined;
        const [gb, kt, gt, tp] = await Promise.all([
          layTopGhiBan(id),
          layTopKienTao(id),
          layTopGangTayVang(id),
          layTopThePhat(id)
        ]);
        setTopGhiBan(gb);
        setTopKienTao(kt);
        setTopGangTay(gt);
        setTopThePhat(tp);
      } catch (error) {
        console.error('Error fetching statistics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [selectedTournamentId]);

  if (loading) {
    return <GlobalSkeletonLoader />;
  }

  // Best entities for top cards
  const bestScorer = topGhiBan[0];
  const bestAssister = topKienTao[0];
  const bestGK = topGangTay[0];
  const worstDiscipline = topThePhat[0];

  const summaryCards = [
    {
      label: 'Vua Phá Lưới',
      value: bestScorer?.ten ?? 'Chưa có',
      sub: `${bestScorer?.ban_thang ?? 0} bàn thắng`,
      icon: '⚽',
      highlight: false
    },
    {
      label: 'Vua Kiến Tạo',
      value: bestAssister?.ten ?? 'Chưa có',
      sub: `${bestAssister?.kienTao ?? 0} kiến tạo`,
      icon: '🎯',
      highlight: true
    },
    {
      label: 'Găng Tay Vàng',
      value: bestGK?.ten ?? 'Chưa có',
      sub: `${bestGK?.sachLuoi ?? 0} trận sạch lưới`,
      icon: '🧤',
      highlight: false
    },
    {
      label: 'Vua Thẻ Phạt',
      value: worstDiscipline?.ten ?? 'Chưa có',
      sub: worstDiscipline ? `${worstDiscipline.theVang} 🟨 - ${worstDiscipline.theDo} 🟥` : '0 🟨 - 0 🟥',
      icon: '🟨',
      highlight: false
    },
  ];

  return (
    <div className={styles.page}>
      <div className={`${styles.header} animate-fade-up`}>

        <h2 className={styles.title}>Thống kê giải đấu</h2>
        <p className={styles.subtitle}>Vinh danh những cá nhân xuất sắc nhất trên sân cỏ</p>
      </div>

      {/* Summary Cards */}
      <div className={styles.summaryGrid}>
        {summaryCards.map((s, i) => (
          <div 
            key={i} 
            className={`${styles.summaryCard} ${s.highlight ? styles.summaryCardHighlight : ''} animate-fade-up`} 
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            <div className={styles.summaryIcon}>{s.icon}</div>
            <div className={styles.summaryContent}>
              <p className={styles.summaryLabel}>{s.label}</p>
              <p className={styles.summaryValue} title={s.value}>{s.value}</p>
              <p className={styles.summarySub}>{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.twoCol}>
        {/* Top Cầu Thủ - Chiếc Giày Vàng */}
        <div className={`${styles.card} animate-fade-up`} style={{ animationDelay: '0.4s' }}>
          <div className={styles.cardHeader}>
            <span className={styles.cardIcon}>⚽</span>
            <h3 className={styles.cardTitle}>Chiếc giày vàng</h3>
          </div>
          <div className={styles.leaderboard}>
            {topGhiBan.length === 0 ? (
              <div className={styles.noData}>Chưa có dữ liệu bàn thắng</div>
            ) : (
              topGhiBan.slice(0, 5).map((ct: any, i: number) => (
                <div key={i} className={`${styles.leaderRow} ${i === 0 ? styles.leaderRowTop : ''}`}>
                  <span className={styles.leaderRank}>{i + 1}</span>
                  <div className={styles.leaderAvatar}>🏃</div>
                  <div className={styles.leaderInfo}>
                    <p className={styles.leaderName}>{ct.ten}</p>
                    <p className={styles.leaderTeam}>{ct.doi?.ten || 'Tự do'}</p>
                  </div>
                  <div className={styles.leaderStat}>
                    {ct.ban_thang} <span className={styles.statIcon}>⚽</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Playmakers - Vua Kiến Tạo */}
        <div className={`${styles.card} animate-fade-up`} style={{ animationDelay: '0.5s' }}>
          <div className={styles.cardHeader}>
            <span className={styles.cardIcon}>🎯</span>
            <h3 className={styles.cardTitle}>Vua kiến tạo</h3>
          </div>
          <div className={styles.leaderboard}>
            {topKienTao.length === 0 ? (
              <div className={styles.noData}>Chưa có dữ liệu kiến tạo</div>
            ) : (
              topKienTao.slice(0, 5).map((nv: any, i: number) => (
                <div key={i} className={`${styles.leaderRow} ${i === 0 ? styles.leaderRowTop : ''}`}>
                  <span className={styles.leaderRank}>{i + 1}</span>
                  <div className={styles.leaderAvatar}>🎯</div>
                  <div className={styles.leaderInfo}>
                    <p className={styles.leaderName}>{nv.ten}</p>
                    <p className={styles.leaderTeam}>{nv.doi?.ten || 'Tự do'}</p>
                  </div>
                  <div className={styles.leaderStat}>
                    {nv.kienTao} <span className={styles.statIcon}>🎯</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
