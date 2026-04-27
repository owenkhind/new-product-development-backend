import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

import { PolicyResource } from '../../../enums/policy-resource.enum';
import { StageAction } from '../../../enums/stage-action.enum';
import { UserRole } from '../../../enums/user-role.enum';
import type { AuthenticatedUser } from '../../../types/authenticated-user.type';
import { ProductsRepository } from '../../products/repositories/products.repository';
import type { ProductRecord } from '../../products/types/product-record.type';
import { UsersRepository } from '../../users/repositories/users.repository';

type AuthorizationInput = {
  action: StageAction;
  actor: AuthenticatedUser;
  resource: PolicyResource;
  targetId?: string;
};

@Injectable()
export class AuthorizationPolicyService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly productsRepository: ProductsRepository,
  ) {}

  async assertAuthorized(input: AuthorizationInput): Promise<void> {
    if (input.actor.role === UserRole.ADMIN) {
      return;
    }

    switch (input.resource) {
      case PolicyResource.USERS:
        this.assertUsersAccess(input);
        return;
      case PolicyResource.PRODUCTS:
        await this.assertProductsAccess(input);
        return;
      case PolicyResource.WORKFLOW:
        await this.assertWorkflowAccess(input);
        return;
      case PolicyResource.GATE_WORKFLOW:
        await this.assertGateWorkflowAccess(input);
        return;
      case PolicyResource.GATE_THREE_REVIEWS:
        await this.assertGateThreeReviewAccess(input);
        return;
      case PolicyResource.GATE_TWO_REVIEWS:
        await this.assertGateTwoReviewAccess(input);
        return;
      case PolicyResource.LAUNCH_CONFIRMATIONS:
      case PolicyResource.SELL_IN_REPORTS:
      case PolicyResource.WEEKLY_FEEDBACK_LOGS:
      case PolicyResource.DAY_30_REVIEWS:
        await this.assertStageFourTemplateAccess(input);
        return;
      case PolicyResource.PRODUCT_SCORECARDS:
      case PolicyResource.REVAMP_EOL_RECOMMENDATIONS:
        await this.assertStageFiveTemplateAccess(input);
        return;
      case PolicyResource.EOL_EXECUTION_PLANS:
      case PolicyResource.CLEARANCE_PLANS:
        await this.assertStageSixTemplateAccess(input);
        return;
      case PolicyResource.PORTFOLIO_UPDATES:
        this.assertPortfolioUpdateAccess(input);
        return;
      case PolicyResource.GATE_DECISIONS:
      case PolicyResource.AUDIT_LOGS:
        await this.assertProductScopedViewAccess(input);
        return;
      default:
        throw new ForbiddenException({
          code: 'AUTHORIZATION_RULE_NOT_IMPLEMENTED',
          message: `Authorization rules for ${input.resource} are not implemented.`,
        });
    }
  }

  private assertUsersAccess(input: AuthorizationInput): void {
    if (input.action === StageAction.VIEW && input.targetId === input.actor.id) {
      return;
    }

    throw new ForbiddenException({
      code: 'USER_ACTION_FORBIDDEN',
      message: `Role ${input.actor.role} cannot ${input.action.toLowerCase()} user records.`,
    });
  }

  private async assertProductsAccess(input: AuthorizationInput): Promise<void> {
    if (input.action === StageAction.CREATE) {
      if (input.actor.role === UserRole.PRODUCT_MANAGER) {
        return;
      }

      throw this.productActionForbidden(input.action, input.actor.role);
    }

    if (input.action === StageAction.VIEW && !input.targetId) {
      return;
    }

    if (!input.targetId) {
      throw new ForbiddenException({
        code: 'PRODUCT_TARGET_REQUIRED',
        message: `Product action ${input.action.toLowerCase()} requires a target product.`,
      });
    }

    const product = await this.productsRepository.findById(input.targetId);

    if (!product) {
      throw new NotFoundException({
        code: 'PRODUCT_NOT_FOUND',
        message: `Product ${input.targetId} was not found.`,
      });
    }

    if (input.action === StageAction.VIEW) {
      if (
        this.hasGlobalProductViewAccess(input.actor.role) ||
        this.isAssignedProductContributor(input.actor, product)
      ) {
        return;
      }

      throw this.productActionForbidden(input.action, input.actor.role);
    }

    if (input.action === StageAction.EDIT) {
      if (this.isAssignedProductEditor(input.actor, product)) {
        return;
      }

      throw this.productActionForbidden(input.action, input.actor.role);
    }

    throw this.productActionForbidden(input.action, input.actor.role);
  }

  private async assertWorkflowAccess(input: AuthorizationInput): Promise<void> {
    const product = await this.getProductOrThrow(input.targetId);

    switch (input.action) {
      case StageAction.REOPEN:
      case StageAction.BLOCK:
      case StageAction.ARCHIVE:
        if (this.canManageGenericWorkflow(input.actor, product, input.action)) {
          return;
        }

        break;
      default:
        break;
    }

    throw new ForbiddenException({
      code: 'WORKFLOW_ACTION_FORBIDDEN',
      message: `Role ${input.actor.role} cannot ${input.action.toLowerCase()} this workflow stage.`,
    });
  }

  private async assertGateWorkflowAccess(input: AuthorizationInput): Promise<void> {
    const product = await this.getProductOrThrow(input.targetId);

    switch (product.currentStage) {
      case 'STAGE_1':
        if (
          input.action === StageAction.SUBMIT &&
          product.productOwnerUserId === input.actor.id
        ) {
          return;
        }

        if (
          [StageAction.APPROVE, StageAction.REJECT, StageAction.KILL].includes(input.action) &&
          input.actor.role === UserRole.HEAD_OF_PRODUCT
        ) {
          return;
        }

        break;
      case 'STAGE_2':
        if (
          input.action === StageAction.SUBMIT &&
          product.productOwnerUserId === input.actor.id
        ) {
          return;
        }

        if (
          input.action === StageAction.APPROVE &&
          input.actor.role === UserRole.COO_EXECUTIVE_APPROVER
        ) {
          return;
        }

        if (
          input.action === StageAction.REJECT &&
          [UserRole.GM_COMMERCIAL_OWNER, UserRole.COO_EXECUTIVE_APPROVER].includes(input.actor.role)
        ) {
          return;
        }

        if (
          input.action === StageAction.KILL &&
          input.actor.role === UserRole.COO_EXECUTIVE_APPROVER
        ) {
          return;
        }

        break;
      case 'STAGE_3':
        if (
          input.action === StageAction.SUBMIT &&
          product.productOwnerUserId === input.actor.id
        ) {
          return;
        }

        if (
          input.action === StageAction.APPROVE &&
          input.actor.role === UserRole.COO_EXECUTIVE_APPROVER
        ) {
          return;
        }

        if (
          input.action === StageAction.REJECT &&
          [UserRole.GM_COMMERCIAL_OWNER, UserRole.COO_EXECUTIVE_APPROVER].includes(input.actor.role)
        ) {
          return;
        }

        if (
          input.action === StageAction.KILL &&
          input.actor.role === UserRole.COO_EXECUTIVE_APPROVER
        ) {
          return;
        }

        break;
      default:
        break;
    }

    throw new ForbiddenException({
      code: 'GATE_WORKFLOW_ACTION_FORBIDDEN',
      message: `Role ${input.actor.role} cannot ${input.action.toLowerCase()} this gate stage.`,
    });
  }

  private async assertGateTwoReviewAccess(input: AuthorizationInput): Promise<void> {
    const product = await this.getProductOrThrow(input.targetId);

    if (product.currentStage !== 'STAGE_2') {
      throw new ForbiddenException({
        code: 'GATE_TWO_REVIEW_STAGE_INVALID',
        message: 'Gate 2 reviews can only be updated while the product is in Stage 2.',
      });
    }

    if (
      input.action === StageAction.REVIEW &&
      input.actor.role === UserRole.QA_TSD_REVIEWER
    ) {
      return;
    }

    if (
      input.action === StageAction.CONFIRM &&
      input.actor.role === UserRole.FINANCE_MANAGER
    ) {
      return;
    }

    if (
      input.action === StageAction.APPROVE &&
      input.actor.role === UserRole.GM_COMMERCIAL_OWNER
    ) {
      return;
    }

    throw new ForbiddenException({
      code: 'GATE_TWO_REVIEW_ACTION_FORBIDDEN',
      message: `Role ${input.actor.role} cannot ${input.action.toLowerCase()} Gate 2 reviews.`,
    });
  }

  private async assertGateThreeReviewAccess(input: AuthorizationInput): Promise<void> {
    const product = await this.getProductOrThrow(input.targetId);

    if (product.currentStage !== 'STAGE_3') {
      throw new ForbiddenException({
        code: 'GATE_THREE_REVIEW_STAGE_INVALID',
        message: 'Gate 3 reviews can only be updated while the product is in Stage 3.',
      });
    }

    if (
      input.action === StageAction.CONFIRM &&
      input.actor.role === UserRole.FINANCE_MANAGER &&
      product.financeOwnerUserId === input.actor.id
    ) {
      return;
    }

    if (
      input.action === StageAction.REVIEW &&
      input.actor.role === UserRole.MARKETING_GTM_OWNER &&
      product.marketingOwnerUserId === input.actor.id
    ) {
      return;
    }

    if (
      input.action === StageAction.APPROVE &&
      input.actor.role === UserRole.GM_COMMERCIAL_OWNER &&
      product.commercialOwnerUserId === input.actor.id
    ) {
      return;
    }

    throw new ForbiddenException({
      code: 'GATE_THREE_REVIEW_ACTION_FORBIDDEN',
      message: `Role ${input.actor.role} cannot ${input.action.toLowerCase()} Gate 3 reviews.`,
    });
  }

  private async assertProductScopedViewAccess(input: AuthorizationInput): Promise<void> {
    const product = await this.getProductOrThrow(input.targetId);

    if (
      this.hasGlobalProductViewAccess(input.actor.role) ||
      this.isAssignedProductContributor(input.actor, product)
    ) {
      return;
    }

    throw this.productActionForbidden(StageAction.VIEW, input.actor.role);
  }

  private async assertStageFourTemplateAccess(input: AuthorizationInput): Promise<void> {
    const product = await this.getProductOrThrow(input.targetId);

    if (input.action === StageAction.VIEW) {
      if (
        this.hasGlobalProductViewAccess(input.actor.role) ||
        this.isAssignedProductContributor(input.actor, product) ||
        input.actor.role === UserRole.KD_AFTER_SALES
      ) {
        return;
      }

      throw this.productActionForbidden(input.action, input.actor.role);
    }

    if (input.action !== StageAction.EDIT) {
      throw this.stageFourActionForbidden(input);
    }

    if (product.currentStage !== 'STAGE_4') {
      throw new ForbiddenException({
        code: 'STAGE_FOUR_TEMPLATE_STAGE_INVALID',
        message: 'Stage 4 templates can only be edited while the product is in Stage 4.',
      });
    }

    switch (input.resource) {
      case PolicyResource.LAUNCH_CONFIRMATIONS:
        if (
          this.isAssignedClusterManager(input.actor, product) ||
          this.isAssignedMarketingOwner(input.actor, product)
        ) {
          return;
        }

        break;
      case PolicyResource.SELL_IN_REPORTS:
        if (
          this.isAssignedClusterManager(input.actor, product) ||
          input.actor.role === UserRole.SPDM_PRODUCT_OPS
        ) {
          return;
        }

        break;
      case PolicyResource.WEEKLY_FEEDBACK_LOGS:
        if (
          this.isAssignedMarketingOwner(input.actor, product) ||
          input.actor.role === UserRole.KD_AFTER_SALES
        ) {
          return;
        }

        break;
      case PolicyResource.DAY_30_REVIEWS:
        if (
          this.isAssignedCommercialOwner(input.actor, product) ||
          this.isAssignedFinanceOwner(input.actor, product) ||
          input.actor.role === UserRole.COO_EXECUTIVE_APPROVER
        ) {
          return;
        }

        break;
      default:
        break;
    }

    throw this.stageFourActionForbidden(input);
  }

  private async assertStageFiveTemplateAccess(input: AuthorizationInput): Promise<void> {
    const product = await this.getProductOrThrow(input.targetId);

    if (input.action === StageAction.VIEW) {
      if (
        this.hasGlobalProductViewAccess(input.actor.role) ||
        this.isAssignedProductContributor(input.actor, product) ||
        input.actor.role === UserRole.KD_AFTER_SALES ||
        input.actor.role === UserRole.SPDM_PRODUCT_OPS
      ) {
        return;
      }

      throw this.productActionForbidden(input.action, input.actor.role);
    }

    if (product.currentStage !== 'STAGE_5') {
      throw new ForbiddenException({
        code: 'STAGE_FIVE_TEMPLATE_STAGE_INVALID',
        message: 'Stage 5 templates can only be edited while the product is in Stage 5.',
      });
    }

    switch (input.resource) {
      case PolicyResource.PRODUCT_SCORECARDS:
        if (
          input.action === StageAction.EDIT &&
          (input.actor.role === UserRole.PRODUCT_MANAGER ||
            this.isAssignedFinanceOwner(input.actor, product)) &&
          (product.productOwnerUserId === input.actor.id ||
            product.financeOwnerUserId === input.actor.id)
        ) {
          return;
        }

        break;
      case PolicyResource.REVAMP_EOL_RECOMMENDATIONS:
        if (input.action === StageAction.EDIT && product.productOwnerUserId === input.actor.id) {
          return;
        }

        if (input.action === StageAction.CONFIRM && this.isAssignedCommercialOwner(input.actor, product)) {
          return;
        }

        if (input.action === StageAction.APPROVE && input.actor.role === UserRole.COO_EXECUTIVE_APPROVER) {
          return;
        }

        break;
      default:
        break;
    }

    throw this.stageFiveActionForbidden(input);
  }

  private assertPortfolioUpdateAccess(input: AuthorizationInput): void {
    if (
      input.action === StageAction.VIEW &&
      [
        UserRole.PRODUCT_MANAGER,
        UserRole.HEAD_OF_PRODUCT,
        UserRole.FINANCE_MANAGER,
        UserRole.GM_COMMERCIAL_OWNER,
        UserRole.COO_EXECUTIVE_APPROVER,
      ].includes(input.actor.role)
    ) {
      return;
    }

    if (
      [StageAction.CREATE, StageAction.EDIT].includes(input.action) &&
      [UserRole.FINANCE_MANAGER, UserRole.COO_EXECUTIVE_APPROVER].includes(input.actor.role)
    ) {
      return;
    }

    throw new ForbiddenException({
      code: 'PORTFOLIO_UPDATE_ACTION_FORBIDDEN',
      message: `Role ${input.actor.role} cannot ${input.action.toLowerCase()} portfolio updates.`,
    });
  }

  private async assertStageSixTemplateAccess(input: AuthorizationInput): Promise<void> {
    const product = await this.getProductOrThrow(input.targetId);

    if (input.action === StageAction.VIEW) {
      if (
        this.hasGlobalProductViewAccess(input.actor.role) ||
        this.isAssignedProductContributor(input.actor, product) ||
        input.actor.role === UserRole.KD_AFTER_SALES ||
        input.actor.role === UserRole.SPDM_PRODUCT_OPS
      ) {
        return;
      }

      throw this.productActionForbidden(input.action, input.actor.role);
    }

    if (input.action !== StageAction.EDIT) {
      throw this.stageSixActionForbidden(input);
    }

    if (product.currentStage !== 'STAGE_6') {
      throw new ForbiddenException({
        code: 'STAGE_SIX_TEMPLATE_STAGE_INVALID',
        message: 'Stage 6 templates can only be edited while the product is in Stage 6.',
      });
    }

    switch (input.resource) {
      case PolicyResource.EOL_EXECUTION_PLANS:
        if (
          this.isAssignedCommercialOwner(input.actor, product) ||
          input.actor.role === UserRole.KD_AFTER_SALES ||
          input.actor.role === UserRole.SPDM_PRODUCT_OPS ||
          input.actor.role === UserRole.COO_EXECUTIVE_APPROVER
        ) {
          return;
        }

        break;
      case PolicyResource.CLEARANCE_PLANS:
        if (
          this.isAssignedCommercialOwner(input.actor, product) ||
          this.isAssignedFinanceOwner(input.actor, product) ||
          input.actor.role === UserRole.COO_EXECUTIVE_APPROVER
        ) {
          return;
        }

        break;
      default:
        break;
    }

    throw this.stageSixActionForbidden(input);
  }

  private async getProductOrThrow(productId?: string): Promise<ProductRecord> {
    if (!productId) {
      throw new ForbiddenException({
        code: 'PRODUCT_TARGET_REQUIRED',
        message: 'This action requires a target product.',
      });
    }

    const product = await this.productsRepository.findById(productId);

    if (!product) {
      throw new NotFoundException({
        code: 'PRODUCT_NOT_FOUND',
        message: `Product ${productId} was not found.`,
      });
    }

    return product;
  }

  private hasGlobalProductViewAccess(role: UserRole): boolean {
    return [
      UserRole.HEAD_OF_PRODUCT,
      UserRole.QA_TSD_REVIEWER,
      UserRole.COO_EXECUTIVE_APPROVER,
    ].includes(role);
  }

  private isAssignedProductContributor(
    actor: AuthenticatedUser,
    product: ProductRecord,
  ): boolean {
    return this.isAssignedProductEditor(actor, product);
  }

  private isAssignedProductEditor(actor: AuthenticatedUser, product: ProductRecord): boolean {
    switch (actor.role) {
      case UserRole.PRODUCT_MANAGER:
        return product.productOwnerUserId === actor.id;
      case UserRole.GM_COMMERCIAL_OWNER:
        return product.commercialOwnerUserId === actor.id;
      case UserRole.FINANCE_MANAGER:
        return product.financeOwnerUserId === actor.id;
      case UserRole.MARKETING_GTM_OWNER:
        return product.marketingOwnerUserId === actor.id;
      case UserRole.CLUSTER_MANAGER:
        return product.clusterOwnerUserIds.includes(actor.id);
      default:
        return false;
    }
  }

  private isAssignedClusterManager(actor: AuthenticatedUser, product: ProductRecord): boolean {
    return actor.role === UserRole.CLUSTER_MANAGER && product.clusterOwnerUserIds.includes(actor.id);
  }

  private isAssignedCommercialOwner(actor: AuthenticatedUser, product: ProductRecord): boolean {
    return actor.role === UserRole.GM_COMMERCIAL_OWNER && product.commercialOwnerUserId === actor.id;
  }

  private isAssignedFinanceOwner(actor: AuthenticatedUser, product: ProductRecord): boolean {
    return actor.role === UserRole.FINANCE_MANAGER && product.financeOwnerUserId === actor.id;
  }

  private isAssignedMarketingOwner(actor: AuthenticatedUser, product: ProductRecord): boolean {
    return actor.role === UserRole.MARKETING_GTM_OWNER && product.marketingOwnerUserId === actor.id;
  }

  private canManageGenericWorkflow(
    actor: AuthenticatedUser,
    product: ProductRecord,
    action: StageAction,
  ): boolean {
    switch (product.currentStage) {
      case 'STAGE_3':
        return (
          actor.role === UserRole.GM_COMMERCIAL_OWNER ||
          actor.role === UserRole.COO_EXECUTIVE_APPROVER
        );
      case 'STAGE_4':
        return (
          actor.role === UserRole.GM_COMMERCIAL_OWNER ||
          actor.role === UserRole.COO_EXECUTIVE_APPROVER
        );
      case 'STAGE_5':
        return (
          actor.role === UserRole.GM_COMMERCIAL_OWNER ||
          actor.role === UserRole.COO_EXECUTIVE_APPROVER
        );
      case 'STAGE_6':
        return (
          actor.role === UserRole.COO_EXECUTIVE_APPROVER ||
          (action === StageAction.REOPEN && actor.role === UserRole.GM_COMMERCIAL_OWNER)
        );
      default:
        return false;
    }
  }

  private productActionForbidden(action: StageAction, role: UserRole): ForbiddenException {
    return new ForbiddenException({
      code: 'PRODUCT_ACTION_FORBIDDEN',
      message: `Role ${role} cannot ${action.toLowerCase()} this product.`,
    });
  }

  private stageFourActionForbidden(input: AuthorizationInput): ForbiddenException {
    return new ForbiddenException({
      code: 'STAGE_FOUR_TEMPLATE_ACTION_FORBIDDEN',
      message: `Role ${input.actor.role} cannot ${input.action.toLowerCase()} ${input.resource.toLowerCase()}.`,
    });
  }

  private stageFiveActionForbidden(input: AuthorizationInput): ForbiddenException {
    return new ForbiddenException({
      code: 'STAGE_FIVE_TEMPLATE_ACTION_FORBIDDEN',
      message: `Role ${input.actor.role} cannot ${input.action.toLowerCase()} ${input.resource.toLowerCase()}.`,
    });
  }

  private stageSixActionForbidden(input: AuthorizationInput): ForbiddenException {
    return new ForbiddenException({
      code: 'STAGE_SIX_TEMPLATE_ACTION_FORBIDDEN',
      message: `Role ${input.actor.role} cannot ${input.action.toLowerCase()} ${input.resource.toLowerCase()}.`,
    });
  }
}
