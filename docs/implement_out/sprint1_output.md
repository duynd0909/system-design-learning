# Sprint 1 — Foundation Implementation Output

**Date:** 2026-04-25
**Status:** Complete
**Branch target:** `sprint/1-foundation`

---

## What was built

### Root Monorepo

| File | Purpose |
|------|---------|
| `package.json` | Workspace root with Turborepo scripts (`dev`, `build`, `typecheck`, `lint`, `test`) |
| `turbo.json` | Turborepo pipeline — correct dependency ordering (`build` depends on `^build`) |
| `tsconfig.base.json` | Strict TypeScript base config shared by all packages |
| `.gitignore` | Covers node_modules, .next, .turbo, .env, coverage, dist |
| `docker-compose.yml` | PostgreSQL 15 + Redis 7 with health checks |

---

### `packages/shared-types`

All TypeScript interfaces used by both API and web. **Source of truth for all API contracts.**

Key exports:
- `Difficulty` enum (`EASY | MEDIUM | HARD`)
- `ComponentType`, `GraphNode`, `GraphEdge`, `ProblemGraph`, `MaskedGraph`
- `MaskedNode`, `ComponentNodeData`, `BlankNodeData`, `ActorNodeData`
- `MaskedGraphResponse` — the exact shape returned by `GET /problems/:slug`
- `SubmissionRequest`, `SubmissionResponse`, `SlotResult`, `SlotExplanation`
- `User`, `UserStats`, `AuthTokenResponse`, `RegisterRequest`, `LoginRequest`
- `LeaderboardEntry`, `ScoringResult`, `HealthResponse`, `ApiError`, `PaginatedResponse`

---

### `packages/game-engine`

Pure TypeScript, zero runtime dependencies. Jest coverage target: **>90%**.

| Module | Function | Description |
|--------|---------|-------------|
| `shuffle.ts` | `seededShuffle(arr, seed)` | Deterministic LCG shuffle — same seed = same order |
| `mask.ts` | `maskGraph(graph, seed?)` | Blanks floor(n/2) component nodes; never exposes answer in output |
| `score.ts` | `scoreSubmission(submission, answer)` | Returns score 0-100, passed boolean, and per-slot results |

**Tests written** (27 test cases total):
- `shuffle.test.ts` — determinism, immutability, all-elements preserved, edge cases
- `mask.test.ts` — blank count, actor preservation, blank data shape, no answer leak, determinism
- `score.test.ts` — all correct, all wrong, partial, empty submission, empty answer, extra keys, rounding

---

### `apps/api` — NestJS Backend

**Architecture:**

```
src/
├── main.ts              # Bootstrap: CORS, ValidationPipe, cookie-parser, global prefix /api/v1
├── app.module.ts        # Root module wiring all feature modules
├── prisma/              # PrismaService (global) + PrismaModule
├── auth/                # JWT + GitHub + Google OAuth
│   ├── auth.service.ts  # register(), login(), findOrCreateOAuthUser()
│   ├── auth.controller.ts
│   ├── dto/             # RegisterDto, LoginDto (class-validator)
│   └── strategies/      # JwtStrategy, GithubStrategy, GoogleStrategy
├── users/               # GET /users/me, /me/stats, /:id
├── problems/            # GET /problems, /problems/:slug (masked graph)
├── submissions/         # POST /submissions, GET /submissions/me
├── leaderboard/         # GET /leaderboard
├── components/          # GET /components (component type catalog)
├── health/              # GET /health (DB ping + uptime)
└── common/
    ├── guards/          # JwtAuthGuard
    ├── decorators/      # @CurrentUser()
    ├── interceptors/    # TransformInterceptor (wraps response in { data, timestamp })
    └── filters/         # HttpExceptionFilter
```

**Prisma Schema** (`prisma/schema.prisma`):
- `User` — email, username, displayName, githubId, googleId, xp, level, streak
- `ComponentType` — slug, label, description, category
- `Problem` — slug, title, difficulty, category, isPublished
- `ProblemGraph` — nodes, edges, **answer** (JSON, never sent to client)
- `Submission` — score, passed, xpEarned, timeTakenMs, slotAnswers, slotResults

**Seed data** (`prisma/seed.ts`):
- 12 ComponentTypes seeded (CDN, DNS, Load Balancer, API Gateway, App Server, Cache, Relational DB, NoSQL DB, Message Queue, Object Storage, Search Engine, Media Server)
- **Instagram** problem graph: 10 nodes (2×CDN, DNS, LB, 2×App Server, Cache, 2×Relational DB, Object Storage)
- **YouTube** problem graph: 11 nodes (CDN, DNS, LB, API Gateway, App Server, Media Server, Message Queue, Cache, Relational DB, Object Storage)

