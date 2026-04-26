---
tags: [plan, p1]
date: 2026-04-24
status: ready
phase: P1 (v0.1.0) — Plan 2 of 4
depends_on: [p1-plan-1-foundation-and-home.md]
unlocks: [p1-plan-4-constellation-and-gates.md]
related:
  - "[[../specs/2026-04-23-fada-p1-ui-ux-design]]"
  - "[[../../DESIGN]]"
  - "[[00-conventions]]"
  - "[[TODO]]"
---

# FADA P1 — Plan 2: Browse · Detail · Watchlist · Plain Collections

> **Sub-skill.** `superpowers:executing-plans`. Tasks 4, 5 and 18, 19 can parallelize.

**Goal.** Ship Movies/Shows browse with filters, rich Movie/Show detail pages with cast drawer and episode list, the Watchlist page, and plain (non-constellation) Collections pages. Constellation rendering for Collections is deferred to Plan 4.

**Architecture.** Extends Plan 1's TMDB client with new typed endpoints, React Query with new query keys, Zustand store (reused — `addToWatchlist`/`removeFromWatchlist` already exist). New components compose the shadcn primitives installed in Plan 1. Filter + search state lives in the URL so pages are deep-linkable.

**Tech stack (new in this plan).** None. Shadcn primitives used: `Sheet`, `Tabs`, `Skeleton`, `Dialog`, `Badge`, `Separator`, `DropdownMenu`.

**Spec.** `vault/specs/2026-04-23-fada-p1-ui-ux-design.md §4.2, §4.4, §4.5, §4.6`.

**Design deltas honored here (from `DESIGN.md`):**
- §4.3 — Episode rows: one persistent banner, no per-row toast. Rows are non-activating articles.
- §4.13 — Detail primary CTA in P1 is `"أضف إلى قائمتي"` (gold); `"شاهد · v0.2"` is secondary ghost with "قريبًا" badge.
- §4.6 — PosterCard monochrome fallback reused.

---

## Scope

### In
- `/movies` and `/shows` browse pages with `<FilterBar>` + infinite-scroll `<PosterGrid>`.
- `<DetailHero>` + `<DetailTabs>` (Overview, Episodes for TV only, Cast, Reviews, More).
- `/title/movie/[id]` and `/title/tv/[id]` detail pages.
- `<CastDrawer>` right-side Sheet with bio + other known credits.
- `<SeasonTabs>` + `<EpisodeRow>` with persistent banner.
- `<WatchlistButton>` wired to Zustand + `aria-pressed`.
- `/watchlist` grid with filter chips + sort + empty state.
- `/collections` index (Editorial default + TMDB tabs) with **plain** `<CollectionCard>`.
- `/collections/curated/[slug]` and `/collections/tmdb/[id]` deep pages (plain variant).
- Three seed editorial collections in `content/collections/`.
- "Part of [Collection]" card on detail pages when applicable.

### Out (deferred)
- Constellation on collection cards + collection hero → Plan 4.
- Search / Discover → Plan 3.
- Settings / export-import → Plan 3.
- Continue-watching progress on detail → P2-3.
- Player / trailer playback controls → P2-2.

---

## Prerequisites

- All P1-1 tasks complete.
- `fada.v1` storage contract in place.

---

## File structure created / modified

