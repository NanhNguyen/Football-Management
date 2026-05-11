import Link from 'next/link';
import styles from './LiveMatchCard.module.css';

interface Props {
  tran: any;
}

export default function LiveMatchCard({ tran }: Props) {
  const isLive = tran.trangThai === 'LIVE';
  const isSapDienRa = tran.trangThai === 'SAP_DIEN_RA';

  return (
    <div className={`${styles.card} ${isLive ? styles.cardLive : ''}`}>
      {/* Status Badge */}
      <div className={styles.statusRow}>
        <span className={styles.vong}>{tran.vong}</span>
        {isLive && (
          <span className={styles.liveBadge}>
            <span className={styles.livePulse} />
            LIVE · {tran.phut}&apos;
          </span>
        )}
        {isSapDienRa && (
          <span className={styles.upcomingBadge}>Sắp diễn ra</span>
        )}
        {tran.trangThai === 'KET_THUC' && (
          <span className={styles.endBadge}>Kết thúc</span>
        )}
      </div>

      {/* Scoreboard */}
      <div className={styles.scoreboard}>
        {/* Home Team */}
        <div className={styles.team}>
          <span className={styles.teamLogo}>{tran.doiNha?.logo ?? '⚽'}</span>
          <span className={styles.teamName}>{tran.doiNha?.ten ?? 'Đội A'}</span>
        </div>

        {/* Score */}
        <div className={styles.scoreCenter}>
          <div className={styles.score}>
            <span className={styles.scoreNum}>{tran.tyDoiNha}</span>
            <span className={styles.scoreSep}>:</span>
            <span className={styles.scoreNum}>{tran.tyDoiKhach}</span>
          </div>
          {isLive && (
            <div className={styles.dealRow}>
              <span className={styles.dealBadge}>+{tran.giaoDichDoiNha} GD</span>
              <span className={styles.dealBadge}>+{tran.giaoDichDoiKhach} GD</span>
            </div>
          )}
        </div>

        {/* Away Team */}
        <div className={styles.team}>
          <span className={styles.teamLogo}>{tran.doiKhach?.logo ?? '⚽'}</span>
          <span className={styles.teamName}>{tran.doiKhach?.ten ?? 'Đội B'}</span>
        </div>
      </div>

      {/* CTA */}
      <Link href={`/tran-dau/${tran.id}`} className={styles.detailBtn}>
        Chi tiết trận đấu
      </Link>
    </div>
  );
}
