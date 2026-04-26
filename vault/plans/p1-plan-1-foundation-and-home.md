---
tags: [plan, p1]
date: 2026-04-24
status: in-progress
phase: P1 (v0.1.0) — Plan 1 of 4
depends_on: []
unlocks: [p1-plan-2-browse-detail-watchlist.md, p1-plan-3-search-discover-settings.md, p1-plan-4-constellation-and-gates.md]
related:
  - "[[../specs/2026-04-23-fada-p1-ui-ux-design]]"
  - "[[../specs/2026-04-26-fada-p1-poster-card-redesign]]"
  - "[[../../DESIGN]]"
  - "[[00-conventions]]"
  - "[[TODO]]"
---

# FADA P1 — Plan 1: Foundation & Home

> **Sub-skill.** Run under `superpowers:executing-plans`. Tasks are mostly sequential; parallelism only helps for Task 8 (shadcn primitive installs).

**Goal.** Ship a runnable Next.js 15 static-export web app with an RTL Arabic shell, design-token system, the five-state right-anchored sidebar, the floating search pill, the TMDB client, React Query, Zustand/localStorage user-data store, and a working Home page with six TMDB-powered rails. The constellation hero and CI gates land in Plan 4.

**Architecture.** Next.js 15 App Router with static export. TMDB queries run client-side via React Query using a shipped public v4 read-access token (user override in Settings — Plan 3). User data lives in Zustand with Zod-validated localStorage persistence under a single `fada.v1` root key. Design tokens are authored in JSON, compiled to CSS variables and Tailwind theme via `tokens/generate.mjs`. CSS uses logical properties throughout. All UI copy ships in `messages/ar.json` via next-intl.

**Tech stack (new in this plan).** Next.js 15, TypeScript strict, Tailwind CSS v4, shadcn/ui (Radix), @tanstack/react-query + persistQueryClient, Zustand, next-intl, Motion One, lottie-web, Lucide React, Zod, Vitest, @testing-library/react, Playwright, @axe-core/playwright.

**Spec.** `vault/specs/2026-04-23-fada-p1-ui-ux-design.md`. Where this plan deviates from the spec, the deltas trace to `DESIGN.md §4`.

**Design deltas honored here (from `DESIGN.md`):**
- §4.4 — Sidebar ships all five responsive states in P1, not deferred.
- §4.5 — Arabic min body size 14px (ESLint rule).
- §4.6 — Poster fallback is monochrome; no per-title hue palette.
- §4.7 — Search shortcut is `/` AND `Ctrl/Cmd+K`.

---

## Scope

### In
- Repo scaffolding: `package.json`, Next.js 15, TS strict, ESLint + custom FADA rules, Prettier with Tailwind plugin.
- Tailwind v4 configured from `tokens/design-tokens.json` via a generator.
- Self-hosted IBM Plex Sans Arabic + IBM Plex Mono via `next/font`.
- RTL root layout (`dir="rtl"`, `lang="ar"`).
- next-intl with `messages/ar.json`.
- Zod-validated storage + Zustand store + migration plumbing.
- TMDB client + typed endpoints + Zod response validation.
- React Query provider + `persistQueryClient`.
- shadcn primitives: Button, Input, Select, Dialog, Sheet, Tabs, Toast, Tooltip, DropdownMenu, ScrollArea, Separator, Skeleton, Switch, Slider, Popover.
- Custom components: `<PosterCard>`, `<Rail>`, `<Sidebar>` (five states), `<BottomNav>`, `<FloatingSearchPill>`, `<StarLoader>`, `<StarEmptyState>`, `<LogoMark>` (anchor-wrapped).
- Home `/` with six rails (hero placeholder, filled in Plan 4).
- Stub shells for `/movies`, `/shows`, `/collections`, `/watchlist`, `/search`, `/settings`.
- Static export (`output: 'export'`).
- Vitest + Playwright smoke pass.

### Out (deferred)
- Hero constellation → Plan 4.
- Browse filters + grids + detail pages → Plan 2.
- Search / Discover / full Settings → Plan 3.
- CI workflow + axe-core + Lighthouse gates → Plan 4.
- TV focus polish → Plan 4.

