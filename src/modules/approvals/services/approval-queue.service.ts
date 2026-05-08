import { Injectable } from '@nestjs/common';

import { ProductStage } from '../../../enums/product-stage.enum';
import { ProductStatus } from '../../../enums/product-status.enum';
import { UserRole } from '../../../enums/user-role.enum';
import type { AuthenticatedUser } from '../../../types/authenticated-user.type';
import {
  ApprovalQueueRepository,
  type ApprovalQueueRecord,
} from '../repositories/approval-queue.repository';
import type {
  ApprovalQueueItem,
  ApprovalQueueResult,
  ApprovalQueueStatus,
  ApprovalQueueUrgency,
} from '../types/approval-queue-item.type';

const MAX_QUEUE_ITEMS = 100;

@Injectable()
export class ApprovalQueueService {
  constructor(
    private readonly approvalQueueRepository: ApprovalQueueRepository,
  ) {}

  async getQueue(actor: AuthenticatedUser): Promise<ApprovalQueueResult> {
    const records = await this.approvalQueueRepository.listForActor({
      actorId: actor.id,
      actorRole: actor.role,
      limit: MAX_QUEUE_ITEMS,
    });
    const items = records.map((record) => this.mapRecord(record, actor.role));

    return {
      items,
      summary: {
        assignedApprovals: items.filter((item) =>
          ['OVERDUE', 'PENDING'].includes(item.status),
        ).length,
        averageReadiness: items.length
          ? Math.round(
              items.reduce((total, item) => total + item.readinessScore, 0) /
                items.length,
            )
          : 0,
        overdueDecisions: items.filter((item) => item.urgency === 'OVERDUE')
          .length,
        supportOverridesOpen: items.filter((item) => item.blockers.length > 0)
          .length,
      },
    };
  }

  private mapRecord(
    record: ApprovalQueueRecord,
    actorRole: UserRole,
  ): ApprovalQueueItem {
    const status = this.getApprovalStatus(record.status);

    return {
      assignedApprover: this.getAssignedApprover(record.stage, actorRole),
      assignedRole: this.getAssignedRole(record.stage, actorRole),
      blockers: this.getBlockers(record),
      category: this.formatCategory(record.category),
      dueDate: this.formatDueDate(record.updatedAt),
      gateLabel: this.getGateLabel(record.stage),
      id: `approval-${record.id}-${record.stage.toLowerCase()}`,
      lastActivity: this.getLastActivity(record),
      owner: record.ownerName ?? record.productCode ?? 'Product owner',
      priorDecisionSummary: this.getPriorDecisionSummary(record),
      productId: record.id,
      productName: record.workingName,
      productStage: record.stage,
      productStatus: record.status,
      readinessScore: this.getStageProgress(record.stage, record.status),
      requestedBy: record.ownerName ?? 'Product owner',
      stageLabel: this.getStageLabel(record.stage),
      status,
      urgency: this.getUrgency(record, status),
    };
  }

  private getAssignedRole(stage: ProductStage, actorRole: UserRole): UserRole {
    if (stage === ProductStage.STAGE_1) return UserRole.HEAD_OF_PRODUCT;
    if (
      stage === ProductStage.STAGE_5 &&
      actorRole === UserRole.COO_EXECUTIVE_APPROVER
    ) {
      return UserRole.COO_EXECUTIVE_APPROVER;
    }
    if (
      stage === ProductStage.STAGE_4 &&
      actorRole === UserRole.GM_COMMERCIAL_OWNER
    ) {
      return UserRole.GM_COMMERCIAL_OWNER;
    }
    if (stage === ProductStage.STAGE_5) return UserRole.GM_COMMERCIAL_OWNER;

    return UserRole.COO_EXECUTIVE_APPROVER;
  }

  private getAssignedApprover(
    stage: ProductStage,
    actorRole: UserRole,
  ): string {
    const role = this.getAssignedRole(stage, actorRole);

    switch (role) {
      case UserRole.HEAD_OF_PRODUCT:
        return 'Head of Product';
      case UserRole.GM_COMMERCIAL_OWNER:
        return 'GM Commercial Owner';
      case UserRole.COO_EXECUTIVE_APPROVER:
        return 'COO Executive Approver';
      default:
        return this.formatRole(role);
    }
  }

