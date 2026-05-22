'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';
import { layBangXepHang } from '@/lib/api';
import { usePublicTournament } from '@/components/PublicTournamentContext';

export default function BangXepHangPage() {
  const { selectedTournamentId, selectedTournament } = usePublicTournament();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await layBangXepHang(selectedTournamentId || undefined);
        setData(res);
      } catch (error) {
        console.error("Lỗi lấy dữ liệu bảng xếp hạng:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    const interval = setInterval(loadData, 3000); // Poll every 3 seconds for Premier League style live standings
    return () => clearInterval(interval);
  }, [selectedTournamentId]);

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>Đang tải dữ liệu bảng xếp hạng thời gian thực...</p>
        </div>
      </div>
    );
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
        <div className={styles.liveBadgeContainer}>
          <span className={styles.liveIndicator}>
            <span className={styles.liveDot}></span>
            Real-time Live (NHA)
          </span>
        </div>
        <h2 className={styles.title}>Bảng Xếp Hạng</h2>
        <p className={styles.subtitle}>{selectedTournament?.ten || 'Giải đấu'} — Vòng bảng {selectedTournament?.mua_giai || ''}</p>
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
                    <th>ĐỘI</th>
                    <th className={styles.thCenter}>TRẬN</th>
                    <th className={styles.thCenter}>T</th>
                    <th className={styles.thCenter}>H</th>
                    <th className={styles.thCenter}>B</th>
                    <th className={styles.thCenter}>BT - BB</th>
                    <th className={styles.thCenter}>HS</th>
                    <th className={styles.thCenter}>ĐIỂM</th>
                    <th className={styles.thCenter}>PĐ</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedData[groupName]
                    .sort((a, b) => b.diem - a.diem || b.hieuSo - a.hieuSo || b.banThang - a.banThang)
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
                        <td className={styles.tdCenter}>{row.thang || 0}</td>
                        <td className={styles.tdCenter}>{row.hoa || 0}</td>
                        <td className={styles.tdCenter}>{row.thua || 0}</td>
                        <td className={styles.tdCenter}>
                          {row.banThang || 0} - {row.banThua || 0}
                        </td>
                        <td className={styles.tdCenter}>
                          {(() => {
                            const hieuSo = (row.banThang || 0) - (row.banThua || 0);
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
                        <td className={styles.tdCenter}>
                          <div className={styles.formRow}>
                            {row.soTran > 0 ? (
                              (row.phongDo || []).map((p: string, idx: number) => (
                                <span key={idx} className={`${styles.formBadge} ${styles['form' + p]}`}>{p}</span>
                              ))
                            ) : (
                              <span className={styles.formEmpty}>—</span>
                            )}
                          </div>
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
