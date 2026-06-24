'use client';

import { useState, useEffect } from 'react';
import styles from '@/app/lich-dau/page.module.css';
import LiveMatchCard from '@/components/LiveMatchCard';
import { usePublicTournament } from '@/components/PublicTournamentContext';

interface Props {
  groupedMatches: Record<string, any[]>;
}

interface ParsedRound {
  rawRound: string;
  roundName: string;
  groupName?: string;
}

// Custom sort comparator for raw rounds
function compareRounds(a: string, b: string): number {
  const parseRound = (s: string) => {
    // Check knockout names first
    let knockoutInfo = null;
    if (s.includes("Chung kết")) knockoutInfo = { type: 5, num: 5 };
    else if (s.includes("Tranh hạng ba")) knockoutInfo = { type: 5, num: 4 };
    else if (s.includes("Bán kết")) knockoutInfo = { type: 5, num: 3 };
    else if (s.includes("Tứ kết")) knockoutInfo = { type: 5, num: 2 };
    else if (s.includes("1/8") || s.includes("16")) knockoutInfo = { type: 5, num: 1 };

    if (knockoutInfo) {
      const matchMatch = s.match(/Trận\s+(\d+)/i);
      const subNum = matchMatch ? parseInt(matchMatch[1], 10) : 0;
      return {
        type: knockoutInfo.type,
        num: knockoutInfo.num,
        sub: '',
        subNum
      };
    }

    // Group stage pattern: "Bảng A - Vòng 1" or "Vòng 1 - Bảng A" or similar
    const groupMatch = s.match(/Bảng\s+([A-Z])\s+-\s+Vòng\s+(\d+)/i) || s.match(/Vòng\s+(\d+)\s+-\s+Bảng\s+([A-Z])/i);
    if (groupMatch) {
      const isNewFormat = s.match(/Vòng\s+(\d+)\s+-\s+Bảng\s+([A-Z])/i);
      const roundNum = isNewFormat ? parseInt(groupMatch[1], 10) : parseInt(groupMatch[2], 10);
      const groupLetter = isNewFormat ? groupMatch[2] : groupMatch[1];
      return {
        type: 1,
        num: roundNum,
        sub: groupLetter,
        subNum: 0
      };
    }

    // League pattern: "Vòng 1", "Vòng 2", etc.
    const roundMatch = s.match(/Vòng\s+(\d+)/i);
    if (roundMatch) {
      return {
        type: 2,
        num: parseInt(roundMatch[1], 10),
        sub: '',
        subNum: 0
      };
    }

    // Default fallback
    return { type: 9, num: 999, sub: s, subNum: 0 };
  };

  const infoA = parseRound(a);
  const infoB = parseRound(b);

  if (infoA.type <= 2 && infoB.type <= 2) {
    if (infoA.num !== infoB.num) {
      return infoA.num - infoB.num;
    }
    if (infoA.sub !== infoB.sub) {
      return infoA.sub.localeCompare(infoB.sub);
    }
    return a.localeCompare(b);
  }

  if (infoA.type <= 2 && infoB.type > 2) return -1;
  if (infoA.type > 2 && infoB.type <= 2) return 1;

  if (infoA.type === 5 && infoB.type === 5) {
    if (infoA.num !== infoB.num) {
      return infoA.num - infoB.num;
    }
    if (infoA.subNum !== infoB.subNum) {
      return infoA.subNum - infoB.subNum;
    }
    return a.localeCompare(b);
  }

  return a.localeCompare(b);
}

// Custom sort comparator for round names (e.g. Vòng 1, Vòng 2, Tứ kết)
function compareRoundNames(a: string, b: string): number {
  const parseName = (name: string) => {
    if (name.includes("Chung kết")) return { type: 5, num: 5 };
    if (name.includes("Tranh hạng ba")) return { type: 5, num: 4 };
    if (name.includes("Bán kết")) return { type: 5, num: 3 };
    if (name.includes("Tứ kết")) return { type: 5, num: 2 };
    if (name.includes("1/8") || name.includes("16")) return { type: 5, num: 1 };

    const roundMatch = name.match(/Vòng\s+(\d+)/i);
    if (roundMatch) {
      return { type: 1, num: parseInt(roundMatch[1], 10) };
    }

    return { type: 9, num: 999 };
  };

  const infoA = parseName(a);
  const infoB = parseName(b);

  if (infoA.type !== infoB.type) {
    return infoA.type - infoB.type;
  }
  return infoA.num - infoB.num;
}

