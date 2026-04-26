# CLAUDE.md — Stackdify

> This file is the single source of truth for all AI agents working on this codebase.
> Read it fully before touching any file. Re-read the relevant section before each task.

---

## 1. Project Identity

**What this is:** A gamified system design practice platform for software engineers.
The core loop: select a real-world system (Instagram, YouTube, TikTok…) → see an architecture graph with ~50% of component nodes blanked out → drag-and-drop component chips to fill the slots → submit → get a scored, humorous, educational result.

**App name:** Stackdify — domain: stackdify.space

**Docs to read first (in `/docs/`):**
- `01_system_design.docx` — architecture, DB schema, API contracts, scoring algorithm
- `02_uiux_design.docx` — full design system, animation specs, page-by-page layout
- `03_sprint_plan.docx` — sprint breakdown, acceptance criteria per sprint
- `04_deployment_plan.docx` — AWS CDK infra, CI/CD, env vars, deployment playbook

---

## 2. Monorepo Structure

```
stackdify/
├── apps/
│   ├── web/              # Next.js 14 frontend (App Router)
│   └── api/              # NestJS backend
├── packages/
│   ├── shared-types/     # TypeScript interfaces shared by FE & BE  ← READ THIS FIRST
│   └── game-engine/      # Pure TS: maskGraph() + scoreSubmission()
├── infra/                # AWS CDK v2 stacks
├── docs/                 # The 4 design documents
├── docker-compose.yml    # Local dev: PostgreSQL + Redis
├── turbo.json
└── CLAUDE.md             # ← You are here
```

**Turborepo commands:**
```bash
npm run dev          # Start all apps in parallel (web + api)
npm run build        # Build all packages in dependency order
npm run typecheck    # tsc --noEmit across all packages
npm run lint         # ESLint across all packages
npm run test         # Jest across all packages
```

---

## 3. Critical Rules — Read Before Every Task

### 3.1 Never Do These

- ❌ **Never send `blankSlotIds` or canonical answers to the client.** The API masks graphs server-side; the answer key is never in the HTTP response until post-submission explanation.
- ❌ **Never use `any` TypeScript type** without an explicit `// eslint-disable-next-line @typescript-eslint/no-explicit-any` comment explaining why.
- ❌ **Never hardcode secrets, URLs, or config values.** Everything goes in `.env.local` (dev) or AWS Secrets Manager (prod). See section 8.
- ❌ **Never use `console.log` in production code.** Use NestJS `Logger` on the backend, and nothing on the frontend (errors go to Sentry in Sprint 5).
- ❌ **Never use HTML5 native drag-and-drop** in the game canvas. It conflicts with React Flow's pan gesture. Use `@dnd-kit/core` exclusively.
- ❌ **Never run `prisma migrate reset` on production.** Only `prisma migrate deploy`.
- ❌ **Never import from `apps/api` in `apps/web` or vice versa.** Cross-app imports go through `packages/shared-types` only.

### 3.2 Always Do These

- ✅ **Always import shared types from `@stackdify/shared-types`** — never redefine interfaces locally.
- ✅ **Always implement both light and dark mode** for every UI component. Use CSS custom properties (`var(--bg-primary)` etc.) defined in `globals.css`.
- ✅ **Always wrap Motion animations** in `useReducedMotion()` check. Skip decorative animations for accessibility.
- ✅ **Always handle loading and error states.** No component fetches data without a skeleton and an error boundary.
- ✅ **Always run `npm run typecheck && npm run lint` before marking any task complete.**
- ✅ **Always check the current sprint** (see section 7) and only implement features scoped to that sprint.

---

## 4. Frontend — `apps/web`

