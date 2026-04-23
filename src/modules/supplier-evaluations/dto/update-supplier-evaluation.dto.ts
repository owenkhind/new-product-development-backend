import { IsOptional, IsString, MaxLength } from 'class-validator';

import { CreateSupplierEvaluationSupplierDto } from './create-supplier-evaluation.dto';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, ValidateNested } from 'class-validator';

export class UpdateSupplierEvaluationDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  scoringMethodology?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  summary?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateSupplierEvaluationSupplierDto)
  suppliers?: CreateSupplierEvaluationSupplierDto[];
}
