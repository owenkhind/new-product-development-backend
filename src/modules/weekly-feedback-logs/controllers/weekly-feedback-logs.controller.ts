import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';

import { PolicyResource } from '../../../enums/policy-resource.enum';
import { StageAction } from '../../../enums/stage-action.enum';
import { Authorize } from '../../../guards/authorize.decorator';
import { PoliciesGuard } from '../../../guards/policies.guard';
import { CreateWeeklyFeedbackLogDto } from '../dto/create-weekly-feedback-log.dto';
import { UpdateWeeklyFeedbackLogDto } from '../dto/update-weekly-feedback-log.dto';
import { WeeklyFeedbackLogResponseDto } from '../dto/weekly-feedback-log-response.dto';
import { WeeklyFeedbackLogsService } from '../services/weekly-feedback-logs.service';

@Controller('products/:productId/weekly-feedback-logs')
@UseGuards(PoliciesGuard)
export class WeeklyFeedbackLogsController {
  constructor(private readonly weeklyFeedbackLogsService: WeeklyFeedbackLogsService) {}

  @Post()
  @Authorize(PolicyResource.PRODUCTS, StageAction.EDIT)
  async create(
    @Param('productId') productId: string,
    @Body() input: CreateWeeklyFeedbackLogDto,
  ): Promise<WeeklyFeedbackLogResponseDto> {
    const record = await this.weeklyFeedbackLogsService.create(productId, input);
    return WeeklyFeedbackLogResponseDto.fromRecord(record);
  }

  @Get()
  @Authorize(PolicyResource.PRODUCTS, StageAction.VIEW)
  async list(@Param('productId') productId: string): Promise<WeeklyFeedbackLogResponseDto[]> {
    const records = await this.weeklyFeedbackLogsService.list(productId);
    return records.map((record) => WeeklyFeedbackLogResponseDto.fromRecord(record));
  }

  @Get(':logId')
  @Authorize(PolicyResource.PRODUCTS, StageAction.VIEW)
  async findOne(
    @Param('productId') productId: string,
    @Param('logId') logId: string,
  ): Promise<WeeklyFeedbackLogResponseDto> {
    const record = await this.weeklyFeedbackLogsService.findOne(productId, logId);
    return WeeklyFeedbackLogResponseDto.fromRecord(record);
  }

  @Patch(':logId')
  @Authorize(PolicyResource.PRODUCTS, StageAction.EDIT)
  async update(
    @Param('productId') productId: string,
    @Param('logId') logId: string,
    @Body() input: UpdateWeeklyFeedbackLogDto,
  ): Promise<WeeklyFeedbackLogResponseDto> {
    const record = await this.weeklyFeedbackLogsService.update(productId, logId, input);
    return WeeklyFeedbackLogResponseDto.fromRecord(record);
  }
}
