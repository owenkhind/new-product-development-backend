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

import { CreateSellInReportAccountDto } from './create-sell-in-report.dto';

export class UpdateSellInReportDto {
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateSellInReportAccountDto)
  accounts?: CreateSellInReportAccountDto[];

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  reportPeriodEnd?: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  reportPeriodStart?: string;
}
