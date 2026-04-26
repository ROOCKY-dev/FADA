---
tags:
  - spec
  - design
  - p1
date: 2026-04-23
status: approved
phase: P1 (v0.1)
related:
  - "[[../index]]"
  - "[[../More/UI-UX]]"
---

# FADA | فضاء — P1 UI/UX Design Spec

**Version:** v0.1
**Status:** Approved (brainstorm complete)
**Owner:** Ahmed
**Date:** 2026-04-23

---

## 1. Overview

P1 delivers a working MVP content browser for FADA — a fully navigable web app that pulls real metadata from TMDB/IMDb, lets users browse, search, discover, and curate a watchlist, with **no playback** (playback lands in P2). The design establishes the visual language, component system, and contribution surface that every subsequent phase builds on.

The identity metaphor is **the night sky**, chosen because the project is named فضاء (space/cosmos). The metaphor is applied surgically — 80% familiar streaming-app language anchors daily use; 20% constellation playpens (Home hero, Collections) carry the signature. The philosophy follows the "Novelty without Alienation" principle: the user should say *"I've never seen that before… but of course it works this way."*

### 1.1 Goals

1. A fully responsive, RTL-first web app with Arabic-only UI copy (i18n plumbing ready for later languages).
2. Browse, Search + Discover, Detail, Collections, and Watchlist surfaces for Movies and Shows, powered entirely by TMDB.
3. A visual language and component system that can be reused by every future phase without rework.
4. An editorial contribution surface: community PRs can add curated collections by dropping a JSON + cover image.
5. Static-export ready so FADA can ship as GitHub Pages / Cloudflare Pages / any static host, with zero required server infrastructure.

### 1.2 Non-goals (deferred)

- Any playback, player UI, or stream URL resolution (→ P2).
- Provider/embed logic, scraping layer, fallback chain (→ P2).
- Progress tracking, "Continue Watching" rail (→ P2).
- Subtitles (→ P2).
- User accounts, cross-device sync (not planned).
- IPTV, Manga/Comics, Live Sports beyond disabled "Coming Soon" nav entries (→ P4/P5).
- Mobile APK wrappers, PWA install (deferrable).
- A second UI language beyond Arabic (plumbing ready, strings deferred).

### 1.3 Decisions carried in from brainstorming

| # | Decision | Answer |
|---|---|---|
| Q1 | P1 output | Working MVP (real TMDB data, no playback) |
| Q2 | Platform | Web app |
| Q3 | Framework | Next.js |
| Q4 | Navigation | Right-anchored persistent sidebar |
| Q5 | Placeholders | Grouped under collapsed "More" |
| Q6 | Collections | TMDB collections + curated editorial |
| Q7 | Language | Arabic-only (plumbing i18n-ready) |
| Q8 | Persistence | localStorage + export/import JSON |
| Q9 | TMDB auth | Shipped public read-access token, user-supplied token fallback |
| Q10 | Home content | Editorial hero + regional rails + trending |
| Q11 | Detail depth | Rich content, no playback stub (playback → toast) |
| Q12 | Search | Search + Discover (combined page) |
| Q13 | Settings | Standard + TMDB token management |
| Q14 | Responsive | Fully responsive + TV-friendly |
| Q15 | "What If?" anchor | Night sky — Constellation as Structure (80/20) |

---

## 2. Visual language

### 2.1 Palette (60-30-10)

All values are starting points to validate in the moodboard; contrast ratios must be preserved on any tuning.

| Role | Token | Hex | Usage |
|---|---|---|---|
| Dominant 60% | `bg.base` | `#0B0D14` | Page background |
| Dominant 60% | `bg.surface` | `#12151F` | Elevated surfaces (cards, sheets) |
| Secondary 30% | `fg.muted` | `#8A93AB` | Muted text, dividers, strokes |
| Accent 10% | `accent.gold` | `#E6B64A` | Buttons, focus rings, active nav, rating stars |
| Text | `fg.primary` | `#E8ECF5` | Primary text (WCAG AAA on base, ~14:1) |
| Semantic | `danger` | `#E5484D` | Errors, destructive confirmations |
| Semantic | `success` | `#2E844A` | Import success, confirmations |

