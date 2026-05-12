import { Controller, Get, UseGuards } from '@nestjs/common';
import { UserRole } from '../types/enums';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

import { MetricsService } from './metrics.service';

@Controller('metrics')
export class MetricsController {
  constructor(private metricsService: MetricsService) {}

  @Get('public')
  getPublicMetrics() {
    return this.metricsService.getDashboardMetrics();
  }

  @Get()
  getMetrics() {
    return this.metricsService.getDashboardMetrics();
  }
}