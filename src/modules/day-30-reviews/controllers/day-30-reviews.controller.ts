import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';

import { PolicyResource } from '../../../enums/policy-resource.enum';
import { StageAction } from '../../../enums/stage-action.enum';
import { Authorize } from '../../../guards/authorize.decorator';
import { PoliciesGuard } from '../../../guards/policies.guard';
import { CreateDay30ReviewDto } from '../dto/create-day-30-review.dto';
import { Day30ReviewResponseDto } from '../dto/day-30-review-response.dto';
import { UpdateDay30ReviewDto } from '../dto/update-day-30-review.dto';
import { Day30ReviewsService } from '../services/day-30-reviews.service';

@Controller('products/:productId/day-30-review')
@UseGuards(PoliciesGuard)
export class Day30ReviewsController {
  constructor(private readonly day30ReviewsService: Day30ReviewsService) {}

  @Post()
  @Authorize(PolicyResource.DAY_30_REVIEWS, StageAction.EDIT)
  async create(
    @Param('productId') productId: string,
    @Body() input: CreateDay30ReviewDto,
  ): Promise<Day30ReviewResponseDto> {
    const record = await this.day30ReviewsService.create(productId, input);
    return Day30ReviewResponseDto.fromRecord(record);
  }

  @Get()
  @Authorize(PolicyResource.DAY_30_REVIEWS, StageAction.VIEW)
  async findOne(@Param('productId') productId: string): Promise<Day30ReviewResponseDto> {
    const record = await this.day30ReviewsService.findOne(productId);
    return Day30ReviewResponseDto.fromRecord(record);
  }

  @Patch()
  @Authorize(PolicyResource.DAY_30_REVIEWS, StageAction.EDIT)
  async update(
    @Param('productId') productId: string,
    @Body() input: UpdateDay30ReviewDto,
  ): Promise<Day30ReviewResponseDto> {
    const record = await this.day30ReviewsService.update(productId, input);
    return Day30ReviewResponseDto.fromRecord(record);
  }
}
