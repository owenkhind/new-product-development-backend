import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNumberString,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

import { ChannelType } from '../../../enums/channel-type.enum';

export class CreateChannelPricingRowDto {
  @IsEnum(ChannelType)
  channelType!: ChannelType;

  @IsNumberString()
  landedCost!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @IsNumberString()
  rsp!: string;
}

export class CreateChannelPricingDto {
  @IsString()
  @MaxLength(3)
  currency!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateChannelPricingRowDto)
  pricingRows!: CreateChannelPricingRowDto[];
}
