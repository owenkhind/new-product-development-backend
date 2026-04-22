import { IsArray, IsBoolean, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreateOpportunityBriefDto {
  @IsInt()
  @Min(0)
  @Max(2)
  affordableCostScore!: number;

  @IsInt()
  @Min(0)
  @Max(2)
  affordablePriceScore!: number;

  @IsInt()
  @Min(0)
  @Max(2)
  affordableValueScore!: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  complianceNotes?: string;

  @IsString()
  @MaxLength(255)
  opportunitySource!: string;

  @IsString()
  @MaxLength(4000)
  problemStatement!: string;

  @IsInt()
  @Min(0)
  @Max(2)
  reliableComplianceScore!: number;

  @IsInt()
  @Min(0)
  @Max(2)
  reliableDurabilityScore!: number;

  @IsInt()
  @Min(0)
  @Max(2)
  reliableServiceScore!: number;

  @IsBoolean()
  requiredDocumentsComplete!: boolean;

  @IsString()
  @MaxLength(255)
  targetCustomer!: string;

  @IsString()
  @MaxLength(255)
  targetMarket!: string;

  @IsInt()
  @Min(0)
  @Max(2)
  trendyCategoryScore!: number;

  @IsInt()
  @Min(0)
  @Max(2)
  trendyColourScore!: number;

  @IsInt()
  @Min(0)
  @Max(2)
  trendyDesignScore!: number;

  @IsArray()
  @IsString({ each: true })
  @MaxLength(255, { each: true })
  uniqueSellingPoints!: string[];
}