All interactive elements meet WCAG AA minimum (4.5:1 for body, 3:1 for large text).

### 2.2 Typography

- **Arabic primary:** IBM Plex Sans Arabic (open-source, variable weight, excellent RTL/bidi).
- **Monospace numerics:** IBM Plex Mono — runtimes, years, episode numbers, ratings. Metaphor enters typography here without touching legibility ("star catalog" feel).
- **Scale (px):** 12 / 14 / 16 / 18 / 22 / 28 / 36 / 48. Base 16. Ratio ~1.25.
- **Weights:** 400 (body), 500 (UI labels), 600 (card titles), 700 (headings).

### 2.3 Motion

- **Library:** Motion One (~3KB, Web Animations API) for all micro-motion.
- **Signature:** Lottie for pulsing-star loading + empty states (single designer-crafted loop, reused).
- **Tokens:** fast 120ms / normal 220ms / slow 400ms. Easing `cubic-bezier(0.2, 0.8, 0.2, 1)`.
- **Reduced motion:** `prefers-reduced-motion` disables parallax, starfield drift, card lift; fades and Lottie loops preserved (subtle single cycle for loader legibility).

### 2.4 Iconography

Lucide React. Stroke weight consistent across the set. Directional glyphs (chevrons, arrows) mirrored automatically by direction; non-directional icons unchanged.

### 2.5 Logo mark