### Stack
| Tool | Version | Purpose |
|------|---------|---------|
| Next.js | 14+ | App Router, SSR/SSG, API routes for auth |
| React | 18 | UI |
| @xyflow/react | latest | Game canvas node-edge graph |
| @dnd-kit/core | latest | Drag-and-drop for component palette |
| motion | latest | All animations (replaces framer-motion) |
| TanStack Query | v5 | Server state, caching, loading/error states |
| next-themes | latest | Light/dark mode |
| NextAuth.js | v5 | Auth (GitHub + Google OAuth) |
| Tailwind CSS | v3 | Styling |
| canvas-confetti | latest | Confetti on 100% score |
| Zod | latest | Form + API response validation |

### App Router Layout
```
apps/web/src/
├── app/
│   ├── (marketing)/         # Landing, about — no auth required
│   │   └── page.tsx
│   ├── (auth)/              # Login, register
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── problems/
│   │   ├── page.tsx         # Problem list
│   │   └── [slug]/
│   │       ├── page.tsx     # Game canvas — PRIMARY FEATURE
│   │       └── result/page.tsx
│   ├── dashboard/page.tsx
│   ├── leaderboard/page.tsx
│   └── api/                 # Next.js route handlers (NextAuth, proxy)
├── components/
│   ├── ui/                  # Base design system (Button, Badge, Card, Modal…)
│   ├── game/                # Game-specific (GameCanvas, BlankSlotNode, ComponentPalette…)
│   ├── layout/              # Navbar, Footer, Sidebar
│   └── providers/           # QueryProvider, ThemeProvider, AuthProvider
├── lib/
│   ├── animations.ts        # Shared Motion animation tokens ← USE THESE, don't inline
│   ├── api.ts               # TanStack Query hooks (useProblems, useSubmit…)
│   └── utils.ts             # cn(), formatXP(), etc.
└── styles/
    └── globals.css          # CSS custom properties for theming
```

### Design Tokens (Tailwind + CSS Variables)

**All colors must use these tokens — never hardcode hex values in components:**

```css
/* globals.css — light mode defaults */
:root {
  --bg-primary: #FFFFFF;
  --bg-secondary: #F8F7FF;
  --bg-game-canvas: #F1F0FF;
  --text-primary: #1E1B4B;
  --text-secondary: #6D28D9;
  --accent-primary: #4F46E5;
  --accent-game: #F59E0B;
  --slot-blank: #F97316;
  --slot-filled: #FFFFFF;
  --slot-correct: #10B981;
  --slot-incorrect: #EF4444;
}

.dark {
  --bg-primary: #0F0D1A;
  --bg-secondary: #1A1730;
  --bg-game-canvas: #131025;
  --text-primary: #EDE9FE;
  --text-secondary: #A78BFA;
  --accent-primary: #818CF8;
  --accent-game: #FCD34D;
  --slot-blank: #FB923C;
  --slot-filled: #2D2650;
  --slot-correct: #34D399;
  --slot-incorrect: #F87171;
}
```

### Shared Animation Tokens

**Import from `@/lib/animations.ts` — never define animation configs inline:**

```typescript
// lib/animations.ts
export const spring = { type: "spring", stiffness: 300, damping: 24 };
export const springBouncy = { type: "spring", stiffness: 400, damping: 17 };
export const fadeUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };
export const fadeIn = { initial: { opacity: 0 }, animate: { opacity: 1 } };
export const scaleIn = { initial: { scale: 0.9, opacity: 0 }, animate: { scale: 1, opacity: 1 } };
export const STAGGER = { staggerChildren: 0.08, delayChildren: 0.1 };
```

### Typography

| Role | Font | Tailwind class |
|------|------|---------------|
| Display | Clash Display | `font-display` |
| Body | Plus Jakarta Sans | `font-body` |
| Mono | JetBrains Mono | `font-mono` |

Load via `next/font` in `apps/web/src/app/layout.tsx`. Self-host Clash Display woff2 in `public/fonts/`.

### Game Canvas — React Flow

**Custom node types (register in `nodeTypes` prop — never inline):**

| Type | File | Description |
|------|------|-------------|
| `componentNode` | `components/game/ComponentNode.tsx` | Visible component with icon + hover tooltip |
| `blankSlotNode` | `components/game/BlankSlotNode.tsx` | Orange dashed droppable slot with pulse animation |
| `filledSlotNode` | `components/game/FilledSlotNode.tsx` | White slot after component placement |
| `actorNode` | `components/game/ActorNode.tsx` | User/client actor (non-interactive) |

