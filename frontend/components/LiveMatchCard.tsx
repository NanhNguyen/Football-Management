'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './LiveMatchCard.module.css';
import { supabase } from '@/lib/supabase';
import { calculateMatchMinute } from '@/lib/api';

interface Props {
  tran: any;
}

export default function LiveMatchCard({ tran }: Props) {
  const [match, setMatch] = useState(tran);

  useEffect(() => {
    // Sync local state if parent prop changes
    setMatch(tran);
  }, [tran]);

  // Real-time minute ticking
  useEffect(() => {
    if (match.trangThai !== 'DANG_DIEN_RA' || match.dangTamDung) return;

    const interval = setInterval(() => {
      const currentPhut = calculateMatchMinute(match);
      if (currentPhut !== match.phut) {
        setMatch((prev: any) => ({ ...prev, phut: currentPhut }));
      }
    }, 10000); // Update UI every 10s

    return () => clearInterval(interval);
  }, [match.trangThai, match.dangTamDung, match.batDauLuc, match.thoiGianDaQua]);

  useEffect(() => {
    if (!match.id) return;

    // Subscribe to real-time changes for this specific match
    const channel = supabase
      .channel(`realtime:match_${match.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tran_dau',
          filter: `id=eq.${match.id}`,
        },
        (payload) => {
          const newDoc = payload.new;
          setMatch((prev: any) => ({
            ...prev,
            tyNha: newDoc.ty_doi_nha,
            tyKhach: newDoc.ty_doi_khach,
            trangThai: newDoc.trang_thai,
            phut: newDoc.phut,
            vong: newDoc.vong,
            time: newDoc.gio,
            date: newDoc.ngay,
            san: newDoc.san,
            batDauLuc: newDoc.bat_dau_luc,
            dangTamDung: newDoc.dang_tam_dung,
            thoiGianDaQua: newDoc.thoi_gian_da_qua
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [match.id]);

  const isLive = match.trangThai === 'DANG_DIEN_RA';
  const isSapDienRa = match.trangThai === 'SAP_DIEN_RA';

  // Support both property names to prevent crashes with old mock data
  const tyNha = match.tyNha !== undefined ? match.tyNha : match.tyDoiNha;
  const tyKhach = match.tyKhach !== undefined ? match.tyKhach : match.tyDoiKhach;

  return (
    <Link href={`/tran-dau/${match.id}`} style={{ textDecoration: 'none' }}>
      <div className={`${styles.card} ${isLive ? styles.cardLive : ''}`}>
        {/* Status & Info Badge */}
        <div className={styles.statusRow}>
          <span className={styles.matchMeta}>
            {match.date ? `${match.date}` : ''} {match.time ? `• ${match.time}` : ''} {match.san ? `• Sân ${match.san}` : ''}
          </span>
          <div className={styles.badges}>
            {isLive && (
              <span className={styles.liveBadge}>
                <span className={styles.livePulse} />
                {match.dangTamDung ? 'PAUSED' : 'LIVE'} · {match.phut}&apos;
              </span>
            )}
            {isSapDienRa && (
              <span className={styles.upcomingBadge}>Sắp diễn ra</span>
            )}
            {match.trangThai === 'KET_THUC' && (
              <span className={styles.endBadge}>Kết thúc</span>
            )}
          </div>
        </div>

        {/* Scoreboard */}
        <div className={styles.scoreboard}>
          {/* Home Team */}
          <div className={styles.team}>
            <span className={styles.teamLogo}>{match.doiNha?.logo ?? '—'}</span>
            <span className={styles.teamName}>{match.doiNha?.ten ?? 'Đội A'}</span>
          </div>

          {/* Score */}
          <div className={styles.scoreCenter}>
            {isSapDienRa && tyNha === 0 && tyKhach === 0 ? (
              <div className={styles.timeOnly}>
                {match.time ? match.time : '--:--'}
              </div>
            ) : (
              <div className={styles.score}>
                <span className={`${styles.scoreNum} ${match.trangThai === 'KET_THUC' ? styles.scoreBold : ''}`}>
                  {tyNha}
                </span>
                <span className={styles.scoreSep}>:</span>
                <span className={`${styles.scoreNum} ${match.trangThai === 'KET_THUC' ? styles.scoreBold : ''}`}>
                  {tyKhach}
                </span>
              </div>
            )}
          </div>

          {/* Away Team */}
          <div className={styles.team}>
            <span className={styles.teamLogo}>{match.doiKhach?.logo ?? '—'}</span>
            <span className={styles.teamName}>{match.doiKhach?.ten ?? 'Đội B'}</span>
          </div>
        </div>

        {/* Scorers Area (Mocked for Visuals) */}
        {(tyNha > 0 || tyKhach > 0) && (
          <div className={styles.scorersList}>
            <div className={styles.scorersHome}>
              {tyNha > 0 && <span className={styles.scorerItem}>Nguyễn Văn A ⚽</span>}
            </div>
            <div className={styles.scorersAway}>
              {tyKhach > 0 && <span className={styles.scorerItem}>Trần Văn B ⚽</span>}
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}

