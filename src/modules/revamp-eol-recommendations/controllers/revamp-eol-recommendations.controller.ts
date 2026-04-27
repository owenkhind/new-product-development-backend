import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';

import { PolicyResource } from '../../../enums/policy-resource.enum';
import { StageAction } from '../../../enums/stage-action.enum';
import { Authorize } from '../../../guards/authorize.decorator';
import { PoliciesGuard } from '../../../guards/policies.guard';
import { CreateRevampEolRecommendationDto } from '../dto/create-revamp-eol-recommendation.dto';
import { RecordCooDecisionDto } from '../dto/record-coo-decision.dto';
import { RecordGmCommercialInputDto } from '../dto/record-gm-commercial-input.dto';
import { RevampEolRecommendationResponseDto } from '../dto/revamp-eol-recommendation-response.dto';
import { UpdateRevampEolRecommendationDto } from '../dto/update-revamp-eol-recommendation.dto';
import { RevampEolRecommendationsService } from '../services/revamp-eol-recommendations.service';

@Controller('products/:productId/revamp-eol-recommendation')
@UseGuards(PoliciesGuard)
export class RevampEolRecommendationsController {
  constructor(
    private readonly revampEolRecommendationsService: RevampEolRecommendationsService,
  ) {}

  @Post()
  @Authorize(PolicyResource.REVAMP_EOL_RECOMMENDATIONS, StageAction.EDIT)
  async create(
    @Param('productId') productId: string,
    @Body() input: CreateRevampEolRecommendationDto,
  ): Promise<RevampEolRecommendationResponseDto> {
    const record = await this.revampEolRecommendationsService.create(productId, input);
    return RevampEolRecommendationResponseDto.fromRecord(record);
  }

  @Get()
  @Authorize(PolicyResource.REVAMP_EOL_RECOMMENDATIONS, StageAction.VIEW)
  async findOne(@Param('productId') productId: string): Promise<RevampEolRecommendationResponseDto> {
    const record = await this.revampEolRecommendationsService.findOne(productId);
    return RevampEolRecommendationResponseDto.fromRecord(record);
  }

  @Patch()
  @Authorize(PolicyResource.REVAMP_EOL_RECOMMENDATIONS, StageAction.EDIT)
  async update(
    @Param('productId') productId: string,
    @Body() input: UpdateRevampEolRecommendationDto,
  ): Promise<RevampEolRecommendationResponseDto> {
    const record = await this.revampEolRecommendationsService.update(productId, input);
    return RevampEolRecommendationResponseDto.fromRecord(record);
  }

  @Post('gm-input')
  @Authorize(PolicyResource.REVAMP_EOL_RECOMMENDATIONS, StageAction.CONFIRM)
  async recordGmCommercialInput(
    @Param('productId') productId: string,
    @Body() input: RecordGmCommercialInputDto,
    @Req() request: Request,
  ): Promise<RevampEolRecommendationResponseDto> {
    const record = await this.revampEolRecommendationsService.recordGmCommercialInput(
      productId,
      request.user!,
      input,
    );
    return RevampEolRecommendationResponseDto.fromRecord(record);
  }

  @Post('coo-decision')
  @Authorize(PolicyResource.REVAMP_EOL_RECOMMENDATIONS, StageAction.APPROVE)
  async recordCooDecision(
    @Param('productId') productId: string,
    @Body() input: RecordCooDecisionDto,
    @Req() request: Request,
  ): Promise<RevampEolRecommendationResponseDto> {
    const record = await this.revampEolRecommendationsService.recordCooDecision(
      productId,
      request.user!,
      input,
    );
    return RevampEolRecommendationResponseDto.fromRecord(record);
  }
}
