export interface TournamentTemplate {
  code: string;
  name: string;
  description: string;
  defaultConfig: {
    theThuc: 'tournament' | 'league';
    luotVongBang?: number;
    soVongLeague?: number;
    maxTeams: number;
    maxPlayers: number;
    starterCount: number;
    benchCount: number;
    matchDurationMinutes: number;
    breakTimeMinutes: number;
    minRestHours: number;
    matchesPerWeek: number;
    pitchesAvailable: number;
    standingsConfig: {
      phongDo: boolean;
      thePhat: boolean;
    };
  };
}

export const tournamentTemplates: TournamentTemplate[] = [
  {
    code: 'TOURNAMENT',
    name: 'Tournament (Đấu cúp/Loại trực tiếp)',
    description: 'Chia cặp đấu loại trực tiếp từng vòng cho đến chung kết.',
    defaultConfig: {
      theThuc: 'tournament',
      luotVongBang: 1, // Dùng cho số lượt đấu (lượt đi/về)
      maxTeams: 16,
      maxPlayers: 20,
      starterCount: 7,
      benchCount: 7,
      matchDurationMinutes: 90,
      breakTimeMinutes: 15,
      minRestHours: 48,
      matchesPerWeek: 4,
      pitchesAvailable: 2,
      standingsConfig: { phongDo: false, thePhat: false }
    }
  },
  {
    code: 'LEAGUE',
    name: 'League (Đấu vòng tròn)',
    description: 'Các đội thi đấu vòng tròn tính điểm.',
    defaultConfig: {
      theThuc: 'league',
      soVongLeague: 1,
      maxTeams: 16,
      maxPlayers: 20,
      starterCount: 7,
      benchCount: 7,
      matchDurationMinutes: 90,
      breakTimeMinutes: 15,
      minRestHours: 48,
      matchesPerWeek: 8,
      pitchesAvailable: 2,
      standingsConfig: { phongDo: true, thePhat: true }
    }
  },
  {
    code: 'MIXED',
    name: 'Tournament (Vòng bảng + Loại trực tiếp)',
    description: 'Thi đấu vòng bảng tính điểm, sau đó các đội nhất nhì vào đá loại trực tiếp.',
    defaultConfig: {
      theThuc: 'tournament',
      luotVongBang: 1,
      maxTeams: 16,
      maxPlayers: 20,
      starterCount: 7,
      benchCount: 7,
      matchDurationMinutes: 90,
      breakTimeMinutes: 15,
      minRestHours: 48,
      matchesPerWeek: 8,
      pitchesAvailable: 2,
      standingsConfig: { phongDo: true, thePhat: false }
    }
  }
];