```
app/
├── app/
│   ├── movies/page.tsx                          # replaces stub
│   ├── shows/page.tsx                           # replaces stub
│   ├── watchlist/page.tsx                       # replaces stub
│   ├── collections/
│   │   ├── page.tsx                             # replaces stub
│   │   ├── curated/[slug]/page.tsx              # new
│   │   └── tmdb/[id]/page.tsx                   # new
│   └── title/
│       ├── movie/[id]/page.tsx                  # new
│       └── tv/[id]/page.tsx                     # new
├── components/fada/
│   ├── FilterBar.tsx                            # new
│   ├── PosterGrid.tsx                           # new
│   ├── DetailHero.tsx                           # new
│   ├── DetailTabs.tsx                           # new
│   ├── CastDrawer.tsx                           # new
│   ├── SeasonTabs.tsx                           # new
│   ├── EpisodeRow.tsx                           # new
│   ├── EpisodesBanner.tsx                       # new — the persistent v0.2 banner
│   ├── WatchlistButton.tsx                      # new
│   ├── ReviewList.tsx                           # new
│   ├── CollectionCard.tsx                       # new (plain variant)
│   └── PartOfCollectionCard.tsx                 # new
├── lib/tmdb/
│   ├── endpoints.ts                             # extended
│   ├── schemas.ts                               # extended
│   └── hooks/
│       ├── useBrowse.ts                         # new
│       ├── useMovieDetail.ts                    # new
│       ├── useTvDetail.ts                       # new
│       ├── useSeasonEpisodes.ts                 # new
│       ├── useCast.ts                           # new
│       ├── useReviews.ts                        # new
│       ├── useMovieCollection.ts                # new
│       └── useTmdbCollection.ts                 # new
├── lib/
│   └── collections/
│       ├── editorial.ts                         # new — reads content/collections
│       └── types.ts
├── content/
│   └── collections/
│       ├── essential-arab-cinema/
│       │   ├── collection.json
│       │   └── cover.jpg
│       ├── turkish-drama-golden-age/
│       │   ├── collection.json
│       │   └── cover.jpg
│       └── 90s-anime/
│           ├── collection.json
│           └── cover.jpg
└── tests/
    ├── unit/
    │   └── collections-editorial.test.ts
    ├── component/
    │   ├── FilterBar.test.tsx
    │   ├── PosterGrid.test.tsx
    │   ├── DetailHero.test.tsx
    │   ├── EpisodeRow.test.tsx
    │   ├── CastDrawer.test.tsx
    │   ├── WatchlistButton.test.tsx
    │   └── CollectionCard.test.tsx
    └── e2e/
        ├── browse.spec.ts
        ├── detail.spec.ts
        ├── watchlist-flow.spec.ts
        └── collections.spec.ts
```

---

## Task 1: Extend TMDB endpoints

- [ ] **T1.A — schemas**
  - Add Zod for: `MovieDetail`, `TvDetail`, `Credits`, `CastMember`, `PersonDetail`, `Review`, `Video`, `Season`, `Episode`, `TmdbCollection`, `Keyword`, `ExternalIds`.

- [ ] **T1.B — endpoints**
  - `movieDetail(id)` · `tvDetail(id)` · `tvSeasonDetail(id, season)` · `credits(type, id)` · `personDetail(id)` · `reviews(type, id, page)` · `videos(type, id)` · `similar(type, id)` · `tmdbCollection(id)` · `discover(type, params)` with full param type.

- [ ] **T1.C — hooks**
  - One hook per endpoint in `lib/tmdb/hooks/`.

**Acceptance.** `msw`-backed unit tests cover each endpoint. Stale times match spec §9.2.

---

## Task 2: `<FilterBar>` + mobile `<Sheet>`

- [ ] **T2.A — layout**
  - Desktop: sticky `top: 0`, `backdrop-blur`, one line of controls: genre chips · year range · language select · sort dropdown.
  - Mobile (< 768): a compact "مرشحات (N)" button opens a `<Sheet>` from inline-end containing the full control set.

- [ ] **T2.B — state**
  - All state lives in the URL (`?genre=28&year=2020-2025&lang=ar&sort=popular`).
  - `useSearchParams` + `useRouter` (App Router). On change, `router.replace` with `scroll: false`.

- [ ] **T2.C — controls**
  - Genre chips from TMDB `/genre/{type}/list` (cached 7d).
  - Year range: `<Slider>` with min 1920, max current year, dual-thumb.
  - Language: `<Select>` with MENA languages on top, then Latin alphabetical.
  - Sort: Popular / Top Rated / Newest / Highest Rated.

- [ ] **T2.D — tests**
  - Component: every control emits URL changes.
  - Component: reading the URL hydrates control state.

**Acceptance.** Navigating `/movies?genre=28&sort=popular` hydrates the filter bar with Action + Popular on first paint.

---

## Task 3: `<PosterGrid>` with infinite scroll

- [ ] **T3.A — layout**
  - Columns: 2/4/6/7/8 at mobile/tablet/desktop/wide/tv (spec §7.2 Comfortable density).
  - `gap: 20px` desktop, `gap: 12px` mobile.

- [ ] **T3.B — infinite**
  - `useInfiniteQuery` with TMDB pagination (1-indexed).
  - Intersection observer sentinel at end of grid fetches next page.
  - Keep 5 pages max in memory; on back-navigation restore scroll.

