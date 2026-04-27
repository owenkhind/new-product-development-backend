import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';

import { PolicyResource } from '../../../enums/policy-resource.enum';
import { StageAction } from '../../../enums/stage-action.enum';
import { Authorize } from '../../../guards/authorize.decorator';
import { PoliciesGuard } from '../../../guards/policies.guard';
import { ChannelPricingResponseDto } from '../dto/channel-pricing-response.dto';
import { CreateChannelPricingDto } from '../dto/create-channel-pricing.dto';
import { UpdateChannelPricingDto } from '../dto/update-channel-pricing.dto';
import { ChannelPricingService } from '../services/channel-pricing.service';

@Controller('products/:productId/channel-pricing')
@UseGuards(PoliciesGuard)
export class ChannelPricingController {
  constructor(private readonly channelPricingService: ChannelPricingService) {}

  @Post()
  @Authorize(PolicyResource.PRODUCTS, StageAction.EDIT)
  async create(
    @Param('productId') productId: string,
    @Body() input: CreateChannelPricingDto,
  ): Promise<ChannelPricingResponseDto> {
    const record = await this.channelPricingService.create(productId, input);
    return ChannelPricingResponseDto.fromRecord(record);
  }

  @Get()
  @Authorize(PolicyResource.PRODUCTS, StageAction.VIEW)
  async findOne(@Param('productId') productId: string): Promise<ChannelPricingResponseDto> {
    const record = await this.channelPricingService.findOne(productId);
    return ChannelPricingResponseDto.fromRecord(record);
  }

  @Patch()
  @Authorize(PolicyResource.PRODUCTS, StageAction.EDIT)
  async update(
    @Param('productId') productId: string,
    @Body() input: UpdateChannelPricingDto,
  ): Promise<ChannelPricingResponseDto> {
    const record = await this.channelPricingService.update(productId, input);
    return ChannelPricingResponseDto.fromRecord(record);
  }
}
