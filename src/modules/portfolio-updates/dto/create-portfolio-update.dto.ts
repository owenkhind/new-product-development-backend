import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';

import { PortfolioReviewStatus } from '../../../enums/portfolio-review-status.enum';
import { ProductScorecardClass } from '../../../enums/product-scorecard-class.enum';

export class CreatePortfolioUpdateRowDto {
  @IsString()
  @MaxLength(2000)
  actionRecommendation!: string;

  @IsEnum(ProductScorecardClass)
  classification!: ProductScorecardClass;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @IsUUID()
  productId!: string;

  @IsOptional()
  @IsUUID()
  scorecardId?: string;
}

export class CreatePortfolioUpdateDto {
  @IsOptional()
  @IsEnum(PortfolioReviewStatus)
  cooReviewStatus?: PortfolioReviewStatus;

  @IsString()
  @MaxLength(20)
  reviewQuarter!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreatePortfolioUpdateRowDto)
  rows!: CreatePortfolioUpdateRowDto[];

  @IsString()
  @MaxLength(5000)
  summary!: string;
}
