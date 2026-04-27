import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

import { AuditAction } from '../../../enums/audit-action.enum';
import { AuditEntityType } from '../../../enums/audit-entity-type.enum';
import { ProductStage } from '../../../enums/product-stage.enum';
import type { AuthenticatedUser } from '../../../types/authenticated-user.type';
import { DatabaseService } from '../../../database/database.service';
import { AuditLogsRepository } from '../../audit-logs/repositories/audit-logs.repository';
import type { AuditLogRecord } from '../../audit-logs/types/audit-log-record.type';
import { ProductsRepository } from '../../products/repositories/products.repository';
import { GateThreeReviewsRepository } from '../repositories/gate-three-reviews.repository';
import type { GateThreeReviewRecord } from '../types/gate-three-review-record.type';

type GateThreeReviewAction = 'FINANCE' | 'MARKETING' | 'GM';

@Injectable()
export class GateThreeReviewsService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly productsRepository: ProductsRepository,
    private readonly gateThreeReviewsRepository: GateThreeReviewsRepository,
    private readonly auditLogsRepository: AuditLogsRepository,
  ) {}

  async recordReview(
    productId: string,
    action: GateThreeReviewAction,
    actor: AuthenticatedUser,
    input: { comment?: string; overrideReason?: string },
  ): Promise<{ auditLog: AuditLogRecord; review: GateThreeReviewRecord }> {
    const product = await this.productsRepository.findById(productId);

    if (!product) {
      throw new NotFoundException({
        code: 'PRODUCT_NOT_FOUND',
        message: `Product ${productId} was not found.`,
      });
    }

    if (product.currentStage !== ProductStage.STAGE_3) {
      throw new BadRequestException({
        code: 'GATE_THREE_REVIEW_STAGE_INVALID',
        message: `Gate 3 review checkpoints can only be updated while product ${productId} is in Stage 3.`,
      });
    }

    if (actor.isAdminSupportOverride && !input.overrideReason) {
      throw new BadRequestException({
        code: 'ADMIN_OVERRIDE_REASON_REQUIRED',
        message: 'Admin support overrides must include an overrideReason.',
      });
    }

    const existingReview = await this.gateThreeReviewsRepository.findByProductId(productId);
    const client = await this.databaseService.getClient();

    try {
      await client.query('BEGIN');

      const review = await this.gateThreeReviewsRepository.upsert(
        this.buildUpsertPayload(productId, action, actor.id, input.comment ?? null),
        client,
      );

      const auditLog = await this.auditLogsRepository.create(
        {
          actingAsUserId: actor.actingAsUserId ?? null,
          action: this.mapAuditAction(action),
          actorUserId: actor.id,
          entityId: product.id,
          entityType: AuditEntityType.PRODUCT,
          fromState: existingReview,
          id: randomUUID(),
          metadata: {
            checkpoint: action,
            comment: input.comment ?? null,
            gate: 'GATE_3',
            overrideReason: input.overrideReason ?? null,
          },
          productId: product.id,
          toState: review,
        },
        client,
      );

      await client.query('COMMIT');

      return {
        auditLog,
        review,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private buildUpsertPayload(
    productId: string,
    action: GateThreeReviewAction,
    actorUserId: string,
    comment: string | null,
  ) {
    const timestamp = new Date();

    switch (action) {
      case 'FINANCE':
        return {
          financeComment: comment,
          financeConfirmedAt: timestamp,
          financeConfirmedByUserId: actorUserId,
          productId,
        };
      case 'MARKETING':
        return {
          marketingComment: comment,
          marketingReviewedAt: timestamp,
          marketingReviewedByUserId: actorUserId,
          productId,
        };
      case 'GM':
        return {
          gmApprovedAt: timestamp,
          gmApprovedByUserId: actorUserId,
          gmComment: comment,
          productId,
        };
    }
  }

  private mapAuditAction(action: GateThreeReviewAction): AuditAction {
    switch (action) {
      case 'FINANCE':
        return AuditAction.FINANCE_CONFIRMED;
      case 'MARKETING':
        return AuditAction.MARKETING_REVIEW_COMPLETED;
      case 'GM':
        return AuditAction.GM_APPROVED;
    }
  }
}
