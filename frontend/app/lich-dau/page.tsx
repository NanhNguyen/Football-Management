import styles from './page.module.css';
import { layDanhSachTranDau } from '@/lib/api';
import LiveMatchCard from '@/components/LiveMatchCard';

export default async function LichDauPage() {
  let data: any[] = [];

  try {
    data = await layDanhSachTranDau();
  } catch {
    // Fallback schedule
    data = [
      { id: 't1', doiNha: { ten: 'TK Warriors', logo: '⚔️' }, doiKhach: { ten: 'Storm KD01', logo: '⛈️' }, tyDoiNha: 3, tyDoiKhach: 1, trangThai: 'KET_THUC', phut: 90, vong: 'Vòng bảng - Bảng A' },
      { id: 't2', doiNha: { ten: 'Lions KD08', logo: '🦁' }, doiKhach: { ten: 'Sharks KD02', logo: '🦈' }, tyDoiNha: 0, tyDoiKhach: 0, trangThai: 'KET_THUC', phut: 90, vong: 'Vòng bảng - Bảng A' },
      { id: 't3', doiNha: { ten: 'Titans KD05', logo: '🛡️' }, doiKhach: { ten: 'Phoenix KD03', logo: '🔥' }, tyDoiNha: 1, tyDoiKhach: 2, trangThai: 'DANG_DIEN_RA', phut: 65, vong: 'Vòng bảng - Bảng B' },
      { id: 't4', doiNha: { ten: 'Sale FC', logo: '🦅' }, doiKhach: { ten: 'Eagles KD07', logo: '🦅' }, tyDoiNha: 0, tyDoiKhach: 0, trangThai: 'SAP_DIEN_RA', phut: 0, vong: 'Vòng bảng - Bảng C' },
      { id: 't5', doiNha: { ten: 'Dragons KD09', logo: '🐲' }, doiKhach: { ten: 'Wolves KD10', logo: '🐺' }, tyDoiNha: 0, tyDoiKhach: 0, trangThai: 'SAP_DIEN_RA', phut: 0, vong: 'Vòng bảng - Bảng B' },
    ];
  }

  const live = data.filter((t: any) => t.trangThai === 'DANG_DIEN_RA');
  const upcoming = data.filter((t: any) => t.trangThai === 'SAP_DIEN_RA');
  const finished = data.filter((t: any) => t.trangThai === 'KET_THUC');

  // Grouping helper
  const groupByRound = (matches: any[]) => {
    return matches.reduce((acc, match) => {
      const round = match.vong || 'Khác';
      if (!acc[round]) acc[round] = [];
      acc[round].push(match);
      return acc;
    }, {} as Record<string, any[]>);
  };

  const finishedGrouped = groupByRound(finished);
  const upcomingGrouped = groupByRound(upcoming);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h2 className={styles.title}>Lịch thi đấu & Kết quả</h2>
        <p className={styles.subtitle}>Thiên Khôi Cúp Siêu Chốt 2024</p>
      </div>

      {/* LIVE SECTION */}
      {live.length > 0 && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>
            <span className={styles.liveDot} />
            Đang diễn ra
          </h3>
          <div className={styles.grid}>
            {live.map((t: any) => <LiveMatchCard key={t.id} tran={t} />)}
          </div>
        </section>
      )}

      {/* UPCOMING BY ROUND */}
      {Object.keys(upcomingGrouped).length > 0 && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>📅 Trận đấu sắp tới</h3>
          {Object.entries(upcomingGrouped).map(([round, matches]) => (
            <div key={round} style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '14px', color: 'var(--color-primary)', marginBottom: '12px', textTransform: 'uppercase' }}>{round}</h4>
              <div className={styles.grid}>
                {(matches as any[]).map((t: any) => <LiveMatchCard key={t.id} tran={t} />)}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* FINISHED BY ROUND */}
      {Object.keys(finishedGrouped).length > 0 && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>✅ Kết quả trận đấu</h3>
          {Object.entries(finishedGrouped).map(([round, matches]) => (
            <div key={round} style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginBottom: '12px', textTransform: 'uppercase' }}>{round}</h4>
              <div className={styles.grid}>
                {(matches as any[]).map((t: any) => <LiveMatchCard key={t.id} tran={t} />)}
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
