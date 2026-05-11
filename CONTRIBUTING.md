# Contributing to Stackdify

Thanks for your interest in contributing! This guide covers everything you need to get started.

---

## Quick Start

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/system-design-game.git`
3. Install dependencies: `npm install`
4. Start infrastructure: `docker-compose up -d`
5. Set up env files: `cp apps/api/.env.example apps/api/.env.local` (and fill in values)
6. Run migrations: `cd apps/api && npx prisma migrate dev && npx prisma db seed`
7. Start dev servers: `cd ../.. && npm run dev`

See [README.md](README.md) for the full setup guide.

---

## Development Workflow

### Branch Naming

- `feat/short-description` — new features
- `fix/short-description` — bug fixes
- `sprint/N-feature-name` — sprint-scoped work

### Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(game): add BlankSlotNode pulse animation
fix(auth): resolve Google OAuth callback redirect
docs(readme): update local development setup
```

### Pull Requests

- Keep PRs small and focused — one feature or fix per PR
- Fill out the PR template completely
- Ensure all CI checks pass: `typecheck`, `lint`, `test`
- Request a review and address feedback promptly

---

## Code Standards

### Before Every Commit

```bash
npm run typecheck   # No TypeScript errors
npm run lint        # No ESLint errors
npm run test        # All tests pass
```

### Key Rules

- **No `any` types** without an eslint-disable comment explaining why
- **Import shared types from `@stackdify/shared-types`** — never redefine locally
- **Implement both light and dark mode** for every UI component
- **Wrap animations in `useReducedMotion()`** for accessibility
- **Use `@dnd-kit/core`** for drag-and-drop — never native HTML5 DnD
- **Use `cn()`** (clsx + tailwind-merge) for conditional class names
- **No `console.log`** in production code — use NestJS `Logger` on backend
- **No hardcoded secrets** — everything in `.env.local` or AWS Secrets Manager

### TypeScript

- Strict mode everywhere (`"strict": true`)
- Prefer `interface` over `type` for object shapes
- Prefer named exports (except Next.js pages and NestJS modules)

### React / Next.js

- Server Components by default; add `"use client"` only when needed
- Memoize `nodeTypes` and `edgeTypes` for React Flow with `useMemo`
- Handle loading and error states in every data-fetching component

---

## Adding a New Problem

If you'd like to contribute a new system design problem:

1. Add the problem definition to the seed data in `apps/api/prisma/seed.ts`
2. Define requirements with nodes, edges, and answer keys following the format in `docs/problems-catalog.md`
3. Follow the blank count rules:
   - EASY: 2 requirements
   - MEDIUM: 3 requirements
   - HARD: 4 requirements
4. Include tests for the graph masking and scoring of your problem

---

## Reporting Issues

- Check existing issues before opening a new one
- Use the issue template and provide:
  - Steps to reproduce
  - Expected vs actual behavior
  - Browser/environment info
  - Screenshots if applicable

---

## Questions?

Open a [GitHub Discussion](https://github.com/duynd0909/system-design-game/discussions) or ask in issues.
