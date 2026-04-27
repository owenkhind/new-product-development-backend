import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

import { LaunchIssueStatus } from '../../../enums/launch-issue-status.enum';
import { ProductStage } from '../../../enums/product-stage.enum';
import { ProductsRepository } from '../../products/repositories/products.repository';
import type {
  CreateLaunchConfirmationChannelDto,
  CreateLaunchConfirmationDto,
} from '../dto/create-launch-confirmation.dto';
import type { UpdateLaunchConfirmationDto } from '../dto/update-launch-confirmation.dto';
import { LaunchConfirmationsRepository } from '../repositories/launch-confirmations.repository';
import type {
  LaunchConfirmationChannelRecord,
  LaunchConfirmationRecord,
} from '../types/launch-confirmation-record.type';

@Injectable()
export class LaunchConfirmationsService {
  constructor(
    private readonly productsRepository: ProductsRepository,
    private readonly launchConfirmationsRepository: LaunchConfirmationsRepository,
  ) {}

  async create(productId: string, input: CreateLaunchConfirmationDto): Promise<LaunchConfirmationRecord> {
    await this.assertStageFourEditable(productId);

    const existingRecord = await this.launchConfirmationsRepository.findByProductId(productId);

    if (existingRecord) {
      throw new ConflictException({
        code: 'LAUNCH_CONFIRMATION_ALREADY_EXISTS',
        message: `Launch confirmation already exists for product ${productId}.`,
      });
    }

    return this.launchConfirmationsRepository.create({
      channels: this.mapChannels(input.channels),
      id: randomUUID(),
      launchDate: input.launchDate,
      notes: input.notes ?? null,
      productId,
    });
  }

  async findOne(productId: string): Promise<LaunchConfirmationRecord> {
    const record = await this.launchConfirmationsRepository.findByProductId(productId);

    if (!record) {
      throw new NotFoundException({
        code: 'LAUNCH_CONFIRMATION_NOT_FOUND',
        message: `Launch confirmation for product ${productId} was not found.`,
      });
    }

    return record;
  }

  async update(productId: string, input: UpdateLaunchConfirmationDto): Promise<LaunchConfirmationRecord> {
    await this.assertStageFourEditable(productId);

    const existingRecord = await this.launchConfirmationsRepository.findByProductId(productId);

    if (!existingRecord) {
      throw new NotFoundException({
        code: 'LAUNCH_CONFIRMATION_NOT_FOUND',
        message: `Launch confirmation for product ${productId} was not found.`,
      });
    }

    const updatedRecord = await this.launchConfirmationsRepository.update(productId, {
      channels: input.channels ? this.mapChannels(input.channels) : undefined,
      launchDate: input.launchDate,
      notes: input.notes,
    });

    if (!updatedRecord) {
      throw new NotFoundException({
        code: 'LAUNCH_CONFIRMATION_NOT_FOUND',
        message: `Launch confirmation for product ${productId} was not found.`,
      });
    }

    return updatedRecord;
  }

  static getBlockedChannels(record: LaunchConfirmationRecord): LaunchConfirmationChannelRecord[] {
    return record.channels.filter(
      (channel) =>
        !channel.isLive ||
        [LaunchIssueStatus.BLOCKED, LaunchIssueStatus.CRITICAL_ISSUE].includes(channel.issueStatus),
    );
  }

  private async assertStageFourEditable(productId: string): Promise<void> {
    const product = await this.productsRepository.findById(productId);

    if (!product) {
      throw new NotFoundException({
        code: 'PRODUCT_NOT_FOUND',
        message: `Product ${productId} was not found.`,
      });
    }

    if (product.currentStage !== ProductStage.STAGE_4) {
      throw new ConflictException({
        code: 'STAGE_FOUR_TEMPLATE_LOCKED',
        message: `Stage 4 templates can only be edited while product ${productId} is in Stage 4.`,
      });
    }
  }

  private mapChannels(channels: CreateLaunchConfirmationChannelDto[]): LaunchConfirmationChannelRecord[] {
    return channels.map((channel) => ({
      accountName: channel.accountName,
      channelType: channel.channelType,
      goLiveAt: channel.goLiveAt ?? null,
      id: randomUUID(),
      isLive: channel.isLive,
      issueStatus: channel.issueStatus,
      issueSummary: channel.issueSummary ?? null,
      listingUrl: channel.listingUrl ?? null,
    }));
  }
}