**Custom edge types:**

| Type | File | Description |
|------|------|-------------|
| `labelEdge` | `components/game/LabelEdge.tsx` | Animated bezier with optional text label |

**Canvas config:**
```typescript
<ReactFlow
  nodeTypes={nodeTypes}        // Always memoize with useMemo
  edgeTypes={edgeTypes}        // Always memoize with useMemo
  fitView
  fitViewOptions={{ padding: 0.2 }}
  minZoom={0.5}
  maxZoom={1.5}
  panOnDrag={true}
  zoomOnScroll={true}
  nodesDraggable={false}       // Nodes are fixed; only palette chips are draggable
>
  <Background variant="dots" />
  <Controls />
  {showMinimap && <MiniMap />} {/* Only for graphs with > 8 nodes */}
</ReactFlow>
```

**BlankSlotNode states:**
1. **Empty** — orange dashed border, `animate-slot-pulse`, "Drop here" label
2. **Drag over** — solid border, `scale-105`, glow shadow
3. **Filled** — white bg, component icon, remove button on hover

---

## 5. Backend — `apps/api`

### Stack
| Tool | Version | Purpose |
|------|---------|---------|
| NestJS | 10+ | Framework |
| Prisma | 5+ | ORM, migrations |
| PostgreSQL | 15 | Primary DB |
| Redis (ioredis) | latest | Cache, sessions, leaderboard |
| passport-jwt | latest | JWT auth strategy |
| passport-github2 | latest | GitHub OAuth |
| passport-google-oauth20 | latest | Google OAuth |
| @nestjs/throttler | latest | Rate limiting |
| class-validator | latest | DTO validation |
| class-transformer | latest | DTO transformation |

### Module Structure
```
apps/api/src/
├── app.module.ts
├── main.ts               # Bootstrap, CORS, ValidationPipe, shutdown hooks
├── auth/                 # JWT + OAuth strategies, guards
├── users/                # UsersModule, UsersService
├── problems/             # ProblemsModule — GET /problems, GET /problems/:slug
├── submissions/          # SubmissionsModule — POST /submissions, GET /submissions/me
├── leaderboard/          # LeaderboardModule — Redis sorted set
├── components/           # ComponentTypesModule — GET /components
├── health/               # HealthModule — GET /health
└── common/
    ├── guards/           # JwtAuthGuard, RolesGuard
    ├── interceptors/     # LoggingInterceptor, TransformInterceptor
    └── filters/          # HttpExceptionFilter
```

### Auth Flow

All protected routes use `@UseGuards(JwtAuthGuard)`. The JWT is issued by NestJS on login and stored as HTTP-only cookie by NextAuth on the frontend.

```typescript
// Attaching user to request — always use this pattern:
@Get('me')
@UseGuards(JwtAuthGuard)
getMe(@CurrentUser() user: User) {  // @CurrentUser() custom decorator
  return this.usersService.findById(user.id);
}
```

### Critical API Contracts

**GET /api/v1/problems/:slug — Problem detail (metadata only, no graph):**
```typescript
// From @stackdify/shared-types
interface ProblemDetailResponse {
  problem: Pick<Problem, 'id' | 'slug' | 'title' | 'difficulty' | 'description' | 'category'>;
  requirements: Requirement[];   // metadata only — no nodes/edges/answers
  componentTypes: ComponentType[];
}
```

**GET /api/v1/problems/:slug/requirements/:order — Accumulated graph for one requirement:**
```typescript
interface RequirementGraphResponse {
  requirement: Requirement & { totalCount: number };
  nodes: MaskedNode[];   // accumulated: reqs 1..order-1 revealed + req `order` blanked
  edges: GraphEdge[];    // accumulated: all edges from reqs 1..order
}

// BlankSlotNode in the response:
interface MaskedNode {
  id: string;
  type: 'component' | 'blank' | 'actor';  // 'blank' = empty slot
  position: { x: number; y: number };
  data: ComponentNodeData | BlankNodeData | ActorNodeData;
}

interface BlankNodeData {
  isBlank: true;
  // NO answer field here — never expose the expected component
}
```

