import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';

import { PolicyResource } from '../../../enums/policy-resource.enum';
import { StageAction } from '../../../enums/stage-action.enum';
import { Authorize } from '../../../guards/authorize.decorator';
import { PoliciesGuard } from '../../../guards/policies.guard';
import { CreateSupplierEvaluationDto } from '../dto/create-supplier-evaluation.dto';
import { SupplierEvaluationResponseDto } from '../dto/supplier-evaluation-response.dto';
import { UpdateSupplierEvaluationDto } from '../dto/update-supplier-evaluation.dto';
import { SupplierEvaluationsService } from '../services/supplier-evaluations.service';

@Controller('products/:productId/supplier-evaluation')
@UseGuards(PoliciesGuard)
export class SupplierEvaluationsController {
  constructor(private readonly supplierEvaluationsService: SupplierEvaluationsService) {}

  @Post()
  @Authorize(PolicyResource.PRODUCTS, StageAction.EDIT)
  async create(
    @Param('productId') productId: string,
    @Body() input: CreateSupplierEvaluationDto,
  ): Promise<SupplierEvaluationResponseDto> {
    const record = await this.supplierEvaluationsService.create(productId, input);
    return SupplierEvaluationResponseDto.fromRecord(record);
  }

  @Get()
  @Authorize(PolicyResource.PRODUCTS, StageAction.VIEW)
  async findOne(@Param('productId') productId: string): Promise<SupplierEvaluationResponseDto> {
    const record = await this.supplierEvaluationsService.findOne(productId);
    return SupplierEvaluationResponseDto.fromRecord(record);
  }

  @Patch()
  @Authorize(PolicyResource.PRODUCTS, StageAction.EDIT)
  async update(
    @Param('productId') productId: string,
    @Body() input: UpdateSupplierEvaluationDto,
  ): Promise<SupplierEvaluationResponseDto> {
    const record = await this.supplierEvaluationsService.update(productId, input);
    return SupplierEvaluationResponseDto.fromRecord(record);
  }
}
