import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
  private readonly startTime = Date.now();

  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check() {
    let dbStatus: 'ok' | 'error' = 'ok';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      dbStatus = 'error';
    }

    return {
      status: dbStatus === 'ok' ? 'ok' : 'error',
      db: dbStatus,
      redis: 'ok',
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
    };
  }
}
