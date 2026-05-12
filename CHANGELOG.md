# Changelog

All notable changes to Stackdify are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Admin Studio & Governance (Sprint 6 — in progress)
  - RequirementBuilder v2 with visual node/edge editor
  - `CONTENT_EDITOR` role with draft/review/publish workflow
  - Problem version history
  - Admin publish/unpublish toggle with confirmation modal
  - Full visual answer-key assignment in RequirementBuilder
  - Problem preview mode (play as user)

## [0.5.0] — 2026-05-04

### Added
- Social & Discovery features (Sprint 4)
  - Problem search and filtering by category/difficulty
  - User profiles and stats dashboard
  - Leaderboard with Redis sorted sets
  - Social sharing of scores

## [0.4.0] — 2026-04-27

### Added
- Progressive Requirements (Sprint 3)
  - Multi-requirement problem flow with progressive graph reveal
  - Accumulated graph building across requirements
  - Requirement-by-requirement scoring and submission
  - Instagram (3 requirements) and YouTube (4 requirements) seeded data

## [0.3.0] — 2026-04-25

### Added
- Core Game Loop (Sprint 2)
  - React Flow game canvas with custom node types (component, blank slot, filled slot, actor)
  - Drag-and-drop component palette with `@dnd-kit/core`
  - Graph masking algorithm (`maskGraph()`) — 50% blanking
  - Scoring algorithm (`scoreSubmission()`) — 0–100 score
  - Submission API with slot-level results
  - Light and dark mode theming
  - Motion animations with reduced-motion support

## [0.2.0] — 2026-04-25

### Added
- Foundation & Auth (Sprint 1)
  - Turborepo monorepo setup (web, api, shared-types, game-engine)
  - NestJS backend with Prisma ORM + PostgreSQL
  - Next.js 14 frontend with App Router
  - JWT authentication with GitHub + Google OAuth
  - Docker Compose for local PostgreSQL + Redis
  - CI pipeline (typecheck, lint, test)
  - Railway deployment (Phase 1)

## [0.1.0] — 2026-04-20

### Added
- Initial project scaffolding
- Design documents (system design, UI/UX, sprint plan, deployment plan)
