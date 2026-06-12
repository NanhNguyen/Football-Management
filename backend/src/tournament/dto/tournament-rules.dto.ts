import { IsArray, IsBoolean, IsNumber, IsString, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class ScoreImpactDto {
  @IsBoolean()
  enabled: boolean;

  @IsNumber()
  value: number;

  @IsString()
  side: 'own' | 'opponent';
}

export class LeagueImpactDto {
  @IsBoolean()
  enabled: boolean;

  @IsString()
  action: 'add' | 'subtract';

  @IsNumber()
  value: number;
}

export class CustomEventDto {
  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsString()
  icon: string;

  @IsString()
  color: string;

  @IsString()
  target_scope: 'none' | '1_player' | '2_players' | 'team';

  @IsString()
  @IsOptional()
  role_1?: string;

  @IsString()
  @IsOptional()
  role_2?: string;

  @ValidateNested()
  @Type(() => ScoreImpactDto)
  score_impact: ScoreImpactDto;

  @ValidateNested()
  @Type(() => LeagueImpactDto)
  league_impact: LeagueImpactDto;
}

export class MatchFormatDto {
  @IsNumber()
  playersPerTeam: number;

  @IsNumber()
  minutesPerHalf: number;

  @IsBoolean()
  penaltyIfDraw: boolean;
}

export class PointsSystemDto {
  @IsNumber()
  win: number;

  @IsNumber()
  draw: number;

  @IsNumber()
  loss: number;

  @IsNumber()
  winByPenalty: number;

  @IsNumber()
  lossByPenalty: number;
}

export class TournamentRulesDto {
  @ValidateNested()
  @Type(() => MatchFormatDto)
  matchFormat: MatchFormatDto;

  @ValidateNested()
  @Type(() => PointsSystemDto)
  pointsSystem: PointsSystemDto;

  @IsArray()
  @IsString({ each: true })
  tieBreakerPriority: string[]; // e.g. ['headToHead', 'goalDifference', 'goalsScored']

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomEventDto)
  custom_events: CustomEventDto[];
}
