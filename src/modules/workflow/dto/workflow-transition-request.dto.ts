import { IsOptional, IsString, MaxLength } from 'class-validator';

export class WorkflowTransitionRequestDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  overrideReason?: string;
}
