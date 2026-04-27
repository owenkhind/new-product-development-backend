import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';

import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { PolicyResource } from '../../../enums/policy-resource.enum';
import { StageAction } from '../../../enums/stage-action.enum';
import { Authorize } from '../../../guards/authorize.decorator';
import { PoliciesGuard } from '../../../guards/policies.guard';
import { CreatePortfolioUpdateDto } from '../dto/create-portfolio-update.dto';
import { ListPortfolioUpdatesResponseDto } from '../dto/list-portfolio-updates-response.dto';
import { PortfolioUpdateResponseDto } from '../dto/portfolio-update-response.dto';
import { UpdatePortfolioUpdateDto } from '../dto/update-portfolio-update.dto';
import { PortfolioUpdatesService } from '../services/portfolio-updates.service';

@Controller('portfolio-updates')
@UseGuards(PoliciesGuard)
export class PortfolioUpdatesController {
  constructor(private readonly portfolioUpdatesService: PortfolioUpdatesService) {}

  @Post()
  @Authorize(PolicyResource.PORTFOLIO_UPDATES, StageAction.CREATE)
  async create(@Body() input: CreatePortfolioUpdateDto): Promise<PortfolioUpdateResponseDto> {
    const record = await this.portfolioUpdatesService.create(input);
    return PortfolioUpdateResponseDto.fromRecord(record);
  }

  @Get()
  @Authorize(PolicyResource.PORTFOLIO_UPDATES, StageAction.VIEW)
  async list(@Query() query: PaginationQueryDto): Promise<ListPortfolioUpdatesResponseDto> {
    const result = await this.portfolioUpdatesService.list(query);
    return {
      data: result.rows.map((record) => PortfolioUpdateResponseDto.fromRecord(record)),
      meta: {
        limit: query.limit,
        page: query.page,
        total: result.total,
      },
    };
  }

  @Get(':portfolioUpdateId')
  @Authorize(PolicyResource.PORTFOLIO_UPDATES, StageAction.VIEW)
  async findOne(
    @Param('portfolioUpdateId') portfolioUpdateId: string,
  ): Promise<PortfolioUpdateResponseDto> {
    const record = await this.portfolioUpdatesService.findOne(portfolioUpdateId);
    return PortfolioUpdateResponseDto.fromRecord(record);
  }

  @Patch(':portfolioUpdateId')
  @Authorize(PolicyResource.PORTFOLIO_UPDATES, StageAction.EDIT)
  async update(
    @Param('portfolioUpdateId') portfolioUpdateId: string,
    @Body() input: UpdatePortfolioUpdateDto,
  ): Promise<PortfolioUpdateResponseDto> {
    const record = await this.portfolioUpdatesService.update(portfolioUpdateId, input);
    return PortfolioUpdateResponseDto.fromRecord(record);
  }
}
