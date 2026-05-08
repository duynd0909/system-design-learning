# Stackdify — Sprint Plan

> **Source of truth** for sprint history, scope, and acceptance criteria.
> Last updated: 2026-05-08 (Sprints 1–5 complete, Sprint 6 in progress).

---

## Sprint Status Overview

| Sprint | Name | Status | Branch |
|--------|------|--------|--------|
| 1 | Foundation & Auth | ✅ Complete | `sprint/1-foundation` |
| 2 | Core Game Loop | ✅ Complete | `sprint/2-game-loop` |
| 3 | Progressive Requirements | ✅ Complete | `main` |
| 4 | Social & Discovery | ✅ Complete | merged to `main` |
| 5 | Scale & Quality | ✅ Complete | merged to `main` |
| 6 | Admin Studio & Governance | 🟡 In Progress | `dev` |

---

## Sprint 1 — Foundation & Auth ✅

**Goal:** Runnable monorepo with auth, DB, and design system bootstrapped.

### Deliverables

- Turborepo monorepo setup (`apps/web`, `apps/api`, `packages/shared-types`, `packages/game-engine`)
- PostgreSQL 15 + Redis 7 via `docker-compose.yml`
- Prisma schema: `User`, `Problem`, `Requirement`, `Submission`, `ComponentType`
- NestJS bootstrap: `ValidationPipe`, CORS, `/api/v1` prefix, `HttpExceptionFilter`, `TransformInterceptor`
- Auth: JWT (7-day), bcrypt 12 rounds, GitHub OAuth, Google OAuth
- `@CurrentUser()` decorator, `JwtAuthGuard`, `OptionalJwtAuthGuard`
- Seed: 12 ComponentTypes, Instagram problem (MEDIUM), YouTube problem (HARD)
- Design system: CSS custom properties (light/dark), Tailwind v4 config, font loading (Clash Display, Plus Jakarta Sans, JetBrains Mono)
- Next.js App Router: `(marketing)` landing, `(auth)` login/register, `providers/`
- `GET /health` endpoint

### Acceptance Criteria

- [x] `docker-compose up -d` → PostgreSQL + Redis healthy
- [x] `npx prisma migrate dev` runs without errors
- [x] `GET /api/v1/health` returns `{ status: "ok", db: "ok", redis: "ok" }`
- [x] `POST /auth/register` → creates user, returns JWT
- [x] `POST /auth/login` → returns JWT
- [x] GitHub OAuth callback registers/links user
- [x] Landing page renders in light and dark mode
- [x] `npm run typecheck && npm run lint` pass

---

## Sprint 2 — Core Game Loop ✅

**Goal:** Playable single-requirement game from problem selection to scored result.

### Deliverables

- `GET /problems` — paginated list, with `nodeCount`, `requirementCount`
- `GET /problems/:slug` — `ProblemDetailResponse` (no graph/answers)
- `GET /problems/:slug/requirements/:order` — `RequirementGraphResponse` (masked graph)
- `POST /submissions` — scoring, XP award, response with `slotResults`
- `packages/game-engine`: `maskGraph()`, `scoreSubmission()`, `seededShuffle()`, Jest tests (>90% coverage)
- Frontend: React Flow canvas, custom node types (`ComponentNode`, `BlankSlotNode`, `ActorNode`)
- Frontend: `@dnd-kit/core` drag-and-drop from `ComponentPalette` to `BlankSlotNode`
- Frontend: `ResultOverlay` modal (score ring, slot breakdown)
- Frontend: confetti (`canvas-confetti`) on 100% score
- Frontend: TanStack Query hooks (`useProblemDetail`, `useRequirementGraph`, `useSubmit`)
- Rate limit submissions: 10/min per user via `@nestjs/throttler`

### Acceptance Criteria

- [x] Blank slots show orange dashed border with pulse animation
- [x] Dragging palette chip onto slot fills it; remove button on hover
- [x] Submit sends `slotAnswers` to API, receives scored result
- [x] `ResultOverlay` shows correct/incorrect per slot with color coding
- [x] Confetti fires on 100% score
- [x] Game canvas works without HTML5 native drag-and-drop events
- [x] `scoreSubmission()` tested: empty, all-correct, all-wrong, partial, unknown IDs
- [x] Light and dark mode on all game components

---

## Sprint 3 — Progressive Requirements ✅

**Goal:** Multi-step requirement progression (Instagram 3 reqs, YouTube 4 reqs).

### Deliverables

