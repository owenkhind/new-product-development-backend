import { Module } from '@nestjs/common';

import { AuthorizationModule } from '../authorization/authorization.module';
import { TemplatesController } from './controllers/templates.controller';
import { TemplateLibraryRepository } from './repositories/template-library.repository';
import { TemplateLibraryService } from './services/template-library.service';

@Module({
  imports: [AuthorizationModule],
  controllers: [TemplatesController],
  providers: [TemplateLibraryRepository, TemplateLibraryService],
  exports: [TemplateLibraryService],
})
export class TemplatesModule {}
