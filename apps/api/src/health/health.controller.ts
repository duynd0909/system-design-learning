import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Controller('health')
export class HealthController {
  private readonly startTime = Date.now();

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Get()
  async check(@Res({ passthrough: true }) response: Response) {
    let dbStatus: 'ok' | 'error' = 'ok';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      dbStatus = 'error';
    }

    const redisStatus: 'ok' | 'error' = (await this.redis.ping()) ? 'ok' : 'error';
    const status = dbStatus === 'ok' && redisStatus === 'ok' ? 'ok' : 'error';
    if (status === 'error') response.status(503);

    return {
      status,
      db: dbStatus,
      redis: redisStatus,
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
    };
  }
}
