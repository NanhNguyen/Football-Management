import { Injectable, NotFoundException } from '@nestjs/common';
import { MatchService } from './match.service';
import {
  danhSachTranDau,
  giaiDauHienTai,
  danhSachDoi,
  BangXepHangItem,
} from '../data/mock-data';
import { TournamentRulesDto } from './dto/tournament-rules.dto';
import ws from 'ws';

@Injectable()
export class TournamentService {
  private readonly rulesMap = new Map<string, TournamentRulesDto>();

  constructor(private readonly matchService: MatchService) {}

  getTournamentRules(tournamentId: string): TournamentRulesDto {
    if (!this.rulesMap.has(tournamentId)) {
      // Initialize with default mock rules
      this.rulesMap.set(tournamentId, JSON.parse(JSON.stringify(giaiDauHienTai.rulesConfig)));
    }
    return this.rulesMap.get(tournamentId)!;
  }

  updateTournamentRules(tournamentId: string, rules: TournamentRulesDto) {
    this.rulesMap.set(tournamentId, rules);
    if (giaiDauHienTai.id === tournamentId) {
      giaiDauHienTai.rulesConfig = rules;
    }
    return rules;
  }

  /**
   * Tính toán và sắp xếp bảng xếp hạng
   */
  calculateLeaderboard(tournamentId: string): BangXepHangItem[] {
    const rules = this.getTournamentRules(tournamentId);
    const matches = danhSachTranDau; // Lấy tất cả trận đấu (nên filter theo tournamentId thực tế)

    // Khởi tạo bảng xếp hạng cho mỗi đội
    const stats: Record<string, BangXepHangItem> = {};
    for (const doi of danhSachDoi) {
      stats[doi.id] = {
        doiId: doi.id,
        bang: doi.bang,
        soTran: 0,
        thang: 0,
        hoa: 0,
        thua: 0,
        banThang: 0,
        banThua: 0,
        diem: 0,
      };
    }

    // Tính toán chỉ số từ các trận đã kết thúc
    const finishedMatches = matches.filter((m) => m.trangThai === 'KET_THUC');
    for (const match of finishedMatches) {
      const homeStats = stats[match.doiNhaId];
      const awayStats = stats[match.doiKhachId];

      if (!homeStats || !awayStats) continue;

      homeStats.soTran++;
      awayStats.soTran++;

      homeStats.banThang += match.tyDoiNha;
      homeStats.banThua += match.tyDoiKhach;

      awayStats.banThang += match.tyDoiKhach;
      awayStats.banThua += match.tyDoiNha;

      const { homePoints, awayPoints } = this.matchService.calculatePoints(
        match.tyDoiNha,
        match.tyDoiKhach,
        rules.pointsSystem,
      );

      homeStats.diem += homePoints;
      awayStats.diem += awayPoints;

      // Tính thắng/hòa/thua
      if (match.tyDoiNha > match.tyDoiKhach) {
        homeStats.thang++;
        awayStats.thua++;
      } else if (match.tyDoiNha < match.tyDoiKhach) {
        homeStats.thua++;
        awayStats.thang++;
      } else {
        homeStats.hoa++;
        awayStats.hoa++;
      }
    }

    const leaderboard = Object.values(stats);

    // Sắp xếp
    leaderboard.sort((a, b) => {
      // 1. Điểm số (Luôn là tiêu chí đầu tiên)
      if (b.diem !== a.diem) {
        return b.diem - a.diem;
      }

      // 2. Các tiêu chí phụ dựa trên tieBreakerPriority
      for (const tieBreaker of rules.tieBreakerPriority) {
        if (tieBreaker === 'headToHead') {
          // Tính thành tích đối đầu
          const h2hMatches = finishedMatches.filter(
            (m) =>
              (m.doiNhaId === a.doiId && m.doiKhachId === b.doiId) ||
              (m.doiNhaId === b.doiId && m.doiKhachId === a.doiId),
          );

          let aPts = 0;
          let bPts = 0;

          for (const m of h2hMatches) {
            const { homePoints, awayPoints } = this.matchService.calculatePoints(
              m.tyDoiNha,
              m.tyDoiKhach,
              rules.pointsSystem,
            );
            if (m.doiNhaId === a.doiId) {
              aPts += homePoints;
              bPts += awayPoints;
            } else {
              bPts += homePoints;
              aPts += awayPoints;
            }
          }

          if (aPts !== bPts) {
            return bPts - aPts; // Đội có điểm đối đầu cao hơn xếp trên
          }
        } else if (tieBreaker === 'goalDifference') {
          const aGD = a.banThang - a.banThua;
          const bGD = b.banThang - b.banThua;
          if (aGD !== bGD) {
            return bGD - aGD;
          }
        } else if (tieBreaker === 'goalsScored') {
          if (a.banThang !== b.banThang) {
            return b.banThang - a.banThang;
          }
        }
      }

      // Nếu vẫn bằng nhau
      return 0;
    });

    return leaderboard;
  }

