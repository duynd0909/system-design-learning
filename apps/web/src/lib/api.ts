'use client';

import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  ShareTokenResponse,
  PublicUserProfile,
  AdminStatsResponse,
  AdminProblemListItem,
  ComponentType,
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
  solved?: 'true' | 'false' | '';
}

function problemListPath({ page = 1, limit = DEFAULT_PROBLEMS_LIMIT, difficulty, category, solved }: ProblemListParams) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  if (difficulty) params.set('difficulty', difficulty);
  if (category) params.set('category', category);
  if (solved) params.set('solved', solved);

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
  const { token, limit = DEFAULT_PROBLEMS_LIMIT, difficulty, category, solved } = params;

  return useInfiniteQuery({
    queryKey: [
      'problems',
      token || null,
      'infinite',
      { difficulty: difficulty || null, category: category || null, solved: solved || null, limit },
    ],
    queryFn: ({ pageParam }) =>
      fetchProblemsPage({ page: pageParam as number, limit, difficulty, category, solved }, token || undefined),
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

// ─── Share ────────────────────────────────────────────────────────────────────

export function useShareProblem(token?: string) {
  return useMutation<ShareTokenResponse, Error, string>({
    mutationFn: (slug) =>
      apiFetch(`/problems/${slug}/share`, { method: 'POST' }, token || undefined),
  });
}

// ─── Public Profile ───────────────────────────────────────────────────────────

export function usePublicProfile(username: string) {
  return useQuery<PublicUserProfile>({
    queryKey: ['users', 'profile', username],
    queryFn: () => apiFetch(`/users/profile/${username}`),
    enabled: !!username,
  });
}

// ─── Component Types ──────────────────────────────────────────────────────────

export function useComponentTypes() {
  return useQuery<ComponentType[]>({
    queryKey: ['components'],
    queryFn: () => apiFetch('/components'),
    staleTime: 10 * 60_000,
  });
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export function useAdminStats(token: string) {
  return useQuery<AdminStatsResponse>({
    queryKey: ['admin', 'stats'],
    queryFn: () => apiFetch('/admin/stats', undefined, token),
    enabled: !!token,
    staleTime: 60_000,
  });
}

export function useAdminProblems(token: string, status?: 'published' | 'hidden' | 'deleted') {
  return useQuery<AdminProblemListItem[]>({
    queryKey: ['admin', 'problems', status ?? 'all'],
    queryFn: () => apiFetch(`/admin/problems${status ? `?status=${status}` : ''}`, undefined, token),
    enabled: !!token,
  });
}

export function useAdminProblem(token: string, slug: string) {
  return useQuery({
    queryKey: ['admin', 'problems', slug],
    queryFn: () => apiFetch<{ problem: AdminProblemListItem; requirements: unknown[] }>(`/admin/problems/${slug}`, undefined, token),
    enabled: !!token && !!slug,
  });
}

export function usePublishProblem(token: string) {
  const qc = useQueryClient();
  return useMutation<unknown, Error, string>({
    mutationFn: (slug) => apiFetch(`/admin/problems/${slug}/publish`, { method: 'PATCH' }, token),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['admin', 'problems'] }); },
  });
}

export function useHideProblem(token: string) {
  const qc = useQueryClient();
  return useMutation<unknown, Error, string>({
    mutationFn: (slug) => apiFetch(`/admin/problems/${slug}/hide`, { method: 'PATCH' }, token),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['admin', 'problems'] }); },
  });
}

export function useSoftDeleteProblem(token: string) {
  const qc = useQueryClient();
  return useMutation<unknown, Error, string>({
    mutationFn: (slug) => apiFetch(`/admin/problems/${slug}`, { method: 'DELETE' }, token),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['admin', 'problems'] }); },
  });
}

export function useRestoreProblem(token: string) {
  const qc = useQueryClient();
  return useMutation<unknown, Error, string>({
    mutationFn: (slug) => apiFetch(`/admin/problems/${slug}/restore`, { method: 'PATCH' }, token),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['admin', 'problems'] }); },
  });
}

export function useCreateProblem(token: string) {
  const qc = useQueryClient();
  return useMutation<{ id: string; slug: string }, Error, Record<string, unknown>>({
    mutationFn: (data) => apiFetch('/admin/problems', { method: 'POST', body: JSON.stringify(data) }, token),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'problems'] });
      void qc.invalidateQueries({ queryKey: ['problems'] });
    },
  });
}

export function useUpdateProblem(token: string) {
  const qc = useQueryClient();
  return useMutation<unknown, Error, { slug: string; data: Record<string, unknown> }>({
    mutationFn: ({ slug, data }) => apiFetch(`/admin/problems/${slug}`, { method: 'PATCH', body: JSON.stringify(data) }, token),
    onSuccess: (_, { slug }) => {
      void qc.invalidateQueries({ queryKey: ['admin', 'problems'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'problems', slug] });
    },
  });
}

export function useReplaceRequirements(token: string) {
  const qc = useQueryClient();
  return useMutation<unknown, Error, { slug: string; requirements: unknown[] }>({
    mutationFn: ({ slug, requirements }) =>
      apiFetch(`/admin/problems/${slug}/requirements`, { method: 'PUT', body: JSON.stringify({ requirements }) }, token),
    onSuccess: (_, { slug }) => {
      void qc.invalidateQueries({ queryKey: ['admin', 'problems', slug] });
    },
  });
}
