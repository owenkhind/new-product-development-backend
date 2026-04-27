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

import { Day30Verdict } from '../../../enums/day-30-verdict.enum';
import { CreateDay30ReviewChannelGpDto } from './create-day-30-review.dto';

export class UpdateDay30ReviewDto {
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  actionPlan?: string;

  @IsOptional()
  @IsNumberString()
  actualRevenue?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  actualSellThroughUnits?: number;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateDay30ReviewChannelGpDto)
  channelGp?: CreateDay30ReviewChannelGpDto[];

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  reviewSummary?: string;

  @IsOptional()
  @IsNumberString()
  targetRevenue?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  targetSellThroughUnits?: number;

  @IsOptional()
  @IsEnum(Day30Verdict)
  verdict?: Day30Verdict;
}
