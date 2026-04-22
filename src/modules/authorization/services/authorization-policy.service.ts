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
      case StageAction.SUBMIT:
        if (product.productOwnerUserId === input.actor.id) {
          return;
        }

        break;
      case StageAction.APPROVE:
      case StageAction.REJECT:
      case StageAction.REOPEN:
      case StageAction.BLOCK:
      case StageAction.ARCHIVE:
        if (this.canManageWorkflowStage(input.actor, product, input.action)) {
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

  private canManageWorkflowStage(
    actor: AuthenticatedUser,
    product: ProductRecord,
    action: StageAction,
  ): boolean {
    switch (product.currentStage) {
      case 'STAGE_1':
        return actor.role === UserRole.HEAD_OF_PRODUCT;
      case 'STAGE_2':
        return (
          actor.role === UserRole.GM_COMMERCIAL_OWNER ||
          actor.role === UserRole.COO_EXECUTIVE_APPROVER
        );
      case 'STAGE_3':
        return (
          actor.role === UserRole.HEAD_OF_PRODUCT ||
          actor.role === UserRole.GM_COMMERCIAL_OWNER
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
}
