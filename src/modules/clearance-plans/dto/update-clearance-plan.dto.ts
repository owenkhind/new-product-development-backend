import { PartialType } from '@nestjs/mapped-types';

import { CreateClearancePlanDto } from './create-clearance-plan.dto';

export class UpdateClearancePlanDto extends PartialType(CreateClearancePlanDto) {}
