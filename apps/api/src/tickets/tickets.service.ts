import { Injectable, OnModuleInit } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';
import { MetricsService } from '../metrics/metrics.service';
import { EventsGateway } from '../gateway/events.gateway';

@Injectable()
export class TicketsService implements OnModuleInit {
  private isPeakMode = false;
  private isAutoTrafficEnabled = true;
  private trafficInterval: NodeJS.Timeout | null = null;

  constructor(
    private prisma: PrismaService,
    private rabbitMQ: RabbitMQService,
    private metricsService: MetricsService,
    private eventsGateway: EventsGateway,
  ) {}

  onModuleInit() {
    this.startBackgroundTraffic();
  }

  toggleAutoTraffic(enabled: boolean) {
    this.isAutoTrafficEnabled = enabled;
    console.log(`Auto Traffic ${enabled ? 'ENABLED' : 'DISABLED'}`);
    this.startBackgroundTraffic();
  }

  togglePeakMode(enabled: boolean) {
    this.isPeakMode = enabled;
    this.metricsService.setPeakMode(enabled);
    console.log(
      `Peak Mode ${enabled ? 'ENABLED' : 'DISABLED'} - Adjusting traffic...`,
    );
    this.startBackgroundTraffic();
    this.emitMetrics(); // Push immediate update
  }

  private startBackgroundTraffic() {
    if (this.trafficInterval) {
      clearInterval(this.trafficInterval);
    }

    if (!this.isAutoTrafficEnabled) return;

    const intervalMs = this.isPeakMode ? 1000 : 4000;

    this.trafficInterval = setInterval(async () => {
      try {
        if (this.isPeakMode) {
          const burst = Math.floor(Math.random() * 3) + 2;
          await this.bulkSimulate(burst);
        } else {
          await this.simulateValidScan();
        }
      } catch (err) {
        console.error('Background traffic error:', err);
      }
    }, intervalMs);
  }

  private async emitMetrics() {
    const metrics = await this.metricsService.getDashboardMetrics();
    this.eventsGateway.emitMetricsUpdate(metrics);
  }

  private async createAndEmitAlert(data: {
    title: string;
    message: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  }) {
    const alert = await this.prisma.alert.create({
      data,
    });

    this.eventsGateway.emitAlert(alert);

    return alert;
  }

  async validateTicket(code: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { code },
      include: {
        scans: true,
      },
    });

    const gate = await this.prisma.gate.findFirst({
      where: { name: 'Gate A' },
    });

    if (!ticket) {
      await this.metricsService.incrementInvalidScan();

      const result = {
        success: false,
        status: 'INVALID',
        message: 'Ticket not found',
        ticketCode: code,
        scannedAt: new Date(),
      };

      this.eventsGateway.emitTicketScan(result);

      await this.createAndEmitAlert({
        title: 'Ticket Not Found',
        message: `Unknown ticket code attempted at Gate A: ${code}.`,
        severity: 'MEDIUM',
      });

      await this.emitMetrics();

      return result;
    }

    if (!ticket.isValid) {
      await this.metricsService.incrementInvalidScan();

      if (gate) {
        await this.prisma.scan.create({
          data: {
            ticketId: ticket.id,
            gateId: gate.id,
            success: false,
          },
        });
      }

      const result = {
        success: false,
        status: 'INVALID',
        message: 'Invalid ticket',
        ticketCode: code,
        scannedAt: new Date(),
      };

      this.eventsGateway.emitTicketScan(result);

      await this.createAndEmitAlert({
        title: 'Invalid Ticket Scan',
        message: `Invalid ticket attempted at Gate A: ${code}.`,
        severity: 'HIGH',
      });

      await this.emitMetrics();

      return result;
    }

    const alreadyScanned = ticket.scans.some((scan) => scan.success);

    if (alreadyScanned) {
      await this.metricsService.incrementInvalidScan();

      const result = {
        success: false,
        status: 'DUPLICATE',
        message: 'Duplicate ticket scan detected',
        ticketCode: code,
        scannedAt: new Date(),
      };

      this.eventsGateway.emitTicketScan(result);

      await this.createAndEmitAlert({
        title: 'Duplicate Ticket Scan',
        message: `Duplicate scan attempt detected for ticket ${code}.`,
        severity: 'HIGH',
      });

      await this.emitMetrics();

      return result;
    }

    await this.metricsService.incrementScan();

    if (gate) {
      await this.prisma.scan.create({
        data: {
          ticketId: ticket.id,
          gateId: gate.id,
          success: true,
        },
      });
    }

    await this.rabbitMQ.publishTicketScan({
      ticketCode: code,
      scannedAt: new Date(),
    });

    const result = {
      success: true,
      status: 'VALID',
      message: 'Ticket validated successfully',
      ticketCode: code,
      scannedAt: new Date(),
      ticket,
    };

    this.eventsGateway.emitTicketScan(result);

    await this.emitMetrics();

    return result;
  }

  async resetScans() {
    await this.prisma.scan.deleteMany();

    await this.emitMetrics();

    return {
      success: true,
      message: 'All scans cleared',
    };
  }

  async simulateValidScan() {
    const randomCode = `TKT-${Date.now()}-${Math.floor(
      1000 + Math.random() * 9000,
    )}`;

    await this.prisma.ticket.create({
      data: {
        code: randomCode,
        isValid: true,
      },
    });

    return this.validateTicket(randomCode);
  }

  async bulkSimulate(count: number) {
    const tickets = Array.from({ length: count }).map((_, index) => ({
      code: `TKT-OFF-${Date.now()}-${index}-${Math.floor(
        10000 + Math.random() * 90000,
      )}`,
      isValid: true,
    }));

    await this.prisma.ticket.createMany({
      data: tickets,
    });

    const createdTickets = await this.prisma.ticket.findMany({
      where: {
        code: {
          in: tickets.map((ticket) => ticket.code),
        },
      },
    });

    const gate = await this.prisma.gate.findFirst({
      where: {
        name: 'Gate A',
      },
    });

    if (gate) {
      await this.prisma.scan.createMany({
        data: createdTickets.map((ticket) => ({
          ticketId: ticket.id,
          gateId: gate.id,
          success: true,
        })),
      });
    }

    await this.emitMetrics();

    return {
      success: true,
      count: createdTickets.length,
    };
  }
}