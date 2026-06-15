import { Controller, Get, Param, Put, Post, Body, UseGuards } from '@nestjs/common';
import { TournamentService } from './tournament.service';
import { TournamentRulesDto } from './dto/tournament-rules.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('tournaments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TournamentController {
  constructor(private readonly tournamentService: TournamentService) {}

  @Get(':id/rules')
  getRules(@Param('id') id: string) {
    return this.tournamentService.getTournamentRules(id);
  }

  @Put(':id/rules')
  @Roles('admin')
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

  @Post(':id/sync-team-logos')
  @Roles('admin')
  async syncTeamLogos(@Param('id') id: string) {
    return this.tournamentService.syncTeamLogos(id);
  }
}
