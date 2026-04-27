import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsISO8601,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

import { FeedbackSeverity } from '../../../enums/feedback-severity.enum';
import { FeedbackSource } from '../../../enums/feedback-source.enum';

export class CreateWeeklyFeedbackItemDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  actionOwner?: string;

  @IsString()
  @MaxLength(2000)
  feedback!: string;

  @IsBoolean()
  isResolved!: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @IsEnum(FeedbackSeverity)
  severity!: FeedbackSeverity;

  @IsEnum(FeedbackSource)
  source!: FeedbackSource;
}

export class CreateWeeklyFeedbackLogDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateWeeklyFeedbackItemDto)
  items!: CreateWeeklyFeedbackItemDto[];

  @IsString()
  @MaxLength(2000)
  summary!: string;

  @IsISO8601({ strict: true })
  weekStartDate!: string;
}
