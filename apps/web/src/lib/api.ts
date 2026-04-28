'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
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

export function useProblems() {
  return useQuery<ProblemSummary[]>({
    queryKey: ['problems'],
    queryFn: () => apiFetch('/problems'),
  });
}

export function useProblemDetail(slug: string) {
  return useQuery<ProblemDetailResponse>({
    queryKey: ['problems', slug],
    queryFn: () => apiFetch(`/problems/${slug}`),
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
