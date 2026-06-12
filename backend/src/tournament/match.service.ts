import { Injectable } from '@nestjs/common';
import { PointsSystemDto } from './dto/tournament-rules.dto';

@Injectable()
export class MatchService {
  /**
   * Tính điểm cho 2 đội dựa vào kết quả trận đấu và hệ thống điểm số
   */
  calculatePoints(
    homeGoals: number,
    awayGoals: number,
    pointsSystem: PointsSystemDto,
    isKnockout: boolean = false, // Nếu có penalty thì truyền thêm kết quả penalty
    homePenaltyGoals?: number,
    awayPenaltyGoals?: number,
  ): { homePoints: number; awayPoints: number } {
    let homePoints = 0;
    let awayPoints = 0;

    if (homeGoals > awayGoals) {
      homePoints = pointsSystem.win;
      awayPoints = pointsSystem.loss;
    } else if (homeGoals < awayGoals) {
      homePoints = pointsSystem.loss;
      awayPoints = pointsSystem.win;
    } else {
      // Hòa
      if (homePenaltyGoals !== undefined && awayPenaltyGoals !== undefined) {
        // Có sút luân lưu
        if (homePenaltyGoals > awayPenaltyGoals) {
          homePoints = pointsSystem.winByPenalty;
          awayPoints = pointsSystem.lossByPenalty;
        } else {
          homePoints = pointsSystem.lossByPenalty;
          awayPoints = pointsSystem.winByPenalty;
        }
      } else {
        homePoints = pointsSystem.draw;
        awayPoints = pointsSystem.draw;
      }
    }

    return { homePoints, awayPoints };
  }
}
