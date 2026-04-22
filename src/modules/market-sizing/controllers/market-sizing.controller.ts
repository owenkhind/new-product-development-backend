import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';

import { PolicyResource } from '../../../enums/policy-resource.enum';
import { StageAction } from '../../../enums/stage-action.enum';
import { Authorize } from '../../../guards/authorize.decorator';
import { PoliciesGuard } from '../../../guards/policies.guard';
import { CreateMarketSizingDto } from '../dto/create-market-sizing.dto';
import { MarketSizingResponseDto } from '../dto/market-sizing-response.dto';
import { UpdateMarketSizingDto } from '../dto/update-market-sizing.dto';
import { MarketSizingService } from '../services/market-sizing.service';

@Controller('products/:productId/market-sizing')
@UseGuards(PoliciesGuard)
export class MarketSizingController {
  constructor(private readonly marketSizingService: MarketSizingService) {}

  @Post()
  @Authorize(PolicyResource.PRODUCTS, StageAction.EDIT)
  async create(
    @Param('productId') productId: string,
    @Body() input: CreateMarketSizingDto,
  ): Promise<MarketSizingResponseDto> {
    const record = await this.marketSizingService.create(productId, input);
    return MarketSizingResponseDto.fromRecord(record);
  }

  @Get()
  @Authorize(PolicyResource.PRODUCTS, StageAction.VIEW)
  async findOne(@Param('productId') productId: string): Promise<MarketSizingResponseDto> {
    const record = await this.marketSizingService.findOne(productId);
    return MarketSizingResponseDto.fromRecord(record);
  }

  @Patch()
  @Authorize(PolicyResource.PRODUCTS, StageAction.EDIT)
  async update(
    @Param('productId') productId: string,
    @Body() input: UpdateMarketSizingDto,
  ): Promise<MarketSizingResponseDto> {
    const record = await this.marketSizingService.update(productId, input);
    return MarketSizingResponseDto.fromRecord(record);
  }
}
