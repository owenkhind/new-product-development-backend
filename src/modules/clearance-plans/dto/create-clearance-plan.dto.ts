import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsISO8601,
  IsNumberString,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

import { ChannelType } from '../../../enums/channel-type.enum';
import { ClearanceTrackerStatus } from '../../../enums/clearance-tracker-status.enum';

export class CreateClearancePricingDto {
  @IsEnum(ChannelType)
  channelType!: ChannelType;

  @IsNumberString()
  clearanceRsp!: string;

  @IsNumberString()
  floorPrice!: string;

  @IsBoolean()
  markdownApproved!: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @IsNumberString()
  originalRsp!: string;
}

export class CreateClearanceAllocationDto {
  @IsInt()
  @Min(0)
  allocatedUnits!: number;

  @IsEnum(ChannelType)
  channelType!: ChannelType;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class CreateClearanceWeeklyTrackerDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @IsEnum(ClearanceTrackerStatus)
  status!: ClearanceTrackerStatus;

  @IsInt()
  @Min(0)
  unitsCleared!: number;

  @IsISO8601({ strict: true })
  weekStartDate!: string;
}

export class CreateClearancePlanDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateClearanceAllocationDto)
  allocations!: CreateClearanceAllocationDto[];

  @IsString()
  @MaxLength(5000)
  executionInstructions!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateClearancePricingDto)
  pricingRows!: CreateClearancePricingDto[];

  @IsString()
  @MaxLength(5000)
  summary!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateClearanceWeeklyTrackerDto)
  weeklyTrackers!: CreateClearanceWeeklyTrackerDto[];
}
