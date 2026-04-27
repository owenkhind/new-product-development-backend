import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

import { ProductStage } from '../../../enums/product-stage.enum';
import { ProductsRepository } from '../../products/repositories/products.repository';
import type {
  CreateChannelListingPlanChannelDto,
  CreateChannelListingPlanDto,
} from '../dto/create-channel-listing-plan.dto';
import type { UpdateChannelListingPlanDto } from '../dto/update-channel-listing-plan.dto';
import { ChannelListingPlansRepository } from '../repositories/channel-listing-plans.repository';
import type {
  ChannelListingPlanChannelRecord,
  ChannelListingPlanRecord,
} from '../types/channel-listing-plan-record.type';

@Injectable()
export class ChannelListingPlansService {
  constructor(
    private readonly productsRepository: ProductsRepository,
    private readonly channelListingPlansRepository: ChannelListingPlansRepository,
  ) {}

  async create(productId: string, input: CreateChannelListingPlanDto): Promise<ChannelListingPlanRecord> {
    await this.assertStageThreeEditable(productId);

    const existingRecord = await this.channelListingPlansRepository.findByProductId(productId);

    if (existingRecord) {
      throw new ConflictException({
        code: 'CHANNEL_LISTING_PLAN_ALREADY_EXISTS',
        message: `Channel listing plan already exists for product ${productId}.`,
      });
    }

    return this.channelListingPlansRepository.create({
      channels: this.mapChannels(input.channels),
      id: randomUUID(),
      lazadaConfirmed: input.lazadaConfirmed,
      productId,
      shopeeConfirmed: input.shopeeConfirmed,
      summary: input.summary ?? null,
    });
  }

  async findOne(productId: string): Promise<ChannelListingPlanRecord> {
    const record = await this.channelListingPlansRepository.findByProductId(productId);

    if (!record) {
      throw new NotFoundException({
        code: 'CHANNEL_LISTING_PLAN_NOT_FOUND',
        message: `Channel listing plan for product ${productId} was not found.`,
      });
    }

    return record;
  }

  async update(productId: string, input: UpdateChannelListingPlanDto): Promise<ChannelListingPlanRecord> {
    await this.assertStageThreeEditable(productId);

    const existingRecord = await this.channelListingPlansRepository.findByProductId(productId);

    if (!existingRecord) {
      throw new NotFoundException({
        code: 'CHANNEL_LISTING_PLAN_NOT_FOUND',
        message: `Channel listing plan for product ${productId} was not found.`,
      });
    }

    const updatedRecord = await this.channelListingPlansRepository.update(productId, {
      channels: input.channels ? this.mapChannels(input.channels) : undefined,
      lazadaConfirmed: input.lazadaConfirmed,
      shopeeConfirmed: input.shopeeConfirmed,
      summary: input.summary,
    });

    if (!updatedRecord) {
      throw new NotFoundException({
        code: 'CHANNEL_LISTING_PLAN_NOT_FOUND',
        message: `Channel listing plan for product ${productId} was not found.`,
      });
    }

    return updatedRecord;
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

  private mapChannels(
    channels: CreateChannelListingPlanChannelDto[],
  ): ChannelListingPlanChannelRecord[] {
    return channels.map((channel) => ({
      accountName: channel.accountName,
      channelType: channel.channelType,
      id: randomUUID(),
      isConfirmed: channel.isConfirmed,
      launchOwner: channel.launchOwner,
      readinessNotes: channel.readinessNotes ?? null,
      targetGoLiveDate: channel.targetGoLiveDate ?? null,
    }));
  }
}