---

## Prerequisites

- Node.js ≥ 20, npm ≥ 10.
- The Next.js project root will live at `/home/ahmed/Projects/Fada | فضاء/app/`. The directory must be created by Task 1; do not pre-create it.
- The user has no TMDB custom token yet; shipped public v4 read-access token is configured via `.env.example` (`NEXT_PUBLIC_TMDB_TOKEN`).

---

## File structure created by this plan

```
app/
├── .env.example
├── .eslintrc.cjs
├── .gitignore
├── .prettierrc
├── README.md
├── next.config.mjs
├── package.json
├── playwright.config.ts
├── postcss.config.mjs
├── tsconfig.json
├── vitest.config.ts
├── app/
│   ├── layout.tsx
│   ├── page.tsx                       # Home (hero placeholder + 6 rails)
│   ├── movies/page.tsx                # stub
│   ├── shows/page.tsx                 # stub
│   ├── collections/page.tsx           # stub
│   ├── watchlist/page.tsx             # stub
│   ├── search/page.tsx                # stub
│   └── settings/page.tsx              # stub
├── components/
│   ├── ui/                            # shadcn primitives (vanilla)
│   ├── fada/
│   │   ├── LogoMark.tsx
│   │   ├── PosterCard.tsx
│   │   ├── Rail.tsx
│   │   ├── Sidebar.tsx
│   │   ├── BottomNav.tsx
│   │   ├── FloatingSearchPill.tsx
│   │   ├── StarLoader.tsx
│   │   └── StarEmptyState.tsx
│   └── providers/
│       ├── QueryProvider.tsx
│       └── IntlProvider.tsx
├── lib/
│   ├── tmdb/
│   │   ├── client.ts
│   │   ├── endpoints.ts
│   │   ├── schemas.ts
│   │   └── types.ts
│   ├── storage/
│   │   ├── schema.ts
│   │   ├── store.ts
│   │   └── migrate.ts
│   ├── query/
│   │   └── client.ts
│   └── utils/
│       ├── cn.ts
│       └── keyboard.ts
├── messages/
│   └── ar.json
├── public/
│   ├── fonts/
│   │   ├── IBMPlexSansArabic-Regular.woff2
│   │   ├── IBMPlexSansArabic-Medium.woff2
│   │   ├── IBMPlexSansArabic-SemiBold.woff2
│   │   ├── IBMPlexSansArabic-Bold.woff2
│   │   └── IBMPlexMono-Regular.woff2
│   ├── lottie/
│   │   └── star-pulse.json
│   └── logo/
│       └── fa.svg
├── styles/
│   └── globals.css
├── tokens/
│   ├── design-tokens.json
│   └── generate.mjs
├── eslint-plugin-fada/                # custom lint rules per 00-conventions §5
│   ├── no-hardcoded-arabic.js
│   ├── no-direct-localstorage.js
│   └── logo-is-anchor.js
└── tests/
    ├── unit/
    │   ├── storage.test.ts
    │   ├── tmdb-client.test.ts
    │   └── keyboard.test.ts
    ├── component/
    │   ├── PosterCard.test.tsx
    │   ├── Rail.test.tsx
    │   ├── Sidebar.test.tsx
    │   ├── FloatingSearchPill.test.tsx
    │   └── LogoMark.test.tsx
    └── e2e/
        └── smoke.spec.ts
```

---

## Task 1: Initialize Next.js 15 project

