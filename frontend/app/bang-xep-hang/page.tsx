import styles from './page.module.css';
import { layBangXepHang } from '@/lib/api';

export default async function BangXepHangPage() {
  let data: any[] = [];

  try {
    data = await layBangXepHang();
  } catch {
    // fallback data (16 teams)
    const groups = ['A', 'B', 'C', 'D'];
    data = [];
    groups.forEach(g => {
      for (let i = 1; i <= 4; i++) {
        data.push({
          bang: g,
          doi: { ten: `Đội ${i} Bảng ${g}`, logo: '⚽' },
          soTran: 3, thang: 4 - i, hoa: 0, thua: i - 1,
          banThang: 10 - i, banThua: 2 + i, hieuSo: 8 - 2 * i, diem: (4 - i) * 3
        });
      }
    });
  }

  // Group data by 'bang'
  const groupedData: Record<string, any[]> = data.reduce((acc, curr) => {
    const bang = curr.bang || 'A';
    if (!acc[bang]) acc[bang] = [];
    acc[bang].push(curr);
    return acc;
  }, {});

  const groups = Object.keys(groupedData).sort();

  return (
    <div className={styles.page}>
      <div className={`${styles.header} animate-fade-up`}>
        <h2 className={styles.title}>Bảng Xếp Hạng</h2>
        <p className={styles.subtitle}>Thiên Khôi Cúp Siêu Chốt — Vòng bảng 2024</p>
      </div>

      <div className={styles.groupGrid}>
        {groups.map((groupName, idx) => (
          <div key={groupName} className={`${styles.groupSection} animate-fade-up stagger-${(idx % 5) + 1}`}>
            <h3 className={styles.groupTitle}>Bảng {groupName}</h3>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.thCenter}>#</th>
                    <th>Đội</th>
                    <th className={styles.thCenter}>Trận</th>
                    <th className={styles.thCenter}>BT-BB</th>
                    <th className={styles.thCenter}>HS</th>
                    <th className={styles.thCenter}>Điểm</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedData[groupName]
                    .sort((a, b) => b.diem - a.diem || b.hieuSo - a.hieuSo)
                    .map((row: any, i: number) => (
                      <tr
                        key={i}
                        className={`${styles.row} ${i < 2 ? styles.rowQualified : styles.rowEliminated} ${i % 2 === 1 ? styles.rowZebra : ''}`}
                      >
                        <td className={styles.tdCenter}>
                          <span className={styles.rank}>{i + 1}</span>
                        </td>
                        <td>
                          <div className={styles.teamCell}>
                            <span className={styles.teamLogo}>{row.doi?.logo}</span>
                            <span className={styles.teamName}>{row.doi?.ten}</span>
                          </div>
                        </td>
                        <td className={styles.tdCenter}>{row.soTran}</td>
                        <td className={styles.tdCenter}>
                          {row.banThang}-{row.banThua}
                        </td>
                        <td className={styles.tdCenter}>
                          {(() => {
                            const hieuSo = row.banThang - row.banThua;
                            return (
                              <span className={hieuSo > 0 ? styles.positive : hieuSo < 0 ? styles.negative : ''}>
                                {hieuSo > 0 ? '+' : ''}{hieuSo}
                              </span>
                            );
                          })()}
                        </td>
                        <td className={styles.tdCenter}>
                          <span className={`${styles.points} ${i < 2 ? styles.pointsQualified : ''}`}>{row.diem}</span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
