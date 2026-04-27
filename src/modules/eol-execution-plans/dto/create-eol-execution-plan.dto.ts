import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
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
import { EolMilestoneStatus } from '../../../enums/eol-milestone-status.enum';

export class CreateEolStockPositionDto {
  @IsEnum(ChannelType)
  channelType!: ChannelType;

  @IsNumberString()
  estimatedStockValue!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @IsInt()
  @Min(0)
  onHandUnits!: number;

  @IsInt()
  @Min(0)
  reservedUnits!: number;
}

export class CreateEolMilestoneDto {
  @IsISO8601({ strict: true })
  dueDate!: string;

  @IsString()
  @MaxLength(255)
  milestoneName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @IsString()
  @MaxLength(100)
  ownerRole!: string;

  @IsEnum(EolMilestoneStatus)
  status!: EolMilestoneStatus;
}

export class CreateEolExecutionPlanDto {
  @IsString()
  @MaxLength(5000)
  kdHandoffNotes!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateEolMilestoneDto)
  milestones!: CreateEolMilestoneDto[];

  @IsString()
  @MaxLength(5000)
  serviceContinuityPlan!: string;

  @IsString()
  @MaxLength(5000)
  sparePartsPlan!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateEolStockPositionDto)
  stockPositions!: CreateEolStockPositionDto[];

  @IsString()
  @MaxLength(5000)
  summary!: string;
}