- - [x] **T1 — scaffold**
  - `cd '/home/ahmed/Projects/Fada | فضاء' && npx create-next-app@15 app --typescript --app --eslint --no-tailwind --src-dir=false --import-alias '@/*'`. (Tailwind is added manually in Task 3 to get v4.)
  - Remove the boilerplate `app/page.tsx` contents (we'll rewrite in Task 21).
  - Commit: `chore(p1-1): bootstrap next 15 app`.

**Acceptance.** `cd app && npm run dev` boots. `/` returns 200.

---

## Task 2: TypeScript strict, ESLint + FADA rules, Prettier

- - [x] **T2.A — tsconfig strict**
  - In `app/tsconfig.json` set `"strict": true`, `"noUncheckedIndexedAccess": true`, `"noImplicitOverride": true`, `"exactOptionalPropertyTypes": true`, `"verbatimModuleSyntax": true`.
  - Add `"paths"` entries: `@/components/*`, `@/lib/*`, `@/messages/*`, `@/tokens/*`.

- - [x] **T2.B — ESLint**
  - Extend `next/core-web-vitals` + `plugin:@typescript-eslint/strict-type-checked` + `plugin:jsx-a11y/recommended`.
  - Wire `eslint-plugin-fada/` (local plugin, see Task 2.C).
  - Add the rules listed in `00-conventions.md §5`, in particular:
    - `no-restricted-syntax` against `left:` / `right:` CSS positioning.
    - `fada/no-hardcoded-arabic`.
    - `fada/no-direct-localstorage`.
    - `fada/logo-is-anchor`.

- - [x] **T2.C — FADA lint plugin**
  - Scaffold `app/eslint-plugin-fada/index.js` exporting `{ rules }`.
  - Implement the three custom rules with AST walkers. Unit test each against a fixture file of valid/invalid cases. Rules live in `app/eslint-plugin-fada/__tests__/`.

- - [x] **T2.D — Prettier**
  - `.prettierrc`: `{ "semi": true, "singleQuote": true, "plugins": ["prettier-plugin-tailwindcss"] }`.
  - `npm run format` = `prettier --write .`.

**Acceptance.** `npm run lint` exits 0 on the empty scaffold; custom rule unit tests pass.

---

## Task 3: Tailwind CSS v4 + globals

- - [x] **T3.A — install**
  - `npm i -D tailwindcss@next @tailwindcss/postcss postcss prettier-plugin-tailwindcss`.
  - `postcss.config.mjs` wires `@tailwindcss/postcss`.

- - [x] **T3.B — globals.css**
  - `styles/globals.css` imports `@import "tailwindcss";` at top, then a `@theme inline { ... }` block consuming CSS variables from `tokens` (wired in Task 4).
  - Base layer resets scrollbar, sets `font-feature-settings: "tnum"` on `.mono`, forces `-webkit-font-smoothing: antialiased`.

- - [x] **T3.C — next.config**
  - `next.config.mjs`: `output: 'export'`, `images.unoptimized: true` (static export requirement), image loader configured for `image.tmdb.org`.

**Acceptance.** `npm run build` succeeds; `out/` directory is produced.

---

## Task 4: Design tokens + generator

- - [x] **T4.A — author tokens**
  - `tokens/design-tokens.json` contains palette, type, spacing, radii, motion, breakpoints exactly as DESIGN.md §5.2–§5.6.
  - Zod-type the tokens in `tokens/schema.ts` so the generator parses against a schema and fails loudly on a drift.

- - [x] **T4.B — generator**
  - `tokens/generate.mjs` reads `design-tokens.json`, emits:
    - `styles/tokens.css` — CSS custom properties for all token values.
    - `tailwind.theme.generated.ts` — a TS object consumed by `@theme inline`.
  - `package.json` script: `"tokens": "node tokens/generate.mjs"`. Runs automatically via `"predev"` / `"prebuild"`.

- - [x] **T4.C — wire**
  - `styles/globals.css` imports `./tokens.css` before Tailwind.

**Acceptance.** Changing a token and rebuilding propagates to a utility class (e.g., `text-accent-gold`).

---

## Task 5: Self-host fonts

- - [x] **T5 — fonts**
  - Download IBM Plex Sans Arabic (Regular/Medium/SemiBold/Bold) and IBM Plex Mono Regular as `.woff2` into `public/fonts/`.
  - Register via `next/font/local` in `app/layout.tsx`, exposing CSS variables `--font-sans` and `--font-mono` on `<html>`.
  - Set `display: 'swap'` and preload Regular + Bold weights.

**Acceptance.** `/` renders with Plex Sans Arabic on a fresh disk-cache load; DevTools Network shows `woff2` served from self-host, no Google Fonts request.

---

## Task 6: RTL root layout

- - [x] **T6 — layout.tsx**
  - `<html dir="rtl" lang="ar" className={`${sans.variable} ${mono.variable}`}>`.
  - Wrap `children` in `<IntlProvider>` (Task 7) and `<QueryProvider>` (Task 14).
  - Metadata object: title "FADA | فضاء", description (Arabic).
  - Include a visible-on-focus skip link pointing to `#main`.
  - `<main id="main">` wraps `children`; sidebar is a sibling.

**Acceptance.** View source shows `dir="rtl" lang="ar"`. Tabbing on any page reveals the skip link.

---

## Task 7: next-intl + ar.json

- - [x] **T7.A — install**
  - `npm i next-intl`.

- - [x] **T7.B — provider**
  - `components/providers/IntlProvider.tsx`: server-side load `ar.json`, pass to `<NextIntlClientProvider locale="ar" messages={...}>`.

- - [x] **T7.C — messages**
  - `messages/ar.json` seeded with every user-facing string identified in this plan. Use flat keys grouped by surface: `nav.home`, `nav.movies`, `home.rail.trendingGlobal`, `empty.watchlist.title`, etc.
  - Organize by surface in commented sections (JSON doesn't support comments — use key prefixes).

**Acceptance.** Component tests assert `t('nav.home')` returns "الرئيسية".

---

## Task 8: shadcn/ui primitives

- - [ ] **T8 — install primitives**
  - `npx shadcn@latest init` with the palette and base CSS variables from the tokens.
  - Add the 15 primitives listed in Scope. Vendored under `components/ui/`, vanilla — do not modify them for styling; consume tokens via CSS variables.
  - Verify each imports cleanly with tree-shaking (no "server component" bundling surprises).

**Acceptance.** `import { Button } from '@/components/ui/button'` works; click sound fine; a11y-tree shows correct roles.

---

## Task 9: Storage schema (Zod)

- - [ ] **T9 — lib/storage/schema.ts**
  - Export `const FadaV1Schema = z.object({ version: z.literal(1), watchlist, preferences, recentSearches, tmdb })`.
  - `watchlist`: `z.array(z.object({ id: z.number().int(), type: z.enum(['movie','tv']), addedAt: z.string().datetime() }))`.
  - `preferences`: `{ region: 'MENA' | 'global', theme: 'dark'|'light'|'system', posterDensity: 'comfortable'|'compact' }`.
  - `recentSearches`: `z.array(z.string()).max(10)`.
  - `tmdb`: `{ customToken: z.string().nullable() }`.
  - Unit tests: valid shape passes; common malformations fail with a clear path.

**Acceptance.** Schema unit tests green.

---

## Task 10: Zustand store

- - [ ] **T10 — lib/storage/store.ts**
  - Create `useFadaStore` with slices: `watchlist`, `preferences`, `recentSearches`, `tmdb`.
  - Actions: `addToWatchlist(item)`, `removeFromWatchlist(id, type)`, `isInWatchlist(id, type)`, `setPreference(key, value)`, `pushRecentSearch(q)`, `clearRecentSearches()`, `setCustomToken(t)`.
  - Use `subscribeWithSelector` middleware so selectors compile cheaply.
  - Use `immer` middleware.

**Acceptance.** Unit tests for each action. Store compiles without `any`.

---

## Task 11: Storage persistence + v1 migrations

- - [ ] **T11.A — persist**
  - Wrap the Zustand store in a `persist` middleware, storage = `localStorage`, key = `fada.v1`, `version: 1`.
  - Hydration read goes through Zod `safeParse`. On failure, log an internal error with code `STORAGE_PARSE_FAILED` and fall back to defaults (do not crash).

- - [ ] **T11.B — migrate.ts**
  - Implement `migrate(state, fromVersion)` stub that currently only understands version 1. Future plans (P2-3) will add v1→v2.
  - Export a `DEFAULTS` object used on first-run.

- - [ ] **T11.C — tests**
  - Round-trip: seed localStorage with a v1 dump, hydrate, assert identity.
  - Corruption: seed garbage, hydrate, assert defaults and error-log.

**Acceptance.** Unit tests green. Manual reload persists a toggled watchlist item across page reloads.

---

## Task 12: TMDB client

- - [ ] **T12.A — client.ts**
  - `lib/tmdb/client.ts` exports `tmdb.get(path, params)` that:
    1. Resolves the token via Zustand selector (`customToken ?? process.env.NEXT_PUBLIC_TMDB_TOKEN`).
    2. Fetches `https://api.themoviedb.org/3${path}` with `Authorization: Bearer <token>` and `language=ar-SA`.
    3. On 429: exponential backoff, max 3 retries, `Retry-After` honored if present.
    4. On 401 with a custom token: logs `TMDB_CUSTOM_TOKEN_INVALID`, falls back to shipped, emits a one-shot toast (through an event bus hook — Plan 3 wires the actual toast).
    5. Parses the body against a Zod schema (Task 13) and returns `{ data }` or throws `TmdbError { code, status }`.

- - [ ] **T12.B — tests**
  - Unit: token resolution picks custom > shipped.
  - Unit: 429 triggers exponential backoff (verify with fake timers).
  - Unit: 401 + custom token downgrades to shipped.

**Acceptance.** `tmdb.get('/trending/all/week')` returns typed data in a unit test hitting `msw`.

---

## Task 13: Typed TMDB endpoints

- - [ ] **T13.A — schemas**
  - `lib/tmdb/schemas.ts` defines Zod schemas for: `Movie`, `TvShow`, `PaginatedResponse<T>`, `DiscoverQuery`, `TrendingPeriod`.
  - Keep schemas permissive on unknown fields (`passthrough`) but strict on the ones we read.

- - [ ] **T13.B — endpoints**
  - `lib/tmdb/endpoints.ts` exports typed helpers: `trending(period, mediaType)`, `popularArabicMovies()`, `trendingAnime()`, `popularTurkishDramas()`, `popularKoreanDramas()`, `popular('movie'|'tv')`.
  - Arabic rail: `discover('movie', { with_original_language: 'ar', sort_by: 'popularity.desc', region: 'SA|EG|AE' })`.
  - Anime rail: `discover('tv', { with_genres: 16, with_original_language: 'ja', sort_by: 'popularity.desc' })`.
  - Turkish: `discover('tv', { with_original_language: 'tr', sort_by: 'popularity.desc' })`.
  - Korean: `discover('tv', { with_original_language: 'ko', sort_by: 'popularity.desc' })`.
  - Browse/detail/cast endpoints are added in Plan 2.

- - [ ] **T13.C — types**
  - `lib/tmdb/types.ts` re-exports inferred types: `export type Movie = z.infer<typeof MovieSchema>` etc.

**Acceptance.** Six rail endpoints compile and each unit-tests against `msw` fixtures.

---

## Task 14: React Query provider + persistence

- - [ ] **T14.A — install**
  - `npm i @tanstack/react-query @tanstack/react-query-persist-client @tanstack/query-sync-storage-persister`.

- - [ ] **T14.B — client**
  - `lib/query/client.ts` exports `makeQueryClient()` with defaultOptions.queries.staleTime set per spec §9.2.

- - [ ] **T14.C — provider**
  - `components/providers/QueryProvider.tsx` wraps `PersistQueryClientProvider` with storage key `fada.rq.v1` and a max-age of 7 days.

- - [ ] **T14.D — per-endpoint stale table**
  - Trending/popular 1h · detail 24h · collections 24h · search 5m · discover 15m.
  - Each `useTrending`, `usePopular...` hook sets its `staleTime` explicitly.

**Acceptance.** Second nav to Home in the same session reads from memory without a network trip (verified in a component test with a spy on the fetcher).

---

## Task 15: `<Sidebar>` — all five responsive states

This is the most DESIGN.md-sensitive component in Plan 1. Build all five per §4.4.

- - [ ] **T15.A — breakpoints**
  - Use Tailwind breakpoints `md` / `lg` / `xl` / `2xl` mapped to spec §7.1 ranges. Custom `tv` breakpoint ≥ 1920px in tokens.

- - [ ] **T15.B — mobile drawer (< 768)**
  - Hidden by default. Opens via `<BottomNav>`'s "More" icon (Task 16) or a top-inline hamburger.
  - Uses shadcn `<Sheet>` slide-in from inline-start (RTL = right edge).
  - Labels visible. Tap outside closes.

- - [ ] **T15.C — tablet icon rail (768–1023)**
  - 64px wide, icon-only, label appears on hover as a tooltip on the inline-end side.

- - [ ] **T15.D — desktop icon rail (1024–1439)**
  - 72px wide, icon-only, same tooltip affordance.

- - [ ] **T15.E — wide labeled rail (1440–1919)**
  - 240px wide. Labels always visible. 3px gold inline-end indicator bar on active row.

- - [ ] **T15.F — tv labeled rail (≥ 1920)**
  - 280px wide. 3px gold focus ring at 2px offset on the focused item. Labels Plex Sans Arabic 16px.

- - [ ] **T15.G — common behavior**
  - Logo is always an `<a href="/">` (FADA lint rule enforces). Logo mark is `<LogoMark>` (Task 18-adjacent).
  - Active route computed from `usePathname()`.
  - Keyboard: `G` then `H/M/S/C/W` jump (spec §3.4). Registered via `lib/utils/keyboard.ts`.
  - "More" section: disabled items show a persistent ghost state with Tooltip on hover. Clicking is inert (spec §5.5 said toast; we changed per DESIGN.md §5.5).

- - [ ] **T15.H — tests**
  - Five component tests (one per breakpoint) verifying:
    - Correct width and visible labels/tooltips.
    - Logo is an `<a href="/">` anchor (not a div).
    - Active route indication.
    - Keyboard jumps.

**Acceptance.** Every breakpoint renders the intended sidebar. Playwright smoke visits at four viewport sizes and assert inline-start edge positions.

---

## Task 16: `<BottomNav>` (mobile)

- - [ ] **T16 — implement**
  - `components/fada/BottomNav.tsx`. Visible only below 768px (`lg:hidden` per Tailwind).
  - Five items: `الرئيسية · الأفلام · المسلسلات · قائمتي · المزيد`.
  - "More" opens the sidebar drawer (Task 15.B).
  - Safe-area-inset aware (iOS home bar).

**Acceptance.** On mobile viewport, the nav renders bottom-fixed, sidebar is hidden by default.

---

## Task 17: `<FloatingSearchPill>`

- - [ ] **T17.A — layout**
  - Top-left corner on Home below hero and on scroll; on Home at rest, sits **inline within the hero top strip** (DESIGN.md §4.1 replaces the prototype's floating-over-hero behavior).
  - Desktop: 44px icon pill by default; expands to 340px with input on focus/hover.
  - Shrinks to icon on scroll > 120px.

- - [ ] **T17.B — shortcuts**
  - `/` focuses and expands (guards: don't trigger inside `<input>`).
  - `Ctrl+K` / `Cmd+K` does the same (detected via navigator platform).
  - `Esc` collapses and blurs.
  - `<kbd>` inside the pill shows the active binding per platform.

- - [ ] **T17.C — tests**
  - Component: keyboard map, expand/collapse, scroll-shrink.
  - Component: platform-detection flip of the `<kbd>` label.

**Acceptance.** All three keyboard paths work in a component test. Hitting `/` inside a `<textarea>` does nothing.

---

## Task 18: `<PosterCard>` asymmetric redesign + monochrome fallback

- [ ] **T18.A — card**
  - `components/fada/PosterCard.tsx`. Sizes: `sm` (120px), `md` (160px), `lg` (200px). Props: `{ tmdbId, type, title, year, rating?, imagePath, size }`.
  - Outer footprint stays rectangular and grid-safe. The asymmetric look comes from internal attached panels, not from changing the layout box.
  - Main poster remains the dominant body. Metadata dock attaches at inline-start of the bottom edge (bottom-right in RTL).
  - Hover lift stays `translateY(-4px)`, 220ms ease.
  - Top inline-end rating pill in mono (only if `rating` provided).
  - Top inline-start watchlist control becomes a distinct attached tab, not a circular floating icon. Wires to Zustand (`useFadaStore`).

- [ ] **T18.B — compact + expanded states**
  - Compact state is the default everywhere: title + one short metadata line.
  - Expanded state appears on both hover and keyboard focus, not hover alone.
  - Expanded state grows the metadata dock **inside the existing card footprint** and reveals the fuller title + richer metadata row.
  - The main card surface remains the primary navigation target. The watchlist tab remains independently clickable and must not trigger navigation.
  - Touch-first contexts stay compact by default; no two-tap expand-then-open model in P1.

- [ ] **T18.C — fallback**
  - When TMDB image returns 404 / no path: render the DESIGN.md §4.6 monochrome fallback. `linear-gradient(160deg, #12151F, #0B0D14)` + 1px stroke + first two Arabic glyphs centered.
  - The fallback is a separate `<PosterFallback>` child so tests can render it directly.

- [ ] **T18.D — tests**
  - Component: renders image when path given.
  - Component: renders fallback when `imagePath` is null.
  - Component: watchlist toggle updates `aria-pressed`.
  - Component: compact state shows the minimum metadata only.
  - Component: hover expands the metadata dock without changing card height.
  - Component: keyboard focus expands the same way as hover.

**Acceptance.** PosterCard tests green. Fallback visually consistent across a grid of 20 missing-image cards. Expanded metadata does not change rail row height or push neighboring cards.

---

## Task 19: `<Rail>`

- - [ ] **T19.A — shell**
  - Horizontal scroller. Snap points at each poster. Scrollbar hidden (Tailwind `scrollbar-none` plugin or custom).
  - Title row with `see-all` link. Chevron overlay on hover (`inset-inline-start` = far-left in RTL = "start" direction in scrollable area).
  - RTL scroll origin: new rails scroll to `scrollLeft = -scrollWidth` (browser behavior for RTL); test this explicitly.

- - [ ] **T19.B — keyboard**
  - Arrow keys move focus among visible posters; wrap-around optional.
  - `Home`/`End` jump to extremes.

- - [ ] **T19.C — rail-level empty state (DESIGN.md §4.12)**
  - If `items.length < 3`, render `<StarEmptyState variant="rail">` with the Arabic message from `messages/ar.json` and an "اقترح إضافة" link.

- - [ ] **T19.D — tests**
  - Component: RTL scroll start, keyboard nav, empty-state activation at n=0,1,2.

**Acceptance.** Playwright smoke confirms rail scroll starts from the right on first paint.

---

## Task 20: `<StarLoader>` + `<StarEmptyState>`

- - [ ] **T20.A — StarLoader**
  - Loads `public/lottie/star-pulse.json` via `lottie-web`. Single loop cycle under reduced-motion.
  - Size variants: `inline` (24px), `block` (80px), `full` (160px).

- - [ ] **T20.B — StarEmptyState**
  - Composition: `<StarLoader size="full" loop={false} />` static final frame + title + description + action slot.
  - Variants: `page`, `rail`, `grid`.

- - [ ] **T20.C — placeholder Lottie**
  - Ship a simple 3-star-pulse Lottie as `public/lottie/star-pulse.json`. Motion designer replaces in P3.

**Acceptance.** Empty watchlist, empty search, empty rail all render correctly.

---

## Task 21: Home `/` — six rails

- - [ ] **T21.A — page**
  - `app/page.tsx` renders:
    1. `<HomeHeroPlaceholder>` — a 60vh gold-on-dark static banner with the editorial title + description, no canvas (Plan 4 swaps this for `<Constellation>`).
    2. `<Rail title={t('home.rail.trendingGlobal')} data={useTrendingWeekly()} />`
    3. `<Rail title={t('home.rail.popularArabicMovies')} data={usePopularArabicMovies()} />`
    4. `<Rail title={t('home.rail.trendingAnime')} data={useTrendingAnime()} />`
    5. `<Rail title={t('home.rail.popularTurkishDramas')} data={usePopularTurkishDramas()} />`
    6. `<Rail title={t('home.rail.popularKoreanDramas')} data={usePopularKoreanDramas()} />`

- - [ ] **T21.B — data hooks**
  - `lib/tmdb/hooks/` directory with one hook per rail, built on `useQuery` + the endpoints from Task 13.

- - [ ] **T21.C — suspense boundaries**
  - Each rail wraps its data-dependent children in `<Suspense fallback={<RailSkeleton />}>`.
  - `<RailSkeleton>` — 7 skeleton `<PosterCard>`s.

**Acceptance.** Network throttled slow-3G: placeholder → skeletons → data. No layout shift (CLS budget).

---

## Task 22: Logo-anchor contract (project-wide)

- - [ ] **T22 — enforce**
  - `<LogoMark>` component always renders bare SVG.
  - Consumers wrap in `<a href="/">` or `<Link href="/">`. Never a `<div>`.
  - `fada/logo-is-anchor` ESLint rule enforces at CI.
  - Sidebar (Task 15) wraps LogoMark with `<Link href="/" aria-label={t('nav.home')} className="...">`. Mobile top bar (if used) does the same.

**Acceptance.** Lint rule fires on a deliberately broken fixture; baseline passes.

---

## Task 23: Stub pages

- [ ] **T23 — stubs**
  - `app/movies/page.tsx`, `shows`, `collections`, `watchlist`, `search`, `settings` each render `<StarEmptyState variant="page" title={t('stub.<page>')} description={t('stub.comingInPlan<N>')}  />` and nothing else.
  - All routes are routable from the sidebar without a 404.

**Acceptance.** Smoke E2E: every sidebar item navigates to its stub page.

---

## Task 24: Static export

- - [ ] **T24 — configure**
  - `next.config.mjs`: `output: 'export'`, `trailingSlash: true`, `images.unoptimized: true`.
  - `npm run build` produces `out/`.
  - `npm run preview` = `npx serve out`.

**Acceptance.** `out/index.html` exists and renders.

---

## Task 25: Vitest + Testing Library

- [ ] **T25 — configure**
  - `vitest.config.ts` with `environment: 'jsdom'`, `setupFiles: ['tests/setup.ts']` (installs jest-dom matchers, mocks `window.matchMedia`).
  - `npm test` script.

**Acceptance.** `npm test -- --run` exits 0.

---

## Task 26: Playwright smoke

- [ ] **T26 — configure**
  - `playwright.config.ts`: projects chromium + webkit, baseURL `http://localhost:3000`, reuse existing server.
  - `tests/e2e/smoke.spec.ts`:
    - Home loads, sidebar visible, logo links to `/`.
    - Navigate to each stub page; each renders `<StarEmptyState>`.
    - Floating search pill keyboard `/` focuses.
    - `Ctrl+K` also focuses.
    - First TAB press reveals skip link.

**Acceptance.** `npm run test:e2e` exits 0 on a fresh machine.

---

## Task 27: Plan 1 acceptance gate

- - [ ] **T27 — gate**
  - `npm run typecheck` — 0 errors.
  - `npm run lint` — 0 errors (custom rules active).
  - `npm test -- --run` — 100% pass.
  - `npm run test:e2e` — 100% pass.
  - `npm run build` — succeeds, `out/` produced.
  - `/` first-paint visual matches DESIGN.md §5.6 Home spec (hero placeholder + 6 rails + right-anchored sidebar + floating search pill + no bottom nav on desktop).
  - All TODO.md §3 P1-1 checkboxes ticked.
  - Manual screenshot sweep at five viewports (375, 768, 1280, 1440, 1920).

---

## Handoff to Plan 2

State at end of Plan 1:
- Shell app is browsable.
- All six stub pages render `<StarEmptyState>`.
- TMDB client, React Query, Zustand, storage, i18n, tokens, fonts, logical-property discipline, lint rules — all in place.
- Home page renders six real TMDB-powered rails with a placeholder hero.

Plan 2 will replace the stubs for `/movies`, `/shows`, `/watchlist`, `/collections` (plain variant), and introduce `/title/[type]/[id]`.

Plan 3 will replace the stubs for `/search` and `/settings`.

Plan 4 will replace the Home placeholder hero with the constellation, replace plain collection cards with constellation variants, and wire CI gates.
