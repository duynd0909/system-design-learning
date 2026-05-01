import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { PublicUserProfile, UserActivity } from '@stackdify/shared-types';

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
    const [submissions, user, allProblems, requirementCounts] = await Promise.all([
      this.prisma.submission.findMany({
        where: { userId },
        select: {
          score: true,
          passed: true,
          xpEarned: true,
          problemId: true,
          requirementOrder: true,
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
      this.prisma.requirement.groupBy({
        by: ['problemId'],
        _max: { order: true },
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

    // A problem is "solved" only when the last requirement's submission passes
    const lastReqOrder = new Map(requirementCounts.map((r) => [r.problemId, r._max.order ?? 1]));
    const solvedProblemIds = new Set(
      submissions
        .filter((s) => s.passed && s.requirementOrder != null && s.requirementOrder === lastReqOrder.get(s.problemId))
        .map((s) => s.problemId),
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

  async getPublicProfile(username: string): Promise<PublicUserProfile> {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: { id: true, username: true, displayName: true, avatarUrl: true, level: true, xp: true, streak: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const [submissions, allProblems, requirementCounts] = await Promise.all([
      this.prisma.submission.findMany({
        where: { userId: user.id },
        select: { passed: true, problemId: true, requirementOrder: true, problem: { select: { category: true } } },
      }),
      this.prisma.problem.findMany({ where: { isPublished: true }, select: { id: true, category: true } }),
      this.prisma.requirement.groupBy({ by: ['problemId'], _max: { order: true } }),
    ]);

    const lastReqOrder = new Map(requirementCounts.map((r) => [r.problemId, r._max.order ?? 1]));
    const solvedProblemIds = new Set(
      submissions
        .filter((s) => s.passed && s.requirementOrder != null && s.requirementOrder === lastReqOrder.get(s.problemId))
        .map((s) => s.problemId),
    );

    const categoryBreakdown: Record<string, { solved: number; total: number }> = {};
    for (const p of allProblems) {
      if (!categoryBreakdown[p.category]) categoryBreakdown[p.category] = { solved: 0, total: 0 };
      categoryBreakdown[p.category].total += 1;
      if (solvedProblemIds.has(p.id)) categoryBreakdown[p.category].solved += 1;
    }

    return {
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl ?? undefined,
      level: user.level,
      xp: user.xp,
      streak: user.streak,
      solvedCount: solvedProblemIds.size,
      categoryBreakdown,
    };
  }

  async getActivity(userId: string, year: number): Promise<UserActivity[]> {
    const since = new Date(year, 0, 1);
    const until = new Date(year, 11, 31, 23, 59, 59, 999);

    const submissions = await this.prisma.submission.findMany({
      where: { userId, createdAt: { gte: since, lte: until } },
      select: { createdAt: true },
    });

    const counts = new Map<string, number>();
    for (const sub of submissions) {
      const date = sub.createdAt.toISOString().slice(0, 10);
      counts.set(date, (counts.get(date) ?? 0) + 1);
    }

    // Return every day of the year (zeros included)
    const result: UserActivity[] = [];
    const isLeap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    const days = isLeap ? 366 : 365;
    for (let i = 0; i < days; i++) {
      const d = new Date(year, 0, 1 + i);
      const date = d.toISOString().slice(0, 10);
      result.push({ date, count: counts.get(date) ?? 0 });
    }
    return result;
  }
}
