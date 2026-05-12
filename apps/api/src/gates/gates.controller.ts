import { Controller, Get, UseGuards } from '@nestjs/common';
import { UserRole } from '../types/enums';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

import { GatesService } from './gates.service';

@Controller('gates')
export class GatesController {
  constructor(private gatesService: GatesService) {}

  @Get('public')
  getPublicGates() {
    return this.gatesService.getAllGates();
  }

  @Get()
  getAllGates() {
    return this.gatesService.getAllGates();
  }
}