  private getApprovalStatus(status: ProductStatus): ApprovalQueueStatus {
    if (status === ProductStatus.BLOCKED) return 'OVERDUE';
    if (status === ProductStatus.REJECTED) return 'REJECTED';
    if (status === ProductStatus.APPROVED) return 'APPROVED';

    return 'PENDING';
  }

  private getUrgency(
    record: ApprovalQueueRecord,
    status: ApprovalQueueStatus,
  ): ApprovalQueueUrgency {
    if (status === 'OVERDUE') return 'OVERDUE';
    if (this.isToday(record.updatedAt)) return 'DUE_TODAY';

    return 'UPCOMING';
  }

  private getBlockers(record: ApprovalQueueRecord): string[] {
    switch (record.status) {
      case ProductStatus.BLOCKED:
        return ['Workflow is blocked pending owner action'];
      case ProductStatus.REJECTED:
        return ['Rework is required before this item can be approved'];
      default:
        return [];
    }
  }

  private getPriorDecisionSummary(record: ApprovalQueueRecord): string {
    if (!record.latestDecisionOutcome) {
      return record.status === ProductStatus.REJECTED
        ? 'Backend status shows rework is required.'
        : 'No prior decision loaded.';
    }

    const decision = this.formatDecision(record.latestDecisionOutcome);
    const comment = record.latestDecisionComment
      ? `: ${record.latestDecisionComment}`
      : '';

    if (record.latestDecisionIsAdminSupportAction) {
      return `${decision} by admin support${comment}`;
    }

    return `${decision} by ${record.latestDecisionActorUserId ?? 'backend user'}${comment}`;
  }

  private getLastActivity(record: ApprovalQueueRecord): string {
    if (record.latestDecisionCreatedAt) {
      return `${this.formatDecision(record.latestDecisionOutcome ?? 'SUBMITTED')} on ${this.formatDueDate(
        record.latestDecisionCreatedAt,
      )}`;
    }

    if (record.status === ProductStatus.IN_REVIEW)
      return 'Submitted for approval';
    if (record.status === ProductStatus.BLOCKED)
      return 'Blocked pending resolution';
    if (record.status === ProductStatus.REJECTED) return 'Returned for rework';

    return 'Awaiting lifecycle action';
  }

  private getGateLabel(stage: ProductStage): string {
    const stageNumber = Number(stage.replace('STAGE_', ''));

    return stageNumber <= 3
      ? `Gate ${stageNumber}`
      : `Stage ${stageNumber} review`;
  }

  private getStageLabel(stage: ProductStage): string {
    const labels: Record<ProductStage, string> = {
      STAGE_1: 'Stage 1 - Register / Spot & Screen',
      STAGE_2: 'Stage 2 - Feasibility / Business Case',
      STAGE_3: 'Stage 3 - Launch Readiness',
      STAGE_4: 'Stage 4 - Launch Execution',
      STAGE_5: 'Stage 5 - Portfolio Review',
      STAGE_6: 'Stage 6 - EOL / Clearance',
    };

    return labels[stage];
  }

  private getStageProgress(stage: ProductStage, status: ProductStatus): number {
    const stageNumber = Number(stage.replace('STAGE_', ''));
    const baseProgress = Math.round(((stageNumber - 1) / 6) * 100);

    if (status === ProductStatus.IN_REVIEW)
      return Math.min(100, baseProgress + 12);
    if (status === ProductStatus.REJECTED || status === ProductStatus.BLOCKED)
      return Math.min(100, baseProgress + 8);

    return Math.min(100, baseProgress + 5);
  }

  private formatCategory(category: string): string {
    return category
      .toLowerCase()
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  private formatRole(role: UserRole): string {
    return role
      .toLowerCase()
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  private formatDecision(outcome: string): string {
    return outcome
      .toLowerCase()
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  private formatDueDate(value: Date): string {
    return value.toISOString().slice(0, 10);
  }

  private isToday(value: Date): boolean {
    return this.formatDueDate(value) === this.formatDueDate(new Date());
  }
}
