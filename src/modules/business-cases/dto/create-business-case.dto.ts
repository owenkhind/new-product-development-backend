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

export class CreateBusinessCaseChannelGpSummaryDto {
  @IsString()
  @MaxLength(255)
  channelName!: string;

  @IsNumberString()
  expectedGpPercent!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class CreateBusinessCaseDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateBusinessCaseChannelGpSummaryDto)
  channelGpSummary!: CreateBusinessCaseChannelGpSummaryDto[];

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  commercialNotes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  financeNotes?: string;

  @IsNumberString()
  investmentNeeded!: string;

  @IsString()
  @MaxLength(4000)
  marketOpportunitySummary!: string;

  @IsString()
  @MaxLength(2000)
  productSummary!: string;

  @IsString()
  @MaxLength(1000)
  recommendation!: string;

  @IsString()
  @MaxLength(4000)
  riskSummary!: string;

  @IsNumberString()
  yearOneRevenue!: string;

  @IsNumberString()
  yearThreeRevenue!: string;

  @IsNumberString()
  yearTwoRevenue!: string;
}
