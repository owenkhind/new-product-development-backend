import { PartialType } from '@nestjs/mapped-types';

import { CreatePortfolioUpdateDto } from './create-portfolio-update.dto';

export class UpdatePortfolioUpdateDto extends PartialType(CreatePortfolioUpdateDto) {}
