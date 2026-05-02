# Sprint 6: Admin Studio & Governance

## Context
Sprint 6 builds the admin control plane for Stackdify. The core game loop (Sprints 1–4) and production hardening (Sprint 5) are complete. Admins now need a dashboard to see platform stats, a problem list with lifecycle controls (publish/hide/soft-delete/restore), and a visual graph builder to create new problems without touching the database manually.

**What's already implemented that Sprint 6 builds on:**
- All admin CRUD endpoints exist (`AdminController` + `AdminService`) — create, update, publish, hide, delete (hard), get stats
- `AdminGuard` exists but uses email allowlist (`ADMIN_EMAILS` env var), not RBAC
- The React Flow game canvas, custom node types (`ComponentNode`, `BlankSlotNode`, `ActorNode`), `ComponentPalette`, and `graph-config.ts` — all reusable in the builder
- `fuse.js`, `apiFetch`, TanStack Query patterns already wired in `lib/api.ts`
- No frontend admin UI, no charting library, no soft delete, no role field in User model

---

## ✅ Phase 1: Foundation — Schema, Types, RBAC (Days 1–2) — DONE

### 1.1 Prisma Schema Migration
**File:** `apps/api/prisma/schema.prisma`

Add:
```prisma
enum Role { USER  CONTENT_EDITOR  ADMIN }

model User {
  // ...
  role  Role  @default(USER)
}

model Problem {
  // ...
  deletedAt  DateTime?   // null = active, soft-deleted otherwise
}
```
Run: `npx prisma migrate dev --name add_role_soft_delete`

### 1.2 Shared Types
**File:** `packages/shared-types/src/index.ts`

Add:
- `Role` enum (`USER | CONTENT_EDITOR | ADMIN`)
- `role: Role` field to `User` interface
- `deletedAt?: string | null` to `Problem` interface
- `DailyCount { date: string; count: number }`
- `ProblemPassRate { slug, title, passRate, totalSubmissions }`
- `AdminStatsResponse` with sub-shapes: `totals`, `submissionsPerDay`, `newUsersPerDay`, `passRateByProblem`, `difficultyDistribution`, `recentSubmissions`, `problemQuality`
- `AdminProblemListItem` (extends problem shape with `deletedAt`, `requirementCount`, `submissionCount`)

### 1.3 Update AdminGuard to Role-Based
**File:** `apps/api/src/common/guards/admin.guard.ts`

`JwtStrategy.validate()` already fetches the full Prisma `User` from DB (with the new `role` field). Change guard to:
```typescript
canActivate(ctx): boolean {
  const user = ctx.switchToHttp().getRequest<{user?: User}>().user;
  if (user?.role === 'ADMIN') return true;
  throw new ForbiddenException('Admin access required');
}
```
Remove `ConfigService` dependency.

Also add (for future CONTENT_EDITOR support):
- `apps/api/src/common/decorators/roles.decorator.ts` — `@Roles(...roles)` via `SetMetadata`
- `apps/api/src/common/guards/roles.guard.ts` — checks `user.role` against metadata

### 1.4 Auth: Include Role in Token Response
**File:** `apps/api/src/auth/auth.service.ts`

Add `role: user.role` to the `user` object returned in `AuthTokenResponse`. JWT payload (`{ sub, email }`) stays unchanged — `JwtStrategy.validate()` re-fetches user from DB so role is always fresh.

### 1.5 Env-Driven Admin Seed
**File:** `apps/api/prisma/seed.ts`

At end of `main()`, upsert admin from env vars (idempotent):
```typescript
const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_USERNAME, ADMIN_DISPLAY_NAME } = process.env;
if (ADMIN_EMAIL && ADMIN_PASSWORD) {
  await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { role: 'ADMIN', username: ADMIN_USERNAME ?? 'admin' },
    create: {
      email: ADMIN_EMAIL,
      password: await bcrypt.hash(ADMIN_PASSWORD, 12),
      username: ADMIN_USERNAME ?? 'admin',
      displayName: ADMIN_DISPLAY_NAME ?? 'Admin',
      role: 'ADMIN',
    },
  });
}
```
Add four vars to `apps/api/.env.local`.

---

## ✅ Phase 2: Backend — Soft Delete, Restore, Enhanced Stats (Day 3) — DONE

### 2.1 Soft Delete & Restore
**File:** `apps/api/src/admin/admin.service.ts`

