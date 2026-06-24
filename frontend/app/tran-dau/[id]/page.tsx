'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import GlobalSkeletonLoader from '@/components/GlobalSkeletonLoader';
import TeamLogo from '@/components/TeamLogo';
import styles from './page.module.css';
import { supabase } from '@/lib/supabase';
import { layChiTietTranDau, calculateMatchMinute } from '@/lib/api';
import { 
  ArrowLeftIcon, 
  SoccerBallIcon, 
  YellowCardIcon, 
  RedCardIcon, 
  SyncIcon, 
  ZapIcon, 
  AwardIcon, 
  StadiumIcon, 
  CalendarIcon, 
  TimerIcon
} from '@/components/AppIcons';

export default function ChiTietTranDauPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [tran, setTran] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Function to load/reload match details
  const fetchMatchDetails = async () => {
    if (!id) return;
    try {
      const detail = await layChiTietTranDau(id);
      if (detail) {
        setTran(detail);
      }
    } catch (err) {
      console.error('Lỗi khi lấy chi tiết trận đấu:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchMatchDetails();
  }, [id]);

  // Real-time minute ticking for LIVE matches
  useEffect(() => {
    if (!tran || tran.trangThai !== 'DANG_DIEN_RA' || tran.dangTamDung) return;

    const interval = setInterval(() => {
      const currentPhut = calculateMatchMinute(tran);
      if (currentPhut !== tran.phut) {
        setTran((prev: any) => prev ? { ...prev, phut: currentPhut } : null);
      }
    }, 10000); // Check every 10s

    return () => clearInterval(interval);
  }, [tran?.trangThai, tran?.dangTamDung, tran?.batDauLuc, tran?.thoiGianDaQua]);

  // Real-time database updates subscription
  useEffect(() => {
    if (!id) return;

    // 1. Subscribe to match table changes
    const matchChannel = supabase
      .channel(`match_detail_${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tran_dau',
          filter: `id=eq.${id}`,
        },
        () => {
          // Refetch everything to stay perfectly in sync and get relation data
          fetchMatchDetails();
        }
      )
      .subscribe();

    // 2. Subscribe to event table changes
    const eventChannel = supabase
      .channel(`match_events_${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'su_kien',
          filter: `tran_dau_id=eq.${id}`,
        },
        () => {
          // Refetch to get fresh list of events and related player/team details
          fetchMatchDetails();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(matchChannel);
      supabase.removeChannel(eventChannel);
    };
  }, [id]);

  if (loading) {
    return <GlobalSkeletonLoader />;
  }

  // Fallback data if match doesn't exist
  const matchData = tran || {
    id, vong: 'Vòng đấu', phut: 0, trangThai: 'SAP_DIEN_RA',
    doiNha: { ten: 'Đội nhà', logo: '' },
    doiKhach: { ten: 'Đội khách', logo: '' },
    tyDoiNha: 0, tyDoiKhach: 0,
    suKien: [],
  };

  const eventIcons: Record<string, React.ReactNode> = {
    'BAN_THANG': <SoccerBallIcon size={14} />,
    'GOAL_NORMAL': <SoccerBallIcon size={14} />,
    'GOAL_PEN': <SoccerBallIcon size={14} />,
    'GOAL_OG': <SoccerBallIcon size={14} />,
    'THE_VANG': <YellowCardIcon size={14} />,
    'THE_DO': <RedCardIcon size={14} />,
    'THAY_NGUOI': <SyncIcon size={14} />,
    'SUB': <SyncIcon size={14} />,
    'CHOT': <ZapIcon size={14} />,
    'MOTM': <AwardIcon size={14} />,
    'CARD': <YellowCardIcon size={14} />,
  };

  const eventLabels: Record<string, string> = {
    'BAN_THANG': 'Bàn thắng',
    'GOAL_NORMAL': 'Bàn thắng',
    'GOAL_PEN': 'Penalty',
    'GOAL_OG': 'Phản lưới nhà',
    'THE_VANG': 'Thẻ vàng',
    'THE_DO': 'Thẻ đỏ',
    'THAY_NGUOI': 'Thay người',
    'SUB': 'Thay người',
    'CHOT': 'Siêu Chốt (+2)',
    'MOTM': 'Xuất sắc nhất',
    'CARD': 'Án phạt',
  };

  const isLive = matchData.trangThai === 'DANG_DIEN_RA';
  const isSapDienRa = matchData.trangThai === 'SAP_DIEN_RA';
  const isKetThuc = matchData.trangThai === 'KET_THUC';

  const tyDoiNha = matchData.tyDoiNha ?? matchData.tyNha ?? 0;
  const tyDoiKhach = matchData.tyDoiKhach ?? matchData.tyKhach ?? 0;

  return (
    <div className={`${styles.page} animate-fade-in`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <button onClick={() => router.back()} className={styles.backLink} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', padding: 0 }}>
          <ArrowLeftIcon size={16} /> Quay lại
        </button>
        <Link href="/" className={styles.backLink} style={{ color: '#64748b' }}>
          Về Trang chủ
        </Link>
      </div>

      {/* Match Header */}
      <div className={`${styles.matchHeader} animate-fade-up`}>
        <div className={styles.matchInfo}>
          <span className={styles.vong}>{matchData.vong}</span>
          {isLive && (
            <span className={styles.liveBadge}>
              <span className={styles.livePulse} />
              {matchData.dangTamDung ? 'NGHỈ GIỮA HIỆP' : `LIVE · ${matchData.phut}'`}
            </span>
          )}
          {isSapDienRa && (
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#fcd34d', background: 'rgba(245, 158, 11, 0.2)', padding: '4px 12px', borderRadius: '999px', textTransform: 'uppercase' }}>
              Sắp diễn ra
            </span>
          )}
          {isKetThuc && (
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#cbd5e1', background: '#1e293b', padding: '4px 12px', borderRadius: '999px', textTransform: 'uppercase' }}>
              Kết thúc
            </span>
          )}
        </div>

        <div className={styles.scoreboard}>
          <Link href={matchData.doiNha?.id ? `/doi-bong/${matchData.doiNha.id}` : '#'} className={styles.team} style={{ textDecoration: 'none', color: 'inherit' }}>
            <span className={styles.teamLogo} style={{ display: 'flex' }}><TeamLogo logo={matchData.doiNha?.logo} /></span>
            <h3 className={styles.teamName}>{matchData.doiNha?.ten}</h3>
          </Link>

          <div className={styles.scoreCenter}>
            <div className={styles.score}>
              <span className={styles.scoreNum}>{tyDoiNha}</span>
              <span className={styles.scoreSep}>—</span>
              <span className={styles.scoreNum}>{tyDoiKhach}</span>
            </div>
            {matchData.san && (
              <span style={{ fontSize: '12px', color: '#94a3b8', marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                <StadiumIcon size={14} /> Sân {matchData.san}
              </span>
            )}
            {matchData.date && (
              <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                <CalendarIcon size={12} /> {matchData.date} {matchData.time ? `• ${matchData.time}` : ''}
              </span>
            )}
          </div>

          <Link href={matchData.doiKhach?.id ? `/doi-bong/${matchData.doiKhach.id}` : '#'} className={styles.team} style={{ textDecoration: 'none', color: 'inherit' }}>
            <span className={styles.teamLogo} style={{ display: 'flex' }}><TeamLogo logo={matchData.doiKhach?.logo} /></span>
            <h3 className={styles.teamName}>{matchData.doiKhach?.ten}</h3>
          </Link>
        </div>
      </div>

      {/* Timeline Section */}
      <div className={`${styles.timelineSection} animate-fade-up`}>
        <h3 className={styles.sectionTitle}>Diễn biến trận đấu</h3>
        {(matchData.suKien || []).length === 0 ? (
          <div style={{ background: '#0E1421', borderRadius: '16px', border: '1px dashed #1e293b', padding: '48px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ display: 'block', marginBottom: '12px' }}><TimerIcon size={32} /></span>
            <p style={{ color: '#64748b', fontWeight: 500, margin: 0 }}>Chưa có sự kiện nào được ghi nhận cho trận đấu này.</p>
          </div>
        ) : (
          <div className={styles.templateContainer}>
            {(() => {
              const chronologicalEvents = (matchData.suKien || [])
                .slice()
                .sort((a: any, b: any) => a.phut - b.phut || a.id.localeCompare(b.id));

              let homeScore = 0;
              let awayScore = 0;

              const eventsWithScores = chronologicalEvents.map((sk: any) => {
                const isGoal = sk.loai?.startsWith('GOAL') || sk.loai === 'BAN_THANG';
                const isOwnGoal = sk.loai === 'GOAL_OG';
                
                if (isGoal) {
                  const isHomeScorer = sk.doiId === matchData.doiNha?.id || sk.doi?.ten === matchData.doiNha?.ten;
                  if (isOwnGoal) {
                    if (isHomeScorer) {
                      awayScore++;
                    } else {
                      homeScore++;
                    }
                  } else {
                    if (isHomeScorer) {
                      homeScore++;
                    } else {
                      awayScore++;
                    }
                  }
                }
                
                return {
                  ...sk,
                  score: `${homeScore} - ${awayScore}`
                };
              });

              const listItems: any[] = [];
              let htInserted = false;

              eventsWithScores.forEach((sk: any) => {
                if (sk.phut > 45 && !htInserted) {
                  const goalsBeforeHT = eventsWithScores.filter((e: any) => e.phut <= 45 && (e.loai?.startsWith('GOAL') || e.loai === 'BAN_THANG'));
                  let htHome = 0;
                  let htAway = 0;
                  goalsBeforeHT.forEach((g: any) => {
                    const isHomeScorer = g.doiId === matchData.doiNha?.id || g.doi?.ten === matchData.doiNha?.ten;
                    const isOG = g.loai === 'GOAL_OG';
                    if (isOG) {
                      if (isHomeScorer) htAway++; else htHome++;
                    } else {
                      if (isHomeScorer) htHome++; else htAway++;
                    }
                  });
                  listItems.push({
                    type: 'PERIOD',
                    id: 'ht-row',
                    label: 'HT',
                    score: `${htHome} - ${htAway}`
                  });
                  htInserted = true;
                }
                listItems.push({
                  type: 'EVENT',
                  ...sk
                });
              });

              if (!htInserted && (isKetThuc || (isLive && matchData.phut > 45))) {
                const goalsBeforeHT = eventsWithScores.filter((e: any) => e.phut <= 45 && (e.loai?.startsWith('GOAL') || e.loai === 'BAN_THANG'));
                let htHome = 0;
                let htAway = 0;
                goalsBeforeHT.forEach((g: any) => {
                  const isHomeScorer = g.doiId === matchData.doiNha?.id || g.doi?.ten === matchData.doiNha?.ten;
                  const isOG = g.loai === 'GOAL_OG';
                  if (isOG) {
                    if (isHomeScorer) htAway++; else htHome++;
                  } else {
                    if (isHomeScorer) htHome++; else htAway++;
                  }
                });
                listItems.push({
                  type: 'PERIOD',
                  id: 'ht-row',
                  label: 'HT',
                  score: `${htHome} - ${htAway}`
                });
              }

              if (isKetThuc) {
                listItems.push({
                  type: 'PERIOD',
                  id: 'ft-row',
                  label: 'FT',
                  score: `${tyDoiNha} - ${tyDoiKhach}`
                });
              }

              return listItems.map((item: any) => {
                if (item.type === 'PERIOD') {
                  return (
                    <div key={item.id} className={`${styles.templateRow} ${styles.periodRow}`}>
                      <div className={styles.templateMinCol}>{item.label}</div>
                      <div className={styles.templateHomeCol}></div>
                      <div className={styles.templateCenterCol}>
                        <span className={styles.periodScore}>{item.score}</span>
                      </div>
                      <div className={styles.templateAwayCol}></div>
                    </div>
                  );
                }

                const sk = item;
                const isGoal = sk.loai?.startsWith('GOAL') || sk.loai === 'BAN_THANG';
                const isOwnGoal = sk.loai === 'GOAL_OG';
                const isSub = sk.loai === 'SUB' || sk.loai === 'THAY_NGUOI';

                const isHomeTeamEvent = isOwnGoal
                  ? !(sk.doiId === matchData.doiNha?.id || sk.doi?.ten === matchData.doiNha?.ten)
                  : (sk.doiId === matchData.doiNha?.id || sk.doi?.ten === matchData.doiNha?.ten);

                let actionDesc = sk.moTa || '';
                if (sk.cauThu?.ten && actionDesc.startsWith(sk.cauThu.ten)) {
                  actionDesc = actionDesc.substring(sk.cauThu.ten.length).trim();
                  actionDesc = actionDesc.replace(/^[\s—\-\(\)]+/, '').replace(/[\(\)]+$/, '');
                }
                
                if (actionDesc) {
                  actionDesc = actionDesc.charAt(0).toUpperCase() + actionDesc.slice(1);
                }

                const playerDisplay = (
                  <div>
                    <div className={styles.playerName}>{sk.cauThu?.ten || 'Cầu thủ'}</div>
                    {isSub ? (
                      <div className={styles.playerSub}>
                        <span style={{ color: '#10b981' }}>▲</span> Vào sân
                        {sk.moTa && (
                          <span style={{ marginLeft: '6px', color: '#64748b' }}>
                            (ra: {sk.moTa.replace('Vào sân thay cho ', '')})
                          </span>
                        )}
                      </div>
                    ) : (
                      actionDesc && <div className={styles.playerSub}>{actionDesc}</div>
                    )}
                  </div>
                );

                return (
                  <div key={sk.id} className={styles.templateRow}>
                    <div className={styles.templateMinCol}>{sk.phut}&apos;</div>

                    <div className={styles.templateHomeCol}>
                      {isHomeTeamEvent && playerDisplay}
                    </div>

                    <div className={styles.templateCenterCol}>
                      {isGoal ? (
                        isHomeTeamEvent ? (
                          <>
                            <span style={{ display: 'flex' }}>{eventIcons[sk.loai] ?? <SoccerBallIcon size={14} />}</span>
                            <span className={styles.templateScore}>{sk.score}</span>
                          </>
                        ) : (
                          <>
                            <span className={styles.templateScore}>{sk.score}</span>
                            <span style={{ display: 'flex' }}>{eventIcons[sk.loai] ?? <SoccerBallIcon size={14} />}</span>
                          </>
                        )
                      ) : (
                        <span style={{ display: 'flex' }}>{eventIcons[sk.loai] ?? <ZapIcon size={14} />}</span>
                      )}
                    </div>

                    <div className={styles.templateAwayCol}>
                      {!isHomeTeamEvent && playerDisplay}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        )}
      </div>

      {/* Stats Section */}
      <div className={`${styles.statsSection} animate-fade-up`}>
        <h3 className={styles.sectionTitle}>Thống kê trận đấu</h3>
        <div className={styles.statsGrid}>
          {[
            { 
              label: 'Bàn thắng', 
              home: tyDoiNha, 
              away: tyDoiKhach 
            },
            { 
              label: 'Sự kiện', 
              home: (matchData.suKien || []).filter((e: any) => e.doi?.ten === matchData.doiNha?.ten).length, 
              away: (matchData.suKien || []).filter((e: any) => e.doi?.ten === matchData.doiKhach?.ten).length 
            },
            { 
              label: 'Thẻ vàng/phạt', 
              home: (matchData.suKien || []).filter((e: any) => (e.loai === 'THE_VANG' || e.loai === 'CARD') && e.doi?.ten === matchData.doiNha?.ten).length, 
              away: (matchData.suKien || []).filter((e: any) => (e.loai === 'THE_VANG' || e.loai === 'CARD') && e.doi?.ten === matchData.doiKhach?.ten).length 
            },
          ].map((stat, i) => (
            <div key={i} className={styles.statRow}>
              <span className={styles.statHome}>{stat.home}</span>
              <span className={styles.statLabel} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span>{stat.label}</span>
              </span>
              <span className={stat.away !== undefined ? styles.statAway : ''}>{stat.away}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