**POST /api/v1/submissions — Request/Response:**
```typescript
interface SubmissionRequest {
  problemId: string;
  requirementOrder: number;   // which requirement is being submitted (1-based)
  slotAnswers: Record<string, string>;  // { nodeId: componentTypeSlug }
  timeTakenMs: number;
}

interface SubmissionResponse {
  id: string;
  score: number;            // 0–100
  passed: boolean;
  xpEarned: number;
  requirementOrder: number;
  isLastRequirement: boolean;
  slotResults: SlotResult[];
  // Canonical answers only included if explanation is requested:
  explanation?: SlotExplanation[];
}
```

### Graph Masking — Core Algorithm

Located in `packages/game-engine/src/mask.ts`:

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

### Scoring Algorithm

Located in `packages/game-engine/src/score.ts`:

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

**Test this function thoroughly.** Edge cases: empty submission, all correct, all wrong, partial, unknown slot IDs.

### Rate Limiting

```typescript
// submissions.controller.ts
@UseGuards(JwtAuthGuard, ThrottlerGuard)
@Throttle({ default: { limit: 10, ttl: 60000 } })  // 10/min per user
@Post()
async create(@Body() dto: CreateSubmissionDto, @CurrentUser() user: User) { ... }
```

---

## 6. Shared Packages

### `packages/shared-types`

**This package is the contract between frontend and backend. Any API change MUST update this package first.**

Key interfaces to define here:
- `Problem`, `ProblemGraph`, `MaskedGraph`
- `Requirement`, `ProblemDetailResponse`, `RequirementGraphResponse`
- `Node`, `Edge`, `ComponentType`
- `ComponentNodeData`, `BlankNodeData`, `ActorNodeData`
- `Submission`, `SubmissionRequest`, `SubmissionResponse`
- `SlotResult`, `SlotExplanation`
- `User`, `UserStats`, `LeaderboardEntry`
- `Difficulty` enum (`EASY | MEDIUM | HARD`)
- `ProblemSummary` — includes `requirementCount` field

### `packages/game-engine`

Pure TypeScript, zero dependencies. Contains:
- `mask.ts` — `maskGraph()`
- `score.ts` — `scoreSubmission()`
- `shuffle.ts` — `seededShuffle()` (deterministic for reproducible tests)
- `accumulate.ts` — `buildAccumulatedGraph()` (progressive requirement reveal)

Test coverage target: **> 90%** (Jest). Run: `npm test --filter=game-engine`.

---

## 7. Sprint Status

> **Update this section when starting/completing a sprint.**

| Sprint | Name | Status | Branch |
|--------|------|--------|--------|
| 1 | Foundation & Auth | ✅ Complete | `sprint/1-foundation` |
| 2 | Core Game Loop | ✅ Complete | `sprint/2-game-loop` |
| 3 | Progressive Requirements | 🟡 In Progress | `main` |
| 4 | Social & Discovery | ⬜ Not started | `sprint/4-social` |
| 5 | Scale & Quality | ⬜ Not started | `sprint/5-scale` |

**Current Sprint: 3 — Progressive Requirements**

Sprint 3 scope (implemented 2026-04-26):
- `Requirement` model replaces `ProblemGraph` (2–4 reqs per problem, sequential unlock)
- New API endpoints: `GET /problems/:slug` → `ProblemDetailResponse`; `GET /problems/:slug/requirements/:order` → `RequirementGraphResponse`
- `buildAccumulatedGraph()` in game-engine composes prior (revealed) + current (blanked) requirements
- `RequirementsSidebar` component — locked/active/completed states, progress bar
- Game page: sidebar + canvas split layout, compact per-requirement result, full modal on final pass
- Seed updated: Instagram (3 reqs), YouTube (4 reqs)

