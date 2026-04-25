import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        xp: true,
        level: true,
        streak: true,
        createdAt: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async getStats(userId: string) {
    const [submissions, user] = await Promise.all([
      this.prisma.submission.findMany({
        where: { userId },
        select: { score: true, passed: true, xpEarned: true },
      }),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { xp: true, level: true, streak: true },
      }),
    ]);

    if (!user) throw new NotFoundException('User not found');

    const totalSubmissions = submissions.length;
    const passedSubmissions = submissions.filter((s) => s.passed).length;
    const averageScore =
      totalSubmissions > 0
        ? Math.round(submissions.reduce((sum, s) => sum + s.score, 0) / totalSubmissions)
        : 0;

    return {
      userId,
      totalSubmissions,
      passedSubmissions,
      averageScore,
      totalXp: user.xp,
      level: user.level,
      streak: user.streak,
    };
  }
}
