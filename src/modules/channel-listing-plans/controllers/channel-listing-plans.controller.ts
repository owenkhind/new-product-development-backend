import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';

import { PolicyResource } from '../../../enums/policy-resource.enum';
import { StageAction } from '../../../enums/stage-action.enum';
import { Authorize } from '../../../guards/authorize.decorator';
import { PoliciesGuard } from '../../../guards/policies.guard';
import { ChannelListingPlanResponseDto } from '../dto/channel-listing-plan-response.dto';
import { CreateChannelListingPlanDto } from '../dto/create-channel-listing-plan.dto';
import { UpdateChannelListingPlanDto } from '../dto/update-channel-listing-plan.dto';
import { ChannelListingPlansService } from '../services/channel-listing-plans.service';

@Controller('products/:productId/channel-listing-plan')
@UseGuards(PoliciesGuard)
export class ChannelListingPlansController {
  constructor(private readonly channelListingPlansService: ChannelListingPlansService) {}

  @Post()
  @Authorize(PolicyResource.PRODUCTS, StageAction.EDIT)
  async create(
    @Param('productId') productId: string,
    @Body() input: CreateChannelListingPlanDto,
  ): Promise<ChannelListingPlanResponseDto> {
    const record = await this.channelListingPlansService.create(productId, input);
    return ChannelListingPlanResponseDto.fromRecord(record);
  }

  @Get()
  @Authorize(PolicyResource.PRODUCTS, StageAction.VIEW)
  async findOne(@Param('productId') productId: string): Promise<ChannelListingPlanResponseDto> {
    const record = await this.channelListingPlansService.findOne(productId);
    return ChannelListingPlanResponseDto.fromRecord(record);
  }

  @Patch()
  @Authorize(PolicyResource.PRODUCTS, StageAction.EDIT)
  async update(
    @Param('productId') productId: string,
    @Body() input: UpdateChannelListingPlanDto,
  ): Promise<ChannelListingPlanResponseDto> {
    const record = await this.channelListingPlansService.update(productId, input);
    return ChannelListingPlanResponseDto.fromRecord(record);
  }
}
