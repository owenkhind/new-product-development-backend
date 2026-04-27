import { ChannelType } from '../../../enums/channel-type.enum';
import { LaunchIssueStatus } from '../../../enums/launch-issue-status.enum';

export type LaunchConfirmationChannelRecord = {
  accountName: string;
  channelType: ChannelType;
  goLiveAt: string | null;
  id: string;
  isLive: boolean;
  issueStatus: LaunchIssueStatus;
  issueSummary: string | null;
  listingUrl: string | null;
};

export type LaunchConfirmationRecord = {
  channels: LaunchConfirmationChannelRecord[];
  createdAt: Date;
  id: string;
  launchDate: string;
  notes: string | null;
  productId: string;
  updatedAt: Date;
};
