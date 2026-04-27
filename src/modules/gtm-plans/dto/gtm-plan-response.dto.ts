import type {
  GtmPlanChecklistItemRecord,
  GtmPlanRecord,
} from '../types/gtm-plan-record.type';

class GtmPlanChecklistItemResponseDto {
  dueDate!: string | null;
  id!: string;
  isComplete!: boolean;
  isCritical!: boolean;
  itemName!: string;
  notes!: string | null;
  ownerRole!: string;

  static fromRecord(record: GtmPlanChecklistItemRecord): GtmPlanChecklistItemResponseDto {
    return {
      dueDate: record.dueDate,
      id: record.id,
      isComplete: record.isComplete,
      isCritical: record.isCritical,
      itemName: record.itemName,
      notes: record.notes,
      ownerRole: record.ownerRole,
    };
  }
}

export class GtmPlanResponseDto {
  activationPlan!: string;
  budget!: string;
  campaignEndDate!: string | null;
  campaignStartDate!: string | null;
  checklistItems!: GtmPlanChecklistItemResponseDto[];
  communicationsPlan!: string;
  createdAt!: Date;
  id!: string;
  launchObjectives!: string;
  productId!: string;
  updatedAt!: Date;

  static fromRecord(record: GtmPlanRecord): GtmPlanResponseDto {
    return {
      activationPlan: record.activationPlan,
      budget: record.budget,
      campaignEndDate: record.campaignEndDate,
      campaignStartDate: record.campaignStartDate,
      checklistItems: record.checklistItems.map((item) =>
        GtmPlanChecklistItemResponseDto.fromRecord(item),
      ),
      communicationsPlan: record.communicationsPlan,
      createdAt: record.createdAt,
      id: record.id,
      launchObjectives: record.launchObjectives,
      productId: record.productId,
      updatedAt: record.updatedAt,
    };
  }
}
