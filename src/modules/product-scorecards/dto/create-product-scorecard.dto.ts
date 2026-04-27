import {
  IsInt,
  IsISO8601,
  IsNumberString,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateProductScorecardDto {
  @IsInt()
  @Min(0)
  complaintCount!: number;

  @IsNumberString()
  grossProfitPercent!: string;

  @IsNumberString()
  margin!: string;

  @IsString()
  @MaxLength(3000)
  marketFeedbackSummary!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @IsNumberString()
  revenue!: string;

  @IsISO8601({ strict: true })
  reviewDate!: string;

  @IsNumberString()
  sellThroughPercent!: string;
}
