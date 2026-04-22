import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';

import { PolicyResource } from '../../../enums/policy-resource.enum';
import { StageAction } from '../../../enums/stage-action.enum';
import { Authorize } from '../../../guards/authorize.decorator';
import { PoliciesGuard } from '../../../guards/policies.guard';
import { CreateOpportunityBriefDto } from '../dto/create-opportunity-brief.dto';
import { OpportunityBriefResponseDto } from '../dto/opportunity-brief-response.dto';
import { UpdateOpportunityBriefDto } from '../dto/update-opportunity-brief.dto';
import { OpportunityBriefsService } from '../services/opportunity-briefs.service';

@Controller('products/:productId/opportunity-brief')
@UseGuards(PoliciesGuard)
export class OpportunityBriefsController {
  constructor(private readonly opportunityBriefsService: OpportunityBriefsService) {}

  @Post()
  @Authorize(PolicyResource.PRODUCTS, StageAction.EDIT)
  async create(
    @Param('productId') productId: string,
    @Body() input: CreateOpportunityBriefDto,
  ): Promise<OpportunityBriefResponseDto> {
    const record = await this.opportunityBriefsService.create(productId, input);
    return OpportunityBriefResponseDto.fromRecord(record);
  }

  @Get()
  @Authorize(PolicyResource.PRODUCTS, StageAction.VIEW)
  async findOne(@Param('productId') productId: string): Promise<OpportunityBriefResponseDto> {
    const record = await this.opportunityBriefsService.findOne(productId);
    return OpportunityBriefResponseDto.fromRecord(record);
  }

  @Patch()
  @Authorize(PolicyResource.PRODUCTS, StageAction.EDIT)
  async update(
    @Param('productId') productId: string,
    @Body() input: UpdateOpportunityBriefDto,
  ): Promise<OpportunityBriefResponseDto> {
    const record = await this.opportunityBriefsService.update(productId, input);
    return OpportunityBriefResponseDto.fromRecord(record);
  }
}
