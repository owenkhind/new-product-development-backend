import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

import { AuditAction } from '../../../enums/audit-action.enum';
import { AuditEntityType } from '../../../enums/audit-entity-type.enum';
import { ProductStatus } from '../../../enums/product-status.enum';
import { WorkflowTransitionAction } from '../../../enums/workflow-transition-action.enum';
import type { AuthenticatedUser } from '../../../types/authenticated-user.type';
import { DatabaseService } from '../../../database/database.service';
import { AuditLogsRepository } from '../../audit-logs/repositories/audit-logs.repository';
import type { AuditLogRecord } from '../../audit-logs/types/audit-log-record.type';
import { ProductsRepository } from '../../products/repositories/products.repository';
import type { ProductRecord } from '../../products/types/product-record.type';

type WorkflowTransitionResult = {
  auditLog: AuditLogRecord;
  product: ProductRecord;
};

@Injectable()
export class ProductWorkflowService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly productsRepository: ProductsRepository,
    private readonly auditLogsRepository: AuditLogsRepository,
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

    const nextStatus = this.resolveNextStatus(product.status, action);
    const client = await this.databaseService.getClient();

    try {
      await client.query('BEGIN');

      const updatedProduct = await this.productsRepository.update(
        product.id,
        {
          status: nextStatus,
        },
        client,
      );

      if (!updatedProduct) {
        throw new NotFoundException({
          code: 'PRODUCT_NOT_FOUND',
          message: `Product ${productId} was not found.`,
        });
      }

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
        product: updatedProduct,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private resolveNextStatus(
    currentStatus: ProductStatus,
    action: WorkflowTransitionAction,
  ): ProductStatus {
    switch (action) {
      case WorkflowTransitionAction.REOPEN:
        this.assertCurrentStatus(action, currentStatus, [
          ProductStatus.REJECTED,
          ProductStatus.KILLED,
          ProductStatus.BLOCKED,
          ProductStatus.APPROVED,
          ProductStatus.ARCHIVED,
        ]);
        return ProductStatus.DRAFT;
      case WorkflowTransitionAction.BLOCK:
        this.assertCurrentStatus(action, currentStatus, [ProductStatus.DRAFT, ProductStatus.IN_REVIEW]);
        return ProductStatus.BLOCKED;
      case WorkflowTransitionAction.ARCHIVE:
        this.assertCurrentStatus(action, currentStatus, [
          ProductStatus.DRAFT,
          ProductStatus.IN_REVIEW,
          ProductStatus.APPROVED,
          ProductStatus.REJECTED,
          ProductStatus.KILLED,
          ProductStatus.BLOCKED,
        ]);
        return ProductStatus.ARCHIVED;
      default:
        throw new BadRequestException({
          code: 'WORKFLOW_ACTION_INVALID',
          message: `Unsupported workflow action ${action}.`,
        });
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

  private mapAuditAction(action: WorkflowTransitionAction): AuditAction {
    switch (action) {
      case WorkflowTransitionAction.REOPEN:
        return AuditAction.REOPEN;
      case WorkflowTransitionAction.BLOCK:
        return AuditAction.BLOCK;
      case WorkflowTransitionAction.ARCHIVE:
        return AuditAction.ARCHIVE;
      default:
        throw new BadRequestException({
          code: 'WORKFLOW_ACTION_INVALID',
          message: `Unsupported workflow action ${action}.`,
        });
    }
  }
}
