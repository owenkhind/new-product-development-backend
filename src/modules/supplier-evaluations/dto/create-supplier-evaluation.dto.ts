import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsNumberString,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateSupplierEvaluationSupplierDto {
  @IsString()
  @MaxLength(255)
  factoryName!: string;

  @IsBoolean()
  isQualified!: boolean;

  @IsInt()
  @Min(0)
  leadTimeDays!: number;

  @IsInt()
  @Min(0)
  moq!: number;

  @IsString()
  @MaxLength(255)
  originCountry!: string;

  @IsString()
  @MaxLength(255)
  paymentTerms!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  remarks?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  sparePartsSupportNotes?: string;

  @IsString()
  @MaxLength(255)
  supplierName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  toolingNotes?: string;

  @IsNumberString()
  weightedScore!: string;
}

export class CreateSupplierEvaluationDto {
  @IsString()
  @MaxLength(1000)
  scoringMethodology!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  summary?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateSupplierEvaluationSupplierDto)
  suppliers!: CreateSupplierEvaluationSupplierDto[];
}