- [ ] **T3.C — skeleton**
  - `<PosterGridSkeleton>` renders a full grid of skeleton cards for the initial page.

- [ ] **T3.D — empty**
  - `<StarEmptyState variant="grid">` when `pages[0].results.length === 0`.

- [ ] **T3.E — tests**
  - Component: renders 20 cards from a fixture.
  - Component: intersection fires next page.
  - Component: empty state when fixture is empty.

**Acceptance.** Lazy loading smooth; CLS contribution ≤ 0.02.

---

## Task 4: `/movies` browse page

- [ ] **T4 — implement**
  - Head: `<h1>الأفلام</h1>` + sub-line "تصفّح أفلام من كل أنحاء العالم".
  - `<FilterBar type="movie" />`.
  - `<PosterGrid>` consuming `useBrowse({ type: 'movie', params: <from URL> })`.

**Acceptance.** Page renders 20+ movies; filters change URL; back-button restores.

---

## Task 5: `/shows` browse page

- [ ] **T5 — implement**
  - Mirror Task 4 with `type: 'tv'`.
  - Genre list fetched with `tvGenres` (TV-specific list).

**Acceptance.** Parallel to T4.

---

## Task 6: `<DetailHero>`

- [ ] **T6.A — layout**
  - Full-width backdrop (TMDB `backdrop_path`) with inline-end-aligned poster (280px desktop, 180px tablet, inline above meta on mobile).
  - Meta row (mono): year · runtime/episode count · rating (gold star + number).
  - Genre chips.
  - Arabic description (15px body, line-height 1.75).
  - **Primary CTA: `<Button variant="primary">` "أضف إلى قائمتي" / "في قائمتي" with `<WatchlistButton>` icon.**
  - **Secondary CTA: `<Button variant="ghost">` "شاهد · قريبًا" with a "v0.2" badge, disabled.** Toast on click: `"المشاهدة قادمة في v0.2"` (**one toast per session** — debounced; DESIGN.md §4.3).
  - IMDb external link button.

- [ ] **T6.B — tests**
  - Component: primary CTA toggles watchlist state and updates `aria-pressed`.
  - Component: secondary CTA toast fires once per 2s.
  - Component: backdrop has `alt=""` (decorative).

**Acceptance.** Visual matches DESIGN.md §5.6 Detail page; CTAs are in the right order.

---

## Task 7: `<DetailTabs>`

- [ ] **T7.A — tabs**
  - For movies: Overview · Cast & Crew · Reviews · More Info.
  - For TV: Overview · **Episodes** · Cast & Crew · Reviews · More Info.
  - Built on shadcn `<Tabs>`. RTL-ordered.

- [ ] **T7.B — panels**
  - Each tab panel is a child component: `<OverviewTab>`, `<EpisodesTab>`, `<CastTab>`, `<ReviewsTab>`, `<MoreInfoTab>`.

**Acceptance.** Keyboard arrow keys navigate tabs; `Home`/`End` jump.

---

## Task 8: `/title/movie/[id]` page

- [ ] **T8 — implement**
  - Fetch `movieDetail(id)` server-side via Next.js (or client — whichever fits static export). Static-export note: `generateStaticParams` returns the top-500 popular IDs at build; everything else falls back to client-side fetch (CSR).
  - Render `<DetailHero>` + `<DetailTabs type="movie">`.
  - If `movie.belongs_to_collection` present, append `<PartOfCollectionCard collection={...} />`.
  - "Similar" rail at bottom using `useSimilar('movie', id)`.

**Acceptance.** E2E: navigate from a poster → detail → tab switch → back preserves filter state.

---

## Task 9: `/title/tv/[id]` page

- [ ] **T9 — implement**
  - Fetch `tvDetail(id)`.
  - Episodes tab fetches `tvSeasonDetail(id, season)` on demand.
  - Same "Similar" rail.

**Acceptance.** E2E: seasons load lazily; keyboard nav between tabs works.

---

## Task 10: `<SeasonTabs>`

- [ ] **T10 — implement**
  - Pill-style tabs, horizontal scroll if ≥ 10 seasons.
  - Sticky when scrolled past hero (`position: sticky; top: 0`).
  - Active pill gold.
  - State stored in URL: `?season=3`.

