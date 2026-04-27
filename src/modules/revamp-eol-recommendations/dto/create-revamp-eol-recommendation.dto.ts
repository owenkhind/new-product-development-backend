import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

import { RevampEolRecommendationOutcome } from '../../../enums/revamp-eol-recommendation-outcome.enum';

export class CreateRevampEolRecommendationDto {
  @IsOptional()
  @IsString()
  @MaxLength(3000)
  eolOption?: string;

  @IsOptional()
  @IsString()
  @MaxLength(3000)
  holdOption?: string;

  @IsEnum(RevampEolRecommendationOutcome)
  recommendationOutcome!: RevampEolRecommendationOutcome;

  @IsString()
  @MaxLength(5000)
  recommendationSummary!: string;

  @IsOptional()
  @IsString()
  @MaxLength(3000)
  revampOption?: string;

  @IsString()
  @MaxLength(5000)
  rootCauseAnalysis!: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @MaxLength(255, { each: true })
  triggerReasons!: string[];
}
