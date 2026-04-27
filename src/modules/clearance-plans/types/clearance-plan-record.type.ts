import type { ChannelType } from '../../../enums/channel-type.enum';
import type { ClearanceTrackerStatus } from '../../../enums/clearance-tracker-status.enum';

export type ClearancePricingRecord = {
  channelType: ChannelType;
  clearanceRsp: string;
  floorPrice: string;
  id: string;
  markdownApproved: boolean;
  notes: string | null;
  originalRsp: string;
};

export type ClearanceAllocationRecord = {
  allocatedUnits: number;
  channelType: ChannelType;
  id: string;
  notes: string | null;
};

export type ClearanceWeeklyTrackerRecord = {
  id: string;
  notes: string | null;
  status: ClearanceTrackerStatus;
  unitsCleared: number;
  weekStartDate: string;
};

export type ClearancePlanRecord = {
  allocations: ClearanceAllocationRecord[];
  createdAt: Date;
  executionInstructions: string;
  id: string;
  pricingRows: ClearancePricingRecord[];
  productId: string;
  summary: string;
  updatedAt: Date;
  weeklyTrackers: ClearanceWeeklyTrackerRecord[];
};
