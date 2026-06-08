export interface AdvancedScheduleConfig {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  matchDurationMinutes: number;
  breakTimeMinutes: number;
  playDays: { dayOfWeek: number; enabled: boolean }[];
  timeSlots: { id: string; startTime: string; endTime: string }[];
  pitchesAvailable: number;
  minRestHours: number;
  blackoutDates: string[]; // YYYY-MM-DD format
}

export interface MatchPair {
  homeId: string | null; // null for dummy
  awayId: string | null;
  roundName: string;
}

export interface ScheduledMatch extends MatchPair {
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  pitch: number; // 1 to pitchesAvailable
}

// Generate all MatchPairs (Round Robin)
export function generateRoundRobin(teams: string[], numLegs: number = 1, prefix: string = 'Vòng', sequential: boolean = false): MatchPair[] {
  let teamIds = [...teams];
  if (teamIds.length % 2 !== 0) {
    teamIds.push('DUMMY');
  }

  const matchPairs: MatchPair[] = [];
  const numRounds = teamIds.length - 1;
  const halfSize = teamIds.length / 2;

  let currentLeg = 1;
  while (currentLeg <= numLegs) {
    let currentTeams = [...teamIds];
    for (let round = 0; round < numRounds; round++) {
      const roundNum = sequential ? (currentLeg - 1) * numRounds + (round + 1) : (round + 1);
      const roundName = (numLegs > 1 && !sequential) ? `${prefix} ${roundNum} (Lượt ${currentLeg})` : `${prefix} ${roundNum}`;
      
      for (let i = 0; i < halfSize; i++) {
        let home = currentTeams[i];
        let away = currentTeams[currentTeams.length - 1 - i];
        
        // Alternate home/away for fairness
        if (round % 2 === 1 && i === 0) {
          const temp = home;
          home = away;
          away = temp;
        }
        
        // Reverse home/away for second leg
        if (currentLeg % 2 === 0) {
          const temp = home;
          home = away;
          away = temp;
        }

        if (home !== 'DUMMY' && away !== 'DUMMY') {
          matchPairs.push({ homeId: home, awayId: away, roundName });
        }
      }
      // Rotate
      const first = currentTeams.shift()!;
      const last = currentTeams.pop()!;
      currentTeams.splice(1, 0, last);
      currentTeams.unshift(first);
    }
    currentLeg++;
  }

  return matchPairs;
}

function getGenericRoundKey(roundName: string): string {
  if (!roundName) return '';
  // If it's "Bảng A - Vòng 1" or "Vòng 1 - Bảng A" -> "Vòng 1"
  const groupVongMatch = roundName.match(/Bảng\s+[A-Z]\s+-\s+(Vòng\s+\d+)/i) || roundName.match(/(Vòng\s+\d+)\s+-\s+Bảng\s+[A-Z]/i);
  if (groupVongMatch) {
    return groupVongMatch[1];
  }
  // Map "Chung kết" and "Tranh hạng ba" to the same week
  if (roundName === 'Chung kết' || roundName === 'Tranh hạng ba') {
    return 'Chung kết & Tranh hạng ba';
  }
  // If it's "Vòng 1/8 - Trận 1" -> "Vòng 1/8"
  // "Tứ kết - Trận 2" -> "Tứ kết"
  return roundName.split(' - ')[0];
}

