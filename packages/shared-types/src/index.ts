// ─── Enums ───────────────────────────────────────────────────────────────────

export enum Difficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
}

export enum Role {
  USER = 'USER',
  CONTENT_EDITOR = 'CONTENT_EDITOR',
  ADMIN = 'ADMIN',
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

// ─── Problem Graph (kept for game-engine compatibility) ───────────────────────

export interface ProblemGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface MaskedGraph {
  nodes: MaskedNode[];
  edges: GraphEdge[];
}

// ─── Requirement ─────────────────────────────────────────────────────────────
// Each problem has 2–4 requirements that unlock sequentially.

export interface Requirement {
  id: string;
  order: number;       // 1-based
  title: string;
  description: string;
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
  deletedAt?: string | null;
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
  requirementCount: number;
  isSolved?: boolean;                    // only present when authenticated
  completedRequirementOrders?: number[]; // only present when authenticated
}

// ─── API Response: Problem Detail (replaces MaskedGraphResponse for GET /problems/:slug) ──

export interface ProblemDetailResponse {
  problem: Pick<Problem, 'id' | 'slug' | 'title' | 'difficulty' | 'description' | 'category'>;
  requirements: Requirement[];   // metadata only — no nodes/edges/answers
  componentTypes: ComponentType[];
  completedRequirementOrders: number[];  // orders of passed requirements; empty when unauthenticated
}

// ─── API Response: Requirement Graph (GET /problems/:slug/requirements/:order) ──

export interface RequirementGraphResponse {
  requirement: Requirement & { totalCount: number };
  nodes: MaskedNode[];   // accumulated: reqs 1..order-1 revealed + req `order` blanked
  edges: GraphEdge[];    // accumulated: all edges from reqs 1..order
}

// ─── Kept for backwards-compat (game canvas page currently uses this shape) ──
/** @deprecated Use ProblemDetailResponse + RequirementGraphResponse instead */
export interface MaskedGraphResponse {
  problem: Pick<Problem, 'id' | 'slug' | 'title' | 'difficulty'>;
  nodes: MaskedNode[];
  edges: GraphEdge[];
  componentTypes: ComponentType[];
}

// ─── Submission ───────────────────────────────────────────────────────────────

export interface SubmissionRequest {
  problemId: string;
  requirementOrder: number;   // which requirement is being submitted
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

export interface XpBreakdown {
  base: number;        // 50 on first pass, else 0
  attempt: number;     // always 10
  streakBonus: number; // 25 if passed && streak >= 3, else 0
  total: number;
}

export interface SubmissionResponse {
  id: string;
  score: number;
  passed: boolean;
  xpEarned: number;
  timeTakenMs: number;
  requirementOrder: number;
  isLastRequirement: boolean;
  slotResults: SlotResult[];
  explanation?: SlotExplanation[];
  xpBreakdown?: XpBreakdown;
  streakAfter?: number;
  createdAt: string;
}

export interface Submission {
  id: string;
  userId: string;
  problemId: string;
  requirementOrder?: number;
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
  requirementOrder?: number;
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
  role: Role;
  xp: number;
  level: number;
  streak: number;
  createdAt: string;
}

export interface UserStats {
  userId: string;
  totalSubmissions: number;
  passedSubmissions: number;
  solved: number;              // unique problems passed at least once
  averageScore: number;
  accuracy: number;            // passedSubmissions / totalSubmissions * 100
  totalXp: number;
  level: number;
  streak: number;
  categoryBreakdown: Record<string, { solved: number; total: number }>;
}

// ─── User Activity ────────────────────────────────────────────────────────────

export interface UserActivity {
  date: string;   // YYYY-MM-DD
  count: number;  // submissions on that day
}

// ─── Solution ────────────────────────────────────────────────────────────────

export interface SolutionNode {
  id: string;
  type: 'component' | 'actor';
  position: { x: number; y: number };
  data: ComponentNodeData | ActorNodeData;
  wasBlank: boolean;   // true if this node was a blank slot in the game
}

export interface SolutionResponse {
  nodes: SolutionNode[];
  edges: GraphEdge[];
  explanations: SlotExplanation[];
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

// ─── Share Token ─────────────────────────────────────────────────────────────

export interface ShareTokenResponse {
  token: string;
  url: string;         // full frontend URL e.g. http://localhost:3000/share/:token
  expiresIn: number;   // 604800 (7 days in seconds)
}

// ─── Public User Profile ──────────────────────────────────────────────────────

export interface PublicUserProfile {
  username: string;
  displayName: string;
  avatarUrl?: string;
  level: number;
  xp: number;
  streak: number;
  solvedCount: number;
  categoryBreakdown: Record<string, { solved: number; total: number }>;
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNextPage: boolean;
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export interface DailyCount {
  date: string;  // YYYY-MM-DD
  count: number;
}

export interface ProblemPassRate {
  slug: string;
  title: string;
  passRate: number;
  totalSubmissions: number;
}

export interface AdminStatsResponse {
  totals: {
    problems: number;
    publishedProblems: number;
    hiddenProblems: number;
    deletedProblems: number;
    requirements: number;
    users: number;
    submissions: number;
    passRate: number;
  };
  submissionsPerDay: DailyCount[];
  newUsersPerDay: DailyCount[];
  passRateByProblem: ProblemPassRate[];
  difficultyDistribution: Record<'EASY' | 'MEDIUM' | 'HARD', number>;
  recentSubmissions: Array<{
    id: string;
    score: number;
    passed: boolean;
    createdAt: string;
    user: { username: string; displayName: string };
    problem: { slug: string; title: string };
  }>;
  problemQuality: Array<{
    id: string;
    slug: string;
    title: string;
    isPublished: boolean;
    deletedAt: string | null;
    requirementCount: number;
    submissionCount: number;
    passRate: number;
  }>;
}

export interface AdminProblemListItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  category: string;
  isPublished: boolean;
  deletedAt: string | null;
  requirementCount: number;
  submissionCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminRequirementDetail {
  id: string;
  order: number;
  title: string;
  description: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  answer: Record<string, string>;
}

export interface AdminProblemDetail {
  problem: AdminProblemListItem;
  requirements: AdminRequirementDetail[];
}
