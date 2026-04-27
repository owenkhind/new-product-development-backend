import type {
  SellInReportAccountRecord,
  SellInReportRecord,
} from '../types/sell-in-report-record.type';

class SellInReportAccountResponseDto {
  accountName!: string;
  channelType!: string;
  declineReason!: string | null;
  id!: string;
  sellInUnits!: number;
  sellInValue!: string;

  static fromRecord(record: SellInReportAccountRecord): SellInReportAccountResponseDto {
    return {
      accountName: record.accountName,
      channelType: record.channelType,
      declineReason: record.declineReason,
      id: record.id,
      sellInUnits: record.sellInUnits,
      sellInValue: record.sellInValue,
    };
  }
}

export class SellInReportResponseDto {
  accounts!: SellInReportAccountResponseDto[];
  createdAt!: Date;
  id!: string;
  notes!: string | null;
  productId!: string;
  reportPeriodEnd!: string;
  reportPeriodStart!: string;
  totalSellInUnits!: number;
  totalSellInValue!: string;
  updatedAt!: Date;

  static fromRecord(record: SellInReportRecord): SellInReportResponseDto {
    return {
      accounts: record.accounts.map((account) => SellInReportAccountResponseDto.fromRecord(account)),
      createdAt: record.createdAt,
      id: record.id,
      notes: record.notes,
      productId: record.productId,
      reportPeriodEnd: record.reportPeriodEnd,
      reportPeriodStart: record.reportPeriodStart,
      totalSellInUnits: record.totalSellInUnits,
      totalSellInValue: record.totalSellInValue,
      updatedAt: record.updatedAt,
    };
  }
}
