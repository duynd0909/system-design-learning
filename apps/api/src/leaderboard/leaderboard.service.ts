import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LeaderboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getGlobal(limit = 50) {
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

    return users.map((u, i) => ({
      rank: i + 1,
      userId: u.id,
      username: u.username,
      displayName: u.displayName,
      avatarUrl: u.avatarUrl,
      xp: u.xp,
      level: u.level,
      passedCount: u._count.submissions,
    }));
  }
}