- `packages/game-engine`: `buildAccumulatedGraph()` — accumulates nodes/edges across requirements
- `RequirementsSidebar` — shows all requirements; locks/unlocks as user progresses
- Sequential requirement unlock: completing req N unlocks req N+1
- `CompactResult` inline banner for non-final requirement pass (vs full `ResultOverlay`)
- `isLastRequirement` flag in `SubmissionResponse`
- `completedRequirementOrders` in problem list response (for solved state display)
- Persistent progress: solved requirements survive page refresh via submission history query

### Acceptance Criteria

- [x] Requirements sidebar shows correct lock/unlock state
- [x] Passing a non-final requirement shows compact banner, advances to next requirement
- [x] Final requirement pass shows full `ResultOverlay` with problem completion state
- [x] Failing any requirement shows `ResultOverlay` with retry option (stays on same requirement)
- [x] Problem list shows "Solved" badge when all requirements completed
- [x] Accumulated graph for req 2 shows req 1 nodes revealed + req 2 nodes masked
- [x] `buildAccumulatedGraph()` tested with multi-requirement scenarios

---

## Sprint 4 — Social & Discovery ✅

**Goal:** Leaderboard, user profiles, sharing, streaks, and improved problem discovery.

### Deliverables

**Backend:**
- Redis sorted-set leaderboard cache (60s TTL); `syncUserScore()` called on every submission
- XP mechanics: +10 attempt, +50 first pass per requirement, +25 streak bonus (streak ≥ 3)
- Streak tracking: increment/reset `user.streak` + `user.lastActiveAt` in submission transaction
- Share tokens: `POST /share` → Redis key (7-day TTL); `GET /share/:token` → reconstructed state
- `GET /users/:id` — public user profile (`PublicUserProfile`)
- `GET /users/me/stats` — `UserStats` with activity history
- `?solved=true/false` filter on `GET /problems`
- New shared types: `XpBreakdown`, `ShareTokenResponse`, `PublicUserProfile`; `User.streak`; `SubmissionResponse.xpBreakdown`, `SubmissionResponse.streakAfter`

**Frontend:**
- `XpCounter` + `StreakBadge` components
- Animated XP increment + streak update in `ResultOverlay`
- fuse.js fuzzy search + solved/unsolved filter on problems page
- Share button in `GameHeader` + `ResultOverlay` (copies `/share/:token` URL to clipboard)
- `/profile/[username]` public profile page with activity heatmap + category chart
- `SocialProofSection` on landing page (top 5 leaderboard entries)
- `/leaderboard` page (top 50, Redis-cached)

### Acceptance Criteria

- [x] Leaderboard updates within 60s of submission
- [x] XP breakdown shown in result overlay (attempt + first-pass + streak)
- [x] Streak increments on next-day submission; resets after gap
- [x] Share button generates URL; visiting URL reconstructs problem state
- [x] Public profile shows solved count, category breakdown, activity heatmap
- [x] Fuzzy search returns relevant results with < 100ms response time (client-side)
- [x] Solved filter correctly shows/hides problems based on submission history

---

## Sprint 5 — Scale & Quality ✅

**Goal:** Production-grade error tracking, admin tools, and observability.

### Deliverables

**Backend:**
- Sentry error tracking integration (`@sentry/node`) with 5% traces sample rate in production
- Admin module: `GET /admin/stats`, `GET /admin/problems`, `GET /admin/problems/:slug`, `GET /admin/users`, `POST /admin/users/:id/role`
- `AdminGuard` checking `user.role === 'ADMIN'`
- `ADMIN_EMAILS` env var — users with these emails auto-assigned ADMIN role on register/login
- `POST /admin/problems` + `PATCH /admin/problems/:slug` for problem CRUD
- `PaginatedResponse<T>` wrapper for all list endpoints

**Frontend:**
- Sentry SDK (`@sentry/nextjs`) in `instrumentation.ts`
- Admin dashboard pages: stats, problem list, problem editor, user management
- `RequirementBuilder` component — visual node/edge/answer editor
- Error boundary pages (`error.tsx`) on game canvas route
- `loading.tsx` skeleton for game canvas initial load
- Admin-only Navbar link (role-gated)

**Infrastructure:**
- Docker Compose production config (`docker-compose.prod.yml`)
- Multi-stage Dockerfiles for API and web
- GitHub Actions: build + push to GHCR, deploy via SSH on tag push (`v*`)
- Nginx reverse proxy config (Cloudflare Tunnel variant)
- PostgreSQL automated backup script (14-day retention)
- Uptime Kuma + Netdata monitoring stack

### Acceptance Criteria

