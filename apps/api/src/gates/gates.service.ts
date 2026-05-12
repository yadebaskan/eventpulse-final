import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GatesService {
  constructor(private prisma: PrismaService) {}

  async getAllGates() {
    return this.prisma.gate.findMany({
      orderBy: {
        name: 'asc',
      },
    });
  }
}