import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { Difficulty, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ComponentsService } from '../components/components.service';
import { buildAccumulatedGraph } from '@stackdify/game-engine';
import type { GraphNode, GraphEdge, PaginatedResponse, ProblemSummary, SolutionNode } from '@stackdify/shared-types';

const DEFAULT_PROBLEM_LIMIT = 12;
const MAX_PROBLEM_LIMIT = 50;
const DIFFICULTIES: readonly Difficulty[] = ['EASY', 'MEDIUM', 'HARD'];

function positiveInt(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizeDifficulty(value: string | undefined): Difficulty | undefined {
  return DIFFICULTIES.includes(value as Difficulty) ? (value as Difficulty) : undefined;
}

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

@Injectable()
export class ProblemsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly componentsService: ComponentsService,
  ) {}

  async findAll(
    userId?: string,
    rawPage?: string,
    rawLimit?: string,
    rawDifficulty?: string,
    rawCategory?: string,
    rawSolved?: string,
  ): Promise<PaginatedResponse<ProblemSummary>> {
    const page = positiveInt(rawPage, 1);
    const limit = Math.min(positiveInt(rawLimit, DEFAULT_PROBLEM_LIMIT), MAX_PROBLEM_LIMIT);
    const skip = (page - 1) * limit;
    const difficulty = normalizeDifficulty(rawDifficulty);
    const category = rawCategory?.trim();
    const where: Prisma.ProblemWhereInput = {
      isPublished: true,
      deletedAt: null,
      ...(difficulty ? { difficulty } : {}),
      ...(category && category !== 'All' ? { category } : {}),
    };

    const [total, problems] = await this.prisma.$transaction([
      this.prisma.problem.count({ where }),
      this.prisma.problem.findMany({
        where,
        include: {
          _count: { select: { requirements: true } },
          requirements: { select: { nodes: true }, orderBy: { order: 'asc' } },
        },
        orderBy: { createdAt: 'asc' },
        skip,
        take: limit,
      }),
    ]);

    const summaries = problems.map((p) => {
      const totalNodes = p.requirements.reduce(
        (sum, r) => sum + toNodes(r.nodes).length,
        0,
      );
      return {
        id: p.id,
        slug: p.slug,
        title: p.title,
        description: p.description,
        difficulty: p.difficulty as ProblemSummary['difficulty'],
        category: p.category,
        nodeCount: totalNodes,
        requirementCount: p._count.requirements,
        isSolved: false,
        completedRequirementOrders: [] as number[],
      };
    });

    if (!userId || summaries.length === 0) {
      return {
        data: summaries,
        total,
        page,
        limit,
        hasNextPage: skip + summaries.length < total,
      };
    }

    // A problem is solved when the user has a passing submission at its last requirement.
    const reqCountById = new Map(problems.map((p) => [p.id, p._count.requirements]));
    const passedSubs = await this.prisma.submission.findMany({
      where: { userId, problemId: { in: problems.map((p) => p.id) }, passed: true },
      select: { problemId: true, requirementOrder: true },
    });

    const solvedIds = new Set(
      passedSubs
        .filter((s) => s.requirementOrder != null && s.requirementOrder === reqCountById.get(s.problemId))
        .map((s) => s.problemId),
    );

    const completedOrdersByProblem = new Map<string, Set<number>>();
    for (const s of passedSubs) {
      if (s.requirementOrder == null) continue;
      const set = completedOrdersByProblem.get(s.problemId) ?? new Set<number>();
      set.add(s.requirementOrder);
      completedOrdersByProblem.set(s.problemId, set);
    }

    let enriched = summaries.map((s) => ({
      ...s,
      isSolved: solvedIds.has(s.id),
      completedRequirementOrders: Array.from(completedOrdersByProblem.get(s.id) ?? []).sort((a, b) => a - b),
    }));

    // Post-filter by solved status when userId is present
    if (rawSolved === 'true') {
      enriched = enriched.filter((s) => s.isSolved);
    } else if (rawSolved === 'false') {
      enriched = enriched.filter((s) => !s.isSolved);
    }

    return {
      data: enriched,
      total: rawSolved ? enriched.length : total,
      page,
      limit,
      hasNextPage: rawSolved ? false : skip + enriched.length < total,
    };
  }

  async findCategories() {
    const categories = await this.prisma.problem.findMany({
      where: { isPublished: true, deletedAt: null },
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    });

    return categories.map((problem) => problem.category);
  }

  async findBySlug(slug: string, userId?: string) {
    const problem = await this.prisma.problem.findFirst({
      where: { slug, isPublished: true, deletedAt: null },
      include: {
        requirements: { orderBy: { order: 'asc' } },
      },
    });

    if (!problem || problem.requirements.length === 0) {
      throw new NotFoundException(`Problem "${slug}" not found`);
    }

    const [allComponents, passedSubs] = await Promise.all([
      this.componentsService.findAll(),
      userId
        ? this.prisma.submission.findMany({
            where: { userId, problemId: problem.id, passed: true },
            select: { requirementOrder: true },
          })
        : Promise.resolve([]),
    ]);

    const optionSlugs = problem.componentOptions as string[];
    const componentTypes = optionSlugs.length > 0
      ? allComponents.filter((c) => optionSlugs.includes(c.slug))
      : allComponents;

    const completedRequirementOrders = Array.from(
      new Set(passedSubs.filter((s) => s.requirementOrder != null).map((s) => s.requirementOrder as number)),
    );

    return {
      problem: {
        id: problem.id,
        slug: problem.slug,
        title: problem.title,
        difficulty: problem.difficulty,
        description: problem.description,
        category: problem.category,
      },
      requirements: problem.requirements.map((r) => ({
        id: r.id,
        order: r.order,
        title: r.title,
        description: r.description,
      })),
      componentTypes,
      completedRequirementOrders,
    };
  }

  async getSolution(slug: string, userId: string) {
    const problem = await this.prisma.problem.findFirst({
      where: { slug, isPublished: true, deletedAt: null },
      include: { requirements: { orderBy: { order: 'asc' } } },
    });

    if (!problem || problem.requirements.length === 0) {
      throw new NotFoundException(`Problem "${slug}" not found`);
    }

    const submissionCount = await this.prisma.submission.count({
      where: { userId, problemId: problem.id },
    });
    if (submissionCount === 0) {
      throw new ForbiddenException('Complete at least one attempt before viewing the solution');
    }

    const componentTypes = await this.componentsService.findAll();
    const componentBySlug = new Map(componentTypes.map((ct) => [ct.slug, ct]));

    const nodes: SolutionNode[] = [];
    const edges: GraphEdge[] = [];
    const seenEdgeIds = new Set<string>();
    const explanations: Array<{ slotId: string; componentSlug: string; label: string; explanation: string }> = [];

    for (const req of problem.requirements) {
      const answer = toAnswer(req.answer);
      for (const node of toNodes(req.nodes)) {
        const wasBlank = node.id in answer;
        if (node.type === 'actor') {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          nodes.push({ id: node.id, type: 'actor', position: node.position, data: node.data as any, wasBlank: false });
        } else {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          nodes.push({ id: node.id, type: 'component', position: node.position, data: node.data as any, wasBlank });
          if (wasBlank) {
            const componentSlug = answer[node.id];
            const ct = componentBySlug.get(componentSlug);
            explanations.push({
              slotId: node.id,
              componentSlug,
              label: ct?.label ?? componentSlug,
              explanation: ct?.description ?? '',
            });
          }
        }
      }
      for (const edge of toEdges(req.edges)) {
        if (!seenEdgeIds.has(edge.id)) {
          seenEdgeIds.add(edge.id);
          edges.push(edge);
        }
      }
    }

    return { nodes, edges, explanations };
  }

  async getRequirementGraph(slug: string, order: number) {
    const problem = await this.prisma.problem.findFirst({
      where: { slug, isPublished: true, deletedAt: null },
      include: {
        requirements: { orderBy: { order: 'asc' } },
      },
    });

    if (!problem || problem.requirements.length === 0) {
      throw new NotFoundException(`Problem "${slug}" not found`);
    }

    const target = problem.requirements.find((r) => r.order === order);
    if (!target) {
      throw new NotFoundException(
        `Requirement ${order} not found for problem "${slug}"`,
      );
    }

    const reqs = problem.requirements.map((r) => ({
      order: r.order,
      nodes: toNodes(r.nodes),
      edges: toEdges(r.edges),
      answer: toAnswer(r.answer),
    }));

    const { nodes, edges } = buildAccumulatedGraph(reqs, order);

    return {
      requirement: {
        id: target.id,
        order: target.order,
        title: target.title,
        description: target.description,
        totalCount: problem.requirements.length,
      },
      nodes,
      edges,
    };
  }
}
