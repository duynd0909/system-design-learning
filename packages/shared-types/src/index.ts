// ─── Enums ───────────────────────────────────────────────────────────────────

export enum Difficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
}

// ─── Component Types ─────────────────────────────────────────────────────────

export interface ComponentType {
  id: string;
  slug: string;
  label: string;
  description: string;
  iconUrl?: string;
  category: string;
}

// ─── Graph Node Data ──────────────────────────────────────────────────────────

export interface ComponentNodeData {
  componentSlug: string;
  label: string;
  iconUrl?: string;
  description?: string;
}

export interface BlankNodeData {
  isBlank: true;
}

export interface ActorNodeData {
  label: string;
  iconUrl?: string;
}

export type NodeData = ComponentNodeData | BlankNodeData | ActorNodeData;

export type NodeType = 'component' | 'blank' | 'actor';

// ─── Graph Node & Edge ────────────────────────────────────────────────────────

export interface GraphNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  data: NodeData;
}

export interface MaskedNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  data: ComponentNodeData | BlankNodeData | ActorNodeData;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  animated?: boolean;
  type?: string;
}

// ─── Problem Graph ────────────────────────────────────────────────────────────

export interface ProblemGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface MaskedGraph {
  nodes: MaskedNode[];
  edges: GraphEdge[];
}

// ─── Problem ──────────────────────────────────────────────────────────────────

export interface Problem {
  id: string;
  slug: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  category: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProblemSummary {
  id: string;
  slug: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  category: string;
  nodeCount: number;
}

// ─── API Response: Masked Graph ───────────────────────────────────────────────

export interface MaskedGraphResponse {
  problem: Pick<Problem, 'id' | 'slug' | 'title' | 'difficulty'>;
  nodes: MaskedNode[];
  edges: GraphEdge[];
  componentTypes: ComponentType[];
}

// ─── Submission ───────────────────────────────────────────────────────────────

export interface SubmissionRequest {
  problemId: string;
  slotAnswers: Record<string, string>;
  timeTakenMs: number;
}

export interface SlotResult {
  slotId: string;
  correct: boolean;
  submitted: string | null;
  expected: string;
}

export interface SlotExplanation {
  slotId: string;
  componentSlug: string;
  label: string;
  explanation: string;
}

export interface SubmissionResponse {
  id: string;
  score: number;
  passed: boolean;
  xpEarned: number;
  timeTakenMs: number;
  slotResults: SlotResult[];
  explanation?: SlotExplanation[];
  createdAt: string;
}

export interface Submission {
  id: string;
  userId: string;
  problemId: string;
  score: number;
  passed: boolean;
  xpEarned: number;
  timeTakenMs: number;
  slotAnswers: Record<string, string>;
  createdAt: string;
}

export interface SubmissionHistoryItem {
  id: string;
  problemId: string;
  score: number;
  passed: boolean;
  xpEarned: number;
  timeTakenMs: number;
  createdAt: string;
  problem: Pick<Problem, 'slug' | 'title' | 'difficulty'>;
}

// ─── User & Auth ──────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  xp: number;
  level: number;
  createdAt: string;
}

export interface UserStats {
  userId: string;
  totalSubmissions: number;
  passedSubmissions: number;
  averageScore: number;
  totalXp: number;
  level: number;
  streak: number;
}

export interface AuthTokenResponse {
  accessToken: string;
  user: User;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  displayName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

// ─── Leaderboard ──────────────────────────────────────────────────────────────

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  xp: number;
  level: number;
  passedCount: number;
}

// ─── Scoring ──────────────────────────────────────────────────────────────────

export interface ScoringResult {
  score: number;
  passed: boolean;
  slotResults: SlotResult[];
}

// ─── Health ───────────────────────────────────────────────────────────────────

export interface HealthResponse {
  status: 'ok' | 'error';
  db: 'ok' | 'error';
  redis: 'ok' | 'error';
  uptime: number;
}

// ─── API Error ────────────────────────────────────────────────────────────────

export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNextPage: boolean;
}
