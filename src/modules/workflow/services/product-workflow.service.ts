import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

import { AuditEntityType } from '../../../enums/audit-entity-type.enum';
import { ProductStage } from '../../../enums/product-stage.enum';
import { ProductStatus } from '../../../enums/product-status.enum';
import { WorkflowTransitionAction } from '../../../enums/workflow-transition-action.enum';
import type { AuthenticatedUser } from '../../../types/authenticated-user.type';
import { DatabaseService } from '../../../database/database.service';
import { AuditLogsRepository } from '../../audit-logs/repositories/audit-logs.repository';
import type { AuditLogRecord } from '../../audit-logs/types/audit-log-record.type';
import { GateDecisionsRepository } from '../../gate-decisions/repositories/gate-decisions.repository';
import type { GateDecisionRecord } from '../../gate-decisions/types/gate-decision-record.type';
import { ProductsRepository } from '../../products/repositories/products.repository';
import type { ProductRecord } from '../../products/types/product-record.type';
import { StageOneCompletionService } from './stage-one-completion.service';

type WorkflowTransitionResult = {
  auditLog: AuditLogRecord;
  gateDecision: GateDecisionRecord;
  product: ProductRecord;
};

type TransitionState = {
  currentStage: ProductStage;
  status: ProductStatus;
};

@Injectable()
export class ProductWorkflowService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly productsRepository: ProductsRepository,
    private readonly gateDecisionsRepository: GateDecisionsRepository,
    private readonly auditLogsRepository: AuditLogsRepository,
    private readonly stageOneCompletionService: StageOneCompletionService,
  ) {}

  async transition(
    productId: string,
    action: WorkflowTransitionAction,
    actor: AuthenticatedUser,
    input: { comment?: string; overrideReason?: string },
  ): Promise<WorkflowTransitionResult> {
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
          outcome: action,
          overrideReason: input.overrideReason ?? null,
          productId: product.id,
        },
        client,
      );

      const auditLog = await this.auditLogsRepository.create(
        {
          actingAsUserId: actor.actingAsUserId ?? null,
          action,
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

  private resolveNextState(
    product: ProductRecord,
    action: WorkflowTransitionAction,
  ): TransitionState {
    switch (action) {
      case WorkflowTransitionAction.SUBMIT:
        this.assertCurrentStatus(action, product.status, [ProductStatus.DRAFT, ProductStatus.REJECTED]);
        return {
          currentStage: product.currentStage,
          status: ProductStatus.IN_REVIEW,
        };
      case WorkflowTransitionAction.APPROVE:
        this.assertCurrentStatus(action, product.status, [ProductStatus.IN_REVIEW]);
        return {
          currentStage:
            product.currentStage === ProductStage.STAGE_6
              ? ProductStage.STAGE_6
              : this.getNextStage(product.currentStage),
          status:
            product.currentStage === ProductStage.STAGE_6
              ? ProductStatus.APPROVED
              : ProductStatus.DRAFT,
        };
      case WorkflowTransitionAction.REJECT:
        this.assertCurrentStatus(action, product.status, [ProductStatus.IN_REVIEW]);
        return {
          currentStage: product.currentStage,
          status: ProductStatus.REJECTED,
        };
      case WorkflowTransitionAction.REOPEN:
        this.assertCurrentStatus(action, product.status, [
          ProductStatus.REJECTED,
          ProductStatus.BLOCKED,
          ProductStatus.APPROVED,
          ProductStatus.ARCHIVED,
        ]);
        return {
          currentStage: product.currentStage,
          status: ProductStatus.DRAFT,
        };
      case WorkflowTransitionAction.BLOCK:
        this.assertCurrentStatus(action, product.status, [ProductStatus.DRAFT, ProductStatus.IN_REVIEW]);
        return {
          currentStage: product.currentStage,
          status: ProductStatus.BLOCKED,
        };
      case WorkflowTransitionAction.ARCHIVE:
        this.assertCurrentStatus(action, product.status, [
          ProductStatus.DRAFT,
          ProductStatus.IN_REVIEW,
          ProductStatus.APPROVED,
          ProductStatus.REJECTED,
          ProductStatus.BLOCKED,
        ]);
        return {
          currentStage: product.currentStage,
          status: ProductStatus.ARCHIVED,
        };
      default:
        throw new BadRequestException({
          code: 'WORKFLOW_ACTION_INVALID',
          message: `Unsupported workflow action ${action}.`,
        });
    }
  }

  private async assertStageRequirements(
    product: ProductRecord,
    action: WorkflowTransitionAction,
  ): Promise<void> {
    if (
      product.currentStage === ProductStage.STAGE_1 &&
      (action === WorkflowTransitionAction.SUBMIT || action === WorkflowTransitionAction.APPROVE)
    ) {
      await this.stageOneCompletionService.assertReadyForGateOne(product.id);
    }
  }

  private assertCurrentStatus(
    action: WorkflowTransitionAction,
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

  private getNextStage(stage: ProductStage): ProductStage {
    switch (stage) {
      case ProductStage.STAGE_1:
        return ProductStage.STAGE_2;
      case ProductStage.STAGE_2:
        return ProductStage.STAGE_3;
      case ProductStage.STAGE_3:
        return ProductStage.STAGE_4;
      case ProductStage.STAGE_4:
        return ProductStage.STAGE_5;
      case ProductStage.STAGE_5:
        return ProductStage.STAGE_6;
      case ProductStage.STAGE_6:
        return ProductStage.STAGE_6;
      default:
        return stage;
    }
  }
}