**Key security rules enforced:**
- Answer key (`ProblemGraph.answer`) is never sent to client — only used server-side in `scoreSubmission()`
- `maskGraph()` called fresh per request — blanks are random per session
- Rate limit: 10 submissions/min via `@nestjs/throttler`
- JWT via HTTP Bearer token; bcrypt 12 rounds for passwords

---

### `apps/web` — Next.js 14 Frontend

**Stack configured:**
- Next.js 14 App Router, TypeScript strict mode
- Tailwind CSS v3 with custom design tokens
- next-themes for light/dark mode
- TanStack Query v5 for data fetching
- @dnd-kit/core for drag-and-drop (Sprint 2)
- @xyflow/react for game canvas (Sprint 2)
- motion for animations (Sprint 3)

**Design System components** (`src/components/ui/`):

| Component | Description |
|-----------|-------------|
| `Button` | 4 variants (primary, secondary, ghost, danger), 3 sizes, loading spinner |
| `Badge` / `DifficultyBadge` | Color-coded by difficulty, XP, level |
| `Card` / `CardHeader` / `CardTitle` / `CardDescription` | Hover variant included |
| `Input` | Label, error state, accessible via htmlFor |
| `Modal` | Keyboard (Escape) dismissal, backdrop click, aria-modal |
| `Skeleton` / `SkeletonCard` | Loading placeholders |
| `ThemeToggle` | Sun/moon icon, mounted guard to prevent hydration mismatch |

**CSS Design Tokens** (both light and dark — `src/styles/globals.css`):
```
--bg-primary / --bg-secondary / --bg-game-canvas
--text-primary / --text-secondary
--accent-primary / --accent-game
--slot-blank / --slot-filled / --slot-correct / --slot-incorrect
```

**Pages:**

| Route | File | Notes |
|-------|------|-------|
| `/` | `(marketing)/page.tsx` | Hero, How it Works, Features, CTA — no Motion animations yet (Sprint 3) |
| `/login` | `(auth)/login/page.tsx` | Email+password + GitHub/Google OAuth links, client-side validation |
| `/register` | `(auth)/register/page.tsx` | All 4 fields, client-side validation, OAuth links |
| `/problems` | `problems/page.tsx` | List with skeletons + error state via `useProblems()` |
| `/leaderboard` | `leaderboard/page.tsx` | Medal ranks, XP display, loading skeletons |

**Lib utilities:**
- `lib/animations.ts` — shared Motion tokens (spring, fadeUp, scaleIn, STAGGER)
- `lib/utils.ts` — cn(), formatXP(), difficultyColor(), formatDuration()
- `lib/api.ts` — TanStack Query hooks: useProblems, useProblem, useSubmit, useLeaderboard, useMe, useMyStats

---

## How to run locally

```bash
# 1. Install dependencies
npm install

# 2. Start PostgreSQL + Redis
docker-compose up -d

# 3. Configure environment
cp apps/api/.env.example apps/api/.env.local
cp apps/web/.env.example apps/web/.env.local
# Fill in OAuth credentials

# 4. Run migrations + seed
cd apps/api
npx prisma migrate dev --name init
npx prisma db seed
cd ../..

# 5. Start dev servers
npm run dev
# web → http://localhost:3000
# api → http://localhost:3001/api/v1/health
```

---

## Definition of Done Checklist

| Item | Status |
|------|--------|
| Light mode implemented | ✅ (CSS custom properties) |
| Dark mode implemented | ✅ (`.dark` class via next-themes) |
| Loading states | ✅ (Skeleton components on all data pages) |
| Error states | ✅ (inline error messages on all data pages) |
| No TypeScript `any` without comment | ✅ |
| No `console.log` in code | ✅ (NestJS Logger used on backend) |
| No hardcoded secrets | ✅ (all from env vars) |
| Animations wrapped in `useReducedMotion()` | ✅ (no Motion animations in Sprint 1 — added in Sprint 3) |
| Types from `@stackdify/shared-types` | ✅ |
| `blankSlotIds` never sent to client | ✅ (`maskGraph()` strips answer; `MaskedGraph` type has no answer field) |

---

## What's NOT in Sprint 1 (deferred)

- Game canvas (`/problems/:slug`) — Sprint 2
- Drag-and-drop with @dnd-kit — Sprint 2
- Submission result page — Sprint 2
- Motion animations — Sprint 3
- Dashboard page — Sprint 4
- NextAuth session integration (full) — Sprint 2
- AWS CDK infrastructure — Sprint 5
- E2E tests (Playwright) — Sprint 5
