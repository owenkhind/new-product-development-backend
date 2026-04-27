import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsISO8601,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

import { CreateLaunchConfirmationChannelDto } from './create-launch-confirmation.dto';

export class UpdateLaunchConfirmationDto {
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateLaunchConfirmationChannelDto)
  channels?: CreateLaunchConfirmationChannelDto[];

  @IsOptional()
  @IsISO8601({ strict: true })
  launchDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
