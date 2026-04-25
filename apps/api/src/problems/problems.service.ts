import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { maskGraph } from '@joy/game-engine';
import type { ProblemGraph } from '@joy/shared-types';

function toProblemGraph(nodes: unknown, edges: unknown): ProblemGraph {
  if (!Array.isArray(nodes) || !Array.isArray(edges)) {
    throw new InternalServerErrorException('Invalid problem graph data');
  }

  return {
    nodes: nodes as ProblemGraph['nodes'],
    edges: edges as ProblemGraph['edges'],
  };
}

@Injectable()
export class ProblemsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const problems = await this.prisma.problem.findMany({
      where: { isPublished: true },
      include: { graph: { select: { nodes: true } } },
      orderBy: { createdAt: 'asc' },
    });

    return problems.map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      description: p.description,
      difficulty: p.difficulty,
      category: p.category,
      nodeCount: Array.isArray(p.graph?.nodes) ? (p.graph.nodes as unknown[]).length : 0,
    }));
  }

  async findBySlug(slug: string) {
    const problem = await this.prisma.problem.findFirst({
      where: { slug, isPublished: true },
      include: {
        graph: true,
      },
    });

    if (!problem?.graph) throw new NotFoundException(`Problem "${slug}" not found`);

    const componentTypes = await this.prisma.componentType.findMany({
      orderBy: { label: 'asc' },
    });

    const rawGraph = toProblemGraph(problem.graph.nodes, problem.graph.edges);

    const masked = maskGraph(rawGraph, `${problem.id}-${Date.now()}`);

    return {
      problem: {
        id: problem.id,
        slug: problem.slug,
        title: problem.title,
        difficulty: problem.difficulty,
      },
      nodes: masked.nodes,
      edges: masked.edges,
      componentTypes,
    };
  }
}