- [x] Sentry captures unhandled exceptions in both API and web
- [x] `/admin` renders stats dashboard for ADMIN role; 403 for others
- [x] Problem CRUD creates/edits/deletes problems with requirements
- [x] `docker-compose.prod.yml up` starts all 4 services (db, redis, api, web) healthy
- [x] GitHub Actions deploy workflow succeeds on `v*` tag push
- [x] `GET /api/v1/health` returns healthy from inside Docker network
- [x] Backup script creates `.sql.gz` in `/srv/stackdify/backups/`

---

## Sprint 6 — Admin Studio & Governance 🟡 In Progress

**Goal:** Full visual problem-builder UI, role management, and content governance workflow.

### Deliverables — Status

#### ✅ Implemented

**Backend:**
- Publish/hide toggle: `PATCH /admin/problems/:slug/publish` + `/hide` + `/restore`
- Role assignment: `PATCH /admin/users/:id/role`, `PATCH /admin/users/:id/deactivate/activate`
- Full problem CRUD with requirements: `POST /admin/problems`, `PATCH /admin/problems/:slug`
- `CONTENT_EDITOR` value exists in `Role` enum (Prisma schema + shared-types)

**Frontend:**
- `RequirementBuilder` — visual React Flow canvas: drag-to-position nodes, draw edges, mark answer slots, toggle preview mode
- Publish/hide/delete actions in `ProblemRowActions` (problem list)
- Role assignment dropdown + activate/deactivate in `UserRowActions` (user management table)
- Admin dashboard: KPI cards, 30-day charts, pass rates per problem, recent activity
- Problem list with tabs: All / Published / Hidden / Deleted
- Problem editor with two tabs: Metadata form + RequirementBuilder

#### ❌ Not Yet Implemented

**Backend:**
- `CONTENT_EDITOR` guard — no separate routes scoped to editor role; currently all admin routes require `ADMIN`
- Draft/review/published state machine — `Problem` only has `isPublished: Boolean`; no `status: DRAFT | REVIEW | PUBLISHED`
- Problem version history — no `ProblemVersion` table, no migration, no `GET /admin/problems/:slug/history` endpoint
- Audit fields on Problem — no `createdBy`, `publishedBy`, `reviewedBy`

**Frontend:**
- Separate content editor dashboard (own problems only) — current `/admin` dashboard is ADMIN-only; CONTENT_EDITOR is blocked at layout level
- Approval workflow UI — no review/reject flow for admins to action editor submissions
- Full game preview mode — builder has a preview toggle (read-only React Flow), but not an actual playable game session

**Shared Types:**
- `PublishStatus` enum (`DRAFT | REVIEW | PUBLISHED`)
- `ProblemVersion`, `RequirementHistory` interfaces
- Approval-related types (reviewer info, review status)

### Acceptance Criteria

- [x] Publish/unpublish toggle works in admin problem list
- [x] Role assignment works in admin user management table
- [x] RequirementBuilder renders a live React Flow preview as nodes are added
- [x] Problem CRUD (create, edit, delete) works end-to-end
- [ ] Content editor can create and save **draft** problems (requires state machine)
- [ ] Admin can review and publish/reject editor-created problems (requires approval workflow)
- [ ] `GET /admin/problems/:slug/history` returns requirement change log
- [ ] CONTENT_EDITOR role can access `/admin` dashboard showing own problems only
- [ ] Role changes take effect on next API request (JWT re-validation)

---

## Definition of Done (All Sprints)

Before marking any task complete:

- [ ] Feature works in **light mode**
- [ ] Feature works in **dark mode**
- [ ] Feature works at **768px+ width** (tablet)
- [ ] **Loading state** implemented (skeleton or spinner)
- [ ] **Error state** implemented (toast or inline error message)
- [ ] No **TypeScript errors** (`npm run typecheck` passes)
- [ ] No **lint errors** (`npm run lint` passes)
- [ ] No **`console.log`** left in code
- [ ] No **hardcoded secrets or URLs**
- [ ] Animations wrapped in **`useReducedMotion()`** check
- [ ] Types imported from **`@stackdify/shared-types`** (not redefined locally)

---

## Future Sprints (Backlog)

| Sprint | Theme | Key Ideas |
|--------|-------|-----------|
| 7 | More Problems | Add 6 more problems from backlog (Twitter, Netflix, Uber, Airbnb, Discord, Stripe) |
| 8 | Competitive Mode | Time-limited challenges, head-to-head via WebSockets |
| 9 | Mobile App | React Native client using the same API |
| 10 | AI Hints | GPT-4o powered contextual hints for stuck users |
