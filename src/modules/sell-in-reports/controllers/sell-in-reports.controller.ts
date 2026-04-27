import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';

import { PolicyResource } from '../../../enums/policy-resource.enum';
import { StageAction } from '../../../enums/stage-action.enum';
import { Authorize } from '../../../guards/authorize.decorator';
import { PoliciesGuard } from '../../../guards/policies.guard';
import { CreateSellInReportDto } from '../dto/create-sell-in-report.dto';
import { SellInReportResponseDto } from '../dto/sell-in-report-response.dto';
import { UpdateSellInReportDto } from '../dto/update-sell-in-report.dto';
import { SellInReportsService } from '../services/sell-in-reports.service';

@Controller('products/:productId/sell-in-reports')
@UseGuards(PoliciesGuard)
export class SellInReportsController {
  constructor(private readonly sellInReportsService: SellInReportsService) {}

  @Post()
  @Authorize(PolicyResource.SELL_IN_REPORTS, StageAction.EDIT)
  async create(
    @Param('productId') productId: string,
    @Body() input: CreateSellInReportDto,
  ): Promise<SellInReportResponseDto> {
    const record = await this.sellInReportsService.create(productId, input);
    return SellInReportResponseDto.fromRecord(record);
  }

  @Get()
  @Authorize(PolicyResource.SELL_IN_REPORTS, StageAction.VIEW)
  async list(@Param('productId') productId: string): Promise<SellInReportResponseDto[]> {
    const records = await this.sellInReportsService.list(productId);
    return records.map((record) => SellInReportResponseDto.fromRecord(record));
  }

  @Get(':reportId')
  @Authorize(PolicyResource.SELL_IN_REPORTS, StageAction.VIEW)
  async findOne(
    @Param('productId') productId: string,
    @Param('reportId') reportId: string,
  ): Promise<SellInReportResponseDto> {
    const record = await this.sellInReportsService.findOne(productId, reportId);
    return SellInReportResponseDto.fromRecord(record);
  }

  @Patch(':reportId')
  @Authorize(PolicyResource.SELL_IN_REPORTS, StageAction.EDIT)
  async update(
    @Param('productId') productId: string,
    @Param('reportId') reportId: string,
    @Body() input: UpdateSellInReportDto,
  ): Promise<SellInReportResponseDto> {
    const record = await this.sellInReportsService.update(productId, reportId, input);
    return SellInReportResponseDto.fromRecord(record);
  }
}
