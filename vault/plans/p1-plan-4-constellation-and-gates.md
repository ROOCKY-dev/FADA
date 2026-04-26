---
tags: [plan, p1]
date: 2026-04-24
status: ready
phase: P1 (v0.1.0) — Plan 4 of 4
depends_on: [p1-plan-1-foundation-and-home.md, p1-plan-2-browse-detail-watchlist.md, p1-plan-3-search-discover-settings.md]
unlocks: [p2-plan-1-resolver-architecture.md]
related:
  - "[[../specs/2026-04-23-fada-p1-ui-ux-design]]"
  - "[[../../DESIGN]]"
  - "[[00-conventions]]"
  - "[[TODO]]"
---

# FADA P1 — Plan 4: Constellation · TV Focus · CI Gates · v0.1 Release

> **Sub-skill.** `superpowers:executing-plans`. Constellation mode builds (Tasks 7, 9, 10) can parallelize once the shared core (Tasks 1–6) is done.

**Goal.** Ship the "20% strange": the constellation canvas on Home hero (60vh, no auto-advance), on Collections index cards (mini variant), and on Collections deep pages (static deep variant). Tighten TV focus. Install the CI gates (axe-core, Lighthouse, Never-Weird, bundle budgets) and tag `v0.1.0`.

**Architecture.** A single `<Constellation>` component owns Canvas2D rendering for all three modes. `components/constellation/` is isolated so `next/dynamic` can code-split it; the component never ships to pages that don't need it. Every star has a DOM-real `<a>` mirror via `<ConstellationAriaMirror>` so screen readers and TV remotes work. Reduced-motion and visibility-hidden handling live inside the component. CI runs on every PR.

**Tech stack (new).** Dev: `@axe-core/playwright`, `@lhci/cli`. No new runtime deps.

**Spec.** `vault/specs/2026-04-23-fada-p1-ui-ux-design.md §5, §7.4, §11`.

**Design deltas honored here (from `DESIGN.md`):**
- §4.1 — Hero 60/50/44vh, no auto-advance, **weekly featured collection** via `content/collections/featured.json`.
- §4.2 — Poster-masked stars with monochrome fallback; retire `nodes[].hue`.
- §4.11 — No force-directed fallback. CI rejects collection PRs missing `nodes[].x/y`.
- Authoring tool `scripts/position-constellation.mjs`.

---

## Scope

### In
- `<Constellation>` + `<ConstellationAriaMirror>` + layout/draw helpers.
- Home hero (mode = `hero`, 60vh).
- Collections index mini-cards (mode = `card`).
- Collections deep hero (mode = `deep`, 80vh static).
- `content/collections/featured.json` pointer.
- Reduced-motion + visibility-hidden behavior.
- TV focus polish (default focus, 3px gold ring at 2px offset, long-press Enter).
- `scripts/position-constellation.mjs` authoring tool.
- `scripts/lint-collections.mjs` CI lint.
- `.github/workflows/ci.yml`.
- axe-core gate (zero violations).
- Lighthouse gate (perf ≥ 90).
- Bundle budget gate.
- Never-Weird E2E suite.
- Manual QA checklist → tag `v0.1-rc.1` → verify → tag `v0.1.0`.

### Out (deferred)
- Light-theme visual polish → P3.
- Second language → post-P5.
- Playback, player, provider adapters → P2.
- Anything in other phases.

---

## Prerequisites

- All P1-1/2/3 tasks complete.
- `content/collections/` has at least three seed editorial collections with hand-placed `nodes[].x/y`.

---

## File structure created / modified

```
app/
├── components/
│   ├── constellation/
│   │   ├── Constellation.tsx                    # new — top-level wrapper
│   │   ├── ConstellationCanvas.tsx              # new — canvas renderer
│   │   ├── ConstellationAriaMirror.tsx          # new — a11y mirror
│   │   ├── layout.ts                            # new — normalized coord math
│   │   ├── draw.ts                              # new — primitives
│   │   ├── useReducedMotion.ts                  # new — hook
│   │   └── Constellation.test.tsx               # new
│   └── fada/
│       ├── HomeHero.tsx                         # new — wraps Constellation + caption
│       ├── CollectionCard.tsx                   # modified — constellation card variant
│       └── CollectionHero.tsx                   # modified — deep page hero
├── content/
│   └── collections/
│       └── featured.json                        # new — pointer to the week's hero collection
├── app/
│   └── page.tsx                                 # modified — use HomeHero instead of placeholder
├── scripts/
│   ├── position-constellation.mjs               # new — local drag tool
│   ├── lint-collections.mjs                     # new — CI lint
│   └── check-bundle-budgets.mjs                 # new — budget assertion
├── .github/
│   └── workflows/
│       └── ci.yml                               # new
├── .lighthouserc.json                           # new
└── tests/
    ├── component/
    │   ├── Constellation.test.tsx
    │   └── HomeHero.test.tsx
    └── e2e/
        ├── never-weird.spec.ts                  # new
        ├── constellation-a11y.spec.ts           # new
        └── axe.spec.ts                          # new — scans every route
```

