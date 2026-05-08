import type {
  ApprovalQueueItem,
  ApprovalQueueResult,
  ApprovalQueueSummary,
  ApprovalQueueUrgency,
  ApprovalQueueStatus,
} from '../types/approval-queue-item.type';

export class ApprovalQueueItemResponseDto {
  assignedApprover!: string;
  assignedRole!: string;
  blockers!: string[];
  category!: string;
  dueDate!: string;
  gateLabel!: string;
  id!: string;
  lastActivity!: string;
  owner!: string;
  priorDecisionSummary!: string;
  productId!: string;
  productName!: string;
  readinessScore!: number;
  requestedBy!: string;
  stageLabel!: string;
  status!: ApprovalQueueStatus;
  urgency!: ApprovalQueueUrgency;

  static fromRecord(record: ApprovalQueueItem): ApprovalQueueItemResponseDto {
    return {
      assignedApprover: record.assignedApprover,
      assignedRole: record.assignedRole,
      blockers: record.blockers,
      category: record.category,
      dueDate: record.dueDate,
      gateLabel: record.gateLabel,
      id: record.id,
      lastActivity: record.lastActivity,
      owner: record.owner,
      priorDecisionSummary: record.priorDecisionSummary,
      productId: record.productId,
      productName: record.productName,
      readinessScore: record.readinessScore,
      requestedBy: record.requestedBy,
      stageLabel: record.stageLabel,
      status: record.status,
      urgency: record.urgency,
    };
  }
}

export class ApprovalQueueSummaryResponseDto {
  assignedApprovals!: number;
  averageReadiness!: number;
  overdueDecisions!: number;
  supportOverridesOpen!: number;

  static fromRecord(
    record: ApprovalQueueSummary,
  ): ApprovalQueueSummaryResponseDto {
    return {
      assignedApprovals: record.assignedApprovals,
      averageReadiness: record.averageReadiness,
      overdueDecisions: record.overdueDecisions,
      supportOverridesOpen: record.supportOverridesOpen,
    };
  }
}

export class ApprovalQueueResponseDto {
  items!: ApprovalQueueItemResponseDto[];
  summary!: ApprovalQueueSummaryResponseDto;

  static fromRecord(record: ApprovalQueueResult): ApprovalQueueResponseDto {
    return {
      items: record.items.map((item) =>
        ApprovalQueueItemResponseDto.fromRecord(item),
      ),
      summary: ApprovalQueueSummaryResponseDto.fromRecord(record.summary),
    };
  }
}
