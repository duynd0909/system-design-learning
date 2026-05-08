# Stackdify

A gamified system design practice platform for software engineers.

**Domain:** stackdify.space

---

## What is it?

Stackdify teaches system design through interactive challenges. The core loop:

1. Select a real-world system (Instagram, YouTube, TikTok, etc.)
2. See an architecture graph with ~50% of component nodes blanked out
3. Drag-and-drop component chips to fill the slots
4. Submit — get a scored, humorous, educational result

---

## Tech Stack

### Frontend (`apps/web`)
- **Next.js 14** (App Router) + **React 18**
- **@xyflow/react** — game canvas
- **@dnd-kit/core** — drag-and-drop palette
- **motion** — animations
- **TanStack Query v5** — server state
- **NextAuth.js v5** — GitHub + Google OAuth
- **Tailwind CSS v3**

### Backend (`apps/api`)
- **NestJS 10+**
- **Prisma 5+** + **PostgreSQL 15**
- **Redis** (ioredis) — cache, sessions, leaderboard
- **passport-jwt** / **passport-github2** / **passport-google-oauth20**

### Monorepo
- **Turborepo** with two shared packages:
  - `packages/shared-types` — TypeScript interfaces shared by FE & BE
  - `packages/game-engine` — pure TS: `maskGraph()` + `scoreSubmission()`

---

## Project Structure

```
stackdify/
├── apps/
│   ├── web/              # Next.js 14 frontend
│   └── api/              # NestJS backend
├── packages/
│   ├── shared-types/     # Shared TypeScript interfaces
│   └── game-engine/      # Graph masking + scoring logic
├── infra/                # AWS CDK v2 stacks
├── docs/                 # Design documents
├── docker-compose.yml    # Local PostgreSQL + Redis
└── turbo.json
```

---

## Local Development

### Prerequisites
- Node.js 20+
- Docker Desktop

### Setup

```bash
# 1. Clone and install dependencies
git clone <repo>
cd stackdify
npm install

# 2. Start PostgreSQL + Redis
docker-compose up -d

# 3. Configure environment
cp apps/api/.env.example apps/api/.env.local
cp apps/web/.env.example apps/web/.env.local
# Fill in OAuth credentials (see docs/01_system_design.docx §8)

# 4. Run DB migrations and seed data
cd apps/api
npx prisma migrate dev
npx prisma db seed

# 5. Start all dev servers
cd ../..
npm run dev
```

| URL | Service |
|-----|---------|
| `http://localhost:3000` | Frontend |
| `http://localhost:3001/api/v1/health` | Backend health check |
| `http://localhost:3001/api/v1/problems` | Problems API |

### Common Commands

```bash
npm run dev          # Start web + api in parallel
npm run build        # Build all packages
npm run typecheck    # TypeScript check across all packages
npm run lint         # ESLint across all packages
npm run test         # Jest across all packages
```

---

## Sprint Status

| Sprint | Name | Status |
|--------|------|--------|
| 1 | Foundation & Auth | ✅ Complete |
| 2 | Core Game Loop | ✅ Complete |
| 3 | Progressive Requirements | ✅ Complete |
| 4 | Social & Discovery | ✅ Complete |
| 5 | Scale & Quality | ✅ Complete |
| 6 | Admin Studio & Governance | 🟡 In Progress |

---

## Deployment

### Phase 1 — Railway (Current, ~$20–30/month)

Auto-deploys on push to `main`. Run migrations before deploy:

```bash
railway run --service api npx prisma migrate deploy
```

### Phase 2 — AWS ECS (at scale, ~$50–72/month)

Region: `ap-southeast-1` (Singapore). Triggered when: 5,000+ MAU or Railway bill approaches $50/month.

```bash
cd infra
npm run cdk deploy --all
```

Migration triggers are documented in `docs/04_deployment_plan.docx`.

---

## Key Design Rules

- **Never** send blank slot answers to the client — graph masking is server-side only
- **Never** use `any` TypeScript without a justification comment
- **Never** use native HTML5 drag-and-drop — use `@dnd-kit/core` exclusively
- **Always** implement both light and dark mode for every UI component
- **Always** wrap animations in `useReducedMotion()` for accessibility
- **Always** import shared types from `@stackdify/shared-types`

---

## Docs

| File | Contents |
|------|----------|
| `docs/01_system_design.docx` | Architecture, DB schema, API contracts, scoring algorithm |
| `docs/02_uiux_design.docx` | Design system, animation specs, page layouts |
| `docs/03_sprint_plan.docx` | Sprint breakdown, acceptance criteria |
| `docs/04_deployment_plan.docx` | Railway → AWS ECS deployment guide |
| `docs/problems-catalog.md` | All 10 problems with full node graphs and answer keys |
| `docs/sprint-6-plan.md` | Sprint 6 detailed implementation plan |
