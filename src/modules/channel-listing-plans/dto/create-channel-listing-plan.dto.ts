import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsISO8601,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

import { ChannelType } from '../../../enums/channel-type.enum';

export class CreateChannelListingPlanChannelDto {
  @IsString()
  @MaxLength(255)
  accountName!: string;

  @IsEnum(ChannelType)
  channelType!: ChannelType;

  @IsBoolean()
  isConfirmed!: boolean;

  @IsString()
  @MaxLength(255)
  launchOwner!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  readinessNotes?: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  targetGoLiveDate?: string;
}

export class CreateChannelListingPlanDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateChannelListingPlanChannelDto)
  channels!: CreateChannelListingPlanChannelDto[];

  @IsBoolean()
  lazadaConfirmed!: boolean;

  @IsBoolean()
  shopeeConfirmed!: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  summary?: string;
}
