import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import type { ComponentType } from '@stackdify/shared-types';

const CACHE_KEY = 'components:all';
const CACHE_TTL = 3600;

@Injectable()
export class ComponentsService {
  private readonly logger = new Logger(ComponentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async findAll(): Promise<ComponentType[]> {
    try {
      const cached = await this.redis.get(CACHE_KEY);
      if (cached) return JSON.parse(cached) as ComponentType[];
    } catch (err) {
      this.logger.warn(`Cache read failed: ${String(err)}`);
    }

    const components = await this.prisma.componentType.findMany({
      orderBy: { label: 'asc' },
    });

    try {
      await this.redis.set(CACHE_KEY, JSON.stringify(components), CACHE_TTL);
    } catch (err) {
      this.logger.warn(`Cache write failed: ${String(err)}`);
    }

    return components as ComponentType[];
  }
}