- `deleteProblem()` → set `deletedAt: new Date()` instead of hard delete
- New `restoreProblem()` → set `deletedAt: null`
- Update `ensureProblem()` with `includeDeleted?: boolean` parameter
- Update `listProblems()` where clauses:
  - `all` → `{ deletedAt: null }`
  - `published` → `{ isPublished: true, deletedAt: null }`
  - `hidden` → `{ isPublished: false, deletedAt: null }`
  - `deleted` → `{ deletedAt: { not: null } }`
- Add `deletedAt` to returned objects

**File:** `apps/api/src/admin/admin.controller.ts`

Add: `@Patch('problems/:slug/restore') restoreProblem(@Param('slug') slug: string)`

### 2.2 Exclude Soft-Deleted from Public APIs
**File:** `apps/api/src/problems/problems.service.ts`

All public queries add `deletedAt: null` to every `where` clause (`findAll`, `findBySlug`, `getRequirementGraph`, `getSolution`, `findCategories`).

### 2.3 Enhanced Stats API
**File:** `apps/api/src/admin/admin.service.ts`

Extend `getStats()` to return full `AdminStatsResponse`:
- `submissionsPerDay` (30 days): `prisma.$queryRaw` with `DATE_TRUNC('day', ...)`
- `newUsersPerDay` (30 days): same pattern on `users` table
- `passRateByProblem`: `prisma.submission.groupBy` by problemId + join problem info
- `difficultyDistribution`: group submissions by `problem.difficulty`
- `problemQuality`: extend with computed `passRate` per problem
- `totals.deletedProblems`: `count({ where: { deletedAt: { not: null } } })`

---

## ✅ Phase 3: Frontend Foundation (Day 4) — DONE

### 3.1 Install Recharts
```bash
npm install recharts --workspace=@stackdify/web
```
(recharts v2 ships its own types; no `@types/recharts` needed)

### 3.2 Admin API Hooks
**File:** `apps/web/src/lib/api.ts`

Add admin section with hooks (all require `token: string`, use existing `apiFetch`):
- `useAdminStats(token)` — GET /admin/stats, `staleTime: 60_000`
- `useAdminProblems(token, status?)` — GET /admin/problems?status=…
- `useAdminProblem(token, slug)` — GET /admin/problems/:slug
- `usePublishProblem(token)`, `useHideProblem(token)`, `useSoftDeleteProblem(token)`, `useRestoreProblem(token)` — mutation hooks
- `useCreateProblem(token)`, `useUpdateProblem(token)`, `useReplaceRequirements(token)` — mutation hooks
- `useComponentTypes()` — GET /components, `staleTime: 10 * 60_000` (feeds builder palette)

All mutation hooks call `queryClient.invalidateQueries(['admin', 'problems'])` on success. Create/update also invalidate `['problems']` for public list refresh.

### 3.3 Admin Layout & Route Guard
**New:** `apps/web/src/app/admin/layout.tsx`

`'use client'` layout wrapping all `/admin/*` pages:
- Uses `useAuth()` — if `!isReady`: return null; if `!isAuthenticated || user.role !== 'ADMIN'`: redirect to `/login`
- Renders two-column layout: fixed sidebar + `{children}` main area
- Sidebar: "Overview" → `/admin`, "Problems" → `/admin/problems`, "← Back to app" link, `ThemeToggle`

**New:** `apps/web/src/components/admin/AdminGuard.tsx`

Client component that wraps redirect logic. Used inside the layout.

---

## ✅ Phase 4: Chart Components (Days 4–5) — DONE

**New directory:** `apps/web/src/components/ui/charts/`

Four recharts wrapper components following the shadcn chart pattern (thin wrappers using `ResponsiveContainer`, design tokens as string props, `Skeleton` while loading):

| File | Chart | Data Shape | Key Color |
|------|-------|-----------|-----------|
| `AreaChart.tsx` | Submissions over 30 days | `{date, count}[]` | `var(--accent-primary)` |
| `LineChart.tsx` | New users over 30 days | `{date, count}[]` | `var(--accent-game)` |
| `BarChart.tsx` | Pass rate by problem (horizontal) | `{title, passRate}[]` | `var(--slot-correct)` |
| `PieChart.tsx` | Difficulty distribution | `{name, value, color}[]` | per slice |

