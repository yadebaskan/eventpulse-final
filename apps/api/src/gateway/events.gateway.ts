import {
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

import { Server } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway {
  @WebSocketServer()
  server!: Server;

  emitTicketScan(data: any) {
    this.server.emit('ticket:scanned', data);
    console.log('WebSocket ticket:scanned emitted');
  }

  emitMetricsUpdate(data: any) {
    this.server.emit('metrics:update', data);
    console.log('WebSocket metrics:update emitted');
  }

  emitAlert(data: any) {
    this.server.emit('alert:created', data);
    console.log('WebSocket alert:created emitted');
  }
}