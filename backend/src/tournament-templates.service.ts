import { Injectable, NotFoundException } from '@nestjs/common';
import { tournamentTemplates, TournamentTemplate } from './data/tournament-templates';

@Injectable()
export class TournamentTemplatesService {
  getAllTemplates(): TournamentTemplate[] {
    return tournamentTemplates;
  }

  getTemplateByCode(code: string): TournamentTemplate {
    const template = tournamentTemplates.find(t => t.code === code);
    if (!template) {
      throw new NotFoundException(`Tournament template with code ${code} not found`);
    }
    return template;
  }
}
