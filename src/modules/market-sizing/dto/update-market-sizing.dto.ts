import { IsArray, IsInt, IsNumberString, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class UpdateMarketSizingDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  annualMarketSizeUnits?: number;

  @IsOptional()
  @IsNumberString()
  annualMarketSizeValue?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  assumptions?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  categoryName?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(255, { each: true })
  dataSources?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(255)
  targetPriceBand?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  targetSegment?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  yearOneSalesUnits?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  yearThreeSalesUnits?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  yearTwoSalesUnits?: number;
}
