import { Module } from '@nestjs/common';

import { PrismaService } from './prisma/prisma.service';
import { RedisService } from './redis/redis.service';
import { RabbitMQService } from './rabbitmq/rabbitmq.service';

import { EventsGateway } from './gateway/events.gateway';

import { MetricsController } from './metrics/metrics.controller';
import { MetricsService } from './metrics/metrics.service';

import { TicketsController } from './tickets/tickets.controller';
import { TicketsService } from './tickets/tickets.service';

import { GatesController } from './gates/gates.controller';
import { GatesService } from './gates/gates.service';

import { AlertsController } from './alerts/alerts.controller';
import { AlertsService } from './alerts/alerts.service';

@Module({
  imports: [],
  controllers: [
    MetricsController,
    TicketsController,
    GatesController,
    AlertsController,
  ],
  providers: [
    PrismaService,
    RedisService,
    RabbitMQService,
    EventsGateway,

    MetricsService,
    TicketsService,
    GatesService,
    AlertsService,
  ],
})
export class AppModule {}