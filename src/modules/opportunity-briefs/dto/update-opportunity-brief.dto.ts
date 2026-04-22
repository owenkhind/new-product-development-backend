import { IsArray, IsBoolean, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class UpdateOpportunityBriefDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(2)
  affordableCostScore?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(2)
  affordablePriceScore?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(2)
  affordableValueScore?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  complianceNotes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  opportunitySource?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  problemStatement?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(2)
  reliableComplianceScore?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(2)
  reliableDurabilityScore?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(2)
  reliableServiceScore?: number;

  @IsOptional()
  @IsBoolean()
  requiredDocumentsComplete?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  targetCustomer?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  targetMarket?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(2)
  trendyCategoryScore?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(2)
  trendyColourScore?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(2)
  trendyDesignScore?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(255, { each: true })
  uniqueSellingPoints?: string[];
}
