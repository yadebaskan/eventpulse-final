import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { AlertsService } from './alerts.service';

type AlertSeverityType = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

@Controller('alerts')
export class AlertsController {
  constructor(private alertsService: AlertsService) {}

  @Get()
  getAlerts() {
    return this.alertsService.getAlerts();
  }

  @Post()
  createAlert(
    @Body()
    body: {
      title: string;
      message: string;
      severity: AlertSeverityType;
    },
  ) {
    return this.alertsService.createAlert(body);
  }

  @Post('gate-failure')
  createGateFailureAlert() {
    return this.alertsService.createGateFailureAlert();
  }

  @Post('high-latency')
  createHighLatencyAlert() {
    return this.alertsService.createHighLatencyAlert();
  }

  @Post(':id/resolve')
resolveAlert(@Param('id') id: string) {
  return this.alertsService.resolveAlert(id);
}

  @Post('invalid-scan-spike')
  createInvalidScanSpikeAlert() {
    return this.alertsService.createInvalidScanSpikeAlert();
  }

  @Post('sync-queue')
  createSyncQueueAlert() {
    return this.alertsService.createSyncQueueAlert();
  }
}