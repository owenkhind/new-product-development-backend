import type { ChannelType } from '../../../enums/channel-type.enum';
import type { EolMilestoneStatus } from '../../../enums/eol-milestone-status.enum';

export type EolStockPositionRecord = {
  channelType: ChannelType;
  estimatedStockValue: string;
  id: string;
  notes: string | null;
  onHandUnits: number;
  reservedUnits: number;
};

export type EolMilestoneRecord = {
  dueDate: string;
  id: string;
  milestoneName: string;
  notes: string | null;
  ownerRole: string;
  status: EolMilestoneStatus;
};

export type EolExecutionPlanRecord = {
  createdAt: Date;
  id: string;
  kdHandoffNotes: string;
  milestones: EolMilestoneRecord[];
  productId: string;
  serviceContinuityPlan: string;
  sparePartsPlan: string;
  stockPositions: EolStockPositionRecord[];
  summary: string;
  updatedAt: Date;
};
