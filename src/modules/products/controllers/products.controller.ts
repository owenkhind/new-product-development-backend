import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';

import { CreateProductDto } from '../dto/create-product.dto';
import { ListProductsQueryDto } from '../dto/list-products-query.dto';
import { ListProductsResponseDto } from '../dto/list-products-response.dto';
import { ProductResponseDto } from '../dto/product-response.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { ProductsService } from '../services/products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  async create(@Body() createProductDto: CreateProductDto): Promise<ProductResponseDto> {
    const product = await this.productsService.create(createProductDto);
    return ProductResponseDto.fromRecord(product);
  }

  @Get()
  async findAll(@Query() query: ListProductsQueryDto): Promise<ListProductsResponseDto> {
    const result = await this.productsService.findAll(query);

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
  async findOne(@Param('id') id: string): Promise<ProductResponseDto> {
    const product = await this.productsService.findOne(id);
    return ProductResponseDto.fromRecord(product);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ): Promise<ProductResponseDto> {
    const product = await this.productsService.update(id, updateProductDto);
    return ProductResponseDto.fromRecord(product);
  }
}
