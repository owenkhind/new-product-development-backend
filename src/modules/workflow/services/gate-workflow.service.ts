import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

import { AuditAction } from '../../../enums/audit-action.enum';
import { AuditEntityType } from '../../../enums/audit-entity-type.enum';
import { GateDecisionOutcome } from '../../../enums/gate-decision-outcome.enum';
import { ProductStage } from '../../../enums/product-stage.enum';
import { ProductStatus } from '../../../enums/product-status.enum';
import type { AuthenticatedUser } from '../../../types/authenticated-user.type';
import { DatabaseService } from '../../../database/database.service';
import { AuditLogsRepository } from '../../audit-logs/repositories/audit-logs.repository';
import type { AuditLogRecord } from '../../audit-logs/types/audit-log-record.type';
import { GateDecisionsRepository } from '../../gate-decisions/repositories/gate-decisions.repository';
import type { GateDecisionRecord } from '../../gate-decisions/types/gate-decision-record.type';
import { ProductsRepository } from '../../products/repositories/products.repository';
import type { ProductRecord } from '../../products/types/product-record.type';
import { StageOneCompletionService } from './stage-one-completion.service';
import { StageTwoCompletionService } from './stage-two-completion.service';

type GateWorkflowResult = {
  auditLog: AuditLogRecord;
  gateDecision: GateDecisionRecord;
  product: ProductRecord;
};

type GateAction = 'SUBMIT' | 'APPROVE' | 'REJECT' | 'KILL';

