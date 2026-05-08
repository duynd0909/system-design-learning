# Stackdify — System Design

> **Source of truth** for architecture, data models, API contracts, and core algorithms.
> Last updated: 2026-05-08 (reflects Sprints 1–5 complete, Sprint 6 in progress).

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Monorepo Structure](#2-monorepo-structure)
3. [Database Schema](#3-database-schema)
4. [API Contracts](#4-api-contracts)
5. [Core Algorithms](#5-core-algorithms)
6. [Shared Types Reference](#6-shared-types-reference)
7. [Rate Limiting & Security](#7-rate-limiting--security)

---

## 1. Architecture Overview

```
Browser
  │
  ▼
stackdify.space (Next.js 14, App Router)
  │  REST calls to api.stackdify.space
  ▼
api.stackdify.space (NestJS 11)
  ├── PostgreSQL 15  (primary data store)
  ├── Redis 7        (leaderboard cache, share tokens, sessions)
  └── Sentry         (error tracking, Sprint 5+)
```

### Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | Next.js | ^15.x / App Router |
| UI Library | React | ^19 |
| Backend | NestJS | ^11 |
| ORM | Prisma | ^7 |
| Database | PostgreSQL | 15 |
| Cache | Redis (ioredis) | 7 |
| Game Canvas | @xyflow/react | ^12 |
| Drag-and-Drop | @dnd-kit/core | ^6 |
| Animations | motion | ^12 |
| Server State | TanStack Query | v5 |
| Auth | next-auth | v4 |
| Styling | Tailwind CSS | v4 |
| Error Tracking | Sentry | ^10 |
| Monorepo | Turborepo | latest |

---

## 2. Monorepo Structure

```
stackdify/
├── apps/
│   ├── web/                    # Next.js 14 frontend (App Router)
│   └── api/                    # NestJS backend
├── packages/
│   ├── shared-types/           # TypeScript interfaces shared by FE & BE
│   └── game-engine/            # Pure TS: maskGraph() + scoreSubmission() + buildAccumulatedGraph()
├── infra/                      # (future) AWS CDK v2 stacks
├── docs/                       # Design documents
├── docker-compose.yml          # Local dev: PostgreSQL + Redis
├── docker-compose.prod.yml     # Production: all services on internal Docker network
├── turbo.json
└── CLAUDE.md
```

### Turborepo Commands

```bash
npm run dev          # Start all apps in parallel (web :3000 + api :3001)
npm run build        # Build all packages in dependency order
npm run typecheck    # tsc --noEmit across all packages
npm run lint         # ESLint across all packages
npm run test         # Jest across all packages
```

---

## 3. Database Schema

### Models

#### User

| Field | Type | Notes |
|-------|------|-------|
| `id` | String (cuid) | PK |
| `email` | String | Unique |
| `username` | String | Unique |
| `displayName` | String | |
| `avatarUrl` | String? | |
| `password` | String? | Null for OAuth-only accounts; bcrypt 12 rounds |
| `githubId` | String? | |
| `googleId` | String? | |
| `role` | Role | `USER` \| `CONTENT_EDITOR` \| `ADMIN` |
| `xp` | Int | Total XP earned |
| `level` | Int | Derived from XP thresholds |
| `streak` | Int | Consecutive active days |
| `lastActiveAt` | DateTime? | For streak tracking |
| `deactivatedAt` | DateTime? | Soft-delete |
| `createdAt` | DateTime | |
| `updatedAt` | DateTime | |

#### Problem

| Field | Type | Notes |
|-------|------|-------|
| `id` | String (cuid) | PK |
| `slug` | String | Unique; URL-safe identifier |
| `title` | String | |
| `description` | String | |
| `difficulty` | Difficulty | `EASY` \| `MEDIUM` \| `HARD` |
| `category` | String | e.g. "Social Media", "Video Streaming" |
| `isPublished` | Boolean | Default false; admin-toggled |
| `componentOptions` | String[] | Allowed component type slugs |
| `deletedAt` | DateTime? | Soft-delete |
| `createdAt` | DateTime | |
| `updatedAt` | DateTime | |

#### Requirement

| Field | Type | Notes |
|-------|------|-------|
| `id` | String (cuid) | PK |
| `problemId` | String | FK → Problem |
| `order` | Int | 1-based; defines unlock sequence |
| `title` | String | |
| `description` | String | |
| `nodes` | JSON | `GraphNode[]` for this step only |
| `edges` | JSON | `GraphEdge[]` for this step (may reference prior nodes) |
| `answer` | JSON | `Record<nodeId, componentTypeSlug>` — server-side only, never sent to client |
| `createdAt` | DateTime | |

#### Submission

| Field | Type | Notes |
|-------|------|-------|
| `id` | String (cuid) | PK |
| `userId` | String | FK → User |
| `problemId` | String | FK → Problem |
| `requirementOrder` | Int? | Which requirement (1-based) |
| `score` | Int | 0–100 |
| `passed` | Boolean | All slots correct |
| `xpEarned` | Int | XP awarded for this submission |
| `timeTakenMs` | Int | Client-reported duration |
| `slotAnswers` | JSON | `Record<nodeId, componentTypeSlug>` — what the user submitted |
| `slotResults` | JSON | `SlotResult[]` — per-slot correct/wrong breakdown |
| `createdAt` | DateTime | |

#### ComponentType

| Field | Type | Notes |
|-------|------|-------|
| `id` | String (cuid) | PK |
| `slug` | String | Unique |
| `label` | String | Display name |
| `description` | String | Tooltip content |
| `iconUrl` | String? | |
| `category` | String | Logical grouping |
| `createdAt` | DateTime | |

### Enums

```typescript
enum Difficulty { EASY, MEDIUM, HARD }
enum Role { USER, CONTENT_EDITOR, ADMIN }
```

### Seed Data

**12 ComponentTypes (seeded):**
CDN, DNS, Load Balancer, API Gateway, Application Server, Cache (Redis), Relational DB, NoSQL DB, Message Queue, Object Storage, Search Engine, Media Server

**Instagram (MEDIUM — 3 requirements):**

| Req | Title | New Nodes | Blank Slots |
|-----|-------|-----------|------------|
| 1 | Handle user traffic | User (actor), DNS, Load Balancer, App Server 1 | `dns-1`, `lb-1` |
| 2 | Serve and cache data | App Server 2, Cache (Redis), Primary DB | `app-2`, `cache-1`, `db-1` |
| 3 | Store and deliver media | CDN (static), CDN (media), Object Storage, Read Replica | `cdn-1`, `cdn-2`, `obj-1`, `db-2` |

**YouTube (HARD — 4 requirements):**

| Req | Title | New Nodes | Blank Slots |
|-----|-------|-----------|------------|
| 1 | Route viewer traffic | Viewer (actor), DNS, CDN, Load Balancer | `dns-1`, `cdn-1` |
| 2 | Serve API requests | API Gateway, App Server | `api-gw`, `app-1` |
| 3 | Handle uploads and transcoding | Creator (actor), Message Queue, Transcoder | `mq-1`, `media-1` |
| 4 | Store and cache data | Cache, Metadata DB, Video Storage | `cache-1`, `db-1`, `obj-1` |

---

## 4. API Contracts

Base URL: `https://api.stackdify.space/api/v1`

All protected routes require `Authorization: Bearer <jwt>`.

### Auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | none | Email/password signup |
| POST | `/auth/login` | none | Email/password signin → `{ token, user }` |
| GET | `/auth/github/callback` | OAuth | GitHub redirect handler |
| GET | `/auth/google/callback` | OAuth | Google redirect handler |

OAuth callback URLs to register:
- GitHub: `https://api.stackdify.space/api/v1/auth/github/callback`
- Google: `https://api.stackdify.space/api/v1/auth/google/callback`

### Users

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/users/me` | JWT | Current user profile |
| GET | `/users/me/stats` | JWT | `UserStats` (solved count, pass rate, category breakdown) |
| GET | `/users/:id` | optional | Public user profile (`PublicUserProfile`) |

### Problems

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/problems` | optional | List published problems; query: `page`, `limit`, `difficulty`, `category`, `solved` |
| GET | `/problems/:slug` | optional | `ProblemDetailResponse` (metadata + requirements list, no graph/answers) |
| GET | `/problems/:slug/requirements/:order` | optional | `RequirementGraphResponse` (accumulated masked graph) |
| GET | `/components` | none | `ComponentType[]` catalog |

**`GET /problems` query params:**

| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Default 1 |
| `limit` | number | Default 12, max 50 |
| `difficulty` | EASY \| MEDIUM \| HARD | Filter by difficulty |
| `category` | string | Filter by category slug |
| `solved` | boolean | Filter to problems the current user has/hasn't solved |

### Submissions

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/submissions` | JWT | Submit answers for a requirement |
| GET | `/submissions/me` | JWT | Paginated submission history |

**POST `/submissions` — Request:**
```typescript
interface SubmissionRequest {
  problemId: string;
  requirementOrder: number;        // 1-based requirement index
  slotAnswers: Record<string, string>;  // { nodeId: componentTypeSlug }
  timeTakenMs: number;
}
```

**POST `/submissions` — Response:**
```typescript
interface SubmissionResponse {
  id: string;
  score: number;                   // 0–100
  passed: boolean;
  xpEarned: number;
  requirementOrder: number;
  isLastRequirement: boolean;
  slotResults: SlotResult[];
  xpBreakdown?: XpBreakdown;       // { attempt, firstPass, streak }
  streakAfter?: number;
  explanation?: SlotExplanation[]; // canonical answers — only on explicit request
}
```

### Leaderboard

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/leaderboard` | none | Top users by XP; query: `limit` (default 50); Redis-cached 60s |

### Share Tokens

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/share` | JWT | Generate 7-day share token → `ShareTokenResponse` |
| GET | `/share/:token` | none | Reconstruct shared problem state |

### Admin

All admin routes require role `ADMIN`.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/stats` | Platform analytics (totals, graphs, per-problem pass rates) |
| GET | `/admin/problems` | Problem list with requirementCount, submissionCount, passRate |
| GET | `/admin/problems/:slug` | Full problem detail including nodes/edges/answers |
| POST | `/admin/problems` | Create new problem |
| PATCH | `/admin/problems/:slug` | Update problem metadata and requirements |
| GET | `/admin/users` | User list with roles |
| POST | `/admin/users/:id/role` | Update user role |

### Health

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | none | `{ status: "ok", db: "ok", redis: "ok", uptime: number }` |

---

## 5. Core Algorithms

### Graph Masking — `packages/game-engine/src/mask.ts`

Called server-side by the problems module. The result is what gets sent to the client — no blank slot answers are ever included.

```typescript
export function maskGraph(graph: ProblemGraph, seed?: string): MaskedGraph {
  const componentNodes = graph.nodes.filter(n => n.type === 'component');
  const blankCount = Math.floor(componentNodes.length / 2);
  const shuffled = seededShuffle(componentNodes, seed ?? crypto.randomUUID());
  const blankIds = new Set(shuffled.slice(0, blankCount).map(n => n.id));

  return {
    nodes: graph.nodes.map(n =>
      blankIds.has(n.id)
        ? { ...n, type: 'blank', data: { isBlank: true } }
        : n
    ),
    edges: graph.edges,
    // blankSlotIds intentionally NOT returned — server-side only
  };
}
```

Rule: ~50% of component nodes become blank slots. Actor nodes are never blanked.

### Requirement Accumulation — `packages/game-engine/src/accumulate.ts`

Builds the accumulated graph for a given requirement order. Requirements 1..N-1 are revealed; requirement N is masked.

```typescript
export function buildAccumulatedGraph(
  requirements: Requirement[],
  targetOrder: number
): { nodes: MaskedNode[]; edges: GraphEdge[] }
```

- Nodes from requirements 1..(targetOrder-1) → type `component` (revealed)
- Nodes from requirement targetOrder → masked (`blank` for component nodes)
- Edges from all requirements 1..targetOrder → included (may cross requirements)

### Scoring — `packages/game-engine/src/score.ts`

```typescript
export function scoreSubmission(
  submission: Record<string, string>,
  answer: Record<string, string>
): ScoringResult {
  const slots = Object.keys(answer);
  const slotResults = slots.map(id => ({
    slotId: id,
    correct: submission[id] === answer[id],
    submitted: submission[id] ?? null,
    expected: answer[id],
  }));
  const correctCount = slotResults.filter(r => r.correct).length;
  return {
    score: Math.round((correctCount / slots.length) * 100),
    passed: correctCount === slots.length,
    slotResults,
  };
}
```

Edge cases covered: empty submission, all correct, all wrong, partial match, unknown slot IDs.

### XP Calculation (submissions service)

| Event | XP |
|-------|-----|
| Attempt (any result) | +10 |
| First pass on this requirement | +50 |
| Streak bonus (passed + streak ≥ 3) | +25 |
| **Maximum per submission** | **85 XP** |

### Streak Logic

- Streak increments if user submits on consecutive UTC calendar days
- Streak resets to 1 if gap exceeds 1 calendar day
- `user.lastActiveAt` is updated in the same transaction as the submission

### Seeded Shuffle — `packages/game-engine/src/shuffle.ts`

Linear congruential generator (LCG) for deterministic, reproducible test scenarios.

```typescript
export function seededShuffle<T>(arr: T[], seed: string): T[]
```

---

## 6. Shared Types Reference

All interfaces live in `packages/shared-types/src/index.ts` (~458 lines). Never redefine locally.

### Node Types

```typescript
interface MaskedNode {
  id: string;
  type: 'component' | 'blank' | 'actor';
  position: { x: number; y: number };
  data: ComponentNodeData | BlankNodeData | ActorNodeData;
}

interface BlankNodeData {
  isBlank: true;
  // NO answer field — never expose expected component
}

interface ComponentNodeData {
  label: string;
  componentTypeSlug: string;
  category: string;
}

interface ActorNodeData {
  label: string;
  isActor: true;
}
```

### API Response Types

```typescript
interface ProblemDetailResponse {
  problem: Pick<Problem, 'id' | 'slug' | 'title' | 'difficulty' | 'description' | 'category'>;
  requirements: Array<Pick<Requirement, 'id' | 'order' | 'title' | 'description'>>;
  componentTypes: ComponentType[];
}

interface RequirementGraphResponse {
  requirement: Requirement & { totalCount: number };
  nodes: MaskedNode[];
  edges: GraphEdge[];
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface PublicUserProfile {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  xp: number;
  level: number;
  streak: number;
  solvedCount: number;
  categoryBreakdown: Record<string, number>;
}

interface UserStats {
  solvedCount: number;
  totalSubmissions: number;
  passRate: number;
  currentStreak: number;
  longestStreak: number;
  categoryBreakdown: Record<string, number>;
  recentActivity: UserActivity[];
}

interface UserActivity {
  date: string;   // YYYY-MM-DD
  count: number;  // submissions on that day
}

interface AdminStatsResponse {
  totalUsers: number;
  totalProblems: number;
  totalSubmissions: number;
  dailyActiveUsers: number;
  problemStats: Array<{
    slug: string;
    title: string;
    submissionCount: number;
    passRate: number;
  }>;
}

interface XpBreakdown {
  attempt: number;
  firstPass: number;
  streak: number;
  total: number;
}

interface ShareTokenResponse {
  token: string;
  url: string;
  expiresAt: string;
}
```

---

## 7. Rate Limiting & Security

### Application-level (NestJS `@nestjs/throttler`)

```typescript
// Global: 100 requests / 60s per IP
// Submission endpoint: 10 requests / 60s per user
@Throttle({ default: { limit: 10, ttl: 60000 } })
```

### Network-level (Nginx)

```nginx
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=30r/s;
limit_req_zone $binary_remote_addr zone=web_limit:10m rate=60r/s;
```

### Security Rules

| Rule | Enforcement |
|------|------------|
| `blankSlotIds` never sent to client | Server masks graph; answer key excluded from response |
| JWT stored in localStorage | 7-day expiry; HTTP-only alternative considered for v2 |
| OAuth account linking by email | Automatic merge if email matches existing account |
| Admin routes behind `AdminGuard` | Checks `user.role === 'ADMIN'` |
| CORS restricted to frontend origin | `CORS_ORIGIN=https://stackdify.space` |
| Password hashed with bcrypt | 12 rounds |
| `prisma migrate deploy` only in production | Never `migrate reset` on prod |
