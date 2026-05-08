# Stackdify — UI/UX Design System

> **Source of truth** for design tokens, component library, page layouts, and animation specs.
> Last updated: 2026-05-08 (reflects Sprints 1–5 complete, Sprint 6 in progress).

---

## Table of Contents

1. [Design Principles](#1-design-principles)
2. [Color System](#2-color-system)
3. [Typography](#3-typography)
4. [Animation Tokens](#4-animation-tokens)
5. [Component Library](#5-component-library)
6. [Page Layouts](#6-page-layouts)
7. [Game Canvas](#7-game-canvas)
8. [Accessibility](#8-accessibility)

---

## 1. Design Principles

- **Light and dark mode on every component** — use CSS custom properties, never hardcode hex values
- **Skeletons before content** — all async data has a loading skeleton
- **Error boundaries everywhere** — no component fetches without an error state
- **Reduced motion respected** — all decorative animations wrapped in `useReducedMotion()` check
- **Mobile-tablet baseline** — minimum supported width: 768px

---

## 2. Color System

### CSS Custom Properties (`apps/web/src/styles/globals.css`)

```css
/* Light mode — :root defaults */
:root {
  --bg-primary:      #FFFFFF;
  --bg-secondary:    #F8F7FF;
  --bg-game-canvas:  #F1F0FF;
  --text-primary:    #1E1B4B;
  --text-secondary:  #6D28D9;
  --accent-primary:  #4F46E5;
  --accent-game:     #F59E0B;
  --slot-blank:      #F97316;
  --slot-filled:     #FFFFFF;
  --slot-correct:    #10B981;
  --slot-incorrect:  #EF4444;
}

/* Dark mode — .dark class (applied by next-themes) */
.dark {
  --bg-primary:      #0F0D1A;
  --bg-secondary:    #1A1730;
  --bg-game-canvas:  #131025;
  --text-primary:    #EDE9FE;
  --text-secondary:  #A78BFA;
  --accent-primary:  #818CF8;
  --accent-game:     #FCD34D;
  --slot-blank:      #FB923C;
  --slot-filled:     #2D2650;
  --slot-correct:    #34D399;
  --slot-incorrect:  #F87171;
}
```

**Rule:** Always use `var(--token-name)` or its Tailwind alias. Never use raw hex values in component code.

### Tailwind Extension

Tokens are extended in `tailwind.config.ts`:

```typescript
theme: {
  extend: {
    colors: {
      bg: {
        primary:     'var(--bg-primary)',
        secondary:   'var(--bg-secondary)',
        'game-canvas': 'var(--bg-game-canvas)',
      },
      text: {
        primary:   'var(--text-primary)',
        secondary: 'var(--text-secondary)',
      },
      accent: {
        primary: 'var(--accent-primary)',
        game:    'var(--accent-game)',
      },
      slot: {
        blank:     'var(--slot-blank)',
        filled:    'var(--slot-filled)',
        correct:   'var(--slot-correct)',
        incorrect: 'var(--slot-incorrect)',
      },
    },
  },
}
```

---

## 3. Typography

| Role | Font | Tailwind class | Load method |
|------|------|---------------|-------------|
| Display | Clash Display | `font-display` | Self-hosted woff2 in `public/fonts/` via `next/font` |
| Body | Plus Jakarta Sans | `font-body` | `next/font/google` |
| Mono | JetBrains Mono | `font-mono` | `next/font/google` |

Fonts are loaded in `apps/web/src/app/layout.tsx` using Next.js `next/font` — no layout shift, no external requests at runtime.

---

## 4. Animation Tokens

Import from `@/lib/animations.ts` — never define animation configs inline.

```typescript
// apps/web/src/lib/animations.ts

export const spring       = { type: "spring", stiffness: 300, damping: 24 };
export const springBouncy = { type: "spring", stiffness: 400, damping: 17 };
export const fadeUp       = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };
export const fadeIn       = { initial: { opacity: 0 },        animate: { opacity: 1 } };
export const scaleIn      = { initial: { scale: 0.9, opacity: 0 }, animate: { scale: 1, opacity: 1 } };
export const STAGGER      = { staggerChildren: 0.08, delayChildren: 0.1 };
```

**Accessibility wrapper (required for all decorative animations):**
```typescript
const prefersReducedMotion = useReducedMotion();

<motion.div
  {...(prefersReducedMotion ? {} : fadeUp)}
  transition={spring}
>
```

---

## 5. Component Library

### Location: `apps/web/src/components/`

#### `ui/` — Base Design System

| Component | Variants / Notes |
|-----------|-----------------|
| `Button.tsx` | 4 variants: `primary`, `secondary`, `ghost`, `danger`; 3 sizes: `sm`, `md`, `lg`; loading spinner state |
| `Badge.tsx` | Generic badge |
| `DifficultyBadge.tsx` | Color-coded: EASY (green), MEDIUM (amber), HARD (red) |
| `Card.tsx` | Hover lift; sub-components: `CardHeader`, `CardTitle`, `CardDescription` |
| `Modal.tsx` | Escape key + backdrop click dismissal; `aria-modal` |
| `Input.tsx` | Label, error state, accessible |
| `Textarea.tsx` | Label, error state |
| `Select.tsx` | |
| `Skeleton.tsx` | Animated pulse placeholder |
| `SkeletonCard.tsx` | Problem card skeleton |
| `Avatar.tsx` | User avatar with fallback initials |
| `Tooltip.tsx` | Hover info overlay |
| `ProgressRing.tsx` | SVG circle progress for score display |
| `XpCounter.tsx` | Animated XP increment counter (Sprint 4) |
| `StreakBadge.tsx` | Fire icon + streak count (Sprint 4) |
| `ThemeToggle.tsx` | Light/dark toggle button |
| `charts/AreaChart.tsx` | Activity heatmap (recharts) |
| `charts/BarChart.tsx` | Category breakdown (recharts) |
| `charts/LineChart.tsx` | XP over time (recharts) |
| `charts/PieChart.tsx` | Solved distribution (recharts) |
| `AuroraBackground.tsx` | Animated gradient background for hero |
| `background-boxes.tsx` | Grid box animation for landing |
| `bento-grid.tsx` | Bento grid layout for features section |
| `floating-icons-hero-section.tsx` | Floating tech icons for hero |

#### `game/` — Game Canvas

| Component | Purpose |
|-----------|---------|
| `GameNodes.tsx` | All custom React Flow node types: `ComponentNode`, `BlankSlotNode`, `ActorNode`, `FilledSlotNode` |
| `LabelEdge.tsx` | Custom React Flow edge type with animated bezier + optional text label |
| `ComponentPalette.tsx` | Draggable chip palette (DnD Kit); left/bottom panel |
| `RequirementsSidebar.tsx` | Left sidebar showing requirement unlock progression |
| `ResultOverlay.tsx` | Score ring modal + confetti (canvas-confetti on 100%) |
| `SubmissionGraphModal.tsx` | View a past submission's graph state |
| `graph-config.ts` | Node/edge visual styling logic |
| `graph-utils.ts` | Auto-layout helpers, path detection |
| `component-icons.tsx` | Maps componentTypeSlug → Lucide icon |

#### `layout/` — Shell

| Component | Notes |
|-----------|-------|
| `Navbar.tsx` | Top navigation; shows user avatar + streak when authenticated |
| `Footer.tsx` | |

#### `auth/`

| Component | Notes |
|-----------|-------|
| `SocialAuthButtons.tsx` | GitHub + Google OAuth buttons |

#### `marketing/`

| Component | Notes |
|-----------|-------|
| `LandingHero.tsx` | Hero section with aurora background + floating icons |
| `SocialProofSection.tsx` | Top 5 leaderboard preview on landing page (Sprint 4) |

#### `admin/`

| Component | Notes |
|-----------|-------|
| `ProblemMetadataForm.tsx` | Form for problem title/description/difficulty/category |
| `RequirementBuilder.tsx` | Node/edge/answer editor for requirements |
| `ProblemRowActions.tsx` | Table row actions for problem management |
| `UserRowActions.tsx` | Table row actions for user management |

#### `providers/`

| Provider | Purpose |
|----------|---------|
| `AuthProvider.tsx` | JWT token storage, user state, login/logout |
| `QueryProvider.tsx` | TanStack Query client configuration |
| `ThemeProvider.tsx` | next-themes dark mode integration |

---

## 6. Page Layouts

### App Router Structure

```
src/app/
├── (marketing)/            # No auth required
│   ├── layout.tsx
│   └── page.tsx            # Landing page
├── (auth)/                 # Auth group
│   ├── layout.tsx
│   ├── login/page.tsx
│   └── register/page.tsx
├── admin/                  # Role-gated (ADMIN only)
│   ├── layout.tsx
│   ├── page.tsx            # Admin dashboard (stats)
│   ├── problems/page.tsx   # Problem management table
│   ├── problems/[slug]/edit/page.tsx
│   ├── problems/new/page.tsx
│   └── users/page.tsx
├── auth/callback/          # OAuth token exchange
├── problems/
│   ├── page.tsx            # Problem list with filters
│   └── [slug]/
│       ├── page.tsx        # GAME CANVAS (core feature)
│       ├── layout.tsx
│       ├── error.tsx
│       └── loading.tsx
├── dashboard/page.tsx      # User dashboard (stats, activity charts)
├── leaderboard/page.tsx    # Leaderboard
├── profile/[username]/page.tsx  # Public user profile
├── share/[token]/route.ts  # Share token resolver (302 redirect)
└── layout.tsx              # Root layout (fonts, providers, Sentry)
```

### Page-by-Page Breakdown

#### Landing Page (`/`)

- **Hero section:** Aurora animated background, floating tech icons, headline, CTA buttons
- **Features section:** Bento grid layout, background boxes animation
- **Social proof:** Top 5 leaderboard preview (`SocialProofSection`)
- **CTA footer strip:** Secondary conversion

Requires no auth. Server component by default.

#### Problems List (`/problems`)

- **Filters bar:** Difficulty (EASY/MEDIUM/HARD), category dropdown, solved/unsolved toggle
- **Search:** fuse.js fuzzy search (client-side, instant results)
- **Grid:** `ProblemCard` with `DifficultyBadge`, requirement count, category tag, solved indicator
- **Infinite scroll:** `useInfiniteProblems()` hook
- **Loading state:** `SkeletonCard` grid

#### Game Canvas (`/problems/[slug]`)

**Layout (3-column):**
```
┌─────────────────────────────────────────────────────────────────┐
│ Navbar                                                          │
├───────────────┬────────────────────────────────────────────────┤
│               │ GameHeader (timer, slot counter, submit button) │
│ Requirements  ├────────────────────────────────────────────────┤
│ Sidebar       │                                                │
│ (300px)       │         React Flow Canvas                      │
│               │                                                │
│               │                                                │
└───────────────┴────────────────────────────────────────────────┘
│ ComponentPalette (horizontal chip strip at bottom)             │
└────────────────────────────────────────────────────────────────┘
```

**State machine:**
```
Load problem detail
  → Select requirement 1
  → Fetch requirement graph
  → Render canvas (blank slots + revealed nodes)
  → User drags palette chips onto blank slots
  → User clicks Submit
  → POST /submissions
    → passed && !isLastRequirement:
         show CompactResult banner → "Next" → increment currentRequirementOrder
    → passed && isLastRequirement:
         show ResultOverlay (full modal, confetti)
    → !passed:
         show ResultOverlay (score + slot breakdown + retry)
```

#### Dashboard (`/dashboard`)

- XP total + level display
- Streak badge + calendar heatmap (AreaChart)
- Solved count + pass rate
- Category breakdown (PieChart)
- Recent submission history table

Requires auth. Redirects to `/login` if unauthenticated.

#### Leaderboard (`/leaderboard`)

- Top 50 users ranked by XP
- Avatar, username, level, XP columns
- Current user highlighted if logged in
- Redis-cached (60s TTL); shows cache freshness indicator

#### Public Profile (`/profile/[username]`)

- User header (avatar, display name, username, XP, level, streak)
- Solved count + category breakdown bar chart
- Activity heatmap (last 90 days)
- No auth required

#### Admin Dashboard (`/admin`)

Role: `ADMIN` only. Non-admin users see a 403 page.

- Platform stats cards (total users, problems, submissions, DAU)
- Problem management table (edit, publish/unpublish, delete)
- User management table (role assignment)
- RequirementBuilder: drag-to-add nodes/edges, set blank slots, define answer key

---

## 7. Game Canvas

### React Flow Configuration

```typescript
<ReactFlow
  nodeTypes={nodeTypes}          // useMemo — never recreate inline
  edgeTypes={edgeTypes}          // useMemo — never recreate inline
  fitView
  fitViewOptions={{ padding: 0.2 }}
  minZoom={0.5}
  maxZoom={1.5}
  panOnDrag={true}
  zoomOnScroll={true}
  nodesDraggable={false}         // Nodes are fixed; only palette chips are draggable
>
  <Background variant="dots" />
  <Controls />
  {nodeCount > 8 && <MiniMap />}
</ReactFlow>
```

### Custom Node Types

| Type | Component | States |
|------|-----------|--------|
| `blankSlotNode` | `BlankSlotNode` in `GameNodes.tsx` | Empty (orange dashed + pulse), DragOver (solid border + scale-105 + glow), Filled (white bg + component icon + remove button on hover) |
| `componentNode` | `ComponentNode` in `GameNodes.tsx` | Default (icon + label + hover tooltip), — |
| `filledSlotNode` | `FilledSlotNode` in `GameNodes.tsx` | Filled state after drop |
| `actorNode` | `ActorNode` in `GameNodes.tsx` | Non-interactive; user/client icon |

### Custom Edge Types

| Type | Component | Description |
|------|-----------|-------------|
| `labelEdge` | `LabelEdge.tsx` | Animated bezier with optional text label |

### Drag-and-Drop (DnD Kit)

- `@dnd-kit/core` exclusively — never HTML5 native drag-and-drop (conflicts with React Flow pan)
- `ComponentPalette` renders draggable chip items
- `BlankSlotNode` renders droppable drop zones
- Drop fires `onDrop(nodeId, componentTypeSlug)` → updates local slot state
- Submit collects all filled slots → `SubmissionRequest`

### BlankSlotNode Visual States

| State | Border | Background | Animation |
|-------|--------|-----------|-----------|
| Empty | Orange dashed 2px | Transparent | `animate-slot-pulse` (scale 1→1.03→1) |
| DragOver | Orange solid 2px | Orange 10% opacity | `scale-105`, glow shadow |
| Filled | None | White / `--slot-filled` | Bounce in on drop |

---

## 8. Accessibility

| Requirement | Implementation |
|-------------|---------------|
| Reduced motion | `useReducedMotion()` → skip decorative animations |
| Keyboard navigation | All interactive elements have `:focus-visible` styles |
| ARIA labels | BlankSlotNode: `aria-label="Drop zone: [slot title]"` |
| Modal | `aria-modal`, focus trap, Escape to close |
| Color contrast | All tokens meet WCAG AA in both light and dark mode |
| Screen readers | `sr-only` class for visually hidden labels on icon-only buttons |
