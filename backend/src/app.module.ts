import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TournamentTemplatesController } from './tournament-templates.controller';
import { TournamentTemplatesService } from './tournament-templates.service';

@Module({
  imports: [],
  controllers: [AppController, TournamentTemplatesController],
  providers: [AppService, TournamentTemplatesService],
})
export class AppModule {}
