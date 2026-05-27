'use client';

import { useState, useEffect } from 'react';
import GlobalSkeletonLoader from '@/components/GlobalSkeletonLoader';
import styles from './page.module.css';
import { layTongQuan, layTopGhiBan, layTopCustomEvents, layChiTietTranDau, calculateMatchMinute } from '@/lib/api';
import Link from 'next/link';
import { usePublicTournament } from '@/components/PublicTournamentContext';
import DateStrip from '@/components/DateStrip';
import MatchListFeed from '@/components/MatchListFeed';

export default function TongQuanPage() {
  const { selectedTournamentId } = usePublicTournament();
  const [data, setData] = useState<any>(null);
  const [topScorers, setTopScorers] = useState<any[]>([]);
  const [topCustomEvents, setTopCustomEvents] = useState<any>({ eventsConfig: [], topPlayers: {} });
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [activeModalTab, setActiveModalTab] = useState<'timeline' | 'roster'>('timeline');
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [tqData, tbData, topCustom] = await Promise.all([
          layTongQuan(selectedTournamentId || undefined), 
          layTopGhiBan(selectedTournamentId || undefined),
          layTopCustomEvents(selectedTournamentId || undefined)
        ]);
        setData(tqData);
        setTopScorers(tbData.slice(0, 3));
        setTopCustomEvents(topCustom);
      } catch (error) {
        console.error("Lỗi lấy dữ liệu tổng quan:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    const interval = setInterval(loadData, 5000); // 5 seconds polling
    return () => clearInterval(interval);
  }, [selectedTournamentId]);

  useEffect(() => {
    if (!selectedMatch?.id) return;
    const fetchDetails = async () => {
      try {
        const freshDetails = await layChiTietTranDau(selectedMatch.id);
        if (freshDetails) {
          setSelectedMatch(freshDetails);
        }
      } catch (error) {
        console.error("Lỗi lấy chi tiết trận đấu:", error);
      }
    };

    fetchDetails();
    const interval = setInterval(fetchDetails, 3000);
    return () => clearInterval(interval);
  }, [selectedMatch?.id]);

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <GlobalSkeletonLoader />;
  }

  // Removed hardcoded topChot array

  return (
    <div className={styles.page}>
      
      {/* 1. Date Strip Navigation */}
      <DateStrip onSelectDate={(date) => {
        // Handle date filtering in future
        console.log("Selected date:", date);
      }} />

      {/* 2. Main Match Feed */}
      <div className={styles.mainFeedWrapper}>
        <MatchListFeed 
          data={data} 
          onMatchClick={(match) => setSelectedMatch(match)} 
        />
      </div>

      {/* 3. Khu Vực Bảng Vàng & Xếp Hạng (Moved to bottom) */}
      <section className={`${styles.section} animate-fade-up`}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Bảng Vàng Danh Dự</h3>
        </div>

        <div className={styles.leaderboardGrid}>
          {/* Block 1: BXH Đội Bóng */}
          <div className={styles.lbCard}>
            <div className={styles.lbHeader}>
              <h4>Bảng Xếp Hạng Đội</h4>
              <Link href="/bang-xep-hang" className={styles.lbLink}>Chi tiết</Link>
            </div>
            <div className={styles.lbList}>
              {(data?.top3Doi || []).map((t: any, i: number) => (
                <div key={i} className={styles.lbTeamRow}>
                  <div className={styles.lbTeamRankBg}>{i + 1}</div>
                  <div className={styles.lbTeamInfo}>
                    <span className={styles.lbTeamRank}>{i === 0 ? '👑' : `#${i + 1}`}</span>
                    <span className={styles.lbTeamLogo}>{t.doi?.logo}</span>
                    <span className={styles.lbTeamName}>{t.doi?.ten}</span>
                  </div>
                  <div className={styles.lbTeamPts}>{t.diem}đ</div>
                </div>
              ))}
            </div>
          </div>

          {/* Block 2: Vua Phá Lưới */}
          <div className={styles.lbCard}>
            <div className={styles.lbHeader}>
              <h4>Vua Phá Lưới</h4>
              <Link href="/thong-ke" className={styles.lbLink}>Chi tiết</Link>
            </div>
            <div className={styles.lbList}>
              {topScorers.map((p, i) => (
                <div key={i} className={styles.lbPlayerRow}>
                  <div className={styles.lbPlayerAvatar}>
                    <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(p.ten)}&background=random&color=fff`} alt={p.ten} />
                    <span className={styles.lbPlayerTeam}>{p.doi?.logo}</span>
                  </div>
                  <div className={styles.lbPlayerNameBox}>
                    <p className={styles.lbPlayerName}>{p.ten}</p>
                  </div>
                  <div className={styles.lbPlayerGoals}>
                    <span>{p.ban_thang}</span> 🥾
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Block 3: Dynamic Custom Events */}
          {topCustomEvents.eventsConfig.map((evt: any) => (
            <div key={evt.id} className={`${styles.lbCard} ${styles.lbCardVip}`}>
              <div className={styles.lbVipGlow}></div>
              <div className={styles.lbHeaderVip}>
                <h4>VUA {evt.name.toUpperCase()} {evt.icon}</h4>
              </div>
              <div className={styles.lbList}>
                {(topCustomEvents.topPlayers[evt.id] || []).length > 0 ? (
                  (topCustomEvents.topPlayers[evt.id] || []).map((c: any, i: number) => (
                    <div key={i} className={styles.lbChotRow}>
                      <div className={styles.lbChotAvatar}>
                        <span className={styles.lbChotRank}>{i + 1}</span>
                      </div>
                      <div className={styles.lbChotInfo}>
                        <p className={styles.lbChotName}>{c.ten}</p>
                        <p className={styles.lbChotDonVi}>{c.doi?.logo} {c.doi?.ten}</p>
                      </div>
                      <div className={styles.lbChotScore}>
                        <span className={styles.lbChotNum}>{c.count}</span> {evt.icon}
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{ textAlign: 'center', padding: '20px 0', color: '#94a3b8', fontSize: '13px' }}>Chưa có dữ liệu</p>
                )}
              </div>
            </div>
          ))}

        </div>
      </section>

      {/* 4. MATCH DETAILS MODAL */}
      {selectedMatch && (
        <div className={styles.modalOverlay} onClick={() => setSelectedMatch(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <span className={styles.modalTitleBadge}>
                {selectedMatch.vong || 'Vòng bảng'}
              </span>
              <button className={styles.modalCloseBtn} onClick={() => setSelectedMatch(null)}>×</button>
            </div>

            <div className={styles.modalHero}>
              <div className={styles.modalStatusRow}>
                {selectedMatch.trangThai === 'DANG_DIEN_RA' ? (
                  <span className={styles.modalLiveBadge}>
                    <span className={styles.liveDot} />
                    {selectedMatch.dangTamDung ? 'NGHỈ GIỮA HIỆP' : `LIVE · ${calculateMatchMinute(selectedMatch)}'`}
                  </span>
                ) : selectedMatch.trangThai === 'KET_THUC' ? (
                  <span className={styles.modalStatusText}>KẾT THÚC</span>
                ) : (
                  <span className={styles.modalStatusText}>SẮP DIỄN RA</span>
                )}
              </div>

              <div className={styles.modalScoreboard}>
                <div className={styles.modalTeam}>
                  <span className={styles.modalTeamLogo}>{selectedMatch.doiNha?.logo ?? '—'}</span>
                  <span className={styles.modalTeamName}>{selectedMatch.doiNha?.ten ?? 'Đội nhà'}</span>
                </div>

                <div className={styles.modalScoreCenter}>
                  {selectedMatch.trangThai === 'SAP_DIEN_RA' && selectedMatch.tyDoiNha === 0 && selectedMatch.tyDoiKhach === 0 ? (
                    <div className={styles.modalTimeOnly}>
                      {selectedMatch.time || '--:--'}
                    </div>
                  ) : (
                    <div className={styles.modalScore}>
                      <span className={styles.modalScoreNum}>{selectedMatch.tyDoiNha ?? 0}</span>
                      <span className={styles.modalScoreSep}>:</span>
                      <span className={styles.modalScoreNum}>{selectedMatch.tyDoiKhach ?? 0}</span>
                    </div>
                  )}
                </div>

                <div className={styles.modalTeam}>
                  <span className={styles.modalTeamLogo}>{selectedMatch.doiKhach?.logo ?? '—'}</span>
                  <span className={styles.modalTeamName}>{selectedMatch.doiKhach?.ten ?? 'Đội khách'}</span>
                </div>
              </div>
            </div>

            <div className={styles.modalTabContainer}>
              <div className={styles.modalTabs}>
                <button
                  className={`${styles.modalTab} ${activeModalTab === 'timeline' ? styles.modalTabActive : ''}`}
                  onClick={() => setActiveModalTab('timeline')}
                >
                  Diễn biến
                </button>
                <button
                  className={`${styles.modalTab} ${activeModalTab === 'roster' ? styles.modalTabActive : ''}`}
                  onClick={() => setActiveModalTab('roster')}
                >
                  Đội hình
                </button>
              </div>

              <div className={styles.modalBody}>
                {activeModalTab === 'timeline' ? (
                  <div className={styles.timeline}>
                    {(selectedMatch.suKien || []).length > 0 ? (
                      (selectedMatch.suKien || []).map((sk: any) => {
                        const isGoal = sk.loai?.startsWith('GOAL_') || sk.loai === 'BAN_THANG';
                        const isRed = sk.loai === 'CARD_RED' || sk.loai === 'THE_DO';
                        const isYellow = sk.loai === 'CARD_YELLOW' || sk.loai === 'THE_VANG';
                        const isSub = sk.loai === 'SUB' || sk.loai === 'THAY_NGUOI';

                        let iconClass = styles.timelineIcon;
                        let iconContent = '';
                        if (isGoal) {
                          iconClass += ` ${styles.timelineIconGoal}`;
                        } else if (isRed) {
                          iconClass += ` ${styles.timelineIconRedCard}`;
                          iconContent = '🟥';
                        } else if (isYellow) {
                          iconClass += ` ${styles.timelineIconCard}`;
                          iconContent = '🟨';
                        } else if (isSub) {
                          iconContent = '🔄';
                        }

                        return (
                          <div key={sk.id} className={styles.timelineItem}>
                            <div className={iconClass}>{iconContent}</div>
                            <div className={styles.timelineContent}>
                              <div className={styles.timelineTime}>{sk.phut}&apos;</div>
                              <div className={styles.timelineText}>
                                {isSub ? (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <span style={{ color: '#10b981', fontWeight: 700, fontSize: '11px' }}>▲</span>
                                      <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{sk.cauThu?.ten || 'Không rõ'}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <span style={{ color: '#ef4444', fontWeight: 700, fontSize: '11px' }}>▼</span>
                                      <span style={{ color: '#64748b', fontSize: '13px' }}>
                                        {sk.moTa ? sk.moTa.replace('Vào sân thay cho ', '') : 'Chưa rõ'}
                                      </span>
                                    </div>
                                  </div>
                                ) : (
                                  sk.moTa
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className={styles.modalEmpty}>Chưa có sự kiện nào diễn ra.</div>
                    )}
                  </div>
                ) : (
                  <div className={styles.rostersGrid}>
                    {(() => {
                      const getActiveRoster = (team: any, events: any[]) => {
                        if (!team || !team.cauThu) return { starting: [], bench: [] };
                        let startingIds = new Set(team.cauThu.filter((ct: any) => ct.viTri !== 'Dự bị').map((ct: any) => ct.id));
                        const teamEvents = (events || []).filter((e: any) => e.doiId === team.id || e.doi_id === team.id);
                        teamEvents.forEach((ev: any) => {
                          if (ev.loai === 'SUB') {
                            const playerInId = ev.cauThuId || ev.cau_thu_id || ev.cauThu?.id;
                            if (playerInId) startingIds.add(playerInId);
                            const match = ev.moTa?.match(/thay cho (.*)$/) || ev.mo_ta?.match(/thay cho (.*)$/);
                            if (match && match[1]) {
                              const playerOutName = match[1].trim();
                              const pOut = team.cauThu.find((ct: any) => ct.ten === playerOutName);
                              if (pOut) startingIds.delete(pOut.id);
                            }
                          }
                        });
                        return {
                          starting: team.cauThu.filter((ct: any) => startingIds.has(ct.id)),
                          bench: team.cauThu.filter((ct: any) => !startingIds.has(ct.id))
                        };
                      };

                      const nhaRoster = getActiveRoster(selectedMatch.doiNha, selectedMatch.suKien || []);
                      const khachRoster = getActiveRoster(selectedMatch.doiKhach, selectedMatch.suKien || []);

                      return (
                        <>
                          <div className={styles.rosterSection}>
                            <h4 className={styles.rosterTitle}>
                              {selectedMatch.doiNha?.ten || 'Đội nhà'}
                            </h4>
                            <div className={styles.rosterList}>
                              {nhaRoster.starting.map((ct: any) => (
                                <div key={ct.id} className={styles.rosterItem}>
                                  <span className={styles.rosterNumber}>{ct.soAo || '—'}</span>
                                  <span className={styles.rosterName}>{ct.ten}</span>
                                  <span className={styles.rosterPos}>Trên sân</span>
                                </div>
                              ))}
                              {nhaRoster.bench.map((ct: any) => (
                                <div key={ct.id} className={styles.rosterItem} style={{ opacity: 0.6 }}>
                                  <span className={styles.rosterNumber}>{ct.soAo || '—'}</span>
                                  <span className={styles.rosterName}>{ct.ten}</span>
                                  <span className={styles.rosterPos}>Dự bị</span>
                                </div>
                              ))}
                              {nhaRoster.starting.length === 0 && nhaRoster.bench.length === 0 && (
                                <div className={styles.modalEmpty}>Chưa đăng ký cầu thủ</div>
                              )}
                            </div>
                          </div>

                          <div className={styles.rosterSection}>
                            <h4 className={styles.rosterTitle}>
                              {selectedMatch.doiKhach?.ten || 'Đội khách'}
                            </h4>
                            <div className={styles.rosterList}>
                              {khachRoster.starting.map((ct: any) => (
                                <div key={ct.id} className={styles.rosterItem}>
                                  <span className={styles.rosterNumber}>{ct.soAo || '—'}</span>
                                  <span className={styles.rosterName}>{ct.ten}</span>
                                  <span className={styles.rosterPos}>Trên sân</span>
                                </div>
                              ))}
                              {khachRoster.bench.map((ct: any) => (
                                <div key={ct.id} className={styles.rosterItem} style={{ opacity: 0.6 }}>
                                  <span className={styles.rosterNumber}>{ct.soAo || '—'}</span>
                                  <span className={styles.rosterName}>{ct.ten}</span>
                                  <span className={styles.rosterPos}>Dự bị</span>
                                </div>
                              ))}
                              {khachRoster.starting.length === 0 && khachRoster.bench.length === 0 && (
                                <div className={styles.modalEmpty}>Chưa đăng ký cầu thủ</div>
                              )}
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>

            <div className={styles.modalFooter}>
              <Link href={`/tran-dau/${selectedMatch.id}`} className={styles.modalFullBtn}>
                Xem chi tiết & phân tích →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
