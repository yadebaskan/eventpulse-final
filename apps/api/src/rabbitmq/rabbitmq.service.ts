import { Injectable, OnModuleInit } from '@nestjs/common';

@Injectable()
export class RabbitMQService implements OnModuleInit {
  async onModuleInit() {
    console.log('RabbitMQ Mocked (Standalone mode)');
  }

  async publishTicketScan(data: any) {
    console.log('RabbitMQ Mock: Ticket scan event published', data);
  }
}