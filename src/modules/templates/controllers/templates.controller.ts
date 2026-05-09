import { Controller, Get, UseGuards } from '@nestjs/common';

import { PolicyResource } from '../../../enums/policy-resource.enum';
import { StageAction } from '../../../enums/stage-action.enum';
import { Authorize } from '../../../guards/authorize.decorator';
import { PoliciesGuard } from '../../../guards/policies.guard';
import { TemplateLibraryResponseDto } from '../dto/template-library-response.dto';
import { TemplateLibraryService } from '../services/template-library.service';

@Controller('templates')
@UseGuards(PoliciesGuard)
export class TemplatesController {
  constructor(
    private readonly templateLibraryService: TemplateLibraryService,
  ) {}

  @Get()
  @Authorize(PolicyResource.TEMPLATES, StageAction.VIEW)
  async getLibrary(): Promise<TemplateLibraryResponseDto> {
    return TemplateLibraryResponseDto.fromRecord(
      await this.templateLibraryService.getDashboard(),
    );
  }
}
