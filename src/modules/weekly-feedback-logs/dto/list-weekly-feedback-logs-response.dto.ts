import type { WeeklyFeedbackLogResponseDto } from './weekly-feedback-log-response.dto';

export type ListWeeklyFeedbackLogsResponseDto = {
  data: WeeklyFeedbackLogResponseDto[];
  meta: {
    limit: number;
    page: number;
    total: number;
  };
};
