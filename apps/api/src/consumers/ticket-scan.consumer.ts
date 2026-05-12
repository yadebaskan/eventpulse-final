import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../gateway/events.gateway';

@Injectable()
export class TicketScanConsumer implements OnModuleInit {
  constructor(private prisma: PrismaService, private gateway: EventsGateway,) {}

  async onModuleInit() {
    console.log('TicketScanConsumer Mocked (Standalone mode)');
  }
}