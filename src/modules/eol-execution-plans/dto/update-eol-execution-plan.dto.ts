import { PartialType } from '@nestjs/mapped-types';

import { CreateEolExecutionPlanDto } from './create-eol-execution-plan.dto';

export class UpdateEolExecutionPlanDto extends PartialType(CreateEolExecutionPlanDto) {}
