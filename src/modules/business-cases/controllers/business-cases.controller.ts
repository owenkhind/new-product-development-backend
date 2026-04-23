import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';

import { PolicyResource } from '../../../enums/policy-resource.enum';
import { StageAction } from '../../../enums/stage-action.enum';
import { Authorize } from '../../../guards/authorize.decorator';
import { PoliciesGuard } from '../../../guards/policies.guard';
import { BusinessCaseResponseDto } from '../dto/business-case-response.dto';
import { CreateBusinessCaseDto } from '../dto/create-business-case.dto';
import { UpdateBusinessCaseDto } from '../dto/update-business-case.dto';
import { BusinessCasesService } from '../services/business-cases.service';

@Controller('products/:productId/business-case')
@UseGuards(PoliciesGuard)
export class BusinessCasesController {
  constructor(private readonly businessCasesService: BusinessCasesService) {}

  @Post()
  @Authorize(PolicyResource.PRODUCTS, StageAction.EDIT)
  async create(
    @Param('productId') productId: string,
    @Body() input: CreateBusinessCaseDto,
  ): Promise<BusinessCaseResponseDto> {
    const record = await this.businessCasesService.create(productId, input);
    return BusinessCaseResponseDto.fromRecord(record);
  }

  @Get()
  @Authorize(PolicyResource.PRODUCTS, StageAction.VIEW)
  async findOne(@Param('productId') productId: string): Promise<BusinessCaseResponseDto> {
    const record = await this.businessCasesService.findOne(productId);
    return BusinessCaseResponseDto.fromRecord(record);
  }

  @Patch()
  @Authorize(PolicyResource.PRODUCTS, StageAction.EDIT)
  async update(
    @Param('productId') productId: string,
    @Body() input: UpdateBusinessCaseDto,
  ): Promise<BusinessCaseResponseDto> {
    const record = await this.businessCasesService.update(productId, input);
    return BusinessCaseResponseDto.fromRecord(record);
  }
}
