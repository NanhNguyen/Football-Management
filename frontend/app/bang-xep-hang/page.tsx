import styles from './page.module.css';
import { layBangXepHang } from '@/lib/api';

export default async function BangXepHangPage() {
  let data: any[] = [];

  try {
    data = await layBangXepHang();
  } catch {
    // fallback data
    data = [
      { hang: 1, doi: { ten: 'TK Warriors', logo: '⚔️', vietTat: 'TKW' }, soTran: 5, thang: 4, hoa: 1, thua: 0, banThang: 14, banThua: 5, hieuSo: 9, diem: 13, giaoDich: 45 },
      { hang: 2, doi: { ten: 'Phoenix KD03', logo: '🔥', vietTat: 'P03' }, soTran: 5, thang: 3, hoa: 1, thua: 1, banThang: 12, banThua: 7, hieuSo: 5, diem: 10, giaoDich: 38 },
      { hang: 3, doi: { ten: 'Titans KD05', logo: '🛡️', vietTat: 'T05' }, soTran: 5, thang: 3, hoa: 0, thua: 2, banThang: 10, banThua: 8, hieuSo: 2, diem: 9, giaoDich: 32 },
      { hang: 4, doi: { ten: 'Sale FC', logo: '🦅', vietTat: 'SFC' }, soTran: 5, thang: 2, hoa: 2, thua: 1, banThang: 9, banThua: 6, hieuSo: 3, diem: 8, giaoDich: 28 },
      { hang: 5, doi: { ten: 'Eagles KD07', logo: '🦅', vietTat: 'E07' }, soTran: 4, thang: 2, hoa: 1, thua: 1, banThang: 7, banThua: 5, hieuSo: 2, diem: 7, giaoDich: 22 },
      { hang: 6, doi: { ten: 'Lions KD08', logo: '🦁', vietTat: 'L08' }, soTran: 4, thang: 2, hoa: 0, thua: 2, banThang: 6, banThua: 8, hieuSo: -2, diem: 6, giaoDich: 18 },
      { hang: 7, doi: { ten: 'Sharks KD02', logo: '🦈', vietTat: 'S02' }, soTran: 4, thang: 1, hoa: 1, thua: 2, banThang: 5, banThua: 7, hieuSo: -2, diem: 4, giaoDich: 15 },
      { hang: 8, doi: { ten: 'Storm KD01', logo: '⛈️', vietTat: 'ST1' }, soTran: 4, thang: 0, hoa: 0, thua: 4, banThang: 2, banThua: 12, hieuSo: -10, diem: 0, giaoDich: 8 },
    ];
  }

  const badges = ['🥇', '🥈', '🥉'];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h2 className={styles.title}>Bảng Xếp Hạng</h2>
        <p className={styles.subtitle}>Thiên Khôi Championship 2024 — Vòng bảng</p>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.thCenter}>#</th>
              <th>Đội</th>
              <th className={styles.thCenter}>Trận</th>
              <th className={styles.thCenter}>Thắng</th>
              <th className={styles.thCenter}>Hòa</th>
              <th className={styles.thCenter}>Thua</th>
              <th className={styles.thCenter}>BT</th>
              <th className={styles.thCenter}>BB</th>
              <th className={styles.thCenter}>HS</th>
              <th className={styles.thCenter}>Điểm</th>
              <th className={styles.thCenter}>Giao dịch</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row: any, i: number) => (
              <tr
                key={row.hang}
                className={`${styles.row} ${i < 3 ? styles.rowTop3 : ''} ${i % 2 === 1 ? styles.rowZebra : ''}`}
              >
                <td className={styles.tdCenter}>
                  {i < 3 ? (
                    <span className={styles.badge}>{badges[i]}</span>
                  ) : (
                    <span className={styles.rank}>{row.hang}</span>
                  )}
                </td>
                <td>
                  <div className={styles.teamCell}>
                    <span className={styles.teamLogo}>{row.doi?.logo}</span>
                    <span className={styles.teamName}>{row.doi?.ten}</span>
                  </div>
                </td>
                <td className={styles.tdCenter}>{row.soTran}</td>
                <td className={`${styles.tdCenter} ${styles.win}`}>{row.thang}</td>
                <td className={styles.tdCenter}>{row.hoa}</td>
                <td className={`${styles.tdCenter} ${styles.loss}`}>{row.thua}</td>
                <td className={styles.tdCenter}>{row.banThang}</td>
                <td className={styles.tdCenter}>{row.banThua}</td>
                <td className={styles.tdCenter}>
                  <span className={row.hieuSo > 0 ? styles.positive : row.hieuSo < 0 ? styles.negative : ''}>
                    {row.hieuSo > 0 ? '+' : ''}{row.hieuSo}
                  </span>
                </td>
                <td className={styles.tdCenter}>
                  <span className={styles.points}>{row.diem}</span>
                </td>
                <td className={styles.tdCenter}>
                  <span className={styles.deals}>{row.giaoDich}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
