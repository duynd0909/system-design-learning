# Sprint 3 Implementation Log — Progressive Requirements

**Date:** 2026-04-26  
**Branch:** main  
**Status:** Complete

---

## Overview

Replaced the single-graph model with a tiered, sequential requirement system inspired by interviewready.io. Each problem now has 2–4 requirements that unlock one-by-one; completing a requirement reveals new nodes growing from the previous graph.

---

## Data Model Changes

### Removed: `ProblemGraph`
The `problem_graphs` table and `ProblemGraph` Prisma model were dropped. The `problem` → `graph` 1-to-1 relation is gone.

### Added: `Requirement`
```prisma
model Requirement {
  id          String   @id @default(cuid())
  problemId   String
  order       Int                          // 1-based sequential index
  title       String
  description String
  nodes       Json                         // GraphNode[] — only NEW nodes for this req
  edges       Json                         // GraphEdge[] — may reference prior-req nodes
  answer      Json                         // { nodeId: componentSlug } — blanks for THIS req only
  createdAt   DateTime @default(now())

  problem Problem @relation(fields: [problemId], references: [id], onDelete: Cascade)

  @@unique([problemId, order])
  @@index([problemId])
  @@map("requirements")
}
```

### Modified: `Submission`
Added `requirementOrder Int?` (nullable for legacy rows).

### Migration
Manual migration at `apps/api/prisma/migrations/20260426000000_add_requirements_drop_problem_graph/migration.sql` (generated via `prisma migrate diff`, applied via `prisma migrate deploy`).

---

## Shared Types (`packages/shared-types/src/index.ts`)

**Added:**
- `Requirement` — `{ id, order, title, description }`
- `ProblemDetailResponse` — `{ problem, requirements[], componentTypes[] }` (no graph data)
- `RequirementGraphResponse` — `{ requirement: Requirement & { totalCount }, nodes: MaskedNode[], edges: GraphEdge[] }`

**Updated:**
- `SubmissionRequest` — added `requirementOrder: number`
- `SubmissionResponse` — added `requirementOrder: number`, `isLastRequirement: boolean`
- `ProblemSummary` — added `requirementCount: number`

**Kept (deprecated):**
- `MaskedGraphResponse` — marked `@deprecated`, kept for reference

---

## Game Engine (`packages/game-engine/src/`)

### New: `accumulate.ts`

```typescript
export function buildAccumulatedGraph(
  requirements: Array<{ order: number; nodes: GraphNode[]; edges: GraphEdge[]; answer: Record<string, string> }>,
  targetOrder: number,
  seed?: string,
): { nodes: MaskedNode[]; edges: GraphEdge[] }
```

**Logic:**
- Requirements 1..(targetOrder-1): all nodes revealed as `component` or `actor` type
- Requirement `targetOrder`: nodes that appear in `answer` → `type: 'blank', data: { isBlank: true }`; others revealed
- All edges from requirements 1..targetOrder accumulated (deduped by id)

Exported from `index.ts` alongside existing `maskGraph`, `scoreSubmission`, `seededShuffle`.

---

## Backend API Changes

### `GET /api/v1/problems` (updated)
Now includes `requirementCount` via `_count: { select: { requirements: true } }`.  
`nodeCount` aggregates across all requirements.

### `GET /api/v1/problems/:slug` (changed shape)
Returns `ProblemDetailResponse` — requirements metadata only, no graph data.  
Previously returned `MaskedGraphResponse` with embedded nodes/edges.

### `GET /api/v1/problems/:slug/requirements/:order` (new)
Returns `RequirementGraphResponse` with accumulated nodes/edges for the given requirement.  
Calls `buildAccumulatedGraph()` from game-engine.

### `POST /api/v1/submissions` (updated)
Accepts `requirementOrder` in body. Scores against the specific requirement's `answer` key only.  
Returns `isLastRequirement` to let the frontend decide compact vs. full result UI.

---

## Seed Data

### Instagram (MEDIUM — 3 requirements)

| # | Title | Blanks |
|---|-------|--------|
| 1 | Handle user traffic | DNS, Load Balancer |
| 2 | Serve and cache data | App Server 2, Redis Cache, Primary DB |
| 3 | Store and deliver media | CDN (static), CDN (media), Object Storage, Read Replica |

### YouTube (HARD — 4 requirements)

| # | Title | Blanks |
|---|-------|--------|
| 1 | Route viewer traffic | DNS, CDN |
| 2 | Serve API requests | API Gateway, App Server |
| 3 | Handle uploads and transcoding | Message Queue, Transcoder |
| 4 | Store and cache data | Cache, Metadata DB, Video Storage |

---

## Frontend Changes

### `apps/web/src/lib/api.ts`
- `useProblem(slug)` → removed; replaced by `useProblemDetail(slug)` and `useRequirementGraph(slug, order)`
- `useSubmit` mutation now sends `requirementOrder` in the request body

### New: `RequirementsSidebar.tsx`
- Left sidebar (300px fixed)
- Problem title + difficulty badge + description (3-line clamp)
- Requirements list with three states: locked (lock icon, muted), active (accent border + pulse dot), completed (green checkmark, clickable for review)
- Animated progress bar at bottom

### `apps/web/src/app/problems/[slug]/page.tsx` (rewritten)
**Layout:** `flex h-screen` → `Navbar` on top, `RequirementsSidebar` (300px) + canvas column side by side.

**State machine:**
- `currentOrder: number` — starts at 1
- `completedOrders: Set<number>` — grows as requirements are passed
- On `result.passed && !isLastRequirement`: show `CompactResult` (inline banner at bottom of canvas) → "Next" button increments `currentOrder`
- On `result.passed && isLastRequirement`: show full `ResultOverlay` modal with confetti
- On `!result.passed` (any requirement): show full `ResultOverlay` with retry

**Compact result (`CompactResult` component):**
- Rendered inside the canvas section as an `absolute` bottom banner
- Shows score %, XP earned, requirement title
- "Next →" or "Retry" button

---

## Files Changed

| File | Change |
|------|--------|
| `apps/api/prisma/schema.prisma` | Add Requirement, remove ProblemGraph, add requirementOrder to Submission |
| `apps/api/prisma/migrations/20260426000000_*.sql` | Manual migration SQL |
| `apps/api/prisma/seed.ts` | Replace ProblemGraph seeds with Requirement seeds |
| `packages/shared-types/src/index.ts` | New types, updated SubmissionRequest/Response, ProblemSummary |
| `packages/game-engine/src/accumulate.ts` | New — buildAccumulatedGraph() |
| `packages/game-engine/src/index.ts` | Export buildAccumulatedGraph |
| `packages/game-engine/package.json` | Fix main/types to point to dist/ (was stale src/) |
| `apps/api/src/problems/problems.service.ts` | Rewrite for requirements-based queries |
| `apps/api/src/problems/problems.controller.ts` | Add GET /:slug/requirements/:order |
| `apps/api/src/submissions/dto/create-submission.dto.ts` | Add requirementOrder |
| `apps/api/src/submissions/submissions.service.ts` | Score against requirement answer, return isLastRequirement |
| `apps/web/src/lib/api.ts` | Add useProblemDetail, useRequirementGraph; remove useProblem |
| `apps/web/src/components/game/RequirementsSidebar.tsx` | New component |
| `apps/web/src/app/problems/[slug]/page.tsx` | New layout + progressive state machine |
| `CLAUDE.md` | Update sprint status, schema docs, API contracts, shared-types list |
