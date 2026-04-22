import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';

import { PolicyResource } from '../../../enums/policy-resource.enum';
import { StageAction } from '../../../enums/stage-action.enum';
import { Authorize } from '../../../guards/authorize.decorator';
import { PoliciesGuard } from '../../../guards/policies.guard';
import { CreateProductDto } from '../dto/create-product.dto';
import { ListProductsQueryDto } from '../dto/list-products-query.dto';
import { ListProductsResponseDto } from '../dto/list-products-response.dto';
import { ProductResponseDto } from '../dto/product-response.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { ProductsService } from '../services/products.service';

@Controller('products')
@UseGuards(PoliciesGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @Authorize(PolicyResource.PRODUCTS, StageAction.CREATE)
  async create(@Body() createProductDto: CreateProductDto): Promise<ProductResponseDto> {
    const product = await this.productsService.create(createProductDto);
    return ProductResponseDto.fromRecord(product);
  }

  @Get()
  @Authorize(PolicyResource.PRODUCTS, StageAction.VIEW)
  async findAll(
    @Query() query: ListProductsQueryDto,
    @Req() request: Request,
  ): Promise<ListProductsResponseDto> {
    const result = await this.productsService.findAll(query, request.user!);

    return {
      data: result.rows.map((product) => ProductResponseDto.fromRecord(product)),
      meta: {
        limit: Math.min(query.limit, 100),
        page: query.page,
        total: result.total,
      },
    };
  }

  @Get(':id')
  @Authorize(PolicyResource.PRODUCTS, StageAction.VIEW)
  async findOne(@Param('id') id: string): Promise<ProductResponseDto> {
    const product = await this.productsService.findOne(id);
    return ProductResponseDto.fromRecord(product);
  }

  @Patch(':id')
  @Authorize(PolicyResource.PRODUCTS, StageAction.EDIT)
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ): Promise<ProductResponseDto> {
    const product = await this.productsService.update(id, updateProductDto);
    return ProductResponseDto.fromRecord(product);
  }
}
