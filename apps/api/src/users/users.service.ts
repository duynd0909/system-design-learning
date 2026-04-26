import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { UserActivity } from '@stackdify/shared-types';

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
    const [submissions, user, allProblems] = await Promise.all([
      this.prisma.submission.findMany({
        where: { userId },
        select: {
          score: true,
          passed: true,
          xpEarned: true,
          problemId: true,
          problem: { select: { category: true } },
        },
      }),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { xp: true, level: true, streak: true },
      }),
      this.prisma.problem.findMany({
        where: { isPublished: true },
        select: { id: true, category: true },
      }),
    ]);

    if (!user) throw new NotFoundException('User not found');

    const totalSubmissions = submissions.length;
    const passedSubmissions = submissions.filter((s) => s.passed).length;
    const averageScore =
      totalSubmissions > 0
        ? Math.round(submissions.reduce((sum, s) => sum + s.score, 0) / totalSubmissions)
        : 0;
    const accuracy = totalSubmissions > 0
      ? Math.round((passedSubmissions / totalSubmissions) * 100)
      : 0;

    const solvedProblemIds = new Set(
      submissions.filter((s) => s.passed).map((s) => s.problemId),
    );
    const solved = solvedProblemIds.size;

    // Build category breakdown from all published problems + user solves
    const categoryBreakdown: Record<string, { solved: number; total: number }> = {};
    for (const p of allProblems) {
      if (!categoryBreakdown[p.category]) {
        categoryBreakdown[p.category] = { solved: 0, total: 0 };
      }
      categoryBreakdown[p.category].total += 1;
      if (solvedProblemIds.has(p.id)) {
        categoryBreakdown[p.category].solved += 1;
      }
    }

    return {
      userId,
      totalSubmissions,
      passedSubmissions,
      solved,
      averageScore,
      accuracy,
      totalXp: user.xp,
      level: user.level,
      streak: user.streak,
      categoryBreakdown,
    };
  }

  async getActivity(userId: string): Promise<UserActivity[]> {
    const since = new Date();
    since.setDate(since.getDate() - 89); // last 90 days inclusive

    const submissions = await this.prisma.submission.findMany({
      where: { userId, createdAt: { gte: since } },
      select: { createdAt: true },
    });

    // Group by YYYY-MM-DD
    const counts = new Map<string, number>();
    for (const sub of submissions) {
      const date = sub.createdAt.toISOString().slice(0, 10);
      counts.set(date, (counts.get(date) ?? 0) + 1);
    }

    // Return all 90 days (zeros included) so the heatmap grid is complete
    const result: UserActivity[] = [];
    for (let i = 89; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const date = d.toISOString().slice(0, 10);
      result.push({ date, count: counts.get(date) ?? 0 });
    }
    return result;
  }
}
