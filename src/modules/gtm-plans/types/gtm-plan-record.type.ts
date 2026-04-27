import { GtmOwnerRole } from '../../../enums/gtm-owner-role.enum';

export type GtmPlanChecklistItemRecord = {
  dueDate: string | null;
  id: string;
  isComplete: boolean;
  isCritical: boolean;
  itemName: string;
  notes: string | null;
  ownerRole: GtmOwnerRole;
};

export type GtmPlanRecord = {
  activationPlan: string;
  budget: string;
  campaignEndDate: string | null;
  campaignStartDate: string | null;
  checklistItems: GtmPlanChecklistItemRecord[];
  communicationsPlan: string;
  createdAt: Date;
  id: string;
  launchObjectives: string;
  productId: string;
  updatedAt: Date;
};
