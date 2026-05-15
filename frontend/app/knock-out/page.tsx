import styles from './page.module.css';

const bracketData = {
  vong16: [
    { id: 1, doiA: { ten: 'TK Warriors', logo: '⚔️' }, doiB: { ten: 'Wolves KD10', logo: '🐺' }, tyA: 3, tyB: 1 },
    { id: 2, doiA: { ten: 'Phoenix KD03', logo: '🔥' }, doiB: { ten: 'Stars KD13', logo: '⭐' }, tyA: 2, tyB: 0 },
    { id: 3, doiA: { ten: 'Sale FC', logo: '🦅' }, doiB: { ten: 'Suns KD16', logo: '☀️' }, tyA: 1, tyB: 0 },
    { id: 4, doiA: { ten: 'Dragons KD09', logo: '🐲' }, doiB: { ten: 'Storm KD01', logo: '⛈️' }, tyA: 2, tyB: 2, penalty: '4-3' },
    { id: 5, doiA: { ten: 'Titans KD05', logo: '🛡️' }, doiB: { ten: 'Moons KD15', logo: '🌙' }, tyA: 1, tyB: 0 },
    { id: 6, doiA: { ten: 'Eagles KD07', logo: '🦅' }, doiB: { ten: 'Lions KD08', logo: '🦁' }, tyA: 2, tyB: 3 },
    { id: 7, doiA: { ten: 'Tigers KD11', logo: '🐯' }, doiB: { ten: 'Comets KD14', logo: '☄️' }, tyA: 0, tyB: 1 },
    { id: 8, doiA: { ten: 'Hawks KD12', logo: '🦅' }, doiB: { ten: 'Sharks KD02', logo: '🦈' }, tyA: 1, tyB: 2 },
  ],
  tuKet: [
    { id: 9, doiA: { ten: 'TK Warriors', logo: '⚔️' }, doiB: { ten: 'Phoenix KD03', logo: '🔥' }, tyA: null, tyB: null },
    { id: 10, doiA: { ten: 'Sale FC', logo: '🦅' }, doiB: { ten: 'Dragons KD09', logo: '🐲' }, tyA: null, tyB: null },
    { id: 11, doiA: { ten: 'Titans KD05', logo: '🛡️' }, doiB: { ten: 'Lions KD08', logo: '🦁' }, tyA: null, tyB: null },
    { id: 12, doiA: { ten: 'Comets KD14', logo: '☄️' }, doiB: { ten: 'Sharks KD02', logo: '🦈' }, tyA: null, tyB: null },
  ],
  banKet: [
    { id: 13, doiA: { ten: 'TBD', logo: '❓' }, doiB: { ten: 'TBD', logo: '❓' }, tyA: null, tyB: null },
    { id: 14, doiA: { ten: 'TBD', logo: '❓' }, doiB: { ten: 'TBD', logo: '❓' }, tyA: null, tyB: null },
  ],
  chungKet: [
    { id: 15, doiA: { ten: 'TBD', logo: '❓' }, doiB: { ten: 'TBD', logo: '❓' }, tyA: null, tyB: null },
  ],
};

function MatchCard({ match }: { match: any }) {
  const aWin = match.tyA !== null && match.tyA > match.tyB;
  const bWin = match.tyA !== null && match.tyB > match.tyA;

  return (
    <div className={`${styles.matchCard} animate-fade-up`}>
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
      <div className={`${styles.header} animate-fade-up`}>
        <h2 className={styles.title}>Vòng Knock-out</h2>
        <p className={styles.subtitle}>Thiên Khôi Cúp Siêu Chốt — Giai đoạn loại trực tiếp 2024</p>
      </div>

      <div className={styles.bracketContainer}>
        <div className={styles.bracket}>
          {/* Vòng 1/8 */}
          <div className={`${styles.round} animate-fade-up stagger-1`}>
            <h4 className={styles.roundTitle}>Vòng 1/8</h4>
            <div className={styles.roundMatches}>
              {bracketData.vong16.map((m) => <MatchCard key={m.id} match={m} />)}
            </div>
          </div>

          {/* Tứ kết */}
          <div className={`${styles.round} animate-fade-up stagger-2`}>
            <h4 className={styles.roundTitle}>Tứ kết</h4>
            <div className={styles.roundMatches}>
              {bracketData.tuKet.map((m) => <MatchCard key={m.id} match={m} />)}
            </div>
          </div>

          {/* Bán kết */}
          <div className={`${styles.round} animate-fade-up stagger-3`}>
            <h4 className={styles.roundTitle}>Bán kết</h4>
            <div className={styles.roundMatches}>
              {bracketData.banKet.map((m) => <MatchCard key={m.id} match={m} />)}
            </div>
          </div>

          {/* Chung kết */}
          <div className={`${styles.round} animate-fade-up stagger-4`}>
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
