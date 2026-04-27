import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsISO8601,
  IsNumberString,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

import { CreateGtmPlanChecklistItemDto } from './create-gtm-plan.dto';

export class UpdateGtmPlanDto {
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  activationPlan?: string;

  @IsOptional()
  @IsNumberString()
  budget?: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  campaignEndDate?: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  campaignStartDate?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateGtmPlanChecklistItemDto)
  checklistItems?: CreateGtmPlanChecklistItemDto[];

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  communicationsPlan?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  launchObjectives?: string;
}
