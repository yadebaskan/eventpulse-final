import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('admin123', 10);
  await prisma.scan.deleteMany();
  await prisma.gate.deleteMany();

  // USERS
  await prisma.user.upsert({
    where: { email: 'admin@eventpulse.com' },
    update: { password: passwordHash, role: 'ADMIN' },
    create: {
      email: 'admin@eventpulse.com',
      password: passwordHash,
      role: 'ADMIN',
    },
  });

  await prisma.user.upsert({
    where: { email: 'ops@eventpulse.com' },
    update: { password: passwordHash, role: 'OPERATIONS' },
    create: {
      email: 'ops@eventpulse.com',
      password: passwordHash,
      role: 'OPERATIONS',
    },
  });

  await prisma.user.upsert({
    where: { email: 'security@eventpulse.com' },
    update: { password: passwordHash, role: 'SECURITY' },
    create: {
      email: 'security@eventpulse.com',
      password: passwordHash,
      role: 'SECURITY',
    },
  });

  // GATES
  await prisma.gate.upsert({
    where: { id: 'gate-a' },
    update: { name: 'Gate A', status: 'OPERATIONAL' },
    create: {
      id: 'gate-a',
      name: 'Gate A',
      status: 'OPERATIONAL',
    },
  });

  await prisma.gate.upsert({
    where: { id: 'gate-b' },
    update: { name: 'Gate B', status: 'OPERATIONAL' },
    create: {
      id: 'gate-b',
      name: 'Gate B',
      status: 'OPERATIONAL',
    },
  });

  await prisma.gate.upsert({
    where: { id: 'gate-c' },
    update: { name: 'Gate C', status: 'FAILURE' },
    create: {
      id: 'gate-c',
      name: 'Gate C',
      status: 'FAILURE',
    },
  });

  // TICKETS
  await prisma.ticket.upsert({
    where: { code: 'VIP-001' },
    update: { isValid: true },
    create: {
      code: 'VIP-001',
      isValid: true,
    },
  });

  await prisma.ticket.upsert({
    where: { code: 'VIP-002' },
    update: { isValid: true },
    create: {
      code: 'VIP-002',
      isValid: true,
    },
  });

  await prisma.ticket.upsert({
    where: { code: 'INVALID-001' },
    update: { isValid: false },
    create: {
      code: 'INVALID-001',
      isValid: false,
    },
  });

  // ALERTS
  await prisma.alert.create({
    data: {
      title: 'Gate Failure',
      message: 'Gate C is currently offline',
      severity: 'CRITICAL',
    },
  });

  await prisma.alert.create({
    data: {
      title: 'High Latency',
      message: 'Response latency exceeded threshold',
      severity: 'HIGH',
    },
  });

  console.log('Seed data created');
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });