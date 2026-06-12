import { Injectable, NotFoundException } from '@nestjs/common';
import { MatchService } from './match.service';
import {
  danhSachTranDau,
  giaiDauHienTai,
  danhSachDoi,
  BangXepHangItem,
} from '../data/mock-data';
import { TournamentRulesDto } from './dto/tournament-rules.dto';

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
}
