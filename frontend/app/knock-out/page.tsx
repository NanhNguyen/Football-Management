import styles from './page.module.css';
import { layDuLieuKnockout } from '@/lib/api';

export const revalidate = 0;

interface MatchCardProps {
  match: {
    id: string;
    doiA: { ten: string; logo: string };
    doiB: { ten: string; logo: string };
    tyA: number | null;
    tyB: number | null;
    penalty: string | null;
    ngayGio: string;
    trangThai: 'KET_THUC' | 'SAP_DIEN_RA';
    winner: 'A' | 'B' | null;
  };
}

function MatchCard({ match }: MatchCardProps) {
  const isFinished = match.trangThai === 'KET_THUC';
  const aWin = isFinished && match.winner === 'A';
  const bWin = isFinished && match.winner === 'B';
  const isUpcoming = match.trangThai === 'SAP_DIEN_RA';

  // Extract start time, e.g. "12/05 • 18:00" -> "18:00"
  const startHour = match.ngayGio ? match.ngayGio.split('•')[1]?.trim() : '--:--';
  const matchDate = match.ngayGio ? match.ngayGio.split('•')[0]?.trim() : '—';

  return (
    <div className={styles.matchCardContainer}>
      <div className={styles.matchTimeHeader}>
        {matchDate}
      </div>
      
      <div className={`${styles.matchCard} ${isFinished ? styles.matchFinished : styles.matchUpcoming}`}>
        <div className={styles.teamsArea}>
          {/* Team A */}
          <div className={`${styles.matchTeam} ${aWin ? styles.teamWin : isFinished ? styles.teamLost : ''}`}>
            <span className={styles.matchLogo}>{match.doiA.logo}</span>
            <span className={styles.matchName}>{match.doiA.ten}</span>
            {isFinished && (
              <span className={styles.matchScore}>{match.tyA}</span>
            )}
          </div>

          {/* Team B */}
          <div className={`${styles.matchTeam} ${bWin ? styles.teamWin : isFinished ? styles.teamLost : ''}`}>
            <span className={styles.matchLogo}>{match.doiB.logo}</span>
            <span className={styles.matchName}>{match.doiB.ten}</span>
            {isFinished && (
              <span className={styles.matchScore}>{match.tyB}</span>
            )}
          </div>
        </div>

        {/* Start time slot if match hasn't started yet */}
        {isUpcoming && (
          <div className={styles.upcomingTimeArea}>
            <div className={styles.timeBadge}>{startHour}</div>
          </div>
        )}

        {/* Penalty details shown small at bottom */}
        {isFinished && match.penalty && (
          <div className={styles.penaltyInfo}>
            (Pen: {match.penalty})
          </div>
        )}
      </div>
    </div>
  );
}

interface ConnectorSlotProps {
  height: number;
  feederTop: any;
  feederBottom: any;
}

function ConnectorSlot({ height, feederTop, feederBottom }: ConnectorSlotProps) {
  const isTopWinner = feederTop && feederTop.winner !== null;
  const isBottomWinner = feederBottom && feederBottom.winner !== null;
  
  const strokeColorDefault = 'var(--color-border-light)';
  const strokeColorHighlight = 'var(--color-primary)';
  
  const topStroke = isTopWinner ? strokeColorHighlight : strokeColorDefault;
  const bottomStroke = isBottomWinner ? strokeColorHighlight : strokeColorDefault;

  // Coordinates
  const yTop = height / 4;
  const yBottom = (3 * height) / 4;
  const yMid = height / 2;

  return (
    <div className={styles.connectorSlot} style={{ height: `${height}px` }}>
      <svg className={styles.connectorSvg} viewBox={`0 0 80 ${height}`} preserveAspectRatio="none">
        {/* Glow behind top branch if active */}
        {isTopWinner && (
          <path
            d={`M 0 ${yTop} H 40 V ${yMid} H 80`}
            stroke={strokeColorHighlight}
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            opacity="0.15"
          />
        )}
        {/* Top branch line */}
        <path
          d={`M 0 ${yTop} H 40 V ${yMid} H 80`}
          stroke={topStroke}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* Glow behind bottom branch if active */}
        {isBottomWinner && (
          <path
            d={`M 0 ${yBottom} H 40 V ${yMid} H 80`}
            stroke={strokeColorHighlight}
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            opacity="0.15"
          />
        )}
        {/* Bottom branch line */}
        <path
          d={`M 0 ${yBottom} H 40 V ${yMid} H 80`}
          stroke={bottomStroke}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    </div>
  );
}

