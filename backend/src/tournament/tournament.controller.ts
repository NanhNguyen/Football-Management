import { Controller, Get, Param, Put, Body } from '@nestjs/common';
import { TournamentService } from './tournament.service';
import { TournamentRulesDto } from './dto/tournament-rules.dto';

@Controller('tournaments')
export class TournamentController {
  constructor(private readonly tournamentService: TournamentService) {}

  @Get(':id/rules')
  getRules(@Param('id') id: string) {
    return this.tournamentService.getTournamentRules(id);
  }

  @Put(':id/rules')
  updateRules(
    @Param('id') id: string,
    @Body() rules: TournamentRulesDto,
  ) {
    return this.tournamentService.updateTournamentRules(id, rules);
  }

  @Get(':id/leaderboard')
  getLeaderboard(@Param('id') id: string) {
    return this.tournamentService.calculateLeaderboard(id);
  }
}
