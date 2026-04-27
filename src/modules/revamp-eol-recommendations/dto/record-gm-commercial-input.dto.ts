import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class RecordGmCommercialInputDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  commercialInput!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  overrideReason?: string;
}
