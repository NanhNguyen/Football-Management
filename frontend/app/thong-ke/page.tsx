import styles from './page.module.css';
import { layTopGhiBan, layTopGiaoDich } from '@/lib/api';

export default async function ThongKePage() {
  let topGhiBan: any[] = [];
  let topGiaoDich: any[] = [];

  try {
    topGhiBan = await layTopGhiBan();
    topGiaoDich = await layTopGiaoDich();
  } catch {
    topGhiBan = [
      { ten: 'Hồ Thiên Khôi', doi: { ten: 'TK Warriors' }, banThang: 10, giaoDich: 15 },
      { ten: 'Bùi Thành H', doi: { ten: 'Phoenix KD03' }, banThang: 9, giaoDich: 14 },
      { ten: 'Nguyễn Văn A', doi: { ten: 'TK Warriors' }, banThang: 8, giaoDich: 12 },
      { ten: 'Phạm Đức D', doi: { ten: 'Sale FC' }, banThang: 7, giaoDich: 10 },
      { ten: 'Vũ Thị F', doi: { ten: 'Titans KD05' }, banThang: 6, giaoDich: 11 },
    ];
    topGiaoDich = [
      { ten: 'Hồ Thiên Khôi', doi: { ten: 'TK Warriors' }, giaoDich: 15, banThang: 10 },
      { ten: 'Bùi Thành H', doi: { ten: 'Phoenix KD03' }, giaoDich: 14, banThang: 9 },
      { ten: 'Nguyễn Văn A', doi: { ten: 'TK Warriors' }, giaoDich: 12, banThang: 8 },
      { ten: 'Vũ Thị F', doi: { ten: 'Titans KD05' }, giaoDich: 11, banThang: 6 },
      { ten: 'Phạm Đức D', doi: { ten: 'Sale FC' }, giaoDich: 10, banThang: 7 },
    ];
  }

  const summaryCards = [
    { icon: '🏠', label: 'Top chốt nhà cá nhân', value: topGiaoDich[0]?.ten ?? 'N/A', sub: `${topGiaoDich[0]?.giaoDich ?? 0} giao dịch` },
    { icon: '⚡', label: 'Đội hiệu quả nhất', value: 'TK Warriors', sub: '45 giao dịch · 14 bàn' },
    { icon: '📊', label: 'Tổng giao dịch tuần', value: '187', sub: '+23% so với tuần trước' },
    { icon: '🎯', label: 'Tỷ lệ thắng cao nhất', value: '80%', sub: 'TK Warriors (4T/1H/0B)' },
  ];

  // Simple bar chart data
  const weeklyDeals = [
    { day: 'T2', value: 22 },
    { day: 'T3', value: 31 },
    { day: 'T4', value: 18 },
    { day: 'T5', value: 45 },
    { day: 'T6', value: 38 },
    { day: 'T7', value: 28 },
    { day: 'CN', value: 5 },
  ];
  const maxDeal = Math.max(...weeklyDeals.map((d) => d.value));

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h2 className={styles.title}>Thống kê</h2>
        <p className={styles.subtitle}>Thiên Khôi Championship 2024 — Phân tích hiệu suất</p>
      </div>

      {/* Summary Cards */}
      <div className={styles.summaryGrid}>
        {summaryCards.map((s, i) => (
          <div key={i} className={styles.summaryCard}>
            <span className={styles.summaryIcon}>{s.icon}</span>
            <div>
              <p className={styles.summaryLabel}>{s.label}</p>
              <p className={styles.summaryValue}>{s.value}</p>
              <p className={styles.summarySub}>{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.twoCol}>
        {/* Top Ghi Bàn */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>⚽ Top ghi bàn</h3>
          <div className={styles.leaderboard}>
            {topGhiBan.map((ct: any, i: number) => (
              <div key={i} className={styles.leaderRow}>
                <span className={styles.leaderRank}>{i + 1}</span>
                <div className={styles.leaderInfo}>
                  <p className={styles.leaderName}>{ct.ten}</p>
                  <p className={styles.leaderTeam}>{ct.doi?.ten}</p>
                </div>
                <span className={styles.leaderStat}>{ct.banThang} bàn</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Giao Dịch */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>💰 Top giao dịch</h3>
          <div className={styles.leaderboard}>
            {topGiaoDich.map((ct: any, i: number) => (
              <div key={i} className={`${styles.leaderRow} ${i === 0 ? styles.leaderRowTop : ''}`}>
                <span className={styles.leaderRank}>{i + 1}</span>
                <div className={styles.leaderInfo}>
                  <p className={styles.leaderName}>{ct.ten}</p>
                  <p className={styles.leaderTeam}>{ct.doi?.ten}</p>
                </div>
                <span className={styles.leaderStatDeal}>{ct.giaoDich} GD</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Weekly Chart */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>📊 Giao dịch theo ngày trong tuần</h3>
        <div className={styles.barChart}>
          {weeklyDeals.map((d, i) => (
            <div key={i} className={styles.barCol}>
              <div className={styles.barWrapper}>
                <div
                  className={styles.bar}
                  style={{ height: `${(d.value / maxDeal) * 100}%` }}
                >
                  <span className={styles.barValue}>{d.value}</span>
                </div>
              </div>
              <span className={styles.barLabel}>{d.day}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
