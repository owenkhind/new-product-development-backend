import { FeedbackSeverity } from '../../../enums/feedback-severity.enum';
import { FeedbackSource } from '../../../enums/feedback-source.enum';

export type WeeklyFeedbackItemRecord = {
  actionOwner: string | null;
  feedback: string;
  id: string;
  isResolved: boolean;
  notes: string | null;
  severity: FeedbackSeverity;
  source: FeedbackSource;
};

export type WeeklyFeedbackLogRecord = {
  createdAt: Date;
  id: string;
  items: WeeklyFeedbackItemRecord[];
  productId: string;
  summary: string;
  updatedAt: Date;
  weekStartDate: string;
};
