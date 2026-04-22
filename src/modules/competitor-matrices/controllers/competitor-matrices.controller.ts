import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';

import { PolicyResource } from '../../../enums/policy-resource.enum';
import { StageAction } from '../../../enums/stage-action.enum';
import { Authorize } from '../../../guards/authorize.decorator';
import { PoliciesGuard } from '../../../guards/policies.guard';
import { CompetitorMatrixResponseDto } from '../dto/competitor-matrix-response.dto';
import { CreateCompetitorMatrixDto } from '../dto/create-competitor-matrix.dto';
import { UpdateCompetitorMatrixDto } from '../dto/update-competitor-matrix.dto';
import { CompetitorMatricesService } from '../services/competitor-matrices.service';

@Controller('products/:productId/competitor-matrix')
@UseGuards(PoliciesGuard)
export class CompetitorMatricesController {
  constructor(private readonly competitorMatricesService: CompetitorMatricesService) {}

  @Post()
  @Authorize(PolicyResource.PRODUCTS, StageAction.EDIT)
  async create(
    @Param('productId') productId: string,
    @Body() input: CreateCompetitorMatrixDto,
  ): Promise<CompetitorMatrixResponseDto> {
    const record = await this.competitorMatricesService.create(productId, input);
    return CompetitorMatrixResponseDto.fromRecord(record);
  }

  @Get()
  @Authorize(PolicyResource.PRODUCTS, StageAction.VIEW)
  async findOne(@Param('productId') productId: string): Promise<CompetitorMatrixResponseDto> {
    const record = await this.competitorMatricesService.findOne(productId);
    return CompetitorMatrixResponseDto.fromRecord(record);
  }

  @Patch()
  @Authorize(PolicyResource.PRODUCTS, StageAction.EDIT)
  async update(
    @Param('productId') productId: string,
    @Body() input: UpdateCompetitorMatrixDto,
  ): Promise<CompetitorMatrixResponseDto> {
    const record = await this.competitorMatricesService.update(productId, input);
    return CompetitorMatrixResponseDto.fromRecord(record);
  }
}