---

## Task 1: `<Constellation>` scaffold + layout helpers

- [ ] **T1.A — wrapper**
  - `Constellation.tsx` is the single public entry. Props: `{ nodes, connections, mode: 'hero'|'card'|'deep', caption?, featured? }`.
  - Imported via `next/dynamic(() => import(...), { ssr: false })` wherever it's used.
  - Renders a container with both `<ConstellationCanvas>` and `<ConstellationAriaMirror>`.

- [ ] **T1.B — layout.ts**
  - `normalizeToPixels(nodes, width, height) → PixelNode[]`.
  - `buildConnectionPaths(nodes, connections) → Array<{from: PixelNode, to: PixelNode}>`.
  - `computeParallax(mouse, width, height) → {dx, dy}` capped at ±8px.
  - Pure functions, fully unit-testable.

- [ ] **T1.C — draw.ts**
  - Functions: `drawAmbientStar(ctx, star, time)`, `drawConnection(ctx, from, to, opacity)`, `drawStarNode(ctx, node, options)`, `drawPosterMask(ctx, node, image)`, `drawFallbackDisc(ctx, node, title)`.
  - No React. Pure canvas operations.

**Acceptance.** Unit tests cover normalize/denormalize round-trip, parallax caps, connection path ordering.

---

## Task 2: Canvas renderer — ambient + parallax + twinkle

- [ ] **T2.A — ambient stars**
  - 120 stars on hero, 40 on card, 80 on deep. Random positions (seeded by collection slug for determinism across reloads).
  - 3 size tiers; twinkle = subtle opacity sine wave with per-star phase offset.

