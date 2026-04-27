import type {
  LaunchConfirmationChannelRecord,
  LaunchConfirmationRecord,
} from '../types/launch-confirmation-record.type';

class LaunchConfirmationChannelResponseDto {
  accountName!: string;
  channelType!: string;
  goLiveAt!: string | null;
  id!: string;
  isLive!: boolean;
  issueStatus!: string;
  issueSummary!: string | null;
  listingUrl!: string | null;

  static fromRecord(record: LaunchConfirmationChannelRecord): LaunchConfirmationChannelResponseDto {
    return {
      accountName: record.accountName,
      channelType: record.channelType,
      goLiveAt: record.goLiveAt,
      id: record.id,
      isLive: record.isLive,
      issueStatus: record.issueStatus,
      issueSummary: record.issueSummary,
      listingUrl: record.listingUrl,
    };
  }
}

export class LaunchConfirmationResponseDto {
  channels!: LaunchConfirmationChannelResponseDto[];
  createdAt!: Date;
  id!: string;
  launchDate!: string;
  notes!: string | null;
  productId!: string;
  updatedAt!: Date;

  static fromRecord(record: LaunchConfirmationRecord): LaunchConfirmationResponseDto {
    return {
      channels: record.channels.map((channel) =>
        LaunchConfirmationChannelResponseDto.fromRecord(channel),
      ),
      createdAt: record.createdAt,
      id: record.id,
      launchDate: record.launchDate,
      notes: record.notes,
      productId: record.productId,
      updatedAt: record.updatedAt,
    };
  }
}
