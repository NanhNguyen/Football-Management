'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './LiveMatchCard.module.css';
import { supabase } from '@/lib/supabase';

interface Props {
  tran: any;
}

export default function LiveMatchCard({ tran }: Props) {
  const [match, setMatch] = useState(tran);

  useEffect(() => {
    // Sync local state if parent prop changes
    setMatch(tran);
  }, [tran]);

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
            san: newDoc.san
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
    <div className={`${styles.card} ${isLive ? styles.cardLive : ''}`}>
      {/* Status Badge */}
      <div className={styles.statusRow}>
        <span className={styles.vong}>{match.vong}</span>
        {isLive && (
          <span className={styles.liveBadge}>
            <span className={styles.livePulse} />
            LIVE · {match.phut}&apos;
          </span>
        )}
        {isSapDienRa && (
          <span className={styles.upcomingBadge}>Sắp diễn ra</span>
        )}
        {match.trangThai === 'KET_THUC' && (
          <span className={styles.endBadge}>Kết thúc</span>
        )}
      </div>

      {/* Scoreboard */}
      <div className={styles.scoreboard}>
        {/* Home Team */}
        <div className={styles.team}>
          <span className={styles.teamLogo}>{match.doiNha?.logo ?? '⚽'}</span>
          <span className={styles.teamName}>{match.doiNha?.ten ?? 'Đội A'}</span>
        </div>

        {/* Score */}
        <div className={styles.scoreCenter}>
          <div className={styles.score}>
            <span className={styles.scoreNum}>{tyNha}</span>
            <span className={styles.scoreSep}>:</span>
            <span className={styles.scoreNum}>{tyKhach}</span>
          </div>
        </div>

        {/* Away Team */}
        <div className={styles.team}>
          <span className={styles.teamLogo}>{match.doiKhach?.logo ?? '⚽'}</span>
          <span className={styles.teamName}>{match.doiKhach?.ten ?? 'Đội B'}</span>
        </div>
      </div>

      {/* CTA */}
      <Link href={`/tran-dau/${match.id}`} className={styles.detailBtn}>
        Chi tiết trận đấu
      </Link>
    </div>
  );
}