// Phase 2: Time & Space Allocation
export function generateScheduleCSP(pairs: MatchPair[], config: AdvancedScheduleConfig): ScheduledMatch[] {
  const scheduled: ScheduledMatch[] = [];
  
  const teamLastPlayTime = new Map<string, number>();
  
  const startObj = new Date(config.startDate);
  const endObj = new Date(config.endDate);
  
  const availableSlots: { dateStr: string; timestamp: number; timeStr: string }[] = [];
  
  let curr = new Date(startObj);
  while (curr <= endObj) {
    const dayOfWeek = curr.getDay(); // 0 = Sunday, 1 = Monday
    const isPlayDay = config.playDays.find(d => d.dayOfWeek === dayOfWeek)?.enabled;
    const dateStr = curr.toISOString().split('T')[0];
    
    if (isPlayDay && !(config.blackoutDates || []).includes(dateStr)) {
      for (const slot of config.timeSlots) {
        const [hours, mins] = slot.startTime.split(':').map(Number);
        const slotDate = new Date(curr);
        slotDate.setHours(hours, mins, 0, 0);
        availableSlots.push({
          dateStr,
          timestamp: slotDate.getTime(),
          timeStr: slot.startTime
        });
      }
    }
    curr.setDate(curr.getDate() + 1);
  }
  
  availableSlots.sort((a, b) => a.timestamp - b.timestamp);

  // Group slots into Weeks using start of week date (Monday)
  const weeksMap = new Map<string, typeof availableSlots>();
  for (const slot of availableSlots) {
     const date = new Date(slot.timestamp);
     const day = date.getDay();
     // Find the Monday of this week.
     // Sunday is 0, Monday is 1, ..., Saturday is 6.
     // Sunday: subtract 6 days. Monday: subtract 0 days. Tuesday: subtract 1 day, etc.
     const diffDays = day === 0 ? 6 : day - 1;
     
     const monday = new Date(date);
     monday.setDate(monday.getDate() - diffDays);
     
     const weekKey = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
     
     if (!weeksMap.has(weekKey)) {
        weeksMap.set(weekKey, []);
     }
     weeksMap.get(weekKey)!.push(slot);
  }
  const weeks = Array.from(weeksMap.values()).sort((a, b) => a[0].timestamp - b[0].timestamp);

  const pitchUsage = new Map<number, number>();
  const minRestMs = config.minRestHours * 60 * 60 * 1000;

  // Group matches by Generic Round Identifier to allow concurrent same-week play for groups & matches
  const roundsMap = new Map<string, MatchPair[]>();
  for (const p of pairs) {
     const key = getGenericRoundKey(p.roundName);
     if (!roundsMap.has(key)) roundsMap.set(key, []);
     roundsMap.get(key)!.push(p);
  }

  let weekIndex = 0;

  for (const [roundName, roundMatches] of roundsMap.entries()) {
    // For each round, we try to schedule all its matches in the current week.
    // To ensure even distribution across Days and Time Slots, we interleave the week's slots.
    let matchesPlacedInRound = 0;

    while (matchesPlacedInRound < roundMatches.length) {
      if (weekIndex >= weeks.length) {
        throw new Error(`Không đủ thời gian để xếp lịch cho ${roundName}. Vui lòng nới rộng Ngày kết thúc hoặc thêm Ngày thi đấu/Khung giờ.`);
      }

      const currentWeek = weeks[weekIndex];
      
      // Interleave slots: [Day1_Slot1, Day2_Slot1, Day3_Slot1, Day1_Slot2, Day2_Slot2...]
      const daysMap = new Map<string, typeof availableSlots>();
      currentWeek.forEach(s => {
          if (!daysMap.has(s.dateStr)) daysMap.set(s.dateStr, []);
          daysMap.get(s.dateStr)!.push(s);
      });
      const dayKeys = Array.from(daysMap.keys());
      let maxSlotsInADay = Math.max(...dayKeys.map(k => daysMap.get(k)!.length));
      
      const interleavedSlots: typeof availableSlots = [];
      for (let i = 0; i < maxSlotsInADay; i++) {
          for (const d of dayKeys) {
              const slotsOfD = daysMap.get(d)!;
              if (i < slotsOfD.length) interleavedSlots.push(slotsOfD[i]);
          }
      }

      let slotPointer = 0;
      let madeProgressInWeek = false;

      // Make multiple passes over the interleaved slots until all matches of the round are placed or no progress can be made
      let consecutiveFails = 0;
      
      while (matchesPlacedInRound < roundMatches.length && consecutiveFails < roundMatches.length * interleavedSlots.length) {
        const pair = roundMatches[matchesPlacedInRound];
        const slot = interleavedSlots[slotPointer % interleavedSlots.length];
        slotPointer++;

        const currentUsage = pitchUsage.get(slot.timestamp) || 0;
        const isKnockoutMatch = !pair.homeId || !pair.awayId;

        if (isKnockoutMatch) {
          if (currentUsage < config.pitchesAvailable) {
            pitchUsage.set(slot.timestamp, currentUsage + 1);
            
            scheduled.push({
              ...pair,
              date: slot.dateStr,
              time: slot.timeStr,
              pitch: currentUsage + 1
            });
            
            matchesPlacedInRound++;
            consecutiveFails = 0;
            madeProgressInWeek = true;
          } else {
            consecutiveFails++;
          }
        } else {
          const homeLast = teamLastPlayTime.get(pair.homeId!) || 0;
          const awayLast = teamLastPlayTime.get(pair.awayId!) || 0;

          if (currentUsage < config.pitchesAvailable && 
              slot.timestamp - homeLast >= minRestMs && 
              slot.timestamp - awayLast >= minRestMs) {
            
            pitchUsage.set(slot.timestamp, currentUsage + 1);
            teamLastPlayTime.set(pair.homeId!, slot.timestamp);
            teamLastPlayTime.set(pair.awayId!, slot.timestamp);
            
            scheduled.push({
              ...pair,
              date: slot.dateStr,
              time: slot.timeStr,
              pitch: currentUsage + 1
            });
            
            matchesPlacedInRound++;
            consecutiveFails = 0;
            madeProgressInWeek = true;
          } else {
            consecutiveFails++;
          }
        }
      }

      // If we couldn't place all matches of this round in the current week, we move to the next week
      if (matchesPlacedInRound < roundMatches.length) {
        weekIndex++;
      }
    }
    
    // Move to next week for the NEXT round to ensure 1 Round per Week (unless they are small enough? No, usually 1 round = 1 week)
    weekIndex++;
  }

  return scheduled;
}
