import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsISO8601,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

import { CreateWeeklyFeedbackItemDto } from './create-weekly-feedback-log.dto';

export class UpdateWeeklyFeedbackLogDto {
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateWeeklyFeedbackItemDto)
  items?: CreateWeeklyFeedbackItemDto[];

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  summary?: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  weekStartDate?: string;
}