All: `'use client'`, `ResponsiveContainer` for full-width, render `Skeleton` on `isLoading`.

Note: recharts does not read CSS vars — pass color strings as props from parent (parent reads `getComputedStyle` or uses hardcoded fallback values).

---

## ✅ Phase 5: Admin Dashboard Page (Day 5) — DONE

**New:** `apps/web/src/app/admin/page.tsx`

Uses `useAdminStats(token)`. Layout:

1. **KPI row** (6 cards): Problems, Published, Users, Submissions, Pass Rate, Deleted
   - Extract `StatCard` from `dashboard/page.tsx` to `components/admin/StatCard.tsx` and reuse both here and in dashboard
2. **Charts row** (2-col desktop): `AreaChart` (submissions/day) + `LineChart` (users/day)
3. **Bottom row** (2-col): `BarChart` (pass rate by problem) + `PieChart` (difficulty distribution)
4. **Recent activity feed**: last 8 global submissions using `recentSubmissions` from stats — reuse `Card`, `DifficultyBadge`
5. **Problem quality table**: `problemQuality` data, columns: title/slug, difficulty, status, submissions, pass rate — each row links to edit page

Animations: `motion.div` with `fadeUp` + `STAGGER` from `@/lib/animations.ts`, wrapped in `useReducedMotion()`.

---

## ✅ Phase 6: Admin Problems List (Day 6) — DONE

**New:** `apps/web/src/app/admin/problems/page.tsx`

State: active tab (`all | published | hidden | deleted`), search term

- Tab bar: 4 tabs switching `useAdminProblems(token, tab)` query
- Search: client-side `fuse.js` on `title` + `slug` (already installed)
- Table columns: Title+Slug, Difficulty (`DifficultyBadge`), Status chip, Req count, Submission count, Actions
- "New Problem" button → `/admin/problems/new`

**New:** `apps/web/src/components/admin/ProblemRowActions.tsx`

Row actions based on status:
- Active+Published: Hide, Edit, Delete
- Active+Hidden: Publish, Edit, Delete
- Deleted: Restore
- Delete shows `Modal` confirmation before calling `useSoftDeleteProblem`

---

## Phase 7: Problem Form & Visual Builder (Days 7–10)

### 7.1 New UI Primitives
- **New:** `apps/web/src/components/ui/Textarea.tsx` — same pattern as `Input.tsx` (forwarded ref, label, error props)
- **New:** `apps/web/src/components/ui/Select.tsx` — styled `<select>` for difficulty dropdown

### 7.2 Metadata Form
**New:** `apps/web/src/components/admin/ProblemMetadataForm.tsx`

Controlled form: slug, title, description (Textarea), difficulty (Select), category (text + datalist). Client-side validation (regex for slug, min length for others). Props: `initialValues?`, `onSubmit`, `isLoading`.

### 7.3 The React Flow Builder (Most Complex)
**New:** `apps/web/src/components/admin/RequirementBuilder.tsx`

**Architecture:**
- `RequirementBuilder` — manages array of requirement states, renders tab per requirement + "Add Req +" tab
- `SingleRequirementCanvas` — the editable React Flow canvas for one requirement

**Reused from game canvas:**
- `ComponentNode`, `ActorNode` — same visual, `draggable` enabled in builder
- `BlankSlotNode` styling for marked-as-answer nodes (new `BuilderBlankNode` type without DnD-Kit droppable)
- `graph-config.ts` — category colors and styles
- `ComponentPalette` chip rendering logic (reference for palette sidebar)

**New builder-only interactions:**
1. **Add node**: Mini palette sidebar (click chip → `addNodes` at default position). No drag — avoids React Flow pan conflict.
2. **Position nodes**: React Flow's native `onNodesChange` + `nodesDraggable={true}` (unlike game canvas)
3. **Draw edges**: React Flow's `onConnect` callback
4. **Mark as answer**: Click a component node in the current requirement → toggle to `BuilderBlankNode` visual + add to `answer` map with `componentSlug`. Click again → remove from answer.
5. **Delete node**: Select node → delete key or button. Clean up edges + answer map.
6. **Prior requirement nodes**: Rendered dimmed + `draggable={false}`, can receive edges but not be edited

**Builder node types:**
```typescript
const builderNodeTypes = {
  component: ComponentNode,  // reuse
  actor: ActorNode,          // reuse
  builderBlank: BuilderBlankNode,  // new — BlankSlotNode without DnD-Kit
};
```