**Acceptance.** Ertuğrul-like 5-season show renders all season pills; clicking loads episodes.

---

## Task 11: `<EpisodeRow>` + `<EpisodesBanner>`

- [ ] **T11.A — banner**
  - `<EpisodesBanner>` sits at top of `<EpisodesTab>`. Persistent gold-accented panel.
  - Copy (Arabic): `"🌙 المشاهدة قادمة في v0.2 — تصفّح التفاصيل الآن"` (emoji only if user requests).
  - Dismissible per-session via `sessionStorage['fada.banner.v02.dismissed']`.

- [ ] **T11.B — row**
  - `<EpisodeRow>` is a non-activating article: `role="article"`, `tabindex={0}`, keyboard `Enter` does nothing (focuses but does not navigate).
  - 200px thumbnail · number (mono) + title · 2-line description · airdate + rating on inline-end.
  - Hover: subtle background shift, no lift (doesn't suggest activation).
  - Click: scrolls/focuses the `<OverviewTab>` with the episode's overview expanded.

- [ ] **T11.C — tests**
  - Component: banner renders above rows.
  - Component: row click does NOT fire a toast.
  - Component: keyboard `Enter` on a row focuses overview section.

**Acceptance.** No per-episode toast is ever fired. DESIGN.md §4.3 satisfied.

---

## Task 12: `<CastDrawer>`

- [ ] **T12 — implement**
  - Right-side (inline-end) `<Sheet>`; opens on cast-item click.
  - Contents: large portrait, Arabic name, original name (Latin), birthday (mono), place of birth, biography (Arabic if TMDB provides, else English), "Known for" horizontal strip of their top 8 credits.
  - Closes on `Esc`, on outside click, on route change.

**Acceptance.** Open → scroll inside drawer does not scroll the page.

---

## Task 13: `<ReviewList>`

- [ ] **T13 — implement**
  - Paginated list of TMDB reviews. Each review shows author avatar, author name, rating, date (Arabic format), body (truncated to 5 lines with "اقرأ المزيد" expand).
  - "Show more" loads next page.
  - Empty state when no reviews: `<StarEmptyState>` "لا توجد مراجعات بعد — كن أول من يكتبها على TMDB" with link to the TMDB page.

**Acceptance.** Review body in Arabic uses Plex Sans Arabic 15px, line-height 1.75.

---

## Task 14: `<WatchlistButton>`

- [ ] **T14 — implement**
  - Icon-only variant (for cards) and icon+label variant (for detail hero).
  - `aria-pressed` reflects state.
  - Gold-filled when saved, ghost otherwise.
  - Debounced update to Zustand (no await needed — synchronous).
  - Announces state change to assistive tech via `aria-live="polite"` region: "تمت الإضافة إلى قائمتي" / "تمت الإزالة من قائمتي".

**Acceptance.** Unit test: toggle fires `addToWatchlist` then `removeFromWatchlist`.

---

## Task 15: `/watchlist` page

- [ ] **T15.A — layout**
  - Head: "قائمتي" + count.
  - Filter chips: الكل / أفلام / مسلسلات.
  - Sort dropdown: الأحدث إضافة / أبجدي / التقييم.
  - `<PosterGrid>` consuming `useFadaStore(state => state.watchlist)` → enriched with TMDB details via a batched fetch.

- [ ] **T15.B — empty state**
  - `<StarEmptyState variant="page">` with the SVG constellation animation from the prototype (`UI-UX.Concept/FADA _ فضاء/app.jsx:800–815` — port to SVG under `components/fada/illustrations/`).
  - Action button: "ابدأ الاستكشاف" links to `/`.

- [ ] **T15.C — batched detail fetch**
  - `useWatchlistDetails(items)` hook does a parallel fetch: each watchlist item queried once, React Query dedupes across other pages.

- [ ] **T15.D — tests**
  - Component: empty state when watchlist empty.
  - Component: filter chips narrow results.
  - Component: sort changes order.
  - E2E: add from movies browse → open watchlist → item present.

**Acceptance.** Adding/removing from any page reflects in the watchlist without a reload.

---

## Task 16: `<CollectionCard>` (plain variant)

- [ ] **T16 — implement**
  - 4:3 card. Cover image fills. Gradient overlay from transparent to bg-base at bottom 40%.
  - Bottom inline-start: kicker (mono, gold) + title + count.
  - Hover: subtle border-color shift to gold-at-30%.
  - **No canvas, no constellation.** Plan 4 introduces a `<ConstellationCollectionCard>` variant; this one stays as the plain anchor.
  - Props: `{ kicker, title, count, cover, href, type: 'editorial' | 'tmdb' }`.

**Acceptance.** Grid of 6 plain cards renders identically across reloads (no layout shift).

---

## Task 17: `/collections` index page

- [ ] **T17 — implement**
  - Head: "المجموعات" + subtitle.
  - Two tabs: تحريرية (default) · TMDB.
  - Editorial tab: reads from `content/collections/*/collection.json` at build time via `lib/collections/editorial.ts` (Task 20).
  - TMDB tab: fetches curated TMDB collection IDs (we ship a list of ~50 well-known ones in `content/tmdb-collections.json`).
  - 3-column grid of `<CollectionCard>`.

**Acceptance.** Tab switch keeps scroll position; collection count matches seeds.

---

## Task 18: `/collections/curated/[slug]` page

- [ ] **T18.A — loader**
  - `generateStaticParams` returns all slugs from `content/collections/`.
  - Page reads `collection.json`, derives title list.

- [ ] **T18.B — UI**
  - Plain hero: cover image at 50vh, gradient overlay, title + description overlaid.
  - `<PosterGrid>` below listing the collection's titles, fetched in parallel from TMDB.
  - `<WatchlistButton>` on each card.

**Acceptance.** `/collections/curated/essential-arab-cinema` renders the hand-curated list.

---

## Task 19: `/collections/tmdb/[id]` page

- [ ] **T19 — implement**
  - Fetches TMDB `/collection/{id}`.
  - Mirror of T18 UI with TMDB-provided hero/description.

**Acceptance.** E.g. `/collections/tmdb/10` (Star Wars collection) renders correctly.

---

## Task 20: Seed editorial collections

- [ ] **T20 — seed**
  - `content/collections/essential-arab-cinema/collection.json`:
    ```json
    {
      "slug": "essential-arab-cinema",
      "title": "أساسيات السينما العربية",
      "description": "خمسة عشر فيلمًا شكّلت وجدان السينما في العالم العربي.",
      "cover": "cover.jpg",
      "nodes": [
        { "tmdbId": <id>, "type": "movie", "x": 0.2, "y": 0.3 },
        … at least 7 nodes, each with hand-placed x/y …
      ],
      "connections": [[0,1],[1,2],[2,3]]
    }
    ```
  - Repeat for `turkish-drama-golden-age` and `90s-anime`. Real TMDB IDs.
  - Place cover images (1600×900 JPG compressed to ≤ 200KB).
  - Unit test: `lib/collections/editorial.ts` parses all seeds against Zod without error.

**Acceptance.** Three collections visible in `/collections` editorial tab.

---

## Task 21: `<PartOfCollectionCard>`

- [ ] **T21 — implement**
  - Card shown on movie detail when `belongs_to_collection` present.
  - Cover thumbnail + "يعد هذا الفيلم جزءًا من مجموعة [X]" + link.

**Acceptance.** E2E: visit The Godfather detail → card appears → click → lands on TMDB collection page.

---

## Task 22: Plan 2 acceptance gate

- [ ] **T22 — gate**
  - `npm run typecheck`, `lint`, `test`, `test:e2e` — all green.
  - Visual parity with DESIGN.md §5.6 on five viewports.
  - Watchlist add → open watchlist → item present: E2E covers this.
  - Filter URL deep-link test passes.
  - Cast drawer opens/closes correctly.
  - Episode banner appears; episode rows are non-activating (E2E checks no toast fires).
  - All TODO.md §3 P1-2 checkboxes ticked.

---

## Handoff to Plan 3

After Plan 2 ships:
- Every route except `/search` and `/settings` is fully functional.
- Watchlist round-trip (add → view → remove) works without the UI for export/import yet.
- Collections work with plain cards (no constellation yet).

Plan 3 adds Search + Discover + full Settings (including export/import UI).
Plan 4 upgrades collection cards to constellation variant, adds the Home hero constellation, and wires CI gates.
