/**
 * MatchCardPublic.tsx
 * Public-only variant of MatchCard.
 * MatchCard.tsx (used in admin) is NOT affected.
 */
import React from 'react';
import styles from './MatchCardPublic.module.css';
import TeamLogo from './TeamLogo';
import { ShieldIcon } from './AppIcons';

interface MatchCardPublicProps {
  match: any;
  status: 'UPCOMING' | 'LIVE' | 'FINISHED';
  /** For UPCOMING: "27/6 · 06:00" style string */
  dateTimeLabel?: string;
  /** For LIVE: "45'" or "HT" */
  liveMinuteLabel?: string;
  /** For FINISHED: "26/6" date string */
  finishedDateLabel?: string;
  onClick: (match: any) => void;
}

export default function MatchCardPublic({
  match,
  status,
  dateTimeLabel,
  liveMinuteLabel,
  finishedDateLabel,
  onClick,
}: MatchCardPublicProps) {
  const isLive = status === 'LIVE';
  const isUpcoming = status === 'UPCOMING';
  const isFinished = status === 'FINISHED';

  // Card border class
  const statusClass = isLive
    ? styles.cardLive
    : isFinished
    ? styles.cardFinished
    : styles.cardUpcoming;

  return (
    <div
      className={`${styles.matchCard} ${statusClass}`}
      onClick={() => onClick(match)}
    >
      {/* ─── Team A (home) ─── */}
      <div className={styles.teamA}>
        <span className={styles.teamName}>{match.doiNha?.ten || 'TBD'}</span>
        <span className={styles.teamLogo}>
          <TeamLogo
            logo={match.doiNha?.logo}
            teamName={match.doiNha?.ten}
            fallback={<ShieldIcon size={18} />}
          />
        </span>
      </div>

      {/* ─── Center: score / status ─── */}
      <div className={styles.scoreCol}>
        {isUpcoming ? (
          <>
            <span className={styles.scoreDash}>–</span>
            {dateTimeLabel && (
              <span className={`${styles.badge} ${styles.badgeUpcoming}`}>
                {dateTimeLabel}
              </span>
            )}
          </>
        ) : isFinished ? (
          <>
            <span className={`${styles.scoreText} ${styles.scoreFinished}`}>
              {match.tyNha ?? 0} – {match.tyKhach ?? 0}
            </span>
            <span className={`${styles.badge} ${styles.badgeFinished}`}>
              ✓ FT{finishedDateLabel ? ` · ${finishedDateLabel}` : ''}
            </span>
          </>
        ) : (
          /* LIVE */
          <>
            <span className={`${styles.scoreText} ${styles.scoreLive}`}>
              {match.tyNha ?? 0} – {match.tyKhach ?? 0}
            </span>
            <span className={`${styles.badge} ${styles.badgeLive}`}>
              <span className={styles.liveDot} />
              {liveMinuteLabel || 'LIVE'}
            </span>
          </>
        )}
      </div>

      {/* ─── Team B (away) ─── */}
      <div className={styles.teamB}>
        <span className={styles.teamLogo}>
          <TeamLogo
            logo={match.doiKhach?.logo}
            teamName={match.doiKhach?.ten}
            fallback={<ShieldIcon size={18} />}
          />
        </span>
        <span className={styles.teamName}>{match.doiKhach?.ten || 'TBD'}</span>
      </div>
    </div>
  );
}
