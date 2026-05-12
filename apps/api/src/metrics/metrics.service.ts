import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class MetricsService {
  private startedAt = Date.now();

  private isHighLatency = false;
  private isPeakMode = false;

  constructor(
    private redisService: RedisService,
    private prisma: PrismaService,
  ) {}

  setHighLatency(value: boolean) {
    this.isHighLatency = value;
  }

  setPeakMode(value: boolean) {
    this.isPeakMode = value;
  }

  async incrementScan() {
    const current =
      Number(
        (await this.redisService.get(
          'valid_scans',
        )) || 0,
      );

    await this.redisService.set(
      'valid_scans',
      current + 1,
    );
  }

  async incrementInvalidScan() {
    const current =
      Number(
        (await this.redisService.get(
          'invalid_scans',
        )) || 0,
      );

    await this.redisService.set(
      'invalid_scans',
      current + 1,
    );
  }

  async getDashboardMetrics() {
    // Removed cache check to ensure real-time accuracy for simulation

    const totalTickets =
      await this.prisma.ticket.count();

    const totalScans =
      await this.prisma.scan.count();

    const invalidScans =
      await this.prisma.scan.count({
        where: {
          success: false,
        },
      });

    const activeGates =
      await this.prisma.gate.count({
        where: {
          status: 'OPERATIONAL',
        },
      });

    const uptimeSeconds =
      Math.floor(
        (Date.now() - this.startedAt) /
          1000,
      );

    const metrics = {
      totalEntries: totalScans,
      latency: this.isHighLatency
        ? 450 + Math.floor(Math.random() * 200)
        : 90 + Math.floor(Math.random() * 40),

      errorRate: Number(
        (
          (invalidScans /
            Math.max(totalScans, 1)) *
          100
        ).toFixed(2),
      ),

      concurrentUsers:
        Math.max(0, totalScans - Math.floor(Math.random() * 3)),

      activeGates: `${activeGates}/24`,

      pods: this.isPeakMode 
        ? 12 + Math.floor(Math.random() * 5) 
        : 8,

      revenue:
        500000 + totalScans * 195,

      uptime: `${uptimeSeconds}s`,

      throughput: `${Math.floor(
        totalScans * 1.8,
      )} req/min`,

      invalidScans,

      systemHealth:
        invalidScans > 15
          ? 'WARNING'
          : 'HEALTHY',

      totalTickets,
    };

    await this.redisService.set(
      'dashboard_metrics',
      metrics,
    );

    return metrics;
  }

  async getMetrics() {
    return this.getDashboardMetrics();
  }
}