import type {
  EolExecutionPlanRecord,
  EolMilestoneRecord,
  EolStockPositionRecord,
} from '../types/eol-execution-plan-record.type';

export class EolExecutionPlanResponseDto {
  createdAt!: string;
  id!: string;
  kdHandoffNotes!: string;
  milestones!: EolMilestoneRecord[];
  productId!: string;
  serviceContinuityPlan!: string;
  sparePartsPlan!: string;
  stockPositions!: EolStockPositionRecord[];
  summary!: string;
  updatedAt!: string;

  static fromRecord(record: EolExecutionPlanRecord): EolExecutionPlanResponseDto {
    return {
      createdAt: record.createdAt.toISOString(),
      id: record.id,
      kdHandoffNotes: record.kdHandoffNotes,
      milestones: record.milestones,
      productId: record.productId,
      serviceContinuityPlan: record.serviceContinuityPlan,
      sparePartsPlan: record.sparePartsPlan,
      stockPositions: record.stockPositions,
      summary: record.summary,
      updatedAt: record.updatedAt.toISOString(),
    };
  }
}
