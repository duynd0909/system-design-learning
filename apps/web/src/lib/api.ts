'use client';

import { useInfiniteQuery, useQuery, useMutation } from '@tanstack/react-query';
import type {
  ProblemSummary,
  ProblemDetailResponse,
  RequirementGraphResponse,
  SolutionResponse,
  SubmissionRequest,
  SubmissionResponse,
  SubmissionHistoryItem,
  LeaderboardEntry,
  User,
  UserStats,
  UserActivity,
  PaginatedResponse,
  Difficulty,
} from '@stackdify/shared-types';

export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

export async function apiFetch<T>(path: string, init?: RequestInit, token?: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message ?? 'API error');
  }
  const json = await res.json();
  return (json.data ?? json) as T;
}

// ─── Problems ────────────────────────────────────────────────────────────────

const DEFAULT_PROBLEMS_LIMIT = 12;

interface ProblemListParams {
  page?: number;
  limit?: number;
  difficulty?: Difficulty | '';
  category?: string;
}

function problemListPath({ page = 1, limit = DEFAULT_PROBLEMS_LIMIT, difficulty, category }: ProblemListParams) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  if (difficulty) params.set('difficulty', difficulty);
  if (category) params.set('category', category);

  return `/problems?${params.toString()}`;
}

function isProblemSummary(value: unknown): value is ProblemSummary {
  if (typeof value !== 'object' || value === null) return false;
  const item = value as Record<string, unknown>;
  return typeof item.id === 'string' && typeof item.slug === 'string' && typeof item.title === 'string';
}

function normalizeProblemsPage(
  payload: PaginatedResponse<ProblemSummary> | ProblemSummary[],
  params: ProblemListParams,
): PaginatedResponse<ProblemSummary> {
  const page = params.page ?? 1;
  const limit = params.limit ?? DEFAULT_PROBLEMS_LIMIT;

  if (Array.isArray(payload)) {
    const data = payload.filter(isProblemSummary);
    return {
      data,
      total: data.length,
      page,
      limit,
      hasNextPage: false,
    };
  }

  const data = Array.isArray(payload.data) ? payload.data.filter(isProblemSummary) : [];
  return {
    data,
    total: typeof payload.total === 'number' ? payload.total : data.length,
    page: typeof payload.page === 'number' ? payload.page : page,
    limit: typeof payload.limit === 'number' ? payload.limit : limit,
    hasNextPage: payload.hasNextPage === true,
  };
}

async function fetchProblemsPage(params: ProblemListParams, token?: string) {
  const payload = await apiFetch<PaginatedResponse<ProblemSummary> | ProblemSummary[]>(
    problemListPath(params),
    undefined,
    token || undefined,
  );
  return normalizeProblemsPage(payload, params);
}

export function useInfiniteProblems(params: Omit<ProblemListParams, 'page'> & { token?: string } = {}) {
  const { token, limit = DEFAULT_PROBLEMS_LIMIT, difficulty, category } = params;

  return useInfiniteQuery({
    queryKey: [
      'problems',
      token || null,
      'infinite',
      { difficulty: difficulty || null, category: category || null, limit },
    ],
    queryFn: ({ pageParam }) =>
      fetchProblemsPage({ page: pageParam as number, limit, difficulty, category }, token || undefined),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.hasNextPage ? lastPage.page + 1 : undefined),
  });
}

export function useProblemCategories() {
  return useQuery<string[]>({
    queryKey: ['problems', 'categories'],
    queryFn: () => apiFetch('/problems/categories'),
    staleTime: 5 * 60_000,
  });
}

export function useProblems(token?: string) {
  return useQuery<ProblemSummary[]>({
    queryKey: ['problems', token || null, 'summary-list'],
    queryFn: async () => {
      const summaries: ProblemSummary[] = [];
      let page = 1;
      let hasNextPage = true;

      while (hasNextPage) {
        const response = await fetchProblemsPage({ page, limit: 50 }, token || undefined);
        summaries.push(...response.data);
        hasNextPage = response.hasNextPage;
        page += 1;
      }

      return summaries;
    },
  });
}

export function useProblemDetail(slug: string, token?: string) {
  return useQuery<ProblemDetailResponse>({
    queryKey: ['problems', slug, token || null],
    queryFn: () => apiFetch(`/problems/${slug}`, undefined, token || undefined),
    enabled: !!slug,
  });
}

export function useRequirementGraph(slug: string, order: number) {
  return useQuery<RequirementGraphResponse>({
    queryKey: ['problems', slug, 'requirements', order],
    queryFn: () => apiFetch(`/problems/${slug}/requirements/${order}`),
    enabled: !!slug && order > 0,
  });
}

// ─── Submissions ──────────────────────────────────────────────────────────────

export function useSubmit(token: string) {
  return useMutation<SubmissionResponse, Error, SubmissionRequest>({
    mutationFn: (data) =>
      apiFetch('/submissions', { method: 'POST', body: JSON.stringify(data) }, token),
  });
}

export function useMySubmissions(token: string, page = 1, limit = 50) {
  return useQuery<PaginatedResponse<SubmissionHistoryItem>>({
    queryKey: ['submissions', 'me', page, limit],
    queryFn: () => apiFetch(`/submissions/me?page=${page}&limit=${limit}`, undefined, token),
    enabled: !!token,
  });
}

// ─── Leaderboard ──────────────────────────────────────────────────────────────

export function useLeaderboard() {
  return useQuery<LeaderboardEntry[]>({
    queryKey: ['leaderboard'],
    queryFn: () => apiFetch('/leaderboard'),
    staleTime: 60_000,
  });
}

// ─── Users ────────────────────────────────────────────────────────────────────

export function useMe(token: string) {
  return useQuery<User>({
    queryKey: ['users', 'me'],
    queryFn: () => apiFetch('/users/me', undefined, token),
    enabled: !!token,
  });
}

export function useMyStats(token: string) {
  return useQuery<UserStats>({
    queryKey: ['users', 'me', 'stats'],
    queryFn: () => apiFetch('/users/me/stats', undefined, token),
    enabled: !!token,
  });
}

export function useMyActivity(token: string, year: number) {
  return useQuery<UserActivity[]>({
    queryKey: ['users', 'me', 'activity', year],
    queryFn: () => apiFetch(`/users/me/activity?year=${year}`, undefined, token),
    enabled: !!token,
    staleTime: 5 * 60_000,
  });
}

export function useProblemSolution(slug: string, token: string) {
  return useQuery<SolutionResponse>({
    queryKey: ['problems', slug, 'solution'],
    queryFn: () => apiFetch(`/problems/${slug}/solution`, undefined, token),
    enabled: !!slug && !!token,
    retry: false,
  });
}
