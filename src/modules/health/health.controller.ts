import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Controller('health')
export class HealthController {
  constructor(private readonly configService: ConfigService) {}

  @Get()
  check(): Record<string, string> {
    return {
      service: this.configService.get<string>('APP_NAME', 'new-product-development-backend'),
      status: 'ok',
      version: this.configService.get<string>('APP_VERSION', '0.1.0'),
    };
  }
}
