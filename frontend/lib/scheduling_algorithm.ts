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

// Phase 2: Time & Space Allocation
export function generateScheduleCSP(pairs: MatchPair[], config: AdvancedScheduleConfig): ScheduledMatch[] {
  const scheduled: ScheduledMatch[] = [];
  
  // Track last played time for constraints
  // Record time in milliseconds
  const teamLastPlayTime = new Map<string, number>();
  
  // Generate valid slot combinations
  const startObj = new Date(config.startDate);
  const endObj = new Date(config.endDate);
  
  // Create an array of available slots chronologically
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
  
  // Sort slots chronologically
  availableSlots.sort((a, b) => a.timestamp - b.timestamp);

  // Group slots by timestamp to keep track of pitch availability
  const pitchUsage = new Map<number, number>(); // timestamp -> number of matches assigned

  const minRestMs = config.minRestHours * 60 * 60 * 1000;

  for (const pair of pairs) {
    if (!pair.homeId || !pair.awayId) continue;
    
    let placed = false;
    
    for (const slot of availableSlots) {
      // Check pitch constraints
      const currentUsage = pitchUsage.get(slot.timestamp) || 0;
      if (currentUsage >= config.pitchesAvailable) {
        continue;
      }
      
      // Check rest constraints
      const homeLast = teamLastPlayTime.get(pair.homeId) || 0;
      const awayLast = teamLastPlayTime.get(pair.awayId) || 0;
      
      if (slot.timestamp - homeLast >= minRestMs && slot.timestamp - awayLast >= minRestMs) {
        // Place match
        const assignedPitch = currentUsage + 1;
        pitchUsage.set(slot.timestamp, currentUsage + 1);
        
        teamLastPlayTime.set(pair.homeId, slot.timestamp);
        teamLastPlayTime.set(pair.awayId, slot.timestamp);
        
        scheduled.push({
          ...pair,
          date: slot.dateStr,
          time: slot.timeStr,
          pitch: assignedPitch
        });
        
        placed = true;
        break;
      }
    }
    
    if (!placed) {
      throw new Error(`Thuật toán không thể tìm thấy slot phù hợp cho trận ${pair.roundName} (Đội nhà: ${pair.homeId}, Đội khách: ${pair.awayId}). Vui lòng nới lỏng cấu hình (thêm ngày, thêm slot, giảm khoảng cách trận).`);
    }
  }

  return scheduled;
}
