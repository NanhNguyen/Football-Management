import React from 'react';
import styles from './MatchCard.module.css';
import TeamLogo from './TeamLogo';
import { ShieldIcon } from './AppIcons';

interface MatchCardProps {
  match: any;
  status: 'UPCOMING' | 'LIVE' | 'FINISHED';
  matchStatusText: string;
  onClick: (match: any) => void;
}

export default function MatchCard({ match, status, matchStatusText, onClick }: MatchCardProps) {
  const isLive = status === 'LIVE';
  const isUpcoming = status === 'UPCOMING';
  const isFinished = status === 'FINISHED';

  // Determine card-level CSS class
  const statusClass = isLive ? styles.cardLive : isUpcoming ? styles.cardUpcoming : styles.cardFinished;

  // For LIVE: prepend "LIVE" prefix when not already set or "HT"
  let displayStatusText = matchStatusText;
  if (isLive && matchStatusText !== 'HT' && !matchStatusText.startsWith('LIVE')) {
    displayStatusText = `LIVE ${matchStatusText}`;
  } else if (isLive && matchStatusText === 'HT') {
    displayStatusText = 'Nghỉ giữa giờ';
  }

  // Score box class
  const scoreBoxClass = [
    styles.scoreBox,
    isUpcoming ? styles.scoreBoxUpcoming : '',
    isLive ? styles.scoreBoxLive : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      className={`${styles.matchCard} ${statusClass}`}
      onClick={() => onClick(match)}
    >
      {/* Team A */}
      <div className={styles.teamA}>
        <span className={styles.teamName}>{match.doiNha?.ten || 'TBD'}</span>
        <span className={styles.teamLogo}>
          <TeamLogo logo={match.doiNha?.logo} teamName={match.doiNha?.ten} fallback={<ShieldIcon size={16} />} />
        </span>
      </div>

      {/* Score and Status Column */}
      <div className={styles.scoreCol}>
        <div className={scoreBoxClass}>
          {isUpcoming ? (
            <span className={styles.scoreDash}>VS</span>
          ) : (
            <span className={isLive ? styles.scoreLive : ''}>
              {match.tyNha ?? 0} - {match.tyKhach ?? 0}
            </span>
          )}
        </div>

        {/* Status badge below score box */}
        {isFinished ? (
          <span className={styles.matchStatus}>
            {displayStatusText.split('FT').map((part, index, arr) => (
              <React.Fragment key={index}>
                {part}
                {index < arr.length - 1 && <span className={styles.badgeFT}>FT</span>}
              </React.Fragment>
            ))}
          </span>
        ) : isLive ? (
          <span className={`${styles.matchStatus} ${styles.statusLive}`}>
            {displayStatusText}
          </span>
        ) : (
          /* UPCOMING — show scheduled time */
          <span className={`${styles.matchStatus} ${styles.statusUpcoming}`}>
            {displayStatusText}
          </span>
        )}
      </div>

      {/* Team B */}
      <div className={styles.teamB}>
        <span className={styles.teamLogo}>
          <TeamLogo logo={match.doiKhach?.logo} teamName={match.doiKhach?.ten} fallback={<ShieldIcon size={16} />} />
        </span>
        <span className={styles.teamName}>{match.doiKhach?.ten || 'TBD'}</span>
      </div>
    </div>
  );
}