**Preview mode toggle:** Replace answer-slot nodes with `type: 'blank'` temporarily, show `BlankSlotNode` read-only view as player would see it.

### 7.4 New Problem Page
**New:** `apps/web/src/app/admin/problems/new/page.tsx`

Single-page layout: `ProblemMetadataForm` above, `RequirementBuilder` below. On submit:
1. `useCreateProblem` → get slug back
2. `useReplaceRequirements` with requirements
3. Redirect to `/admin/problems`

### 7.5 Edit Problem Page
**New:** `apps/web/src/app/admin/problems/[slug]/edit/page.tsx`

Pre-populate `ProblemMetadataForm` and `RequirementBuilder` from `useAdminProblem(token, slug)`. Top-level Publish/Hide quick-action button. On save: `useUpdateProblem` + `useReplaceRequirements`. Loading skeleton while data loads.

---

## Phase 8: Polish & Navbar (Day 10)

### 8.1 Navbar Admin Link
**File:** `apps/web/src/components/layout/Navbar.tsx`

Add to nav links conditionally:
```typescript
...(user?.role === 'ADMIN' ? [{ href: '/admin', label: 'Admin' }] : [])
```

---

## Verification Checklist

### Backend
- [ ] `npx prisma migrate dev` applies cleanly; `User.role` and `Problem.deletedAt` exist
- [ ] `npx prisma db seed` with `ADMIN_EMAIL` env set creates admin user with `role='ADMIN'`; re-running is idempotent
- [ ] `GET /admin/stats` with regular user JWT → 403; with admin JWT → 200 with all fields
- [ ] `DELETE /admin/problems/:slug` → `deletedAt` set, not hard deleted; public `GET /problems` excludes it
- [ ] `GET /admin/problems?status=deleted` → shows soft-deleted problem
- [ ] `PATCH /admin/problems/:slug/restore` → `deletedAt` cleared; publish + verify public returns it

### Frontend
- [ ] `/admin` redirects non-admin users to `/login`
- [ ] Admin link appears in Navbar only for admin users
- [ ] All 4 charts render in light and dark mode without JS errors
- [ ] `Skeleton` renders while `isLoading`, error state shown on query failure
- [ ] Problems list tab switching loads correct status filter
- [ ] Soft-delete confirm modal appears; row disappears after deletion
- [ ] New problem form validates slug format and required fields
- [ ] Builder: add component node → mark as answer → add edge → save → verify via GET /admin/problems/:slug
- [ ] Preview mode shows correct blank slot visualization
- [ ] Publish problem → appears at `/problems`
- [ ] `npm run typecheck` — zero errors
- [ ] `npm run lint` — zero warnings
- [ ] OS "Reduce motion" enabled — animations do not fire

---

## Critical Files Reference

| File | Change |
|------|--------|
| `apps/api/prisma/schema.prisma` | Add Role enum, User.role, Problem.deletedAt |
| `packages/shared-types/src/index.ts` | Add Role, AdminStatsResponse, AdminProblemListItem |
| `apps/api/prisma/seed.ts` | Env-driven admin upsert |
| `apps/api/src/common/guards/admin.guard.ts` | Switch to role-based check |
| `apps/api/src/admin/admin.service.ts` | Soft delete, restore, enhanced stats |
| `apps/api/src/admin/admin.controller.ts` | Add restore endpoint |
| `apps/api/src/problems/problems.service.ts` | Add `deletedAt: null` filters |
| `apps/web/src/lib/api.ts` | Admin hooks section |
| `apps/web/src/app/admin/layout.tsx` | NEW — sidebar + route guard |
| `apps/web/src/app/admin/page.tsx` | NEW — dashboard with charts |
| `apps/web/src/app/admin/problems/page.tsx` | NEW — problems list |
| `apps/web/src/app/admin/problems/new/page.tsx` | NEW — create problem |
| `apps/web/src/app/admin/problems/[slug]/edit/page.tsx` | NEW — edit + builder |
| `apps/web/src/components/admin/RequirementBuilder.tsx` | NEW — most complex piece |
| `apps/web/src/components/ui/charts/` | NEW — 4 recharts wrappers |
| `apps/web/src/components/layout/Navbar.tsx` | Conditional admin link |
