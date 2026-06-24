import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TournamentTemplatesController } from './tournament-templates.controller';
import { TournamentTemplatesService } from './tournament-templates.service';
import { MatchService } from './tournament/match.service';
import { TournamentService } from './tournament/tournament.service';
import { TournamentController } from './tournament/tournament.controller';
import { AuthModule } from './auth/auth.module';
import { MatchEventsController } from './match-events/match-events.controller';

import { MatchTimerManager } from './tournament/match-timer.manager';
import { MatchesController } from './tournament/matches/matches.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule
  ],
  controllers: [AppController, TournamentTemplatesController, TournamentController, MatchEventsController, MatchesController],
  providers: [AppService, TournamentTemplatesService, MatchService, TournamentService, MatchTimerManager],
})
export class AppModule {}
