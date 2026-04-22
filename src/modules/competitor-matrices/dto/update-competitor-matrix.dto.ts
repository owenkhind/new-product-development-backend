import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';

import { CreateCompetitorMatrixEntryDto } from './create-competitor-matrix.dto';

export class UpdateCompetitorMatrixDto {
  @IsOptional()
  @IsArray()
  @ArrayMinSize(3)
  @ValidateNested({ each: true })
  @Type(() => CreateCompetitorMatrixEntryDto)
  entries?: CreateCompetitorMatrixEntryDto[];

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  scoringMethodology?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  summary?: string;
}
