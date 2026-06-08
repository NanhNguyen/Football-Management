import { generateRoundRobin, generateScheduleCSP } from '../lib/scheduling_algorithm';

const teams = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8'];
const config = {
  startDate: '2026-06-05', // Friday
  endDate: '2026-08-30',
  matchDurationMinutes: 90,
  breakTimeMinutes: 15,
  playDays: [
    { dayOfWeek: 5, enabled: true },  // Friday
    { dayOfWeek: 6, enabled: true },  // Saturday
    { dayOfWeek: 0, enabled: true },  // Sunday
  ],
  timeSlots: [
    { id: '1', startTime: '18:30', endTime: '20:15' }
  ],
  pitchesAvailable: 2,
  minRestHours: 24,
  blackoutDates: []
};

try {
  console.log("Generating round robin pairs...");
  const pairs = generateRoundRobin(teams, 1, 'Vòng');
  console.log(`Generated ${pairs.length} match pairs.`);

  console.log("Running generateScheduleCSP...");
  const scheduled = generateScheduleCSP(pairs, config);
  console.log("SUCCESS! Scheduled matches:");
  scheduled.forEach((m: any) => {
    console.log(`[${m.roundName}] ${m.homeId} vs ${m.awayId} - ${m.date} ${m.time} (Sân ${m.pitch})`);
  });
} catch (err: any) {
  console.error("FAILED with error:");
  console.error(err.stack || err.message);
}
