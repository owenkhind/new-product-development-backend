import { PartialType } from '@nestjs/mapped-types';

import { CreateRevampEolRecommendationDto } from './create-revamp-eol-recommendation.dto';

export class UpdateRevampEolRecommendationDto extends PartialType(CreateRevampEolRecommendationDto) {}
