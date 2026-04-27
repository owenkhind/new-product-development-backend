import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

import { CreateChannelListingPlanChannelDto } from './create-channel-listing-plan.dto';

export class UpdateChannelListingPlanDto {
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateChannelListingPlanChannelDto)
  channels?: CreateChannelListingPlanChannelDto[];

  @IsOptional()
  @IsBoolean()
  lazadaConfirmed?: boolean;

  @IsOptional()
  @IsBoolean()
  shopeeConfirmed?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  summary?: string;
}
