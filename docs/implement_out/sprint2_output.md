# Sprint 2 — Core Game Loop Implementation Output

**Date:** 2026-04-25  
**Status:** Implemented  
**Skipped by request:** S3 SVG icon bucket/upload. Component icons use `lucide-react` in the web app.

---

## Sprint 1 Baseline Used

- Monorepo, NestJS API, Next.js web app, Prisma schema, seed data, shared types, and game-engine package were already present.
- Seeded problems available: Instagram and YouTube.
- Existing backend modules already covered problems, components, submissions, users, leaderboard, and health.
- Existing game-engine already provided `maskGraph()` and `scoreSubmission()`.

---

## What was built

### Workspace and Shared Contracts

- Added root `packageManager` so Turborepo can resolve workspaces.
- Installed `lucide-react` for frontend icons.
- Added missing `apps/web/.env.example`.
- Updated package exports for `@joy/shared-types` and `@joy/game-engine` to use tracked `src` JS/declaration outputs.
- Added `SubmissionHistoryItem` to `packages/shared-types`.
- Fixed game-engine Jest coverage collection so tests execute TS sources, not stale generated JS.

### Backend

- `GET /submissions/me` now returns `PaginatedResponse<SubmissionHistoryItem>`.
- Submission history supports `page` and `limit` query params with a max limit of 100.
- Submission creation now awards XP only when `scoreSubmission()` returns `passed: true`.
- Auth token responses now include `createdAt` and normalize optional avatar values for the shared `User` type.

### Frontend Auth

- Added local JWT auth via `AuthProvider`.
- Login/register forms now call the Nest API, persist the bearer token and user in `localStorage`, and redirect to `/problems`.
- Added `/auth/callback` to complete OAuth redirects from the Nest API.
- Navbar now reflects signed-in state and supports logout.

### Frontend Game Loop

- Added `/problems/[slug]` playable canvas page.
- Built React Flow custom node types:
  - `ComponentNode`
  - `BlankSlotNode`
  - `FilledSlotNode`
  - `ActorNode`
- Built `LabelEdge` for labeled graph edges.
- Built `ComponentPalette` with DnD Kit draggable Lucide-icon chips.
- Implemented drag/drop slot filling and replacement.
- Implemented submit state flow: loading data → fill slots → submit loading → result overlay.
- Built `ResultOverlay` with SVG score ring, pass/fail state, XP display, retry, and back-to-problems actions.
- Problem list now shows authenticated completion status from submission history.
- Removed `next/font/google` usage so production builds do not require network access to Google Fonts.

---

## Verification

| Command | Result |
| --- | --- |
| `npm run typecheck` | ✅ Pass |
| `npm run typecheck --workspace=@joy/web` | ✅ Pass |
| `npm run typecheck --workspace=@joy/api` | ✅ Pass |
| `npm run test --workspace=@joy/game-engine -- --coverage` | ✅ Pass — 30 tests, 100% statements/branches/functions/lines |
| `npm run build --workspace=@joy/web` | ✅ Pass when run outside sandbox; sandboxed Turbopack build cannot bind its internal worker port |

Notes:
- The first web build attempt failed on `next/font/google` because the sandbox cannot fetch Google Fonts. The implementation now uses local/system font stacks.
- npm reports 9 known audit findings from installed dependencies: 1 low and 8 moderate. No audit fix was applied because it was outside Sprint 2 scope and may introduce dependency churn.

---

## Residual Gaps

- Full manual browser playthrough was not completed here: it requires local API/database services plus UI interaction.
- S3 SVG icon setup remains intentionally skipped.
