import { Controller, Get, Param } from '@nestjs/common';
import { TournamentTemplatesService } from './tournament-templates.service';

@Controller('tournament-templates')
export class TournamentTemplatesController {
  constructor(private readonly templatesService: TournamentTemplatesService) {}

  @Get()
  getAllTemplates() {
    return this.templatesService.getAllTemplates();
  }

  @Get(':code')
  getTemplateByCode(@Param('code') code: string) {
    return this.templatesService.getTemplateByCode(code);
  }
}
