import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsISO8601,
  IsNumberString,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

import { ChannelType } from '../../../enums/channel-type.enum';

export class CreateSellInReportAccountDto {
  @IsString()
  @MaxLength(255)
  accountName!: string;

  @IsEnum(ChannelType)
  channelType!: ChannelType;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  declineReason?: string;

  @IsInt()
  @Min(0)
  sellInUnits!: number;

  @IsNumberString()
  sellInValue!: string;
}

export class CreateSellInReportDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateSellInReportAccountDto)
  accounts!: CreateSellInReportAccountDto[];

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @IsISO8601({ strict: true })
  reportPeriodEnd!: string;

  @IsISO8601({ strict: true })
  reportPeriodStart!: string;
}
