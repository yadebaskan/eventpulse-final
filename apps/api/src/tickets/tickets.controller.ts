import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { TicketsService } from './tickets.service';

@Controller('tickets')
export class TicketsController {
  constructor(private ticketsService: TicketsService) {}

  @Get('validate/:code')
  async validate(@Param('code') code: string) {
    return this.ticketsService.validateTicket(code);
  }

  @Post('reset')
  async reset() {
    return this.ticketsService.resetScans();
  }

  @Post('simulate')
  async simulate() {
    return this.ticketsService.simulateValidScan();
  }

  @Post('bulk-simulate/:count')
  async bulkSimulate(@Param('count') count: string) {
    return this.ticketsService.bulkSimulate(parseInt(count));
  }

  @Post('toggle-peak')
  async togglePeak(@Body() body: { enabled: boolean }) {
    return this.ticketsService.togglePeakMode(body.enabled);
  }

  @Post('toggle-auto')
  async toggleAuto(@Body() body: { enabled: boolean }) {
    return this.ticketsService.toggleAutoTraffic(body.enabled);
  }
}