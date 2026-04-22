import { Module } from '@nestjs/common';

import { UsersModule } from '../users/users.module';
import { ProductsController } from './controllers/products.controller';
import { ProductsRepository } from './repositories/products.repository';
import { ProductsService } from './services/products.service';

@Module({
  imports: [UsersModule],
  controllers: [ProductsController],
  providers: [ProductsRepository, ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
