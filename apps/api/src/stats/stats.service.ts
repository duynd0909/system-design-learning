import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

const STATS_CACHE_KEY = 'public:stats';
const STATS_TTL = 5 * 60; // 5 minutes

export interface PublicStats {
  problemCount: number;
  engineerCount: number;
  topXp: number;
  totalSubmissions: number;
  totalPassed: number;
}

@Injectable()
export class StatsService {
  private readonly logger = new Logger(StatsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(RedisService) private readonly redis: RedisService,
  ) {}

  async getPublicStats(): Promise<PublicStats> {
    // Try cache first
    try {
      const cached = await this.redis.get(STATS_CACHE_KEY);
      if (cached) {
        return JSON.parse(cached) as PublicStats;
      }
    } catch (err) {
      this.logger.warn(`Stats cache read failed: ${String(err)}`);
    }

    return this.fetchFromDbAndCache();
  }

  private async fetchFromDbAndCache(): Promise<PublicStats> {
    const [
      problemCount,
      engineerCount,
      topUser,
      totalSubmissions,
      totalPassed,
    ] = await Promise.all([
      this.prisma.problem.count({ where: { isPublished: true, deletedAt: null } }),
      this.prisma.user.count(),
      this.prisma.user.findFirst({
        orderBy: { xp: 'desc' },
        select: { xp: true },
      }),
      this.prisma.submission.count(),
      this.prisma.submission.count({ where: { passed: true } }),
    ]);

    const stats: PublicStats = {
      problemCount,
      engineerCount,
      topXp: topUser?.xp ?? 0,
      totalSubmissions,
      totalPassed,
    };

    // Cache it
    try {
      await this.redis.set(STATS_CACHE_KEY, JSON.stringify(stats), STATS_TTL);
    } catch (err) {
      this.logger.warn(`Stats cache write failed: ${String(err)}`);
    }

    return stats;
  }
}
