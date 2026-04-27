import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsISO8601,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  ValidateNested,
} from 'class-validator';

import { ChannelType } from '../../../enums/channel-type.enum';
import { LaunchIssueStatus } from '../../../enums/launch-issue-status.enum';

export class CreateLaunchConfirmationChannelDto {
  @IsString()
  @MaxLength(255)
  accountName!: string;

  @IsEnum(ChannelType)
  channelType!: ChannelType;

  @IsOptional()
  @IsISO8601({ strict: true })
  goLiveAt?: string;

  @IsBoolean()
  isLive!: boolean;

  @IsEnum(LaunchIssueStatus)
  issueStatus!: LaunchIssueStatus;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  issueSummary?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  @MaxLength(1000)
  listingUrl?: string;
}

export class CreateLaunchConfirmationDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateLaunchConfirmationChannelDto)
  channels!: CreateLaunchConfirmationChannelDto[];

  @IsISO8601({ strict: true })
  launchDate!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
