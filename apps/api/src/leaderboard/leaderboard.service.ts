import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import type { LeaderboardEntry } from '@stackdify/shared-types';

const LEADERBOARD_KEY = 'leaderboard:global';
const LEADERBOARD_TTL = 60; // seconds

@Injectable()
export class LeaderboardService {
  private readonly logger = new Logger(LeaderboardService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(RedisService) private readonly redis: RedisService,
  ) {}

  async getGlobal(limit = 50): Promise<LeaderboardEntry[]> {
    try {
      const cached = await this.redis.zrevrangeWithScores(LEADERBOARD_KEY, 0, limit - 1);
      if (cached.length > 0) {
        return cached.map((entry, i) => {
          const data = JSON.parse(entry.member) as Omit<LeaderboardEntry, 'rank' | 'xp'>;
          return { ...data, rank: i + 1, xp: entry.score };
        });
      }
    } catch (err) {
      this.logger.warn(`Cache read failed, falling back to DB: ${String(err)}`);
    }

    return this.fetchFromDbAndCache(limit);
  }

  async syncUserScore(
    userId: string,
    newXp: number,
    entryData: Omit<LeaderboardEntry, 'rank' | 'xp'>,
  ): Promise<void> {
    const member = JSON.stringify(entryData);
    await this.redis.zadd(LEADERBOARD_KEY, newXp, member);
  }

  async invalidateCache(): Promise<void> {
    await this.redis.del(LEADERBOARD_KEY);
  }

  private async fetchFromDbAndCache(limit: number): Promise<LeaderboardEntry[]> {
    const users = await this.prisma.user.findMany({
      orderBy: { xp: 'desc' },
      take: limit,
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        xp: true,
        level: true,
        _count: { select: { submissions: { where: { passed: true } } } },
      },
    });

    const entries: LeaderboardEntry[] = users.map((u, i) => ({
      rank: i + 1,
      userId: u.id,
      username: u.username,
      displayName: u.displayName,
      avatarUrl: u.avatarUrl ?? undefined,
      xp: u.xp,
      level: u.level,
      passedCount: u._count.submissions,
    }));

    // Populate Redis sorted set
    await Promise.all(
      entries.map(({ xp, rank: _rank, ...rest }) =>
        this.redis.zadd(LEADERBOARD_KEY, xp, JSON.stringify(rest)),
      ),
    );
    await this.redis.expire(LEADERBOARD_KEY, LEADERBOARD_TTL);

    return entries;
  }
}
