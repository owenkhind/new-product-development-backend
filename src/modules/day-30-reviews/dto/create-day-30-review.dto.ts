import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNumberString,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

import { ChannelType } from '../../../enums/channel-type.enum';
import { Day30Verdict } from '../../../enums/day-30-verdict.enum';

export class CreateDay30ReviewChannelGpDto {
  @IsNumberString()
  actualGpPercent!: string;

  @IsEnum(ChannelType)
  channelType!: ChannelType;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class CreateDay30ReviewDto {
  @IsString()
  @MaxLength(4000)
  actionPlan!: string;

  @IsNumberString()
  actualRevenue!: string;

  @IsInt()
  @Min(0)
  actualSellThroughUnits!: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateDay30ReviewChannelGpDto)
  channelGp!: CreateDay30ReviewChannelGpDto[];

  @IsString()
  @MaxLength(4000)
  reviewSummary!: string;

  @IsNumberString()
  targetRevenue!: string;

  @IsInt()
  @Min(0)
  targetSellThroughUnits!: number;

  @IsEnum(Day30Verdict)
  verdict!: Day30Verdict;
}
