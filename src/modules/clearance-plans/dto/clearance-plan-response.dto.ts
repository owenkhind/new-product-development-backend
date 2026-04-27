import type {
  ClearanceAllocationRecord,
  ClearancePlanRecord,
  ClearancePricingRecord,
  ClearanceWeeklyTrackerRecord,
} from '../types/clearance-plan-record.type';

export class ClearancePlanResponseDto {
  allocations!: ClearanceAllocationRecord[];
  createdAt!: string;
  executionInstructions!: string;
  id!: string;
  pricingRows!: ClearancePricingRecord[];
  productId!: string;
  summary!: string;
  updatedAt!: string;
  weeklyTrackers!: ClearanceWeeklyTrackerRecord[];

  static fromRecord(record: ClearancePlanRecord): ClearancePlanResponseDto {
    return {
      allocations: record.allocations,
      createdAt: record.createdAt.toISOString(),
      executionInstructions: record.executionInstructions,
      id: record.id,
      pricingRows: record.pricingRows,
      productId: record.productId,
      summary: record.summary,
      updatedAt: record.updatedAt.toISOString(),
      weeklyTrackers: record.weeklyTrackers,
    };
  }
}
