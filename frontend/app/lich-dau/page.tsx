import styles from './page.module.css';
import { layDanhSachTranDau } from '@/lib/api';
import LiveMatchCard from '@/components/LiveMatchCard';

export default async function LichDauPage() {
  let data: any[] = [];

  try {
    data = await layDanhSachTranDau();
  } catch {
    data = [
      { id: 'tran-1', doiNha: { ten: 'TK Warriors', logo: '⚔️' }, doiKhach: { ten: 'Sale FC', logo: '🦅' }, tyDoiNha: 3, tyDoiKhach: 1, giaoDichDoiNha: 5, giaoDichDoiKhach: 2, trangThai: 'LIVE', phut: 72, vong: 'Vòng 5' },
      { id: 'tran-2', doiNha: { ten: 'Titans KD05', logo: '🛡️' }, doiKhach: { ten: 'Phoenix KD03', logo: '🔥' }, tyDoiNha: 1, tyDoiKhach: 2, giaoDichDoiNha: 3, giaoDichDoiKhach: 4, trangThai: 'LIVE', phut: 65, vong: 'Vòng 5' },
      { id: 'tran-3', doiNha: { ten: 'Eagles KD07', logo: '🦅' }, doiKhach: { ten: 'Sharks KD02', logo: '🦈' }, tyDoiNha: 0, tyDoiKhach: 0, giaoDichDoiNha: 0, giaoDichDoiKhach: 0, trangThai: 'SAP_DIEN_RA', phut: 0, vong: 'Vòng 5' },
      { id: 'tran-4', doiNha: { ten: 'Lions KD08', logo: '🦁' }, doiKhach: { ten: 'Storm KD01', logo: '⛈️' }, tyDoiNha: 0, tyDoiKhach: 0, giaoDichDoiNha: 0, giaoDichDoiKhach: 0, trangThai: 'SAP_DIEN_RA', phut: 0, vong: 'Vòng 5' },
      { id: 'tran-5', doiNha: { ten: 'TK Warriors', logo: '⚔️' }, doiKhach: { ten: 'Titans KD05', logo: '🛡️' }, tyDoiNha: 2, tyDoiKhach: 2, giaoDichDoiNha: 4, giaoDichDoiKhach: 3, trangThai: 'KET_THUC', phut: 90, vong: 'Vòng 4' },
      { id: 'tran-6', doiNha: { ten: 'Phoenix KD03', logo: '🔥' }, doiKhach: { ten: 'Sale FC', logo: '🦅' }, tyDoiNha: 3, tyDoiKhach: 1, giaoDichDoiNha: 6, giaoDichDoiKhach: 2, trangThai: 'KET_THUC', phut: 90, vong: 'Vòng 4' },
    ];
  }

  const live = data.filter((t: any) => t.trangThai === 'LIVE');
  const upcoming = data.filter((t: any) => t.trangThai === 'SAP_DIEN_RA');
  const finished = data.filter((t: any) => t.trangThai === 'KET_THUC');

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h2 className={styles.title}>Lịch thi đấu</h2>
        <p className={styles.subtitle}>Thiên Khôi Championship 2024</p>
      </div>

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

      {upcoming.length > 0 && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>📅 Sắp diễn ra</h3>
          <div className={styles.grid}>
            {upcoming.map((t: any) => <LiveMatchCard key={t.id} tran={t} />)}
          </div>
        </section>
      )}

      {finished.length > 0 && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>✅ Đã kết thúc</h3>
          <div className={styles.grid}>
            {finished.map((t: any) => <LiveMatchCard key={t.id} tran={t} />)}
          </div>
        </section>
      )}
    </div>
  );
}
