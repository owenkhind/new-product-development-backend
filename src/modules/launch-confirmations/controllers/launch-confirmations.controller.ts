import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';

import { PolicyResource } from '../../../enums/policy-resource.enum';
import { StageAction } from '../../../enums/stage-action.enum';
import { Authorize } from '../../../guards/authorize.decorator';
import { PoliciesGuard } from '../../../guards/policies.guard';
import { CreateLaunchConfirmationDto } from '../dto/create-launch-confirmation.dto';
import { LaunchConfirmationResponseDto } from '../dto/launch-confirmation-response.dto';
import { UpdateLaunchConfirmationDto } from '../dto/update-launch-confirmation.dto';
import { LaunchConfirmationsService } from '../services/launch-confirmations.service';

@Controller('products/:productId/launch-confirmation')
@UseGuards(PoliciesGuard)
export class LaunchConfirmationsController {
  constructor(private readonly launchConfirmationsService: LaunchConfirmationsService) {}

  @Post()
  @Authorize(PolicyResource.LAUNCH_CONFIRMATIONS, StageAction.EDIT)
  async create(
    @Param('productId') productId: string,
    @Body() input: CreateLaunchConfirmationDto,
  ): Promise<LaunchConfirmationResponseDto> {
    const record = await this.launchConfirmationsService.create(productId, input);
    return LaunchConfirmationResponseDto.fromRecord(record);
  }

  @Get()
  @Authorize(PolicyResource.LAUNCH_CONFIRMATIONS, StageAction.VIEW)
  async findOne(@Param('productId') productId: string): Promise<LaunchConfirmationResponseDto> {
    const record = await this.launchConfirmationsService.findOne(productId);
    return LaunchConfirmationResponseDto.fromRecord(record);
  }

  @Patch()
  @Authorize(PolicyResource.LAUNCH_CONFIRMATIONS, StageAction.EDIT)
  async update(
    @Param('productId') productId: string,
    @Body() input: UpdateLaunchConfirmationDto,
  ): Promise<LaunchConfirmationResponseDto> {
    const record = await this.launchConfirmationsService.update(productId, input);
    return LaunchConfirmationResponseDto.fromRecord(record);
  }
}
