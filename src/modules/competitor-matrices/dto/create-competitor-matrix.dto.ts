import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNumberString,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

class CreateCompetitorMatrixEntryDto {
  @IsString()
  @MaxLength(255)
  brandName!: string;

  @IsString()
  @MaxLength(255)
  competitorName!: string;

  @Min(0)
  @Max(5)
  designScore!: number;

  @Min(0)
  @Max(5)
  featureScore!: number;

  @IsString()
  @MaxLength(255)
  modelName!: string;

  @IsNumberString()
  price!: string;

  @IsArray()
  @IsString({ each: true })
  @MaxLength(255, { each: true })
  strengths!: string[];

  @Min(0)
  @Max(5)
  overallScore!: number;

  @Min(0)
  @Max(5)
  valueScore!: number;

  @IsArray()
  @IsString({ each: true })
  @MaxLength(255, { each: true })
  weaknesses!: string[];
}

export class CreateCompetitorMatrixDto {
  @IsArray()
  @ArrayMinSize(3)
  @ValidateNested({ each: true })
  @Type(() => CreateCompetitorMatrixEntryDto)
  entries!: CreateCompetitorMatrixEntryDto[];

  @IsString()
  @MaxLength(1000)
  scoringMethodology!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  summary?: string;
}

export { CreateCompetitorMatrixEntryDto };
