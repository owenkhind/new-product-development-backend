import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsISO8601,
  IsNumberString,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

import { GtmOwnerRole } from '../../../enums/gtm-owner-role.enum';

export class CreateGtmPlanChecklistItemDto {
  @IsOptional()
  @IsISO8601({ strict: true })
  dueDate?: string;

  @IsBoolean()
  isComplete!: boolean;

  @IsBoolean()
  isCritical!: boolean;

  @IsString()
  @MaxLength(255)
  itemName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @IsEnum(GtmOwnerRole)
  ownerRole!: GtmOwnerRole;
}

export class CreateGtmPlanDto {
  @IsString()
  @MaxLength(4000)
  activationPlan!: string;

  @IsNumberString()
  budget!: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  campaignEndDate?: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  campaignStartDate?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateGtmPlanChecklistItemDto)
  checklistItems!: CreateGtmPlanChecklistItemDto[];

  @IsString()
  @MaxLength(4000)
  communicationsPlan!: string;

  @IsString()
  @MaxLength(4000)
  launchObjectives!: string;
}
