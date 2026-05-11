import styles from './page.module.css';

const bracketData = {
  tuKet: [
    { id: 1, doiA: { ten: 'TK Warriors', logo: '⚔️' }, doiB: { ten: 'Storm KD01', logo: '⛈️' }, tyA: 3, tyB: 0 },
    { id: 2, doiA: { ten: 'Phoenix KD03', logo: '🔥' }, doiB: { ten: 'Sharks KD02', logo: '🦈' }, tyA: 2, tyB: 1 },
    { id: 3, doiA: { ten: 'Titans KD05', logo: '🛡️' }, doiB: { ten: 'Lions KD08', logo: '🦁' }, tyA: 1, tyB: 0 },
    { id: 4, doiA: { ten: 'Sale FC', logo: '🦅' }, doiB: { ten: 'Eagles KD07', logo: '🦅' }, tyA: 2, tyB: 2, penalty: '4-3' },
  ],
  banKet: [
    { id: 5, doiA: { ten: 'TK Warriors', logo: '⚔️' }, doiB: { ten: 'Phoenix KD03', logo: '🔥' }, tyA: null, tyB: null },
    { id: 6, doiA: { ten: 'Titans KD05', logo: '🛡️' }, doiB: { ten: 'Sale FC', logo: '🦅' }, tyA: null, tyB: null },
  ],
  chungKet: [
    { id: 7, doiA: { ten: 'TBD', logo: '❓' }, doiB: { ten: 'TBD', logo: '❓' }, tyA: null, tyB: null },
  ],
};

function MatchCard({ match }: { match: any }) {
  const aWin = match.tyA !== null && match.tyA > match.tyB;
  const bWin = match.tyA !== null && match.tyB > match.tyA;

  return (
    <div className={styles.matchCard}>
      <div className={`${styles.matchTeam} ${aWin ? styles.matchTeamWin : ''}`}>
        <span className={styles.matchLogo}>{match.doiA.logo}</span>
        <span className={styles.matchName}>{match.doiA.ten}</span>
        <span className={styles.matchScore}>{match.tyA ?? '-'}</span>
      </div>
      <div className={`${styles.matchTeam} ${bWin ? styles.matchTeamWin : ''}`}>
        <span className={styles.matchLogo}>{match.doiB.logo}</span>
        <span className={styles.matchName}>{match.doiB.ten}</span>
        <span className={styles.matchScore}>{match.tyB ?? '-'}</span>
      </div>
      {match.penalty && (
        <span className={styles.penaltyBadge}>PEN: {match.penalty}</span>
      )}
    </div>
  );
}

export default function KnockoutPage() {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h2 className={styles.title}>Vòng Knock-out</h2>
        <p className={styles.subtitle}>Thiên Khôi Championship 2024 — Giai đoạn loại trực tiếp</p>
      </div>

      <div className={styles.bracketContainer}>
        <div className={styles.bracket}>
          {/* Tứ kết */}
          <div className={styles.round}>
            <h4 className={styles.roundTitle}>Tứ kết</h4>
            <div className={styles.roundMatches}>
              {bracketData.tuKet.map((m) => <MatchCard key={m.id} match={m} />)}
            </div>
          </div>

          {/* Bán kết */}
          <div className={styles.round}>
            <h4 className={styles.roundTitle}>Bán kết</h4>
            <div className={styles.roundMatches}>
              {bracketData.banKet.map((m) => <MatchCard key={m.id} match={m} />)}
            </div>
          </div>

          {/* Chung kết */}
          <div className={styles.round}>
            <h4 className={styles.roundTitle}>🏆 Chung kết</h4>
            <div className={styles.roundMatches}>
              {bracketData.chungKet.map((m) => <MatchCard key={m.id} match={m} />)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
