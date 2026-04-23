import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNumberString,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

import { CreateBusinessCaseChannelGpSummaryDto } from './create-business-case.dto';

export class UpdateBusinessCaseDto {
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateBusinessCaseChannelGpSummaryDto)
  channelGpSummary?: CreateBusinessCaseChannelGpSummaryDto[];

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  commercialNotes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  financeNotes?: string;

  @IsOptional()
  @IsNumberString()
  investmentNeeded?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  marketOpportunitySummary?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  productSummary?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  recommendation?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  riskSummary?: string;

  @IsOptional()
  @IsNumberString()
  yearOneRevenue?: string;

  @IsOptional()
  @IsNumberString()
  yearThreeRevenue?: string;

  @IsOptional()
  @IsNumberString()
  yearTwoRevenue?: string;
}
