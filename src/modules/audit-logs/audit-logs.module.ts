import { Module } from '@nestjs/common';

import { AuthorizationModule } from '../authorization/authorization.module';
import { AuditLogsController } from './controllers/audit-logs.controller';
import { ProductAuditLogsController } from './controllers/product-audit-logs.controller';
import { AuditLogsRepository } from './repositories/audit-logs.repository';
import { AuditLogsService } from './services/audit-logs.service';

@Module({
  imports: [AuthorizationModule],
  controllers: [AuditLogsController, ProductAuditLogsController],
  providers: [AuditLogsRepository, AuditLogsService],
  exports: [AuditLogsRepository, AuditLogsService],
})
export class AuditLogsModule {}