The Arabic "ف" (from فضاء) drawn as 3–5 linked star points — constellation as wordmark. Static in the sidebar (unchanged anchor per Never-Weird test #3); subtle breathing pulse only on hover. SVG asset at `public/logo/fa.svg`.

### 2.6 Spacing and radii

- **Spacing scale:** 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64.
- **Radii:** 4 / 8 / 12 / 24. Cards at 12. Pill/round only for star-discs on the home hero.

---

## 3. Information architecture

### 3.1 Sidebar (right-anchored in RTL)

```
[ف] Logo / brand              →  /
الرئيسية    (Home)             →  /
الأفلام     (Movies)           →  /movies
المسلسلات   (Shows)            →  /shows
المجموعات   (Collections)      →  /collections
قائمتي      (Watchlist)        →  /watchlist
البحث       (Search/Discover)  →  /search
─── divider ───
المزيد ▾    (More — collapsed)
  ├── [قريبًا] IPTV            →  disabled → toast
  ├── [قريبًا] المانجا          →  disabled → toast
  └── [قريبًا] الرياضة المباشرة →  disabled → toast
الإعدادات   (Settings)         →  /settings
```

### 3.2 Routes

| Route | Purpose |
|---|---|
| `/` | Home (hero constellation + rails) |
| `/movies` | Movies browse (filters + infinite grid) |
| `/shows` | Shows browse (filters + infinite grid) |
| `/collections` | Collections index — Editorial (default) + TMDB tabs |
| `/collections/curated/[slug]` | A curated editorial collection |
| `/collections/tmdb/[id]` | A TMDB official collection |
| `/title/movie/[tmdbId]` | Movie detail |
| `/title/tv/[tmdbId]` | Show detail (seasons/episodes inline) |
| `/watchlist` | Local watchlist grid |
| `/search` | Unified Search + Discover |
| `/settings` | Preferences, TMDB token, export/import, about |

### 3.3 Global affordances

- **No global header** (keeps screen real estate for content).
- **Floating search pill** in the top-left corner (empty space opposite the sidebar in RTL). Icon-only by default; expands to input on click or `/` shortcut; shrinks to icon on scroll beyond 120px; `Esc` collapses.
- **Theme toggle** lives inside Settings (set-and-forget).

### 3.4 Keyboard / remote navigation

- `/` — focus floating search pill
- `G` then `H/M/S/C/W` — jump to Home / Movies / Shows / Collections / Watchlist (Vim-style)
- Arrow keys — navigate grids and rails
- `Enter` — activate focused item
- `Esc` — close drawers, dialogs, shrink search pill
- Long-press `Enter` on a card — toggle watchlist quick-action
- First load focuses the first item of the first rail (TV-friendly).

### 3.5 "More" section behavior

Disabled entries are clickable; each shows a toast ("قريبًا في الإصدار 1.1 — IPTV" etc.). No route leads to a broken page.

---

## 4. Page specifications

### 4.1 Home (`/`)

Rails in order (RTL horizontal scroll, chevron at far-left, keyboard-arrow navigable):

1. **Hero constellation** — full viewport-height canvas (§6.1).
2. **Trending Globally**
3. **Popular Arabic Movies** (covers MENA)
4. **Trending Anime**
5. **Popular Turkish Dramas**
6. **Popular Korean Dramas**

Each rail: title on the right, "عرض الكل →" link on the left. 7 posters visible on desktop, 4 on tablet, 2.5 on mobile (peeking).

### 4.2 Movies (`/movies`) and Shows (`/shows`)

Identical shape; different TMDB endpoints.

- **Filter bar** (sticky): genre chips, year range slider, original-language select, sort (Popular / Top Rated / Newest / Highest Rated). Collapses into a Sheet below 768px.
- **Grid:** infinite scroll; poster cards with title + year below. Columns: 6 desktop / 4 tablet / 2 mobile.
- **Empty state:** `<StarEmptyState>` with "لا توجد نتائج — جرّب تعديل المرشحات".
- Filter state lives in the URL (`?genre=28&year=2020-2025&sort=popular`).

### 4.3 Collections (`/collections`)

Two tabs:

- **Editorial (default)** — curated lists shipped in `content/collections/`. Each shown as a **constellation card** (§6.2).
- **TMDB** — TMDB official collections. Same card treatment.

Deep page `/collections/[type]/[id|slug]`:

- Full-width constellation hero (the playpen, §6.1).
- Standard poster grid below listing the same titles (the anchor — always reachable).

### 4.4 Movie detail (`/title/movie/[tmdbId]`)

- **Hero:** backdrop (darkened gradient into page), poster right-aligned in RTL, title, year, runtime, genres, rating (star + number), "قائمتي +" button, external IMDb link.
- **Tabs:**
  - **Overview** — description + trailer embed (TMDB videos endpoint).
  - **Cast & Crew** — top 10 cast, clickable → `<CastDrawer>` with bio + TMDB credits.
  - **Reviews** — TMDB reviews, paginated.
  - **More info** — production companies, keywords, alt titles, external IDs.
- **"Similar" rail** at bottom.
- **"Part of [Collection name]"** card if the movie belongs to a TMDB collection; links to that collection's constellation page.
- **No playback stub.** Any playback trigger (trailer controls unaffected) → toast "المشاهدة قادمة في الإصدار 0.2".

### 4.5 Show detail (`/title/tv/[tmdbId]`)

Same hero + tabs as Movie, plus:

- **Seasons selector** — pill-style tabs (`<SeasonTabs>`), sticky when scrolled.
- **Episode list** — `<EpisodeRow>` per episode: thumbnail, number (monospace), title, air date, rating, 2-line overview. Click → "coming in v0.2" toast.

### 4.6 Watchlist (`/watchlist`)

- Grid of saved titles (same `<PosterCard>` as browse).
- Filter chips: All / Movies / Shows.
- Sort: Added (newest first) / Alphabetical / Rating.
- **Empty state:** `<StarEmptyState>` with "قائمتك فارغة — أضف عنوانًا من أي صفحة".

### 4.7 Search + Discover (`/search`)

Two modes on one page:

- **Search mode** (default when query present) — TMDB multi-search; mixed grid with a type badge on each card.
- **Discover mode** (default when no query) — filter panel (type / genre / year range / region / original language / sort) driving TMDB `/discover`. Results update live.
- **Recent searches** — chips under the input, last 10, deduped, clearable.

### 4.8 Settings (`/settings`)

Sections in order:

1. **عام (General)** — region preference (affects Home rails), theme (dark default / light / system), poster density (comfortable / compact).
2. **بياناتي (My Data)** — Watchlist export (download `.json`), import (upload `.json`), clear cached metadata, reset all data (confirm dialog).
3. **TMDB** — token status badge (shipped / custom), rate-limit info, "استخدم مفتاحًا خاصًا" input.
4. **حول (About)** — version, license, GitHub link, credits.

---

## 5. Constellation playpens

The metaphor's two homes. Contained so failure doesn't break daily use.

### 5.1 Home hero

- **Canvas:** Canvas2D (not WebGL — simpler, perf-safe on low-end). Size: 100vw × 80vh desktop, 70vh tablet, 60vh mobile.
- **Backdrop:** ~120 ambient stars, random positions, 3 size tiers. Very slow parallax tied to mouse (max ±8px) and scroll (max ±20px). Twinkle = subtle opacity sine wave with per-star phase offset.
- **Foreground:** the featured editorial collection — 5–9 titles. Each is a **star node**: poster masked into a soft disc (80px desktop, 56px mobile) with a faint gold glow. Positions laid out from the editorial JSON (hand-placed); fallback: force-directed layout when `nodes[].x/y` missing.
- **Lines:** 1px gold at 20% opacity, connecting adjacent nodes per the JSON's `connections[]`. Fade in sequentially on mount (Motion One stagger, 80ms apart).
- **Interaction:**
  - Hover a star — scale 110%, lines lift to 60% opacity, tooltip shows title + year in IBM Plex Mono.
  - Click — normal route change to the detail page (affordance echo: same outcome as a card click).
- **Caption:** collection title (display size) above the canvas; short description below. Always visible, always legible — the anchor.
- **Perf budget:** render loop pauses when tab is hidden; `prefers-reduced-motion` renders stars static (no twinkle, no parallax).

### 5.2 Collection cards and deep page

- **Card on `/collections`:** mini constellation inside each card — 4–7 star nodes (24px discs), lines, collection name at the bottom. Hover traces the connecting lines drawing-style (0 → 100% length over 400ms). No parallax.
- **Deep page `/collections/.../[slug|id]`:** visually expands into the large hero version (same canvas treatment as Home hero), then a standard poster grid below it.

### 5.3 Editorial authoring format

One JSON per collection, shipped in `content/collections/[slug]/collection.json`:

```json
{
  "slug": "essential-arab-cinema",
  "title": "أساسيات السينما العربية",
  "description": "...",
  "cover": "cover.jpg",
  "nodes": [
    { "tmdbId": 12345, "type": "movie", "x": 0.2, "y": 0.3 },
    { "tmdbId": 67890, "type": "tv",    "x": 0.55, "y": 0.4 }
  ],
  "connections": [[0,1],[1,2]]
}
```

- `x`/`y` normalized to 0–1 so the constellation scales to any canvas size.
- `connections[]` contains index pairs into `nodes[]`.
- Community PRs add a collection by dropping a folder containing `collection.json` + `cover.jpg`.
- `nodes[].x/y` optional — a force-directed fallback lays out arbitrarily-authored collections.

### 5.4 Never-Weird checks (must pass)

1. **"Can I get home?"** — sidebar always visible, logo always links to `/`.
2. **"Can my dad read the text?"** — collection title/description use normal typography above the canvas; star tooltips degrade to tap-to-open on touch.
3. **"One thing didn't change"** — sidebar, logo, and poster card shape are identical here and on every other page.

---

## 6. Component system

Built on **shadcn/ui** (Radix primitives + Tailwind) as the familiar anchor.

### 6.1 Primitives (shadcn, kept vanilla for upstream updates)

Button, Input, Select, Dialog, Sheet/Drawer, Tabs, Toast, Tooltip, DropdownMenu, ScrollArea, Separator, Skeleton, Switch, Slider, Popover.

### 6.2 Custom components (`components/fada/`)

| Component | Purpose |
|---|---|
| `<PosterCard>` | Title poster, fallback star-disc when image fails, badge slot (type/new/rating), hover lift (y: -4px, 220ms). Sizes: `sm` / `md` / `lg`. |
| `<Rail>` | Horizontal scroller, RTL-aware snap points, chevron at the "start" end, keyboard arrow handlers, `title` + `href` slots. |
| `<Sidebar>` | Right-anchored; collapsible to icon-only below 1280px; full drawer below 768px. |
| `<FloatingSearchPill>` | Top-left corner; icon-only default; expands on click/focus; `/` shortcut; `Esc` collapses; shrinks on scroll past 120px. |
| `<Constellation>` | Canvas wrapper. Props: `nodes[]`, `connections[]`, `mode: 'hero' \| 'card'`, `interactive: boolean`. All canvas/motion logic lives here. |
| `<StarLoader>` | Lottie-backed loading animation. |
| `<StarEmptyState>` | Lottie + `title` + `description` + optional action slot. |
| `<FilterBar>` | Genre chips, year range, sort, language. Sticky; collapses to Sheet on mobile. |
| `<CastDrawer>` | Right-side Sheet with bio and other known works. |
| `<EpisodeRow>` | Thumbnail, number (monospace), title, date, rating, overview. Click → "v0.2" toast. |
| `<SeasonTabs>` | Pill-style tab row, RTL ordered, sticky when scrolled. |
| `<WatchlistButton>` | Icon-only, toggles filled gold when saved; `aria-pressed` accurate; immediate local update via Zustand store. |
| `<Toast>` | Extends shadcn Toast with gold accent; used for "v0.2" placeholders and settings confirmations. |

### 6.3 Motion contract

All custom components consume the tokens from §2.3. No component defines its own motion timing.

### 6.4 File layout

```
components/
  ui/             # shadcn primitives (vanilla)
  fada/           # custom components
  constellation/  # canvas code, isolated so it can be lazy-loaded
```

---

## 7. Responsive and device strategy

Per Q14: fully responsive + TV-friendly.

### 7.1 Breakpoints

| Name | Range |
|---|---|
| mobile | < 768px |
| tablet | 768–1023px |
| desktop | 1024–1439px |
| wide | 1440–1919px |
| tv | ≥ 1920px |

### 7.2 Layout per breakpoint

| Element | mobile | tablet | desktop | wide | tv |
|---|---|---|---|---|---|
| Sidebar | hamburger drawer | icon-only 64px | icon-only 72px | full 240px | full 280px |
| Bottom nav | 5 items | — | — | — | — |
| Grid columns | 2 | 4 | 6 | 7 | 8 |
| Rail visible posters | 2.5 | 4 | 7 | 8 | 10 |
| Hero height | 60vh | 70vh | 80vh | 80vh | 70vh |
| Filter bar | Sheet | sticky compact | sticky full | sticky full | sticky full |
| Floating search | pill (compact) | pill | pill | pill | pill + larger hit target |

### 7.3 Mobile bottom nav (<768px)

`الرئيسية · الأفلام · المسلسلات · قائمتي · المزيد`. "More" opens the full sidebar drawer. Sidebar becomes the drawer — no second nav.

### 7.4 TV / 10-foot UI

- Visible default focus on page load (first rail's first item). `tabindex` managed per grid/rail.
- Focus ring: gold accent, 3px, 2px offset — readable at 3m.
- Keyboard model: arrows to move, Enter to activate, Back/Escape to go up one level. Long-press Enter → watchlist quick-toggle.
- Hover-only effects (tooltips, constellation line traces) have focus equivalents.
- No mouse-required gestures.

### 7.5 Touch

- Rails swipe with momentum (native overflow scroll + CSS `scroll-snap-type`).
- No hover effects on touch devices (`(hover: none)` media query).
- Long-press reveals quick-actions menu on poster cards.

---

## 8. RTL, i18n, accessibility

### 8.1 RTL

- Root `<html dir="rtl" lang="ar">`.
- CSS **logical properties** only (`margin-inline-*`, `padding-inline-*`, `inset-inline-*`). No `left`/`right` in component styles.
- **Mirrored:** sidebar (right-anchored), rail scroll start, chevrons, progress bars, toasts (top-left corner).
- **Not mirrored:** posters, backdrops, trailer thumbnails, the constellation canvas (normalized coordinates laid out as authored).
- **Numerals:** Western digits by default (TMDB data is English-numeric). Future Settings toggle to switch to Arabic-Indic digits.
- **Mixed-direction:** Latin titles wrapped with `unicode-bidi: isolate` + `direction: ltr`.

### 8.2 i18n

- Library: **next-intl**.
- All UI strings in `messages/ar.json`. Hard-coded Arabic in components is a lint error.
- Dates: `Intl.DateTimeFormat('ar-EG')`.
- Numbers in prose copy: `ar-EG` locale.
- Numbers in monospace numerics (runtimes, ratings, episode numbers): Western digits (the "star catalog" aesthetic).
- Adding a second language later: one new JSON + a `<LocaleSwitcher>` in Settings. No component changes needed.

### 8.3 Accessibility (WCAG 2.2 AA, AAA where cheap)

- **Contrast:** AA minimum across the board; primary body text meets AAA.
- **Keyboard:** every interactive element reachable; focus ring is the gold accent (3px, 2px offset) — consistent desktop and TV.
- **Skip link** to main content (visible on focus).
- **ARIA:** handled by Radix primitives under Dialogs, Tabs, Menus, etc.
- **Constellation canvas:** each star is mirrored as a real `<a>` in the DOM with `aria-label` (title + year + "part of collection X"), visually hidden but focusable in author-defined order. Canvas itself `aria-hidden`.
- **Images:** `alt` = title + "ملصق"; decorative stars get `role="presentation"`.
- **Forms:** labels associated; errors linked via `aria-describedby`.
- **Motion:** `prefers-reduced-motion` respected across all animations.
- **Zoom:** layouts intact up to 200% browser zoom; all sizing in `rem`.
- **No color-only signals:** watchlist "saved" uses gold fill + aria-text.

### 8.4 Never-Weird acceptance criteria

1. From every route, the logo is visible and returns to `/`.
2. Body text contrast ≥ 4.5:1 (axe-core pass).
3. Sidebar, logo, and poster card shape identical across Home, Browse, Detail, Watchlist, Collections.

---

## 9. Data and state

### 9.1 TMDB access

- Shipped **public v4 read-access token** in `NEXT_PUBLIC_TMDB_TOKEN` (env var, baked into static bundle — it's public by design).
- User-supplied token: stored at `localStorage["fada.tmdb.customToken"]`. Custom takes precedence over shipped.
- **Single client** `lib/tmdb/client.ts` — the only place that holds the token and issues fetches. Swapping the token, adding retry, or proxying later happens here.
- **Image CDN:** `image.tmdb.org`. Next/Image `loader` configured for TMDB. Standard widths: `w92` / `w185` / `w342` / `w500` / `w780` / `original`.

### 9.2 Caching

- `@tanstack/react-query` for all TMDB queries.
- **Stale times:** trending/popular 1h; detail pages 24h; collections 24h; search 5m; discover 15m.
- **Persistence:** `persistQueryClient` writes cache to `localStorage["fada.rq.v1"]`. Bumping `v1` invalidates on schema changes.
- **Cache size cap:** 5MB soft limit; oldest entries evicted.

### 9.3 LocalStorage schema

Single root key `fada.v1`:

```ts
{
  version: 1,
  watchlist: Array<{ id: number, type: 'movie'|'tv', addedAt: string }>,
  preferences: {
    region: 'MENA' | 'global',
    theme: 'dark' | 'light' | 'system',
    posterDensity: 'comfortable' | 'compact'
  },
  recentSearches: string[],    // last 10, deduped
  tmdb: { customToken: string | null }
}
```

- Versioned from day one. Sequential migrators run on load when `version` is below current.
- All reads/writes go through `lib/storage/*` with Zod schema guards. Direct `localStorage.setItem` in components is a lint error.

### 9.4 Watchlist export/import

Export (Settings → My Data → Export) downloads `fada-watchlist-YYYY-MM-DD.json`:

```json
{
  "fada_export_version": 1,
  "exported_at": "2026-04-23T11:00:00Z",
  "watchlist": [
    { "id": 550, "type": "movie", "addedAt": "2026-04-22T09:00:00Z", "title": "Fight Club" }
  ]
}
```

- `title` is for human readability; TMDB `id` + `type` is the identity on import.
- Import validates the envelope (version + Zod), merges non-destructively (dedupe by `id+type`), toasts "تم استيراد X عنوانًا".
- Invalid file → error toast, no partial import.

### 9.5 State management

- **Server state** (TMDB) → React Query only.
- **UI state** (drawers, filter bar) → local `useState` or URL params when shareable.
- **User data** (watchlist, prefs) → **Zustand** store, hydrated from localStorage, persisted via middleware.
- **Filters and search query live in the URL** (`?genre=28&year=2020-2025&sort=popular`) — shareable, deep-linkable, back-button friendly.

### 9.6 Error handling

| Case | Behavior |
|---|---|
| TMDB 429 | Exponential backoff (max 3 retries), then banner "الخدمة مشغولة — جرّب مفتاح TMDB خاص من الإعدادات" |
| TMDB 404 on detail | Empty state "ربما حُذف العنوان — عد إلى الرئيسية" with a home link |
| Network offline | Cached data shown if present; otherwise `<StarEmptyState>` "لا يوجد اتصال" |
| Invalid import file | Error toast; no partial import |
| Invalid custom token | Inline error under the input; falls back to shipped token until fixed |

---

## 10. Tech stack and project structure

### 10.1 Stack

| Purpose | Choice |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript strict |
| Styling | Tailwind CSS v4 |
| Primitives | shadcn/ui (Radix) |
| Server state | @tanstack/react-query |
| User state | Zustand |
| i18n | next-intl |
| Motion | Motion One |
| Lottie | lottie-web |
| Icons | Lucide React |
| Validation | Zod |

### 10.2 Build and distribution

- **Static export** (`output: 'export'`). Ships as a folder of HTML/CSS/JS — hostable on GitHub Pages, Cloudflare Pages, Vercel static, or any plain static server.
- **Fonts:** `next/font` with local woff2 for IBM Plex Sans Arabic + Plex Mono, self-hosted under `public/fonts/`.
- **Bundle budgets:** initial JS ≤ 180KB gzipped on Home; constellation canvas chunk ≤ 40KB gzipped, lazy-loaded.

### 10.3 Project structure

```
app/
  layout.tsx                 # RTL, fonts, providers
  page.tsx                   # Home
  movies/page.tsx
  shows/page.tsx
  collections/
    page.tsx
    curated/[slug]/page.tsx
    tmdb/[id]/page.tsx
  title/[type]/[id]/page.tsx
  watchlist/page.tsx
  search/page.tsx
  settings/page.tsx
components/
  ui/                        # shadcn primitives
  fada/                      # custom components
  constellation/             # canvas code (lazy-loaded)
lib/
  tmdb/
    client.ts
    endpoints.ts
    types.ts
  storage/
    schema.ts                # Zod schemas
    store.ts                 # Zustand + persistence
    migrate.ts               # version migrations
  i18n/
  utils/
messages/
  ar.json                    # all UI strings
content/
  collections/               # editorial JSON + cover images
    essential-arab-cinema/
      collection.json
      cover.jpg
public/
  fonts/
  lottie/
  logo/
styles/
  globals.css                # Tailwind base + CSS variables from tokens
tokens/
  design-tokens.json         # single source of truth
tests/
  unit/
  e2e/
```

### 10.4 Config

- ESLint + Prettier with Tailwind plugin.
- Path aliases: `@/components`, `@/lib`, `@/messages`, `@/content`, `@/tokens`.
- `.env.example` documents `NEXT_PUBLIC_TMDB_TOKEN`.

### 10.5 Contribution surface

- `content/collections/` — drop a folder + `collection.json` + `cover.jpg` → community PR adds a curated collection.
- `messages/*.json` — future language files land here.
- `tokens/design-tokens.json` — palette / type / motion values. A small generator emits Tailwind theme + CSS variables so tuning cascades.

---

## 11. Testing, acceptance, and out of scope

### 11.1 Unit (Vitest + @testing-library/react)

- Storage: migrations, Zod validation, watchlist dedupe, export/import round-trip.
- TMDB client: token selection (custom > shipped), retry/backoff, URL construction.
- Constellation: normalized-coord → canvas-coord projection, connection resolution, force-directed fallback.
- Watchlist store: add/remove, idempotency, hydration.

### 11.2 Component (Vitest + jsdom)

- `<PosterCard>` fallback when image fails.
- `<Rail>` keyboard arrow navigation + RTL scroll start position.
- `<FloatingSearchPill>` keyboard shortcut, expand/collapse, scroll shrink.
- `<WatchlistButton>` immediate toggle + `aria-pressed` correctness.

### 11.3 E2E (Playwright)

- Home → detail → watchlist → export → clear → import → watchlist restored.
- Search: type → results → open → back → recent searches persisted.
- Discover: apply filters → URL reflects state → reload restores state.
- Constellation: Tab through hidden anchors → each star reachable with correct label.
- RTL integrity: layout at `dir="rtl"`, rail scroll starts from right, chevrons point left.

### 11.4 Accessibility gates (CI-blocking)

- axe-core scan on every route — zero violations.
- Keyboard-only walk of every page — reachable and operable.
- `prefers-reduced-motion` toggle → canvas/parallax disabled.
- Contrast spot check on token combinations (scripted).

### 11.5 Performance gates (CI-blocking)

- Lighthouse Performance ≥ 90 on Home and a Detail page (desktop + mobile emulation).
- Initial JS ≤ 180KB gzipped on Home.
- Constellation chunk ≤ 40KB gzipped.
- Constellation canvas sustains 60fps on a mid-tier laptop; degrades to static at <30fps or under `prefers-reduced-motion`.

### 11.6 Never-Weird acceptance (codified in E2E)

1. From every route, the logo is visible and returns to `/`.
2. Body text contrast ≥ 4.5:1 (axe-core).
3. Sidebar, logo, and poster card shape identical across Home, Browse, Detail, Watchlist, Collections.

### 11.7 Manual QA before tagging v0.1

- [ ] All UI strings are in `messages/ar.json` (no hard-coded Arabic).
- [ ] RTL rail scroll starts from the right on a fresh load.
- [ ] At least 3 curated collections ship in `content/collections/`.
- [ ] Watchlist export opens cleanly in a text editor and re-imports without loss.
- [ ] TMDB custom-token path works end-to-end.
- [ ] Every "coming soon" placeholder shows a toast, never a broken page.

### 11.8 Out of scope (explicit non-goals for P1)

- Any playback, player UI, stream URL resolution (→ P2).
- Provider/embed logic, scraping layer, fallback chain (→ P2).
- Progress tracking, "Continue Watching" rail (→ P2).
- Subtitles (→ P2).
- User accounts, cross-device sync (not planned).
- IPTV beyond the "Coming Soon" toast (→ P4).
- Manga/Comics reader beyond the "Coming Soon" toast (→ P5).
- Live Sports beyond the "Coming Soon" toast (→ P4).
- PWA install, mobile APK wrappers (deferrable).
- Light-theme visual design beyond token swap (polish later).
- Second UI language beyond Arabic (plumbing ready, strings deferred).

---

## 12. Open questions

None — resolved during brainstorming. Design is ready for implementation planning.

---

## 13. Changelog

- **2026-04-23** — Initial spec written after brainstorming session.
