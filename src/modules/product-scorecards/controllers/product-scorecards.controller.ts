import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';

import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { PolicyResource } from '../../../enums/policy-resource.enum';
import { StageAction } from '../../../enums/stage-action.enum';
import { Authorize } from '../../../guards/authorize.decorator';
import { PoliciesGuard } from '../../../guards/policies.guard';
import { CreateProductScorecardDto } from '../dto/create-product-scorecard.dto';
import { ListProductScorecardsResponseDto } from '../dto/list-product-scorecards-response.dto';
import { ProductScorecardResponseDto } from '../dto/product-scorecard-response.dto';
import { UpdateProductScorecardDto } from '../dto/update-product-scorecard.dto';
import { ProductScorecardsService } from '../services/product-scorecards.service';

@Controller('products/:productId/scorecards')
@UseGuards(PoliciesGuard)
export class ProductScorecardsController {
  constructor(private readonly productScorecardsService: ProductScorecardsService) {}

  @Post()
  @Authorize(PolicyResource.PRODUCT_SCORECARDS, StageAction.EDIT)
  async create(
    @Param('productId') productId: string,
    @Body() input: CreateProductScorecardDto,
  ): Promise<ProductScorecardResponseDto> {
    const record = await this.productScorecardsService.create(productId, input);
    return ProductScorecardResponseDto.fromRecord(record);
  }

  @Get()
  @Authorize(PolicyResource.PRODUCT_SCORECARDS, StageAction.VIEW)
  async list(
    @Param('productId') productId: string,
    @Query() query: PaginationQueryDto,
  ): Promise<ListProductScorecardsResponseDto> {
    const result = await this.productScorecardsService.list(productId, query);
    return {
      data: result.rows.map((record) => ProductScorecardResponseDto.fromRecord(record)),
      meta: {
        limit: query.limit,
        page: query.page,
        total: result.total,
      },
    };
  }

  @Get(':scorecardId')
  @Authorize(PolicyResource.PRODUCT_SCORECARDS, StageAction.VIEW)
  async findOne(
    @Param('productId') productId: string,
    @Param('scorecardId') scorecardId: string,
  ): Promise<ProductScorecardResponseDto> {
    const record = await this.productScorecardsService.findOne(productId, scorecardId);
    return ProductScorecardResponseDto.fromRecord(record);
  }

  @Patch(':scorecardId')
  @Authorize(PolicyResource.PRODUCT_SCORECARDS, StageAction.EDIT)
  async update(
    @Param('productId') productId: string,
    @Param('scorecardId') scorecardId: string,
    @Body() input: UpdateProductScorecardDto,
  ): Promise<ProductScorecardResponseDto> {
    const record = await this.productScorecardsService.update(productId, scorecardId, input);
    return ProductScorecardResponseDto.fromRecord(record);
  }
}
