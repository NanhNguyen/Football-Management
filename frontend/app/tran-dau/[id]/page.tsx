'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import GlobalSkeletonLoader from '@/components/GlobalSkeletonLoader';
import styles from './page.module.css';
import { supabase } from '@/lib/supabase';
import { layChiTietTranDau, calculateMatchMinute } from '@/lib/api';

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
    doiNha: { ten: 'Đội nhà', logo: '⚽' },
    doiKhach: { ten: 'Đội khách', logo: '⚽' },
    tyDoiNha: 0, tyDoiKhach: 0,
    suKien: [],
  };

  const eventIcons: Record<string, string> = {
    'BAN_THANG': '⚽',
    'GOAL_NORMAL': '⚽',
    'GOAL_PEN': '⚽',
    'GOAL_OG': '⚽',
    'THE_VANG': '🟨',
    'THE_DO': '🟥',
    'THAY_NGUOI': '🔄',
    'SUB': '🔄',
    'CHOT': '⚡',
    'MOTM': '🏅',
    'CARD': '🟨',
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
          ← Quay lại
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
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#f59e0b', background: '#fef3c7', padding: '4px 12px', borderRadius: '999px', textTransform: 'uppercase' }}>
              Sắp diễn ra
            </span>
          )}
          {isKetThuc && (
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', background: '#f1f5f9', padding: '4px 12px', borderRadius: '999px', textTransform: 'uppercase' }}>
              Kết thúc
            </span>
          )}
        </div>

        <div className={styles.scoreboard}>
          <div className={styles.team}>
            <span className={styles.teamLogo}>{matchData.doiNha?.logo || '⚽'}</span>
            <h3 className={styles.teamName}>{matchData.doiNha?.ten}</h3>
          </div>

          <div className={styles.scoreCenter}>
            <div className={styles.score}>
              <span className={styles.scoreNum}>{tyDoiNha}</span>
              <span className={styles.scoreSep}>—</span>
              <span className={styles.scoreNum}>{tyDoiKhach}</span>
            </div>
            {matchData.san && (
              <span style={{ fontSize: '12px', color: '#94a3b8', marginTop: '12px', display: 'block' }}>
                🏟️ Sân {matchData.san}
              </span>
            )}
            {matchData.date && (
              <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px', display: 'block' }}>
                📅 {matchData.date} {matchData.time ? `• ${matchData.time}` : ''}
              </span>
            )}
          </div>

          <div className={styles.team}>
            <span className={styles.teamLogo}>{matchData.doiKhach?.logo || '⚽'}</span>
            <h3 className={styles.teamName}>{matchData.doiKhach?.ten}</h3>
          </div>
        </div>
      </div>

      {/* Timeline Section */}
      <div className={`${styles.timelineSection} animate-fade-up`}>
        <h3 className={styles.sectionTitle}>Diễn biến trận đấu</h3>
        {(matchData.suKien || []).length === 0 ? (
          <div style={{ background: '#f8fafc', borderRadius: '16px', border: '1px dashed #cbd5e1', padding: '48px', textAlign: 'center' }}>
            <span style={{ fontSize: '32px', display: 'block', marginBottom: '12px' }}>⏱️</span>
            <p style={{ color: '#64748b', fontWeight: 500, margin: 0 }}>Chưa có sự kiện nào được ghi nhận cho trận đấu này.</p>
          </div>
        ) : (
          <div className={styles.timeline}>
            {(matchData.suKien || []).map((sk: any) => {
              const isHomeTeamEvent = sk.doi?.ten === matchData.doiNha?.ten;
              return (
                <div key={sk.id} className={`${styles.timelineItem} ${sk.loai === 'CHOT' ? styles.timelineItemDeal : ''}`}>
                  <div className={styles.timelineDot}>
                    <span className={styles.timelineIcon}>{eventIcons[sk.loai] ?? '📌'}</span>
                    <span className={styles.timelineMinute}>{sk.phut}&apos;</span>
                  </div>
                  <div className={styles.timelineContent}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className={styles.timelineLabel}>{eventLabels[sk.loai] ?? sk.loai}</span>
                      {sk.doi?.ten && (
                        <span style={{ fontSize: '11px', fontWeight: 700, color: isHomeTeamEvent ? '#d71920' : '#2563eb', background: isHomeTeamEvent ? '#fef2f2' : '#eff6ff', padding: '2px 8px', borderRadius: '4px' }}>
                          {sk.doi.ten}
                        </span>
                      )}
                    </div>
                    {(sk.loai === 'SUB' || sk.loai === 'THAY_NGUOI') ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: '#10b981', fontWeight: 900, fontSize: '13px' }}>▲</span>
                          <span style={{ fontWeight: 600, color: '#1e293b' }}>{sk.cauThu?.ten || 'Không rõ'} (Vào sân)</span>
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
            { 
              label: 'Siêu Chốt 🔥', 
              home: (matchData.suKien || []).filter((e: any) => e.loai === 'CHOT' && e.doi?.ten === matchData.doiNha?.ten).length, 
              away: (matchData.suKien || []).filter((e: any) => e.loai === 'CHOT' && e.doi?.ten === matchData.doiKhach?.ten).length 
            },
          ].map((stat, i) => (
            <div key={i} className={styles.statRow}>
              <span className={styles.statHome}>{stat.home}</span>
              <span className={styles.statLabel}>{stat.label}</span>
              <span className={styles.statAway}>{stat.away}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
