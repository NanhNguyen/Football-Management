import styles from './page.module.css';
import { layTopGhiBan } from '@/lib/api';

export default async function ThongKePage() {
  let topGhiBan: any[] = [];

  try {
    topGhiBan = await layTopGhiBan();
  } catch {
    topGhiBan = [
      { ten: 'Hồ Thiên Khôi', doi: { ten: 'TK Warriors' }, banThang: 10 },
      { ten: 'Bùi Thành H', doi: { ten: 'Phoenix KD03' }, banThang: 9 },
      { ten: 'Nguyễn Văn A', doi: { ten: 'TK Warriors' }, banThang: 8 },
      { ten: 'Phạm Đức D', doi: { ten: 'Sale FC' }, banThang: 7 },
      { ten: 'Vũ Thị F', doi: { ten: 'Titans KD05' }, banThang: 6 },
    ];
  }

  const summaryCards = [
    { icon: '👟', label: 'Vua phá lưới', value: topGhiBan[0]?.ten ?? 'N/A', sub: `${topGhiBan[0]?.banThang ?? 0} bàn thắng` },
    { icon: '🔥', label: 'Hàng công mạnh nhất', value: 'TK Warriors', sub: '14 bàn thắng / 5 trận' },
    { icon: '🛡️', label: 'Hàng thủ tốt nhất', value: 'Sale FC', sub: 'Chỉ lọt lưới 2 bàn' },
    { icon: '🎯', label: 'Tỷ lệ thắng cao nhất', value: '80%', sub: 'TK Warriors (4T/1H/0B)' },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h2 className={styles.title}>Thống kê</h2>
        <p className={styles.subtitle}>Thiên Khôi Cúp Siêu Chốt — Phân tích hiệu suất</p>
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

        {/* Top Đội Bóng */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>🏆 Đội bóng tiêu biểu</h3>
          <div className={styles.leaderboard}>
            {[
              { ten: 'TK Warriors', stat: 'Công mạnh nhất', value: '14 bàn' },
              { ten: 'Sale FC', stat: 'Thủ tốt nhất', value: '2 bàn' },
              { ten: 'Titans KD05', stat: 'Fair play', value: '0 thẻ đỏ' },
              { ten: 'Phoenix KD03', stat: 'Ngựa ô', value: 'Top 2' },
            ].map((doi: any, i: number) => (
              <div key={i} className={styles.leaderRow}>
                <span className={styles.leaderRank}>{i + 1}</span>
                <div className={styles.leaderInfo}>
                  <p className={styles.leaderName}>{doi.ten}</p>
                  <p className={styles.leaderTeam}>{doi.stat}</p>
                </div>
                <span className={styles.leaderStat}>{doi.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
