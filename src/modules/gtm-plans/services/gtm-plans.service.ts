import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

import { ProductStage } from '../../../enums/product-stage.enum';
import { ProductsRepository } from '../../products/repositories/products.repository';
import type { CreateGtmPlanChecklistItemDto, CreateGtmPlanDto } from '../dto/create-gtm-plan.dto';
import type { UpdateGtmPlanDto } from '../dto/update-gtm-plan.dto';
import { GtmPlansRepository } from '../repositories/gtm-plans.repository';
import type { GtmPlanChecklistItemRecord, GtmPlanRecord } from '../types/gtm-plan-record.type';

@Injectable()
export class GtmPlansService {
  constructor(
    private readonly productsRepository: ProductsRepository,
    private readonly gtmPlansRepository: GtmPlansRepository,
  ) {}

  async create(productId: string, input: CreateGtmPlanDto): Promise<GtmPlanRecord> {
    await this.assertStageThreeEditable(productId);

    const existingRecord = await this.gtmPlansRepository.findByProductId(productId);

    if (existingRecord) {
      throw new ConflictException({
        code: 'GTM_PLAN_ALREADY_EXISTS',
        message: `GTM plan already exists for product ${productId}.`,
      });
    }

    return this.gtmPlansRepository.create({
      activationPlan: input.activationPlan,
      budget: input.budget,
      campaignEndDate: input.campaignEndDate ?? null,
      campaignStartDate: input.campaignStartDate ?? null,
      checklistItems: this.mapChecklistItems(input.checklistItems),
      communicationsPlan: input.communicationsPlan,
      id: randomUUID(),
      launchObjectives: input.launchObjectives,
      productId,
    });
  }

  async findOne(productId: string): Promise<GtmPlanRecord> {
    const record = await this.gtmPlansRepository.findByProductId(productId);

    if (!record) {
      throw new NotFoundException({
        code: 'GTM_PLAN_NOT_FOUND',
        message: `GTM plan for product ${productId} was not found.`,
      });
    }

    return record;
  }

  async update(productId: string, input: UpdateGtmPlanDto): Promise<GtmPlanRecord> {
    await this.assertStageThreeEditable(productId);

    const existingRecord = await this.gtmPlansRepository.findByProductId(productId);

    if (!existingRecord) {
      throw new NotFoundException({
        code: 'GTM_PLAN_NOT_FOUND',
        message: `GTM plan for product ${productId} was not found.`,
      });
    }

    const updatedRecord = await this.gtmPlansRepository.update(productId, {
      activationPlan: input.activationPlan,
      budget: input.budget,
      campaignEndDate: input.campaignEndDate,
      campaignStartDate: input.campaignStartDate,
      checklistItems: input.checklistItems ? this.mapChecklistItems(input.checklistItems) : undefined,
      communicationsPlan: input.communicationsPlan,
      launchObjectives: input.launchObjectives,
    });

    if (!updatedRecord) {
      throw new NotFoundException({
        code: 'GTM_PLAN_NOT_FOUND',
        message: `GTM plan for product ${productId} was not found.`,
      });
    }

    return updatedRecord;
  }

  static getUnresolvedCriticalItems(record: GtmPlanRecord): GtmPlanChecklistItemRecord[] {
    return record.checklistItems.filter((item) => item.isCritical && !item.isComplete);
  }

  private async assertStageThreeEditable(productId: string): Promise<void> {
    const product = await this.productsRepository.findById(productId);

    if (!product) {
      throw new NotFoundException({
        code: 'PRODUCT_NOT_FOUND',
        message: `Product ${productId} was not found.`,
      });
    }

    if (product.currentStage !== ProductStage.STAGE_3) {
      throw new ConflictException({
        code: 'STAGE_THREE_TEMPLATE_LOCKED',
        message: `Stage 3 templates can only be edited while product ${productId} is in Stage 3.`,
      });
    }
  }

  private mapChecklistItems(items: CreateGtmPlanChecklistItemDto[]): GtmPlanChecklistItemRecord[] {
    return items.map((item) => ({
      dueDate: item.dueDate ?? null,
      id: randomUUID(),
      isComplete: item.isComplete,
      isCritical: item.isCritical,
      itemName: item.itemName,
      notes: item.notes ?? null,
      ownerRole: item.ownerRole,
    }));
  }
}