export default function ScheduleClient({ groupedMatches }: Props) {
  const { selectedTournamentId } = usePublicTournament();
  const rawRoundsSorted = Object.keys(groupedMatches).sort(compareRounds);

  const parseRawRound = (raw: string): ParsedRound => {
    // Check for group stage pattern: "Bảng A - Vòng 1" or "Vòng 1 - Bảng A"
    const groupMatch = raw.match(/Bảng\s+([A-Z])\s+-\s+(Vòng\s+\d+)/i) || raw.match(/(Vòng\s+\d+)\s+-\s+Bảng\s+([A-Z])/i);
    if (groupMatch) {
      const isNewFormat = raw.match(/(Vòng\s+\d+)\s+-\s+Bảng\s+([A-Z])/i);
      const roundName = isNewFormat ? groupMatch[1] : groupMatch[2];
      const groupLetter = isNewFormat ? groupMatch[2] : groupMatch[1];
      return {
        rawRound: raw,
        roundName: roundName,
        groupName: `Bảng ${groupLetter.toUpperCase()}`
      };
    }

    // Check for knockout stages
    if (raw.includes("1/8") || raw.includes("16")) {
      return { rawRound: raw, roundName: "Vòng 1/8" };
    }
    if (raw.includes("Tứ kết")) {
      return { rawRound: raw, roundName: "Tứ kết" };
    }
    if (raw.includes("Bán kết")) {
      return { rawRound: raw, roundName: "Bán kết" };
    }
    if (raw.includes("Tranh hạng ba")) {
      return { rawRound: raw, roundName: "Tranh hạng ba" };
    }
    if (raw.includes("Chung kết")) {
      return { rawRound: raw, roundName: "Chung kết" };
    }

    // Check for standard "Vòng X" pattern
    const roundMatch = raw.match(/Vòng\s+(\d+)/i);
    if (roundMatch) {
      return {
        rawRound: raw,
        roundName: `Vòng ${roundMatch[1]}`
      };
    }

    // Fallback
    return { rawRound: raw, roundName: raw };
  };

  if (rawRoundsSorted.length === 0) {
    return <div className={styles.emptyState}>Chưa có lịch thi đấu được cập nhật.</div>;
  }

  const parsedRounds = rawRoundsSorted.map(parseRawRound);
  const roundNames = Array.from(new Set(parsedRounds.map(r => r.roundName))).sort(compareRoundNames);

  // States
  const [activeRoundName, setActiveRoundName] = useState<string>(roundNames[0] || '');
  const [activeGroup, setActiveGroup] = useState<string>('Tất cả');

  // Sync activeRoundName when tournament changes or on mount
  useEffect(() => {
    if (selectedTournamentId && roundNames.length > 0) {
      const savedRound = localStorage.getItem(`public_selected_round_${selectedTournamentId}`);
      if (savedRound && roundNames.includes(savedRound)) {
        setActiveRoundName(savedRound);
      } else {
        setActiveRoundName(roundNames[0]);
      }
    } else if (roundNames.length > 0) {
      setActiveRoundName(roundNames[0]);
    }
  }, [selectedTournamentId, roundNames]);

  // Filter groups available in current active round name
  const targetParsedRounds = parsedRounds.filter(r => r.roundName === activeRoundName);
  const groupsInRound = Array.from(
    new Set(
      targetParsedRounds
        .filter(r => r.groupName)
        .map(r => r.groupName as string)
    )
  ).sort();

  const handleRoundChange = (roundName: string) => {
    setActiveRoundName(roundName);
    setActiveGroup('Tất cả');
    if (selectedTournamentId) {
      localStorage.setItem(`public_selected_round_${selectedTournamentId}`, roundName);
    }
  };

  const currentRoundIndex = roundNames.indexOf(activeRoundName);
  const handlePrevRound = () => {
    if (currentRoundIndex > 0) {
      handleRoundChange(roundNames[currentRoundIndex - 1]);
    }
  };

  const handleNextRound = () => {
    if (currentRoundIndex < roundNames.length - 1 && currentRoundIndex !== -1) {
      handleRoundChange(roundNames[currentRoundIndex + 1]);
    }
  };

  const getActiveRoundDate = () => {
    const rawRounds = targetParsedRounds.map(r => r.rawRound);
    const matchesInRound = rawRounds.flatMap(raw => groupedMatches[raw] || []);
    if (matchesInRound.length === 0) return 'Chưa xếp lịch';

    const dates = matchesInRound
      .map((m: any) => m.date || m.batDauLuc)
      .filter(Boolean)
      .map((dStr: string) => {
        try {
          const d = new Date(dStr);
          return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
        } catch (e) {
          return 0;
        }
      })
      .filter((t: number) => t > 0)
      .sort((a: number, b: number) => a - b);

    if (dates.length === 0) return 'Chưa xếp lịch';

    const formatDateLabel = (timeMs: number) => {
      const dateObj = new Date(timeMs);
      const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
      return `${dayNames[dateObj.getDay()]}, ${dateObj.getDate()} Thg ${dateObj.getMonth() + 1}`;
    };

    if (dates.length === 1) {
      return formatDateLabel(dates[0]);
    }

    return `${formatDateLabel(dates[0])} - ${formatDateLabel(dates[dates.length - 1])}`;
  };

  // Get selected raw round keys
  const selectedRawRounds = targetParsedRounds
    .filter(r => activeGroup === 'Tất cả' || !r.groupName || r.groupName === activeGroup)
    .map(r => r.rawRound);

  const currentMatches = selectedRawRounds.flatMap(raw => groupedMatches[raw] || []);

  return (
    <section className={`${styles.section} animate-fade-up stagger-2`}>
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>Danh sách trận đấu theo vòng</h3>
        
        {/* Main round filter tabs */}
        <div className={styles.pillTabs}>
          {roundNames.map(rn => (
            <button
              key={rn}
              className={`${styles.pillTab} ${activeRoundName === rn ? styles.pillTabActive : ''}`}
              onClick={() => handleRoundChange(rn)}
            >
              {rn}
            </button>
          ))}
        </div>

        {/* Round Switcher / Navigator (Mobile only) */}
        {roundNames.length > 0 && (
          <div className={styles.weekNavigator}>
            <button 
              className={styles.navBtn} 
              onClick={handlePrevRound}
              disabled={currentRoundIndex <= 0}
              aria-label="Vòng trước"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>

            <div className={styles.weekInfo}>
              <span className={styles.weekTitle}>{activeRoundName}</span>
              <span className={styles.weekDate}>{getActiveRoundDate()}</span>
            </div>

            <button 
              className={styles.navBtn} 
              onClick={handleNextRound}
              disabled={currentRoundIndex >= roundNames.length - 1}
              aria-label="Vòng sau"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
          </div>
        )}

        {/* Secondary group filter pills (if groups exist) */}
        {groupsInRound.length > 0 && (
          <div className={styles.subPillTabs}>
            <button
              className={`${styles.subPillTab} ${activeGroup === 'Tất cả' ? styles.subPillTabActive : ''}`}
              onClick={() => setActiveGroup('Tất cả')}
            >
              Tất cả các bảng
            </button>
            {groupsInRound.map(group => (
              <button
                key={group}
                className={`${styles.subPillTab} ${activeGroup === group ? styles.subPillTabActive : ''}`}
                onClick={() => setActiveGroup(group)}
              >
                {group}
              </button>
            ))}
          </div>
        )}
      </div>
      
      <div key={`${activeRoundName}-${activeGroup}`} className={styles.grid}>
        {currentMatches.length > 0 ? (
          currentMatches.map((t: any, i: number) => (
            <div key={t.id} className={`animate-fade-up stagger-${(i % 5) + 1}`}>
              <LiveMatchCard tran={t} />
            </div>
          ))
        ) : (
          <div className={styles.emptyState} style={{ gridColumn: 'span 2' }}>
            Không có trận đấu nào trong vòng này.
          </div>
        )}
      </div>
    </section>
  );
}