@Injectable()
export class GateWorkflowService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly productsRepository: ProductsRepository,
    private readonly gateDecisionsRepository: GateDecisionsRepository,
    private readonly auditLogsRepository: AuditLogsRepository,
    private readonly stageOneCompletionService: StageOneCompletionService,
    private readonly stageTwoCompletionService: StageTwoCompletionService,
  ) {}

  async transition(
    productId: string,
    action: GateAction,
    actor: AuthenticatedUser,
    input: { comment?: string; overrideReason?: string },
  ): Promise<GateWorkflowResult> {
    const product = await this.productsRepository.findById(productId);

    if (!product) {
      throw new NotFoundException({
        code: 'PRODUCT_NOT_FOUND',
        message: `Product ${productId} was not found.`,
      });
    }

    if (actor.isAdminSupportOverride && !input.overrideReason) {
      throw new BadRequestException({
        code: 'ADMIN_OVERRIDE_REASON_REQUIRED',
        message: 'Admin support overrides must include an overrideReason.',
      });
    }

    await this.assertStageRequirements(product, action);
    const nextState = this.resolveNextState(product, action);
    const client = await this.databaseService.getClient();

    try {
      await client.query('BEGIN');

      const updatedProduct = await this.productsRepository.update(
        product.id,
        {
          currentStage: nextState.currentStage,
          status: nextState.status,
        },
        client,
      );

      if (!updatedProduct) {
        throw new NotFoundException({
          code: 'PRODUCT_NOT_FOUND',
          message: `Product ${productId} was not found.`,
        });
      }

      const gateDecision = await this.gateDecisionsRepository.create(
        {
          actingAsUserId: actor.actingAsUserId ?? null,
          actorUserId: actor.id,
          comment: input.comment ?? null,
          gateStage: product.currentStage,
          id: randomUUID(),
          isAdminSupportAction: actor.isAdminSupportOverride ?? false,
          outcome: this.mapGateOutcome(action),
          overrideReason: input.overrideReason ?? null,
          productId: product.id,
        },
        client,
      );

      const auditLog = await this.auditLogsRepository.create(
        {
          actingAsUserId: actor.actingAsUserId ?? null,
          action: this.mapAuditAction(action),
          actorUserId: actor.id,
          entityId: product.id,
          entityType: AuditEntityType.PRODUCT,
          fromState: {
            currentStage: product.currentStage,
            status: product.status,
          },
          id: randomUUID(),
          metadata: {
            comment: input.comment ?? null,
            gateDecisionId: gateDecision.id,
            overrideReason: input.overrideReason ?? null,
          },
          productId: product.id,
          toState: {
            currentStage: updatedProduct.currentStage,
            status: updatedProduct.status,
          },
        },
        client,
      );

      await client.query('COMMIT');

      return {
        auditLog,
        gateDecision,
        product: updatedProduct,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private async assertStageRequirements(product: ProductRecord, action: GateAction): Promise<void> {
    if (product.currentStage === ProductStage.STAGE_1) {
      if (action === 'SUBMIT' || action === 'APPROVE') {
        await this.stageOneCompletionService.assertReadyForGateOne(product.id);
      }

      return;
    }

    if (product.currentStage === ProductStage.STAGE_2) {
      if (action === 'SUBMIT') {
        await this.stageTwoCompletionService.assertReadyForGateTwoSubmission(product.id);
      }

      if (action === 'APPROVE') {
        await this.stageTwoCompletionService.assertReadyForGateTwoApproval(product.id);
      }

      return;
    }

    throw new BadRequestException({
      code: 'UNSUPPORTED_GATE_STAGE',
      message: `Explicit gate decisions are not supported for ${product.currentStage}.`,
    });
  }

  private resolveNextState(
    product: ProductRecord,
    action: GateAction,
  ): { currentStage: ProductStage; status: ProductStatus } {
    switch (action) {
      case 'SUBMIT':
        this.assertCurrentStatus(action, product.status, [ProductStatus.DRAFT, ProductStatus.REJECTED]);
        return {
          currentStage: product.currentStage,
          status: ProductStatus.IN_REVIEW,
        };
      case 'APPROVE':
        this.assertCurrentStatus(action, product.status, [ProductStatus.IN_REVIEW]);
        return {
          currentStage: this.getNextStage(product.currentStage),
          status: ProductStatus.DRAFT,
        };
      case 'REJECT':
        this.assertCurrentStatus(action, product.status, [ProductStatus.IN_REVIEW]);
        return {
          currentStage: product.currentStage,
          status: ProductStatus.REJECTED,
        };
      case 'KILL':
        this.assertCurrentStatus(action, product.status, [ProductStatus.IN_REVIEW]);
        return {
          currentStage: product.currentStage,
          status: ProductStatus.KILLED,
        };
      default:
        throw new BadRequestException({
          code: 'WORKFLOW_ACTION_INVALID',
          message: `Unsupported gate action ${action}.`,
        });
    }
  }

  private assertCurrentStatus(
    action: GateAction,
    currentStatus: ProductStatus,
    allowedStatuses: ProductStatus[],
  ): void {
    if (allowedStatuses.includes(currentStatus)) {
      return;
    }

    throw new BadRequestException({
      code: 'WORKFLOW_TRANSITION_NOT_ALLOWED',
      message: `Cannot ${action.toLowerCase()} when product status is ${currentStatus}.`,
      details: {
        allowedStatuses,
        currentStatus,
      },
    });
  }

  private mapGateOutcome(action: GateAction): GateDecisionOutcome {
    switch (action) {
      case 'SUBMIT':
        return GateDecisionOutcome.SUBMITTED;
      case 'APPROVE':
        return GateDecisionOutcome.APPROVED;
      case 'REJECT':
        return GateDecisionOutcome.REJECTED;
      case 'KILL':
        return GateDecisionOutcome.KILLED;
    }
  }

  private mapAuditAction(action: GateAction): AuditAction {
    switch (action) {
      case 'SUBMIT':
        return AuditAction.SUBMIT;
      case 'APPROVE':
        return AuditAction.APPROVE;
      case 'REJECT':
        return AuditAction.REJECT;
      case 'KILL':
        return AuditAction.KILL;
    }
  }

  private getNextStage(stage: ProductStage): ProductStage {
    switch (stage) {
      case ProductStage.STAGE_1:
        return ProductStage.STAGE_2;
      case ProductStage.STAGE_2:
        return ProductStage.STAGE_3;
      default:
        return stage;
    }
  }
}
