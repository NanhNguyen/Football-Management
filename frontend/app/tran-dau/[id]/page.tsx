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
          <div className={styles.timeline}>
            {(matchData.suKien || []).map((sk: any) => {
              const isHomeTeamEvent = sk.doi?.ten === matchData.doiNha?.ten;
              return (
                <div key={sk.id} className={`${styles.timelineItem} ${sk.loai === 'CHOT' ? styles.timelineItemDeal : ''}`}>
                  <div className={styles.timelineDot} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className={styles.timelineIcon} style={{ display: 'inline-flex' }}>{eventIcons[sk.loai] ?? <ZapIcon size={14} />}</span>
                    <span className={styles.timelineMinute}>{sk.phut}&apos;</span>
                  </div>
                  <div className={styles.timelineContent}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className={styles.timelineLabel}>{eventLabels[sk.loai] ?? sk.loai}</span>
                      {sk.doi?.ten && (
                        <span style={{ fontSize: '11px', fontWeight: 700, color: isHomeTeamEvent ? '#fca5a5' : '#93c5fd', background: isHomeTeamEvent ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)', padding: '2px 8px', borderRadius: '4px' }}>
                          {sk.doi.ten}
                        </span>
                      )}
                    </div>
                    {(sk.loai === 'SUB' || sk.loai === 'THAY_NGUOI') ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: '#10b981', fontWeight: 900, fontSize: '13px' }}>▲</span>
                          <span style={{ fontWeight: 600, color: '#f8fafc' }}>{sk.cauThu?.ten || 'Không rõ'} (Vào sân)</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: '#ef4444', fontWeight: 900, fontSize: '13px' }}>▼</span>
                          <span style={{ color: '#64748b' }}>
                            {sk.moTa ? sk.moTa.replace('Vào sân thay cho ', '') : 'Chưa rõ'} (Ra sân)
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className={styles.timelineDesc}>
                        <strong>{sk.cauThu?.ten ?? 'Không rõ'}</strong>
                        {sk.moTa && ` — ${sk.moTa}`}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
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
