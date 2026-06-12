import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TournamentTemplatesController } from './tournament-templates.controller';
import { TournamentTemplatesService } from './tournament-templates.service';
import { MatchService } from './tournament/match.service';
import { TournamentService } from './tournament/tournament.service';
import { TournamentController } from './tournament/tournament.controller';

@Module({
  imports: [],
  controllers: [AppController, TournamentTemplatesController, TournamentController],
  providers: [AppService, TournamentTemplatesService, MatchService, TournamentService],
})
export class AppModule {}