---

## 8. Environment Variables

### Development — `apps/api/.env.local`
```bash
DATABASE_URL="postgresql://stackdify:stackdify@localhost:5432/stackdify_dev"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="dev-secret-min-32-chars-change-in-prod"
GITHUB_CLIENT_ID="your-github-oauth-app-client-id"
GITHUB_CLIENT_SECRET="your-github-oauth-app-client-secret"
GOOGLE_CLIENT_ID="your-google-oauth-client-id"
GOOGLE_CLIENT_SECRET="your-google-oauth-client-secret"
AWS_S3_BUCKET="stackdify-assets-dev"
AWS_REGION="ap-southeast-1"
CORS_ORIGIN="http://localhost:3000"
NODE_ENV="development"
PORT=3001
```

### Development — `apps/web/.env.local`
```bash
NEXTAUTH_SECRET="dev-nextauth-secret-min-32-chars"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_API_URL="http://localhost:3001/api/v1"
GITHUB_CLIENT_ID="your-github-oauth-app-client-id"
GITHUB_CLIENT_SECRET="your-github-oauth-app-client-secret"
GOOGLE_CLIENT_ID="your-google-oauth-client-id"
GOOGLE_CLIENT_SECRET="your-google-oauth-client-secret"
```

**Production:** All secrets are in AWS Secrets Manager. ECS task definitions inject them as environment variables. See `04_deployment_plan.docx` for the full production reference.

---

## 9. Local Development Setup

```bash
# 1. Clone and install
git clone <repo>
cd stackdify
npm install          # Installs all workspaces via Turborepo

# 2. Start infrastructure
docker-compose up -d  # PostgreSQL on :5432, Redis on :6379

# 3. Set up environment files
cp apps/api/.env.example apps/api/.env.local
cp apps/web/.env.example apps/web/.env.local
# Fill in OAuth credentials (see section 8)

# 4. Run DB migrations + seed
cd apps/api
npx prisma migrate dev
npx prisma db seed   # Seeds Instagram + YouTube problem graphs

# 5. Start development servers
cd ../..
npm run dev          # Starts web (:3000) + api (:3001) in parallel
```

**Verify setup:**
- `http://localhost:3000` → landing page (light/dark toggle works)
- `http://localhost:3001/api/v1/health` → `{ "status": "ok", "db": "ok", "redis": "ok" }`
- `http://localhost:3001/api/v1/problems` → JSON array with 2 problems

---

## 10. Database

### Prisma Workflow

```bash
# Create a new migration after schema changes:
npx prisma migrate dev --name "describe_the_change"

# Apply migrations on production (CI/CD runs this):
npx prisma migrate deploy

# Open Prisma Studio (visual DB browser):
npx prisma studio

# Regenerate Prisma Client after schema changes:
npx prisma generate
```

### Seed Data Structure

The seed script (`apps/api/prisma/seed.ts`) must insert:
1. **ComponentTypes** — at minimum: CDN, Load Balancer, Application Server, Cache, Relational DB, DNS
2. **Problems** — Instagram + YouTube (with `isPublished: true`)
3. **Requirements** — per problem, ordered 1-based, each with `nodes`, `edges`, and `answer` for that step only

**Requirement count by difficulty:**
- `EASY`: 2 requirements
- `MEDIUM`: 3 requirements (Instagram)
- `HARD`: 4 requirements (YouTube)

**Instagram (MEDIUM — 3 requirements):**
| Req | Title | New Nodes | Blanks |
|-----|-------|-----------|--------|
| 1 | Handle user traffic | User(actor), DNS, Load Balancer, App Server 1 | dns-1, lb-1 |
| 2 | Serve and cache data | App Server 2, Cache (Redis), Primary DB | app-2, cache-1, db-1 |
| 3 | Store and deliver media | CDN(static), CDN(media), Object Storage, Read Replica | cdn-1, cdn-2, obj-1, db-2 |

