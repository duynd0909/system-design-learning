import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { buildAccumulatedGraph } from '@stackdify/game-engine';
import type { GraphNode, GraphEdge, SolutionNode } from '@stackdify/shared-types';

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
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const problems = await this.prisma.problem.findMany({
      where: { isPublished: true },
      include: {
        _count: { select: { requirements: true } },
        requirements: { select: { nodes: true }, orderBy: { order: 'asc' } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return problems.map((p) => {
      const totalNodes = p.requirements.reduce(
        (sum, r) => sum + toNodes(r.nodes).length,
        0,
      );
      return {
        id: p.id,
        slug: p.slug,
        title: p.title,
        description: p.description,
        difficulty: p.difficulty,
        category: p.category,
        nodeCount: totalNodes,
        requirementCount: p._count.requirements,
      };
    });
  }

  async findBySlug(slug: string) {
    const problem = await this.prisma.problem.findFirst({
      where: { slug, isPublished: true },
      include: {
        requirements: { orderBy: { order: 'asc' } },
      },
    });

    if (!problem || problem.requirements.length === 0) {
      throw new NotFoundException(`Problem "${slug}" not found`);
    }

    const componentTypes = await this.prisma.componentType.findMany({
      orderBy: { label: 'asc' },
    });

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
    };
  }

  async getSolution(slug: string, userId: string) {
    const problem = await this.prisma.problem.findFirst({
      where: { slug, isPublished: true },
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

    const componentTypes = await this.prisma.componentType.findMany();
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
      where: { slug, isPublished: true },
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

    const { nodes, edges } = buildAccumulatedGraph(
      reqs,
      order,
      `${problem.id}-req${order}`,
    );

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
