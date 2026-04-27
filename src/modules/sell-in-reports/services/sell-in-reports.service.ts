import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

import { ProductStage } from '../../../enums/product-stage.enum';
import type { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { ProductsRepository } from '../../products/repositories/products.repository';
import type { CreateSellInReportAccountDto, CreateSellInReportDto } from '../dto/create-sell-in-report.dto';
import type { UpdateSellInReportDto } from '../dto/update-sell-in-report.dto';
import { SellInReportsRepository } from '../repositories/sell-in-reports.repository';
import type { SellInReportAccountRecord, SellInReportRecord } from '../types/sell-in-report-record.type';

@Injectable()
export class SellInReportsService {
  constructor(
    private readonly productsRepository: ProductsRepository,
    private readonly sellInReportsRepository: SellInReportsRepository,
  ) {}

  async create(productId: string, input: CreateSellInReportDto): Promise<SellInReportRecord> {
    await this.assertStageFourEditable(productId);

    const accounts = this.mapAccounts(input.accounts);

    return this.sellInReportsRepository.create({
      accounts,
      id: randomUUID(),
      notes: input.notes ?? null,
      productId,
      reportPeriodEnd: input.reportPeriodEnd,
      reportPeriodStart: input.reportPeriodStart,
      totalSellInUnits: this.calculateTotalUnits(accounts),
      totalSellInValue: this.calculateTotalValue(accounts),
    });
  }

  async list(
    productId: string,
    query: PaginationQueryDto,
  ): Promise<{ rows: SellInReportRecord[]; total: number }> {
    await this.assertProductExists(productId);
    return this.sellInReportsRepository.listByProductId({
      limit: query.limit,
      offset: (query.page - 1) * query.limit,
      productId,
    });
  }

  async findOne(productId: string, reportId: string): Promise<SellInReportRecord> {
    const record = await this.sellInReportsRepository.findById(productId, reportId);

    if (!record) {
      throw new NotFoundException({
        code: 'SELL_IN_REPORT_NOT_FOUND',
        message: `Sell-in report ${reportId} for product ${productId} was not found.`,
      });
    }

    return record;
  }

  async update(
    productId: string,
    reportId: string,
    input: UpdateSellInReportDto,
  ): Promise<SellInReportRecord> {
    await this.assertStageFourEditable(productId);

    const existingRecord = await this.sellInReportsRepository.findById(productId, reportId);

    if (!existingRecord) {
      throw new NotFoundException({
        code: 'SELL_IN_REPORT_NOT_FOUND',
        message: `Sell-in report ${reportId} for product ${productId} was not found.`,
      });
    }

    const accounts = input.accounts ? this.mapAccounts(input.accounts) : undefined;
    const updatedRecord = await this.sellInReportsRepository.update(productId, reportId, {
      accounts,
      notes: input.notes,
      reportPeriodEnd: input.reportPeriodEnd,
      reportPeriodStart: input.reportPeriodStart,
      totalSellInUnits: accounts ? this.calculateTotalUnits(accounts) : undefined,
      totalSellInValue: accounts ? this.calculateTotalValue(accounts) : undefined,
    });

    if (!updatedRecord) {
      throw new NotFoundException({
        code: 'SELL_IN_REPORT_NOT_FOUND',
        message: `Sell-in report ${reportId} for product ${productId} was not found.`,
      });
    }

    return updatedRecord;
  }

  private async assertProductExists(productId: string): Promise<void> {
    const product = await this.productsRepository.findById(productId);

    if (!product) {
      throw new NotFoundException({
        code: 'PRODUCT_NOT_FOUND',
        message: `Product ${productId} was not found.`,
      });
    }
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
      throw new BadRequestException({
        code: 'STAGE_FOUR_TEMPLATE_LOCKED',
        message: `Stage 4 reports can only be edited while product ${productId} is in Stage 4.`,
      });
    }
  }

  private calculateTotalUnits(accounts: SellInReportAccountRecord[]): number {
    return accounts.reduce((total, account) => total + account.sellInUnits, 0);
  }

  private calculateTotalValue(accounts: SellInReportAccountRecord[]): string {
    return accounts
      .reduce((total, account) => total + Number(account.sellInValue), 0)
      .toFixed(2);
  }

  private mapAccounts(accounts: CreateSellInReportAccountDto[]): SellInReportAccountRecord[] {
    return accounts.map((account) => ({
      accountName: account.accountName,
      channelType: account.channelType,
      declineReason: account.declineReason ?? null,
      id: randomUUID(),
      sellInUnits: account.sellInUnits,
      sellInValue: account.sellInValue,
    }));
  }
}