export default async function KnockoutPage() {
  const bracketData = await layDuLieuKnockout();

  return (
    <div className={styles.page}>
      <div className={`${styles.header} animate-fade-up`}>
        <h2 className={styles.title}>Vòng Knock-out</h2>
        <p className={styles.subtitle}>Thiên Khôi Cúp Siêu Chốt — Sơ đồ loại trực tiếp chuẩn Cúp C1</p>
      </div>

      <div className={styles.bracketContainer}>
        <div className={styles.bracket}>
          
          {/* Round 1/8 */}
          <div className={`${styles.round} animate-fade-up`} style={{ animationDelay: '0.1s' }}>
            <div className={styles.roundHeader}>
              <h4 className={styles.roundTitle}>Vòng 1/8</h4>
            </div>
            <div className={styles.roundMatches}>
              {bracketData.vong16.map((m: any) => (
                <MatchCard key={m.id} match={m} />
              ))}
            </div>
          </div>

          {/* Connectors 1 */}
          <div className={styles.connectorColumn}>
            <div className={styles.connectorHeader}></div>
            <div className={styles.connectorMatches}>
              {Array(4).fill(null).map((_, i) => (
                <ConnectorSlot
                  key={`c0-${i}`}
                  height={280}
                  feederTop={bracketData.vong16[2 * i]}
                  feederBottom={bracketData.vong16[2 * i + 1]}
                />
              ))}
            </div>
          </div>

          {/* Quarterfinals */}
          <div className={`${styles.round} animate-fade-up`} style={{ animationDelay: '0.2s' }}>
            <div className={styles.roundHeader}>
              <h4 className={styles.roundTitle}>Tứ kết</h4>
            </div>
            <div className={styles.roundMatches}>
              {bracketData.tuKet.map((m: any) => (
                <MatchCard key={m.id} match={m} />
              ))}
            </div>
          </div>

          {/* Connectors 2 */}
          <div className={styles.connectorColumn}>
            <div className={styles.connectorHeader}></div>
            <div className={styles.connectorMatches}>
              {Array(2).fill(null).map((_, i) => (
                <ConnectorSlot
                  key={`c1-${i}`}
                  height={560}
                  feederTop={bracketData.tuKet[2 * i]}
                  feederBottom={bracketData.tuKet[2 * i + 1]}
                />
              ))}
            </div>
          </div>

          {/* Semifinals */}
          <div className={`${styles.round} animate-fade-up`} style={{ animationDelay: '0.3s' }}>
            <div className={styles.roundHeader}>
              <h4 className={styles.roundTitle}>Bán kết</h4>
            </div>
            <div className={styles.roundMatches}>
              {bracketData.banKet.map((m: any) => (
                <MatchCard key={m.id} match={m} />
              ))}
            </div>
          </div>

          {/* Connectors 3 */}
          <div className={styles.connectorColumn}>
            <div className={styles.connectorHeader}></div>
            <div className={styles.connectorMatches}>
              <ConnectorSlot
                height={1120}
                feederTop={bracketData.banKet[0]}
                feederBottom={bracketData.banKet[1]}
              />
            </div>
          </div>

          {/* Finals */}
          <div className={`${styles.round} animate-fade-up`} style={{ animationDelay: '0.4s' }}>
            <div className={styles.roundHeader}>
              <h4 className={styles.roundTitle}>Chung kết</h4>
            </div>
            <div className={styles.roundMatches}>
              {bracketData.chungKet.map((m: any) => (
                <MatchCard key={m.id} match={m} />
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
