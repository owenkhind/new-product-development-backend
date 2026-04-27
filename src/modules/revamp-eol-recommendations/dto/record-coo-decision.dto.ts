import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

import { RevampEolDecision } from '../../../enums/revamp-eol-decision.enum';

export class RecordCooDecisionDto {
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  comment?: string;

  @IsEnum(RevampEolDecision)
  decision!: RevampEolDecision;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  overrideReason?: string;
}
