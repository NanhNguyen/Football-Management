import styles from './page.module.css';
import { layTongQuan } from '@/lib/api';
import LiveMatchCard from '@/components/LiveMatchCard';
import Link from 'next/link';

export default async function TongQuanPage() {
  let data: any;

  try {
    data = await layTongQuan();
  } catch {
    data = null;
  }

  const stats = [
    { label: 'Tổng số đội', value: data?.tongSoDoi ?? 16, icon: '🏆' },
    { label: 'Tổng số trận', value: data?.tongSoTran ?? 48, icon: '⚽' },
    { label: 'Trận đang LIVE', value: data?.tranDangLive ?? 1, icon: '🔴', isLive: true },
    { label: 'Đội dẫn đầu', value: data?.doiDanDau ?? 'TK Warriors', icon: '👑' },
    { label: 'Tổng bàn thắng', value: data?.tongBanThang ?? 84, icon: '🎯' },
  ];

  return (
    <div className={styles.page}>
      {/* HERO — Tournament Command Center */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroHeader}>
            <h2 className={styles.heroTitle}>Tournament Command Center</h2>
            <p className={styles.heroSubtitle}>Thiên Khôi Cúp Siêu Chốt — Vòng bảng 2024</p>
          </div>
          <div className={styles.statsGrid}>
            {stats.map((s, i) => (
              <div key={i} className={`${styles.statCard} ${s.isLive ? styles.statCardLive : ''}`}>
                <span className={styles.statIcon}>{s.icon}</span>
                <div>
                  <p className={styles.statValue}>{s.value}</p>
                  <p className={styles.statLabel}>{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LIVE MATCH CENTER */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>
            <span className={styles.liveDot} />
            Trận đấu đang diễn ra
          </h3>
          <Link href="/lich-dau" className={styles.viewAll}>
            Xem tất cả →
          </Link>
        </div>
        <div className={styles.matchGrid}>
          {(data?.tranLive ?? []).length > 0 ? (
            data.tranLive.map((tran: any) => (
              <LiveMatchCard key={tran.id} tran={tran} />
            ))
          ) : (
            <>
              <LiveMatchCard tran={{
                id: 'tran-1', doiNha: { ten: 'TK Warriors', logo: '⚔️', vietTat: 'TKW' },
                doiKhach: { ten: 'Sale FC', logo: '🦅', vietTat: 'SFC' },
                tyDoiNha: 3, tyDoiKhach: 1,
                trangThai: 'DANG_DIEN_RA', phut: 72, vong: 'Tứ kết'
              }} />
              <LiveMatchCard tran={{
                id: 'tran-2', doiNha: { ten: 'Titans KD05', logo: '🛡️', vietTat: 'T05' },
                doiKhach: { ten: 'Phoenix KD03', logo: '🔥', vietTat: 'P03' },
                tyDoiNha: 1, tyDoiKhach: 2,
                trangThai: 'DANG_DIEN_RA', phut: 65, vong: 'Tứ kết'
              }} />
            </>
          )}
        </div>
      </section>

      {/* TOP 3 — Mini Standings */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>🏅 BXH nhanh — Top 3</h3>
          <Link href="/bang-xep-hang" className={styles.viewAll}>
            Xem đầy đủ →
          </Link>
        </div>
        <div className={styles.top3Grid}>
          {(data?.top3Doi ?? [
            { hang: 1, doi: { ten: 'TK Warriors', logo: '⚔️' }, diem: 13, banThang: 14 },
            { hang: 2, doi: { ten: 'Phoenix KD03', logo: '🔥' }, diem: 10, banThang: 12 },
            { hang: 3, doi: { ten: 'Titans KD05', logo: '🛡️' }, diem: 9, banThang: 10 },
          ]).map((item: any, i: number) => {
            const badges = ['🥇', '🥈', '🥉'];
            return (
              <div key={i} className={`${styles.top3Card} ${i === 0 ? styles.top3First : ''}`}>
                <span className={styles.top3Badge}>{badges[i]}</span>
                <span className={styles.top3Logo}>{item.doi?.logo}</span>
                <div className={styles.top3Info}>
                  <p className={styles.top3Name}>{item.doi?.ten}</p>
                  <p className={styles.top3Stats}>{item.diem} điểm · {item.banThang} bàn thắng</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
