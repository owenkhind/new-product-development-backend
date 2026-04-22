import { IsArray, IsInt, IsNumberString, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateMarketSizingDto {
  @IsInt()
  @Min(0)
  annualMarketSizeUnits!: number;

  @IsNumberString()
  annualMarketSizeValue!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  assumptions?: string;

  @IsString()
  @MaxLength(255)
  categoryName!: string;

  @IsArray()
  @IsString({ each: true })
  @MaxLength(255, { each: true })
  dataSources!: string[];

  @IsString()
  @MaxLength(255)
  targetPriceBand!: string;

  @IsString()
  @MaxLength(255)
  targetSegment!: string;

  @IsInt()
  @Min(0)
  yearOneSalesUnits!: number;

  @IsInt()
  @Min(0)
  yearThreeSalesUnits!: number;

  @IsInt()
  @Min(0)
  yearTwoSalesUnits!: number;
}
