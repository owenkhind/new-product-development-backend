import { PartialType } from '@nestjs/mapped-types';

import { CreateProductScorecardDto } from './create-product-scorecard.dto';

export class UpdateProductScorecardDto extends PartialType(CreateProductScorecardDto) {}
