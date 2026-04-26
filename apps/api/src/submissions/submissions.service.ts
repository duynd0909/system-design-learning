import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { scoreSubmission } from '@stackdify/game-engine';
import type { PaginatedResponse, SubmissionHistoryItem } from '@stackdify/shared-types';
import type { CreateSubmissionDto } from './dto/create-submission.dto';

const XP_PER_POINT = 10;
const DEFAULT_HISTORY_LIMIT = 20;
const MAX_HISTORY_LIMIT = 100;

function isStringRecord(value: unknown): value is Record<string, string> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.values(value).every((item) => typeof item === 'string')
  );
}

function positiveInt(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

@Injectable()
export class SubmissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateSubmissionDto) {
    // Fetch the specific requirement's answer key
    const requirement = await this.prisma.requirement.findFirst({
      where: { problemId: dto.problemId, order: dto.requirementOrder },
      include: { problem: { select: { requirements: { select: { order: true } } } } },
    });

    if (!requirement) {
      throw new NotFoundException(
        `Requirement ${dto.requirementOrder} not found for problem`,
      );
    }
    if (!isStringRecord(requirement.answer)) {
      throw new InternalServerErrorException('Invalid requirement answer data');
    }

    const answer = requirement.answer;
    const totalRequirements = requirement.problem.requirements.length;
    const isLastRequirement = dto.requirementOrder === totalRequirements;

    const result = scoreSubmission(dto.slotAnswers, answer);
    const xpEarned = result.passed ? XP_PER_POINT * Object.keys(answer).length : 0;

    const slotResultsJson: Prisma.InputJsonArray = result.slotResults.map(
      (slotResult): Prisma.InputJsonObject => ({
        slotId: slotResult.slotId,
        correct: slotResult.correct,
        submitted: slotResult.submitted,
        expected: slotResult.expected,
      }),
    );

    const submission = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const sub = await tx.submission.create({
        data: {
          userId,
          problemId: dto.problemId,
          requirementOrder: dto.requirementOrder,
          score: result.score,
          passed: result.passed,
          xpEarned,
          timeTakenMs: dto.timeTakenMs,
          slotAnswers: dto.slotAnswers,
          slotResults: slotResultsJson,
        },
      });

      if (xpEarned > 0) {
        await tx.user.update({
          where: { id: userId },
          data: { xp: { increment: xpEarned } },
        });
      }

      return sub;
    });

    return {
      id: submission.id,
      score: result.score,
      passed: result.passed,
      xpEarned,
      timeTakenMs: dto.timeTakenMs,
      requirementOrder: dto.requirementOrder,
      isLastRequirement,
      slotResults: result.slotResults,
      createdAt: submission.createdAt.toISOString(),
    };
  }

  async findMySubmissions(
    userId: string,
    rawPage?: string,
    rawLimit?: string,
  ): Promise<PaginatedResponse<SubmissionHistoryItem>> {
    const page = positiveInt(rawPage, 1);
    const limit = Math.min(positiveInt(rawLimit, DEFAULT_HISTORY_LIMIT), MAX_HISTORY_LIMIT);
    const skip = (page - 1) * limit;

    const [total, submissions] = await this.prisma.$transaction([
      this.prisma.submission.count({ where: { userId } }),
      this.prisma.submission.findMany({
        where: { userId },
        select: {
          id: true,
          problemId: true,
          requirementOrder: true,
          score: true,
          passed: true,
          xpEarned: true,
          timeTakenMs: true,
          createdAt: true,
          problem: { select: { slug: true, title: true, difficulty: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      data: submissions.map((submission) => ({
        id: submission.id,
        problemId: submission.problemId,
        requirementOrder: submission.requirementOrder ?? undefined,
        score: submission.score,
        passed: submission.passed,
        xpEarned: submission.xpEarned,
        timeTakenMs: submission.timeTakenMs,
        createdAt: submission.createdAt.toISOString(),
        problem: {
          slug: submission.problem.slug,
          title: submission.problem.title,
          difficulty: submission.problem.difficulty as SubmissionHistoryItem['problem']['difficulty'],
        },
      })),
      total,
      page,
      limit,
      hasNextPage: skip + submissions.length < total,
    };
  }

  async findOne(id: string, userId: string) {
    const sub = await this.prisma.submission.findFirst({
      where: { id, userId },
    });
    if (!sub) throw new NotFoundException('Submission not found');
    return sub;
  }
}
