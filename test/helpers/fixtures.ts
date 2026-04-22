import { AuditEntityType } from '../../src/enums/audit-entity-type.enum';
import { ProductBrand } from '../../src/enums/product-brand.enum';
import { ProductCategory } from '../../src/enums/product-category.enum';
import { ProductStage } from '../../src/enums/product-stage.enum';
import { ProductStatus } from '../../src/enums/product-status.enum';
import { UserRole } from '../../src/enums/user-role.enum';
import { WorkflowTransitionAction } from '../../src/enums/workflow-transition-action.enum';
import type { AuditLogRecord } from '../../src/modules/audit-logs/types/audit-log-record.type';
import type { GateDecisionRecord } from '../../src/modules/gate-decisions/types/gate-decision-record.type';
import type { ProductRecord } from '../../src/modules/products/types/product-record.type';
import type { UserRecord } from '../../src/modules/users/types/user-record.type';

export const testIds = {
  actingAsUser: '00000000-0000-4000-8000-000000000012',
  admin: '00000000-0000-4000-8000-000000000001',
  auditLog: '00000000-0000-4000-8000-000000000010',
  clusterManager: '00000000-0000-4000-8000-000000000006',
  commercialOwner: '00000000-0000-4000-8000-000000000003',
  financeOwner: '00000000-0000-4000-8000-000000000004',
  gateDecision: '00000000-0000-4000-8000-000000000009',
  headOfProduct: '00000000-0000-4000-8000-000000000002',
  marketingOwner: '00000000-0000-4000-8000-000000000005',
  product: '00000000-0000-4000-8000-000000000008',
  productOwner: '00000000-0000-4000-8000-000000000007',
};

export function createUserRecord(overrides: Partial<UserRecord> = {}): UserRecord {
  return {
    createdAt: new Date('2026-04-15T00:00:00.000Z'),
    email: 'owner@example.com',
    fullName: 'Owner User',
    id: testIds.productOwner,
    isActive: true,
    lastLoginAt: null,
    role: UserRole.PRODUCT_MANAGER,
    updatedAt: new Date('2026-04-15T00:00:00.000Z'),
    ...overrides,
  };
}

export function createProductRecord(overrides: Partial<ProductRecord> = {}): ProductRecord {
  return {
    brand: ProductBrand.KHIND,
    category: ProductCategory.FANS,
    clusterOwnerUserIds: [testIds.clusterManager],
    commercialOwnerUserId: testIds.commercialOwner,
    createdAt: new Date('2026-04-20T00:00:00.000Z'),
    currentStage: ProductStage.STAGE_1,
    description: 'Initial product draft',
    financeOwnerUserId: testIds.financeOwner,
    id: testIds.product,
    marketingOwnerUserId: testIds.marketingOwner,
    productCode: 'KPD-001',
    productOwnerUserId: testIds.productOwner,
    status: ProductStatus.DRAFT,
    updatedAt: new Date('2026-04-20T00:00:00.000Z'),
    workingName: 'Desk Fan Revamp',
    ...overrides,
  };
}

export function createGateDecisionRecord(
  overrides: Partial<GateDecisionRecord> = {},
): GateDecisionRecord {
  return {
    actingAsUserId: null,
    actorUserId: testIds.headOfProduct,
    comment: 'Approved for feasibility.',
    createdAt: new Date('2026-04-22T00:00:00.000Z'),
    gateStage: ProductStage.STAGE_1,
    id: testIds.gateDecision,
    isAdminSupportAction: false,
    outcome: WorkflowTransitionAction.APPROVE,
    overrideReason: null,
    productId: testIds.product,
    ...overrides,
  };
}

export function createAuditLogRecord(overrides: Partial<AuditLogRecord> = {}): AuditLogRecord {
  return {
    actingAsUserId: null,
    action: WorkflowTransitionAction.SUBMIT,
    actorUserId: testIds.productOwner,
    createdAt: new Date('2026-04-22T00:00:00.000Z'),
    entityId: testIds.product,
    entityType: AuditEntityType.PRODUCT,
    fromState: {
      currentStage: ProductStage.STAGE_1,
      status: ProductStatus.DRAFT,
    },
    id: testIds.auditLog,
    metadata: {
      comment: 'Ready for Gate 1',
    },
    productId: testIds.product,
    toState: {
      currentStage: ProductStage.STAGE_1,
      status: ProductStatus.IN_REVIEW,
    },
    ...overrides,
  };
}
