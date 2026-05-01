import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { Difficulty, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { GraphEdge, GraphNode } from '@stackdify/shared-types';
import type {
  AdminProblemDto,
  AdminRequirementDto,
  ReplaceRequirementsDto,
  UpdateAdminProblemDto,
} from './dto/admin-problem.dto';

function toNodes(raw: unknown): GraphNode[] {
  return Array.isArray(raw) ? (raw as GraphNode[]) : [];
}

function toEdges(raw: unknown): GraphEdge[] {
  return Array.isArray(raw) ? (raw as GraphEdge[]) : [];
}

function toAnswer(raw: unknown): Record<string, string> {
  return raw !== null && typeof raw === 'object' && !Array.isArray(raw)
    ? (raw as Record<string, string>)
    : {};
}

function fillDailyGaps(
  rows: Array<{ date: string; count: bigint }>,
  days: number,
): Array<{ date: string; count: number }> {
  const map = new Map(rows.map((r) => [r.date, Number(r.count)]));
  const result: Array<{ date: string; count: number }> = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    result.push({ date: key, count: map.get(key) ?? 0 });
  }
  return result;
}

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      totalProblems,
      publishedProblems,
      deletedProblems,
      totalRequirements,
      totalUsers,
      totalSubmissions,
      passedSubmissions,
      recentSubmissions,
      problems,
      rawSubsPerDay,
      rawUsersPerDay,
    ] = await Promise.all([
      this.prisma.problem.count({ where: { deletedAt: null } }),
      this.prisma.problem.count({ where: { isPublished: true, deletedAt: null } }),
      this.prisma.problem.count({ where: { deletedAt: { not: null } } }),
      this.prisma.requirement.count(),
      this.prisma.user.count(),
      this.prisma.submission.count(),
      this.prisma.submission.count({ where: { passed: true } }),
      this.prisma.submission.findMany({
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: {
          id: true,
          score: true,
          passed: true,
          createdAt: true,
          user: { select: { username: true, displayName: true } },
          problem: { select: { slug: true, title: true } },
        },
      }),
      this.prisma.problem.findMany({
        where: { deletedAt: null },
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          slug: true,
          title: true,
          isPublished: true,
          deletedAt: true,
          _count: { select: { requirements: true, submissions: true } },
        },
      }),
      this.prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
        SELECT DATE_TRUNC('day', "createdAt")::date::text AS date, COUNT(*) AS count
        FROM submissions
        WHERE "createdAt" >= ${thirtyDaysAgo}
        GROUP BY 1 ORDER BY 1
      `,
      this.prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
        SELECT DATE_TRUNC('day', "createdAt")::date::text AS date, COUNT(*) AS count
        FROM users
        WHERE "createdAt" >= ${thirtyDaysAgo}
        GROUP BY 1 ORDER BY 1
      `,
    ]);

    // Per-problem pass rate
    const allSubmissions = await this.prisma.submission.findMany({
      select: { problemId: true, passed: true, problem: { select: { slug: true, title: true } } },
    });

    const problemMap = new Map<string, { slug: string; title: string; total: number; passed: number }>();
    for (const sub of allSubmissions) {
      const entry = problemMap.get(sub.problemId) ?? {
        slug: sub.problem.slug,
        title: sub.problem.title,
        total: 0,
        passed: 0,
      };
      entry.total++;
      if (sub.passed) entry.passed++;
      problemMap.set(sub.problemId, entry);
    }

    // Difficulty distribution from submissions
    const subsWithDifficulty = await this.prisma.submission.findMany({
      select: { problem: { select: { difficulty: true } } },
    });
    const difficultyDistribution: Record<'EASY' | 'MEDIUM' | 'HARD', number> = { EASY: 0, MEDIUM: 0, HARD: 0 };
    for (const sub of subsWithDifficulty) {
      const d = sub.problem.difficulty as 'EASY' | 'MEDIUM' | 'HARD';
      difficultyDistribution[d]++;
    }

    return {
      totals: {
        problems: totalProblems,
        publishedProblems,
        hiddenProblems: totalProblems - publishedProblems,
        deletedProblems,
        requirements: totalRequirements,
        users: totalUsers,
        submissions: totalSubmissions,
        passRate: totalSubmissions > 0 ? Math.round((passedSubmissions / totalSubmissions) * 100) : 0,
      },
      submissionsPerDay: fillDailyGaps(rawSubsPerDay, 30),
      newUsersPerDay: fillDailyGaps(rawUsersPerDay, 30),
      passRateByProblem: Array.from(problemMap.values()).map((p) => ({
        slug: p.slug,
        title: p.title,
        totalSubmissions: p.total,
        passRate: p.total > 0 ? Math.round((p.passed / p.total) * 100) : 0,
      })),
      difficultyDistribution,
      recentSubmissions: recentSubmissions.map((submission) => ({
        id: submission.id,
        score: submission.score,
        passed: submission.passed,
        createdAt: submission.createdAt.toISOString(),
        user: submission.user,
        problem: submission.problem,
      })),
      problemQuality: problems.map((problem) => {
        const stats = problemMap.get(problem.id);
        return {
          id: problem.id,
          slug: problem.slug,
          title: problem.title,
          isPublished: problem.isPublished,
          deletedAt: problem.deletedAt?.toISOString() ?? null,
          requirementCount: problem._count.requirements,
          submissionCount: problem._count.submissions,
          passRate: stats && stats.total > 0 ? Math.round((stats.passed / stats.total) * 100) : 0,
        };
      }),
    };
  }

  async listProblems(status?: string) {
    const where: Prisma.ProblemWhereInput =
      status === 'published' ? { isPublished: true, deletedAt: null } :
      status === 'hidden'    ? { isPublished: false, deletedAt: null } :
      status === 'deleted'   ? { deletedAt: { not: null } } :
                               { deletedAt: null };

    const problems = await this.prisma.problem.findMany({
      where,
      include: {
        _count: { select: { requirements: true, submissions: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return problems.map((problem) => ({
      id: problem.id,
      slug: problem.slug,
      title: problem.title,
      description: problem.description,
      difficulty: problem.difficulty,
      category: problem.category,
      isPublished: problem.isPublished,
      deletedAt: problem.deletedAt?.toISOString() ?? null,
      requirementCount: problem._count.requirements,
      submissionCount: problem._count.submissions,
      createdAt: problem.createdAt.toISOString(),
      updatedAt: problem.updatedAt.toISOString(),
    }));
  }

  async createProblem(dto: AdminProblemDto) {
    const existing = await this.prisma.problem.findUnique({ where: { slug: dto.slug } });
    if (existing) throw new ConflictException(`Problem "${dto.slug}" already exists`);

    return this.prisma.problem.create({
      data: {
        slug: dto.slug,
        title: dto.title,
        description: dto.description,
        difficulty: dto.difficulty,
        category: dto.category,
        isPublished: dto.isPublished ?? false,
      },
    });
  }

  async getProblem(slug: string) {
    const problem = await this.prisma.problem.findUnique({
      where: { slug },
      include: { requirements: { orderBy: { order: 'asc' } } },
    });
    if (!problem) throw new NotFoundException(`Problem "${slug}" not found`);

    return {
      problem: {
        id: problem.id,
        slug: problem.slug,
        title: problem.title,
        description: problem.description,
        difficulty: problem.difficulty,
        category: problem.category,
        isPublished: problem.isPublished,
        deletedAt: problem.deletedAt?.toISOString() ?? null,
        createdAt: problem.createdAt.toISOString(),
        updatedAt: problem.updatedAt.toISOString(),
      },
      requirements: problem.requirements.map((requirement) => ({
        id: requirement.id,
        order: requirement.order,
        title: requirement.title,
        description: requirement.description,
        nodes: toNodes(requirement.nodes),
        edges: toEdges(requirement.edges),
        answer: toAnswer(requirement.answer),
      })),
    };
  }

  async updateProblem(slug: string, dto: UpdateAdminProblemDto) {
    await this.ensureProblem(slug);
    return this.prisma.problem.update({
      where: { slug },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.difficulty !== undefined ? { difficulty: dto.difficulty as Difficulty } : {}),
        ...(dto.category !== undefined ? { category: dto.category } : {}),
        ...(dto.isPublished !== undefined ? { isPublished: dto.isPublished } : {}),
      },
    });
  }

  async replaceRequirements(slug: string, dto: ReplaceRequirementsDto) {
    const problem = await this.ensureProblem(slug);
    const requirements = dto.requirements.slice().sort((a, b) => a.order - b.order);
    this.validateRequirements(requirements);

    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.requirement.deleteMany({ where: { problemId: problem.id } });
      await tx.requirement.createMany({
        data: requirements.map((requirement) => ({
          problemId: problem.id,
          order: requirement.order,
          title: requirement.title,
          description: requirement.description,
          nodes: requirement.nodes as unknown as Prisma.InputJsonArray,
          edges: requirement.edges as unknown as Prisma.InputJsonArray,
          answer: requirement.answer as Prisma.InputJsonObject,
        })),
      });
    });

    return this.getProblem(slug);
  }

  async publishProblem(slug: string) {
    const problem = await this.getProblem(slug);
    if (problem.requirements.length === 0) {
      throw new BadRequestException('Cannot publish a problem without requirements');
    }
    return this.updateProblem(slug, { isPublished: true });
  }

  async hideProblem(slug: string) {
    return this.updateProblem(slug, { isPublished: false });
  }

  async deleteProblem(slug: string) {
    await this.ensureProblem(slug);
    await this.prisma.problem.update({
      where: { slug },
      data: { deletedAt: new Date(), isPublished: false },
    });
    return { deleted: true };
  }

  async restoreProblem(slug: string) {
    const problem = await this.prisma.problem.findUnique({ where: { slug } });
    if (!problem) throw new NotFoundException(`Problem "${slug}" not found`);
    if (!problem.deletedAt) throw new BadRequestException('Problem is not deleted');
    return this.prisma.problem.update({
      where: { slug },
      data: { deletedAt: null },
    });
  }

  private async ensureProblem(slug: string) {
    const problem = await this.prisma.problem.findUnique({ where: { slug } });
    if (!problem) throw new NotFoundException(`Problem "${slug}" not found`);
    if (problem.deletedAt) throw new NotFoundException(`Problem "${slug}" is deleted`);
    return problem;
  }

  private validateRequirements(requirements: AdminRequirementDto[]) {
    if (requirements.length === 0) {
      throw new BadRequestException('At least one requirement is required');
    }

    const expectedOrders = new Set<number>();
    const seenNodeIds = new Set<string>();

    for (let i = 0; i < requirements.length; i++) {
      const requirement = requirements[i];
      const expectedOrder = i + 1;
      if (requirement.order !== expectedOrder) {
        throw new BadRequestException('Requirement orders must be sequential starting at 1');
      }
      if (expectedOrders.has(requirement.order)) {
        throw new BadRequestException(`Duplicate requirement order ${requirement.order}`);
      }
      expectedOrders.add(requirement.order);

      for (const node of requirement.nodes) {
        if (!node.id) throw new BadRequestException('Every node must have an id');
        if (seenNodeIds.has(node.id)) {
          throw new BadRequestException(`Duplicate node id "${node.id}"`);
        }
        seenNodeIds.add(node.id);
      }

      const currentNodeIds = new Set(requirement.nodes.map((node) => node.id));
      for (const slotId of Object.keys(requirement.answer)) {
        if (!currentNodeIds.has(slotId)) {
          throw new BadRequestException(`Answer references node "${slotId}" outside requirement ${requirement.order}`);
        }
      }

      for (const edge of requirement.edges) {
        if (!seenNodeIds.has(edge.source) || !seenNodeIds.has(edge.target)) {
          throw new BadRequestException(`Edge "${edge.id}" references an unknown node`);
        }
      }
    }
  }
}