- [ ] **T2.B — parallax**
  - Mouse parallax max ±8px.
  - Scroll parallax max ±20px (hero only; card/deep don't track scroll).

- [ ] **T2.C — RAF loop + pause**
  - `requestAnimationFrame` render loop.
  - `document.visibilitychange === 'hidden'` pauses the loop; resumes on visible.
  - Throttle canvas size changes via `ResizeObserver` + `requestIdleCallback`.

- [ ] **T2.D — perf fallback**
  - Measure 30-frame rolling avg; if < 30fps sustained for 2s, switch to static render (same positions, no twinkle, no parallax). Log diagnostic event with code `CONSTELLATION_DEGRADED`.

**Acceptance.** On mid-tier laptop: 60fps sustained. Profile under reduced-motion: render-loop inactive.

---

## Task 3: Normalized layout

- [ ] **T3 — coord system**
  - Collection JSON stores `nodes[].x/y ∈ [0, 1]`. Canvas multiplies by its size.
  - Canvas is not mirrored in RTL (DESIGN.md §5.2). Coordinates are absolute as authored.
  - Unit test: a node at `(0.5, 0.5)` renders centered at any canvas size.

**Acceptance.** Resize the window; nodes reflow proportionally; connections follow.

---

## Task 4: Poster-masked star nodes

- [ ] **T4.A — image loading**
  - For each node, load `https://image.tmdb.org/t/p/w185${posterPath}` (w185 is plenty at 80px display size).
  - `Image` object cache keyed by `tmdbId+type` — avoid reloads across mode changes.

- [ ] **T4.B — masking**
  - Circular mask at node center, radius `R` (80px hero / 24px card / 64px deep).
  - Soft gold glow ring (radial gradient) overlaid at `R*2.2`.
  - Faint gold outline `rgba(230,182,74,0.35)` at hover → `0.9` at focus.

**Acceptance.** A node renders with poster image inside a gold-glow disc.

---

## Task 5: Monochrome fallback

- [ ] **T5 — implement**
  - When `posterPath` is null OR the image fails to load OR reduced-motion is active AND `mode !== 'deep'`: render a monochrome gold-fill disc.
  - Fallback content: first **Arabic glyph** of the node title rendered at `R * 0.8` in Plex Sans Arabic Bold 28px.
  - Deep mode falls back to a simple dark-grey disc with the title below.

**Acceptance.** A simulated offline state keeps the constellation readable (DESIGN.md §4.2/§4.6).

---

## Task 6: `<ConstellationAriaMirror>`

- [ ] **T6 — implement**
  - Hidden `<ul role="list" aria-label="{collection title} titles">`.
  - One `<li><a href="/title/{type}/{tmdbId}" aria-label="{title} - {year} - عنصر {i+1} من {N}">{title}</a></li>` per node.
  - Author-defined order.
  - `sr-only` class hides visually; keyboard can focus and activate.
  - The `<canvas>` itself has `aria-hidden="true"`.

**Acceptance.** axe-core: 0 violations. Playwright keyboard walk: tab through all N anchors with focus ring visible.

---

## Task 7: Home hero — 60/50/44vh, no auto-advance

- [ ] **T7.A — `<HomeHero>`**
  - Wraps `<Constellation mode="hero">`.
  - **Reads `content/collections/featured.json`** — a tiny JSON `{ slug: "essential-arab-cinema", valid_until: "2026-05-01" }`. If `valid_until` is past, show the first editorial collection as fallback.
  - Canvas above the fold but smaller: 60vh desktop / 50vh tablet / 44vh mobile.
  - Caption (title + description + CTA row) above the canvas in Arabic prose. CTA: gold "استكشف المجموعة" → `/collections/curated/{slug}`; ghost "أضف إلى قائمتي" → adds all nodes to watchlist in one action.

- [ ] **T7.B — manual prev/next only**
  - Optional: prev/next buttons for power users to cycle editorial collections (only if multiple are marked "featurable"). No auto-advance timer. No pips auto-filling.

- [ ] **T7.C — replace placeholder**
  - `app/page.tsx` swaps the `<HomeHeroPlaceholder>` (from Plan 1 Task 21) for `<HomeHero>`.

**Acceptance.** DESIGN.md §4.1 satisfied — no 80vh hero, no timer.

---

## Task 8: Weekly-featured pointer

- [ ] **T8 — seed**
  - `content/collections/featured.json` with the first week's pick.
  - Document in `docs/contributing.md` how to update it (simple PR that bumps the file).

**Acceptance.** Editing the file and rebuilding switches the Home hero.

---

## Task 9: Mini-constellation on `<CollectionCard>`

- [ ] **T9.A — card variant**
  - Previously plain (Plan 2 Task 16). Now an opt-in prop `variant: 'plain' | 'constellation'`.
  - When constellation: render `<Constellation mode="card">` behind the gradient overlay. Hover traces the connection lines drawing-style (0 → 100% length over 400ms).
  - Plain mode is kept and still used in `<PartOfCollectionCard>` and any low-bandwidth fallback.

- [ ] **T9.B — `/collections` index**
  - Use the constellation variant by default. Both Editorial and TMDB tabs.

**Acceptance.** Hover over a card traces lines; click navigates to the deep page.

---

## Task 10: Deep-page constellation hero

- [ ] **T10.A — `<CollectionHero>`**
  - 80vh constellation on top of the deep page. Mode = `deep`: **static** (no twinkle, no parallax — the page below is the dynamic part).
  - Caption overlay at the bottom-inline-end with title + description.

- [ ] **T10.B — wiring**
  - `/collections/curated/[slug]/page.tsx` and `/collections/tmdb/[id]/page.tsx` swap their plain hero (Plan 2 T18/T19) for `<CollectionHero>`.

**Acceptance.** Deep page scroll reveals the poster grid below the 80vh hero.

---

## Task 11: Reduced-motion path

- [ ] **T11 — implement**
  - `useReducedMotion()` hook returns `matchMedia('(prefers-reduced-motion: reduce)').matches`.
  - Constellation: twinkle off, parallax off, line-stagger replaced with instant render.
  - Ambient stars render static. Nodes render static.
  - Poster-masked star still animates scale on focus (instant, no easing).

**Acceptance.** `page.emulateMedia({ reducedMotion: 'reduce' })` in Playwright sees a static canvas.

---

## Task 12: Visibility-hidden render pause

- [ ] **T12 — implement**
  - Listen for `document.visibilitychange`; when hidden, cancel RAF.
  - On visible, re-request RAF and seed `t0` to avoid a time-warp jump.

**Acceptance.** Switching tabs and returning doesn't show a one-second "catch-up" glitch.

---

## Task 13: CI collection lint

- [ ] **T13 — `scripts/lint-collections.mjs`**
  - Walks `content/collections/*/collection.json`.
  - Asserts for each:
    - Zod schema valid.
    - `nodes.length >= 4 && nodes.length <= 9`.
    - Every node has `x ∈ (0,1)` and `y ∈ (0,1)` (strict exclusive).
    - Every `connections[][0|1]` indexes into `nodes`.
    - No duplicate `tmdbId`.
    - Image cover exists and is ≤ 500KB.
  - **Rejects** (exit non-zero) any collection that lacks `x/y`. Error message: `"collection '<slug>' needs hand-placed node positions. See docs/collections.md for the positioning tool."`
  - Runs as a CI stage and as a pre-commit hook (Husky optional).

**Acceptance.** Breaking a seed's `x/y` makes `npm run lint:collections` exit 1.

---

## Task 14: `scripts/position-constellation.mjs` authoring tool

- [ ] **T14 — implement**
  - Node script: `npm run collection:position <slug>`.
  - Spawns a local HTTP server on an ephemeral port.
  - Opens a static HTML page in the default browser.
  - The page loads the collection JSON, renders each node as a draggable circle over a fake canvas, and shows poster thumbs.
  - User drags nodes; on "save", positions are normalized back to `[0,1]` and written to `collection.json` with a git-friendly formatter.
  - Simple. No frameworks — vanilla HTML + drag handlers.

**Acceptance.** Running the tool on `essential-arab-cinema`, dragging, saving → the JSON diff is positions-only and git-diffable.

---

## Task 15: TV focus polish

- [ ] **T15.A — default focus**
  - On each page's first mount, focus the first interactive element of the first visible rail/grid (already partly covered in Plan 1 Task 19; finalize here).

- [ ] **T15.B — focus ring**
  - CSS: `:focus-visible` outline `3px solid var(--accent-gold)`, `outline-offset: 2px`. No rounded corners clipping; uses outline, not box-shadow, so it wraps irregular shapes.

- [ ] **T15.C — long-press Enter**
  - On `<PosterCard>`, holding `Enter` ≥ 400ms fires the watchlist toggle without navigating. Release before 400ms → navigate.
  - Helper: `lib/utils/keyboard.ts` → `useLongPress(el, { key: 'Enter', threshold: 400, onShort, onLong })`.
  - Announce action via `aria-live`.

- [ ] **T15.D — tests**
  - Component: focus-visible ring present.
  - Component: long-press toggles watchlist.
  - E2E: TV viewport (1920×1080), tab through rails, activate cards.

**Acceptance.** Playwright WebKit + `--window-size=1920,1080` passes.

---

## Task 16: GitHub Actions CI

- [ ] **T16 — `.github/workflows/ci.yml`**
  - Trigger: PRs to `main` and `phase/*`, pushes to `main`.
  - Matrix: Node 20, ubuntu-latest.
  - Stages (per `00-conventions.md §7`): install → typecheck → lint → test (unit+component) → build → test:e2e → axe → lighthouse → bundle-budget → collection-lint.
  - Artifacts: `playwright-report`, `lighthouse-report`, failed-test screenshots.

**Acceptance.** First PR to `main` runs the full pipeline green.

---

## Task 17: axe-core gate

- [ ] **T17.A — spec**
  - `tests/e2e/axe.spec.ts`:
    - Iterate every public route: `/`, `/movies`, `/shows`, `/collections`, `/collections/curated/essential-arab-cinema`, `/collections/tmdb/10`, `/title/movie/550`, `/title/tv/1399`, `/watchlist`, `/search`, `/settings`.
    - For each: `await injectAxe(page); const results = await getViolations(page); expect(results).toEqual([]);`.

- [ ] **T17.B — rule config**
  - WCAG 2.2 AA tags: `wcag2a`, `wcag2aa`, `wcag22aa`.
  - Best-practices tag included.

**Acceptance.** 0 violations on every route.

---

## Task 18: Lighthouse gate

- [ ] **T18.A — `.lighthouserc.json`**
  - `assertions`: `categories:performance >= 0.90` on desktop + mobile emulations.
  - URLs: `/` and `/title/movie/550`.
  - Upload: artifact on PR.

- [ ] **T18.B — CI wire**
  - Stage uses `lhci collect && lhci assert`.

**Acceptance.** `npx @lhci/cli autorun` passes locally against the static build.

---

## Task 19: Never-Weird E2E suite

- [ ] **T19 — `tests/e2e/never-weird.spec.ts`**
  - **Test 1** — Logo home: from every route, logo click lands on `/`.
  - **Test 2** — Anchor shape identity: snapshot the bounding box of sidebar, logo, and a `<PosterCard>` on Home, Browse, Detail, Watchlist, Collections. Assert identical within 2px tolerance.
  - **Test 3** — Contrast spot check: sample 5 token pairs on live DOM, assert AA via a small WCAG contrast helper (`lib/utils/wcag.ts`).
  - **Test 4** — RTL rail scroll origin: first rail's `scrollLeft` matches RTL-start expectation on fresh load.
  - **Test 5** — Reduced-motion respects: enable, load Home, assert no RAF is running after 1s.

**Acceptance.** All five tests green.

---

## Task 20: Bundle budgets

- [ ] **T20 — `scripts/check-bundle-budgets.mjs`**
  - Reads Next.js build manifest (`app/.next/build-manifest.json` + `app-build-manifest.json`).
  - Sums initial JS for `/` and for a detail page; gzip-estimates (fast zlib pass on the built files).
  - Asserts:
    - Home initial JS ≤ 180KB gz.
    - Constellation chunk ≤ 40KB gz.
  - Exit non-zero on breach.
  - CI invokes after `build`.

**Acceptance.** Current build passes with headroom; adding a 200KB dep fails CI.

---

## Manual QA before tagging `v0.1.0`

- [ ] Every UI string is in `messages/ar.json` — no hard-coded Arabic anywhere (lint already enforces; visual pass as a second check).
- [ ] RTL rail scroll starts from the right on a fresh reload in Chrome and Safari.
- [ ] At least 3 curated collections ship in `content/collections/` with correct hand-placed positions.
- [ ] Watchlist export → open in text editor → re-import works without loss.
- [ ] TMDB custom-token path works end-to-end; invalid token falls back gracefully.
- [ ] Every "coming soon" disabled nav shows a ghost disabled affordance (never a toast on click).
- [ ] Every episode row triggers zero toasts; persistent banner visible on `/title/tv/*` Episodes tab.
- [ ] Home hero is 60vh desktop, renders the weekly featured collection, does not auto-advance.
- [ ] Sidebar renders correctly at 375, 768, 1024, 1440, 1920 (five states).
- [ ] Keyboard `/`, `Ctrl/Cmd+K`, `G+H/M/S/C/W`, arrow keys in rails/grids, `Esc` closes drawers — all work.
- [ ] `prefers-reduced-motion` disables twinkle + parallax; constellation stays readable.
- [ ] TV-focus walkthrough at 1920×1080: every interactive element reachable with arrow/Enter only.
- [ ] Lighthouse perf ≥ 90 on Home + Detail, desktop + mobile.
- [ ] axe-core 0 violations on every route.
- [ ] Bundle budgets hold.

---

## Task 21: Release process

- [ ] **T21.A — `v0.1.0-rc.1`**
  - Bump `package.json` version.
  - Draft release notes in `docs/release-notes/v0.1.0.md` (seeded from conventional-commit log).
  - Tag `git tag -a v0.1.0-rc.1 -m 'P1 release candidate 1'`.
  - GitHub release = `pre-release`. Attach `dist-v0.1.0-rc.1.tar.gz` (the static export).

- [ ] **T21.B — Manual QA**
  - Run the full manual QA checklist above against the pre-release. File any regressions as issues, fix, cut `rc.2` if needed.

- [ ] **T21.C — `v0.1.0`**
  - Once QA is clean: tag `v0.1.0`, mark GitHub release as the latest.
  - Attach `dist-v0.1.0.tar.gz` + `source-v0.1.0.zip`.
  - Update `TODO.md §1 Roadmap` — P1 row flips to 🟢 done.
  - Close P1 milestone on GitHub.

---

## Handoff to Phase 2

State at v0.1.0:
- Fully designed, fully navigable content browser. No playback.
- Constellation contained to Home hero + Collections.
- CI gates enforce quality on every PR.
- Lint rules prevent drift on invariants.

Phase 2 starts at `p2-plan-1-resolver-architecture.md`. It must not break any v0.1 gate.
