import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import type { LeaderboardEntry } from '@stackdify/shared-types';

const LEADERBOARD_KEY = 'leaderboard:global';
const LEADERBOARD_TTL = 60; // seconds

@Injectable()
export class LeaderboardService implements OnModuleInit {
  private readonly logger = new Logger(LeaderboardService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(RedisService) private readonly redis: RedisService,
  ) {}

  async onModuleInit() {
    await this.invalidateCache();
    this.logger.log('Leaderboard cache cleared on startup');
  }

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
      },
    });

    const userIds = users.map(u => u.id);

    // Compute unique solved problems per user
    const [passedSubs, reqMaxOrders] = await Promise.all([
      this.prisma.submission.findMany({
        where: { userId: { in: userIds }, passed: true },
        select: { userId: true, problemId: true, requirementOrder: true },
      }),
      this.prisma.requirement.groupBy({
        by: ['problemId'],
        _max: { order: true },
      }),
    ]);

    const lastReqMap = new Map(reqMaxOrders.map(r => [r.problemId, r._max.order ?? 1]));
    const solvedByUser = new Map<string, Set<string>>();
    for (const s of passedSubs) {
      if (s.requirementOrder != null && s.requirementOrder === lastReqMap.get(s.problemId)) {
        let set = solvedByUser.get(s.userId);
        if (!set) { set = new Set<string>(); solvedByUser.set(s.userId, set); }
        set.add(s.problemId);
      }
    }

    const entries: LeaderboardEntry[] = users.map((u, i) => ({
      rank: i + 1,
      userId: u.id,
      username: u.username,
      displayName: u.displayName,
      avatarUrl: u.avatarUrl ?? undefined,
      xp: u.xp,
      level: u.level,
      passedCount: solvedByUser.get(u.id)?.size ?? 0,
    }));

    // Clear stale entries before rebuilding to avoid duplicates
    await this.redis.del(LEADERBOARD_KEY);

    await Promise.all(
      entries.map(({ xp, rank: _rank, ...rest }) =>
        this.redis.zadd(LEADERBOARD_KEY, xp, JSON.stringify(rest)),
      ),
    );
    await this.redis.expire(LEADERBOARD_KEY, LEADERBOARD_TTL);

    return entries;
  }
}