**YouTube (HARD — 4 requirements):**
| Req | Title | New Nodes | Blanks |
|-----|-------|-----------|--------|
| 1 | Route viewer traffic | Viewer(actor), DNS, CDN, Load Balancer | dns-1, cdn-1 |
| 2 | Serve API requests | API Gateway, App Server | api-gw, app-1 |
| 3 | Handle uploads and transcoding | Creator(actor), Message Queue, Transcoder | mq-1, media-1 |
| 4 | Store and cache data | Cache, Metadata DB, Video Storage | cache-1, db-1, obj-1 |

Each requirement's `edges` may include cross-requirement connections (source/target from earlier reqs).

---

## 11. Testing

### Game Engine (unit tests — highest priority)
```bash
cd packages/game-engine
npm test -- --coverage
```
Must cover: `maskGraph()`, `scoreSubmission()`, `seededShuffle()`. Target: **> 90% coverage**.

### Backend (NestJS)
```bash
cd apps/api
npm run test          # Unit tests
npm run test:e2e      # E2E with supertest (Sprint 5)
```

### Frontend
```bash
cd apps/web
npm test              # Jest + React Testing Library
npm run test:e2e      # Playwright (Sprint 5)
```

### CI — runs on every PR
```bash
npx turbo typecheck lint test
```
All three must pass before merging.

---

## 12. Code Style & Conventions

### TypeScript
- Strict mode enabled everywhere (`"strict": true` in all tsconfigs)
- No `any` without justification comment
- Prefer `interface` over `type` for object shapes
- Prefer named exports over default exports (except Next.js pages and NestJS modules)

### React / Next.js
- Server Components by default in App Router; add `"use client"` only when needed
- Co-locate component-specific types in the same file
- Use `cn()` utility (clsx + tailwind-merge) for conditional class names
- Memoize `nodeTypes` and `edgeTypes` for React Flow with `useMemo`

### NestJS
- One module per feature domain
- DTOs live in `dto/` subdirectory of their module
- Services contain business logic; controllers are thin
- Use `@nestjs/config` for all configuration (never `process.env` directly in services)

### Git
- Branch naming: `sprint/N-feature-name` or `fix/short-description`
- Commit style: `feat(game): add BlankSlotNode pulse animation` (conventional commits)
- One feature per PR; small PRs preferred

---

## 13. AWS Deployment (Production)

**Region:** `ap-southeast-1` (Singapore — closest to Hanoi)

**Deploy command (manual first time):**
```bash
cd infra
npm run cdk deploy --all
```

**Subsequent deploys:** Automatic via GitHub Actions on merge to `main`.

**Check deployment status:**
```bash
aws ecs describe-services \
  --cluster stackdify-cluster \
  --services stackdify-api stackdify-web \
  --query 'services[*].{name:serviceName,running:runningCount,desired:desiredCount,status:status}'
```

**Tail production logs:**
```bash
aws logs tail /ecs/stackdify-api --follow
aws logs tail /ecs/stackdify-web --follow
```

**Estimated monthly cost:** ~$50–72 USD (see `04_deployment_plan.docx` for full breakdown).

---

## 14. Key External Resources

| Resource | URL | When to use |
|----------|-----|-------------|
| React Flow docs | https://reactflow.dev | Game canvas implementation |
| Motion docs | https://motion.dev | All animations |
| 21st.dev components | https://21st.dev/community/components/s/framer-motion | UI component inspiration |
| DnD Kit docs | https://docs.dndkit.com | Palette drag-and-drop |
| Prisma docs | https://www.prisma.io/docs | ORM + migrations |
| NestJS docs | https://docs.nestjs.com | Backend patterns |
| AWS CDK v2 | https://docs.aws.amazon.com/cdk/v2/guide | Infrastructure |
| NextAuth v5 | https://authjs.dev | Authentication |
| TanStack Query v5 | https://tanstack.com/query/v5 | Client data fetching |

---

## 15. Definition of Done (Every Task)

Before marking any task complete, verify ALL of the following:

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
