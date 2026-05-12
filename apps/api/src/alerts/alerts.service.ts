import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../gateway/events.gateway';
import { MetricsService } from '../metrics/metrics.service';

type AlertSeverityType = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

@Injectable()
export class AlertsService {
  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
    private metricsService: MetricsService,
  ) {}

  async getAlerts() {
    return this.prisma.alert.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: 20,
    });
  }

  async createAlert(data: {
    title: string;
    message: string;
    severity: AlertSeverityType;
  }) {
    const alert = await this.prisma.alert.create({
      data,
    });

    this.eventsGateway.emitAlert(alert);

    return alert;
  }

  async resolveAlert(id: string) {
    const alert = await this.prisma.alert.update({
      where: { id },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
      },
    });

    this.eventsGateway.emitAlertUpdate(alert);

    if (alert.title === 'High Latency') {
      this.metricsService.setHighLatency(false);
      const metrics = await this.metricsService.getDashboardMetrics();
      this.eventsGateway.emitMetricsUpdate(metrics);
    }

    return alert;
  }

  async createGateFailureAlert() {
    return this.createAlert({
      title: 'Gate Failure',
      message: 'Gate C sensor module is offline. Technical team notified.',
      severity: 'CRITICAL',
    });
  }

  async createHighLatencyAlert() {
    this.metricsService.setHighLatency(true);
    const metrics = await this.metricsService.getDashboardMetrics();
    this.eventsGateway.emitMetricsUpdate(metrics);

    return this.createAlert({
      title: 'High Latency',
      message: 'API latency exceeded acceptable technical monitoring threshold.',
      severity: 'HIGH',
    });
  }

  async createInvalidScanSpikeAlert() {
    return this.createAlert({
      title: 'Invalid Scan Spike',
      message: 'Unusual number of invalid ticket scans detected at entrance gates.',
      severity: 'MEDIUM',
    });
  }

  async createSyncQueueAlert() {
    return this.createAlert({
      title: 'Sync Queue Warning',
      message: 'Offline validation queue is growing. Recovery sync may be required.',
      severity: 'HIGH',
    });
  }
}