  private getSimilarity(s1: string, s2: string): number {
    const norm1 = s1.trim().toLowerCase();
    const norm2 = s2.trim().toLowerCase();
    
    if (norm1 === norm2) return 1.0;
    
    const cleanStr = (s: string) => s.replace(/[^a-z0-9]/g, '');
    const c1 = cleanStr(norm1);
    const c2 = cleanStr(norm2);
    if (c1 === c2 && c1.length > 0) return 1.0;
    
    const track = Array(norm2.length + 1).fill(null).map(() =>
      Array(norm1.length + 1).fill(null)
    );
    for (let i = 0; i <= norm1.length; i += 1) {
      track[0][i] = i;
    }
    for (let j = 0; j <= norm2.length; j += 1) {
      track[j][0] = j;
    }
    for (let j = 1; j <= norm2.length; j += 1) {
      for (let i = 1; i <= norm1.length; i += 1) {
        const indicator = norm1[i - 1] === norm2[j - 1] ? 0 : 1;
        track[j][i] = Math.min(
          track[j][i - 1] + 1, // deletion
          track[j - 1][i] + 1, // insertion
          track[j - 1][i - 1] + indicator // substitution
        );
      }
    }
    const distance = track[norm2.length][norm1.length];
    const maxLen = Math.max(norm1.length, norm2.length);
    if (maxLen === 0) return 1.0;
    return (maxLen - distance) / maxLen;
  }

  private checkMatch(name1: string, name2: string): boolean {
    const n1 = name1.trim().toLowerCase();
    const n2 = name2.trim().toLowerCase();
    if (n1 === n2) return true;
    
    const clean = (s: string) => s.replace(/\b(fc|football club|club|sc|women|u21|youth)\b/g, '').replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
    const c1 = clean(n1);
    const c2 = clean(n2);
    if (c1 === c2 && c1.length > 0) return true;
    
    const sim = this.getSimilarity(c1, c2);
    if (sim >= 0.9) return true;
    
    if (c1.includes(c2) || c2.includes(c1)) {
      const minLen = Math.min(c1.length, c2.length);
      const maxLen = Math.max(c1.length, c2.length);
      if (minLen / maxLen >= 0.7) {
        return true;
      }
    }
    
    return false;
  }

  async syncTeamLogos(tournamentId: string) {
    const fs = require('fs');
    const path = require('path');
    const { createClient } = require('@supabase/supabase-js');

    const envPath = path.resolve(process.cwd(), '../frontend/.env.local');
    let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    let supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
      const keyMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/);
      if (urlMatch) supabaseUrl = urlMatch[1].trim();
      if (keyMatch) supabaseAnonKey = keyMatch[1].trim();
    }

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Supabase credentials not found');
      return { success: false, error: 'Supabase credentials not found' };
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      realtime: {
        transport: ws as any,
      },
    });

    const { data: dbTeams, error: dbError } = await supabase
      .from('doi_bong')
      .select('*')
      .eq('giai_dau_id', tournamentId)
      .is('external_api_id', null);

    if (dbError) {
      console.error('Error fetching teams from Supabase:', dbError);
      return { success: false, error: dbError.message };
    }

    if (!dbTeams || dbTeams.length === 0) {
      return { success: true, count: 0 };
    }

    let syncCount = 0;

    for (const team of dbTeams) {
      try {
        const res = await fetch(`https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(team.ten)}`);
        if (!res.ok) continue;
        const data = await res.json();
        if (data && data.teams && data.teams.length > 0) {
          let matchedApiTeam: any = null;
          for (const apiTeam of data.teams) {
            if (this.checkMatch(team.ten, apiTeam.strTeam)) {
              matchedApiTeam = apiTeam;
              break;
            }
          }

          if (matchedApiTeam) {
            const externalId = parseInt(matchedApiTeam.idTeam);
            const logoUrl = matchedApiTeam.strBadge;

            const { error: updateError } = await supabase
              .from('doi_bong')
              .update({
                external_api_id: externalId,
                logo: logoUrl,
                logo_source: 'EXTERNAL_API'
              })
              .eq('id', team.id);

            if (!updateError) {
              syncCount++;
            } else {
              console.error(`Error updating team ${team.ten}:`, updateError);
            }
          }
        }
      } catch (err) {
        console.error(`Error syncing team ${team.ten}:`, err);
      }
    }

    return { success: true, count: syncCount };
  }
}
