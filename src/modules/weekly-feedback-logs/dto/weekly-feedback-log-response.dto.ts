import type {
  WeeklyFeedbackItemRecord,
  WeeklyFeedbackLogRecord,
} from '../types/weekly-feedback-log-record.type';

class WeeklyFeedbackItemResponseDto {
  actionOwner!: string | null;
  feedback!: string;
  id!: string;
  isResolved!: boolean;
  notes!: string | null;
  severity!: string;
  source!: string;

  static fromRecord(record: WeeklyFeedbackItemRecord): WeeklyFeedbackItemResponseDto {
    return {
      actionOwner: record.actionOwner,
      feedback: record.feedback,
      id: record.id,
      isResolved: record.isResolved,
      notes: record.notes,
      severity: record.severity,
      source: record.source,
    };
  }
}

export class WeeklyFeedbackLogResponseDto {
  createdAt!: Date;
  id!: string;
  items!: WeeklyFeedbackItemResponseDto[];
  productId!: string;
  summary!: string;
  updatedAt!: Date;
  weekStartDate!: string;

  static fromRecord(record: WeeklyFeedbackLogRecord): WeeklyFeedbackLogResponseDto {
    return {
      createdAt: record.createdAt,
      id: record.id,
      items: record.items.map((item) => WeeklyFeedbackItemResponseDto.fromRecord(item)),
      productId: record.productId,
      summary: record.summary,
      updatedAt: record.updatedAt,
      weekStartDate: record.weekStartDate,
    };
  }
}
