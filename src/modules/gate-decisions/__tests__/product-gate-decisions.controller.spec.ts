import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { ProductStage } from '../../../enums/product-stage.enum';
import { WorkflowTransitionAction } from '../../../enums/workflow-transition-action.enum';
import { ProductGateDecisionsController } from '../controllers/product-gate-decisions.controller';
import { GateDecisionsService } from '../services/gate-decisions.service';

describe('ProductGateDecisionsController', () => {
  it('maps gate decision records to API responses', async () => {
    const gateDecision = {
      actingAsUserId: null,
      actorUserId: 'head-of-product-id',
      comment: 'Approved for feasibility.',
      createdAt: new Date('2026-04-22T00:00:00.000Z'),
      gateStage: ProductStage.STAGE_1,
      id: 'gate-decision-id',
      isAdminSupportAction: false,
      outcome: WorkflowTransitionAction.APPROVE,
      overrideReason: null,
      productId: 'product-id',
    };

    const service = {
      findByProductId: async () => [gateDecision],
    };
    const controller = new ProductGateDecisionsController(service as unknown as GateDecisionsService);

    const response = await controller.findAll('product-id');

    assert.deepEqual(response, {
      data: [
        {
          actingAsUserId: null,
          actorUserId: 'head-of-product-id',
          comment: 'Approved for feasibility.',
          createdAt: gateDecision.createdAt,
          gateStage: ProductStage.STAGE_1,
          id: 'gate-decision-id',
          isAdminSupportAction: false,
          outcome: WorkflowTransitionAction.APPROVE,
          overrideReason: null,
          productId: 'product-id',
        },
      ],
    });
  });
});
