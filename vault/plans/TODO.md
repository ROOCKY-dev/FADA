---
tags:
  - index
  - tracker
  - todo
date: 2026-04-24
status: active
---

# FADA | فضاء — Master TODO

> **This file is the single entry point for all implementation work across phases P1–P5.** It indexes every plan file in this folder, tracks high-level progress, and enumerates the release gates for each version. Check items off as they land. When a plan advances, also bump the per-phase status table.
>
> **Do not edit plans inline without advancing status.** If scope changes, update the relevant plan file, update this tracker, and note the change in `## Change log` below.

---

## 0. Project snapshot

- **Project:** FADA | فضاء — open-source, ad-free, Arabic-first streaming middleman.
- **Distribution:** GitHub releases only (no app stores, no monetization).
- **Current state:** Implementation underway in `app/`. P1-1 Foundation & Home is in progress.
- **Working directory for code:** `/home/ahmed/Projects/Fada | فضاء/app/` (Next.js project root, sibling of `vault/`).
- **Design contract:** `/home/ahmed/Projects/Fada | فضاء/DESIGN.md` (final UI/UX, supersedes `vault/specs/` where they disagree).
- **Cross-cutting conventions:** `00-conventions.md` in this folder.
- **Operator manual:** `/home/ahmed/CLAUDE.md` (Claude Code guidance for this repo).

## 1. Roadmap at a glance

| Phase | Version | Name | Status | Plan files |
|---|---|---|---|---|
| **P1** | v0.1.0 | Foundation & UI/UX | 🟡 in progress | [p1-plan-1](p1-plan-1-foundation-and-home.md) · [p1-plan-2](p1-plan-2-browse-detail-watchlist.md) · [p1-plan-3](p1-plan-3-search-discover-settings.md) · [p1-plan-4](p1-plan-4-constellation-and-gates.md) |
| **P2** | v0.2.0 | Backend & VOD Embed | ⬜ blocked on P1 | [p2-plan-1](p2-plan-1-resolver-architecture.md) · [p2-plan-2](p2-plan-2-player-and-subtitles.md) · [p2-plan-3](p2-plan-3-progress-and-history.md) · [p2-plan-4](p2-plan-4-global-coverage.md) |
| **P3** | v1.0.0 | Refinement & Stabilization | ⬜ blocked on P2 | [p3-plan-1](p3-plan-1-stabilization.md) |
| **P4** | v1.1.0 | IPTV & Live Content | ⬜ blocked on P3 | [p4-plan-1](p4-plan-1-iptv-foundation.md) · [p4-plan-2](p4-plan-2-live-sports.md) |
| **P5** | v1.2.0 | Manga & Comics Reader | ⬜ blocked on P4 | [p5-plan-1](p5-plan-1-manga-reader.md) · [p5-plan-2](p5-plan-2-manga-sources.md) |
| post-P5 | — | Parking lot | — | [post-p5-roadmap](post-p5-roadmap.md) |

**Status legend:** ⬜ not started · 🟡 in progress · 🟢 done · 🟠 blocked · 🔴 broken

## 2. Status dashboard per plan

### Phase 1 — v0.1.0 Foundation & UI/UX

| Plan | Tasks | Status | Key deliverable |
|---|---|---|---|
| [P1-1 Foundation & Home](p1-plan-1-foundation-and-home.md) | 27 | 🟡 | Next.js 15 scaffold, tokens, sidebar, home rails |
| [P1-2 Browse/Detail/Watchlist](p1-plan-2-browse-detail-watchlist.md) | 22 | ⬜ | Movies/Shows browse, detail tabs, watchlist grid |
| [P1-3 Search/Discover/Settings](p1-plan-3-search-discover-settings.md) | 18 | ⬜ | Search+Discover unified, full Settings |
| [P1-4 Constellation & Gates](p1-plan-4-constellation-and-gates.md) | 20 | ⬜ | Canvas constellation, CI gates, v0.1 release |

### Phase 2 — v0.2.0 Backend & VOD Embed

| Plan | Tasks | Status | Key deliverable |
|---|---|---|---|
| [P2-1 Resolver Architecture](p2-plan-1-resolver-architecture.md) | 24 | ⬜ | Provider registry, adapter interface, fallback chain |
| [P2-2 Player & Subtitles](p2-plan-2-player-and-subtitles.md) | 20 | ⬜ | HLS player, subtitle fetch/parse, keyboard controls |
| [P2-3 Progress & History](p2-plan-3-progress-and-history.md) | 14 | ⬜ | Continue-watching rail, progress schema v2 |
| [P2-4 Global Coverage](p2-plan-4-global-coverage.md) | 19 | ⬜ | Regional adapters + scraper layer |

### Phase 3 — v1.0.0 Stabilization

| Plan | Tasks | Status | Key deliverable |
|---|---|---|---|
| [P3-1 Stabilization](p3-plan-1-stabilization.md) | 16 | ⬜ | Refactor sweep, perf, a11y audit, v1.0 release |

### Phase 4 — v1.1.0 IPTV & Live

| Plan | Tasks | Status | Key deliverable |
|---|---|---|---|
| [P4-1 IPTV Foundation](p4-plan-1-iptv-foundation.md) | 18 | ⬜ | M3U parser, EPG, channel list, favorites |
| [P4-2 Live Sports](p4-plan-2-live-sports.md) | 13 | ⬜ | Sports schedule UI, live source resolution |

### Phase 5 — v1.2.0 Manga & Comics

| Plan | Tasks | Status | Key deliverable |
|---|---|---|---|
| [P5-1 Manga Reader](p5-plan-1-manga-reader.md) | 17 | ⬜ | Page viewer, RTL reading, chapter nav |
| [P5-2 Manga Sources](p5-plan-2-manga-sources.md) | 12 | ⬜ | Source adapters, search, download queue |

---

## 3. High-level checklist — P1 (v0.1.0)

Check items as they land. Each item links to its source-of-truth plan.

### P1-1 · Foundation & Home ([plan](p1-plan-1-foundation-and-home.md))

- [ ] Task 1 — Initialize Next.js 15 App Router project in `app/`
- [ ] Task 2 — Configure TypeScript strict, ESLint, Prettier (with tailwindcss plugin)
- [ ] Task 3 — Install Tailwind CSS v4 and wire `styles/globals.css`
- [ ] Task 4 — Author `tokens/design-tokens.json` and the `tokens/generate.mjs` generator
- [ ] Task 5 — Self-host IBM Plex Sans Arabic + Plex Mono under `public/fonts/`
- [ ] Task 6 — Root `<html dir="rtl" lang="ar">` with font variables
- [ ] Task 7 — Install next-intl, author `messages/ar.json`, wire `IntlProvider`
- [ ] Task 8 — Install shadcn/ui and add the 14 primitives used in P1
- [ ] Task 9 — Implement Zod schema for `fada.v1` localStorage root
- [ ] Task 10 — Implement Zustand store (watchlist, preferences, recentSearches, tmdb)
- [ ] Task 11 — Implement localStorage persistence + v1 migration plumbing
- [ ] Task 12 — Implement TMDB client (`lib/tmdb/client.ts`) with token resolution
- [ ] Task 13 — Implement typed TMDB endpoints + Zod response validation
- [ ] Task 14 — Configure React Query + `persistQueryClient` with stale-time table
- [ ] Task 15 — Implement `<Sidebar>` with five responsive states (mobile/tablet/desktop/wide/tv)
- [ ] Task 16 — Implement `<BottomNav>` for mobile
- [ ] Task 17 — Implement `<FloatingSearchPill>` with `/` + `Ctrl/Cmd+K` shortcuts
- [ ] Task 18 — Implement global `<PosterCard>` asymmetric redesign with monochrome fallback
- [ ] Task 19 — Implement `<Rail>` with RTL-aware scroll and rail-level empty state
- [ ] Task 20 — Implement `<StarLoader>` + `<StarEmptyState>` (Lottie-backed)
- [ ] Task 21 — Build Home page `/` with six rails (hero deferred to P1-4)
- [ ] Task 22 — Wire the "Logo → /" anchor contract project-wide
- [ ] Task 23 — Build stub pages for `/movies`, `/shows`, `/collections`, `/watchlist`, `/search`, `/settings`
- [ ] Task 24 — Configure Next.js static export (`output: 'export'`)
- [ ] Task 25 — Configure Vitest + @testing-library/react
- [ ] Task 26 — Configure Playwright with a smoke spec
- [ ] Task 27 — Plan 1 acceptance gate: typecheck, lint, unit, component, smoke-e2e all green

### P1-2 · Browse / Detail / Watchlist ([plan](p1-plan-2-browse-detail-watchlist.md))

- [ ] Task 1 — Extend TMDB client with browse/detail/cast/reviews/season endpoints
- [ ] Task 2 — `<FilterBar>` (genre chips, year range, language, sort) + mobile `<Sheet>`
- [ ] Task 3 — `<PosterGrid>` with infinite scroll, URL-synced state
- [ ] Task 4 — `/movies` browse page
- [ ] Task 5 — `/shows` browse page
- [ ] Task 6 — `<DetailHero>` with gold primary CTA `"أضف إلى قائمتي"` (per DESIGN.md §4.13)
- [ ] Task 7 — `<DetailTabs>` (Overview, Episodes, Cast, Reviews, More)
- [ ] Task 8 — `/title/movie/[id]` page
- [ ] Task 9 — `/title/tv/[id]` page
- [ ] Task 10 — `<SeasonTabs>` (sticky, RTL pills)
- [ ] Task 11 — `<EpisodeRow>` with persistent banner (no per-row toast, DESIGN.md §4.3)
- [ ] Task 12 — `<CastDrawer>` (right-side Sheet)
- [ ] Task 13 — `<ReviewList>` with pagination
- [ ] Task 14 — `<WatchlistButton>` wired to Zustand store
- [ ] Task 15 — `/watchlist` page with filter chips + sort
- [ ] Task 16 — `<CollectionCard>` (plain grid variant; constellation in P1-4)
- [ ] Task 17 — `/collections` index page
- [ ] Task 18 — `/collections/curated/[slug]` page (editorial JSON reader)
- [ ] Task 19 — `/collections/tmdb/[id]` page
- [ ] Task 20 — Seed three editorial collections in `content/collections/`
- [ ] Task 21 — "Part of collection" card on matching detail pages
- [ ] Task 22 — Plan 2 acceptance: every new surface has unit, component, and E2E tests

### P1-3 · Search / Discover / Settings ([plan](p1-plan-3-search-discover-settings.md))

- [ ] Task 1 — Multi-search TMDB endpoint integration
- [ ] Task 2 — Discover endpoint with region/language/genre params
- [ ] Task 3 — `/search` unified page (Search mode + Discover mode)
- [ ] Task 4 — Recent-searches chips (10 deep, deduped, clearable)
- [ ] Task 5 — `<TypeBadge>` on search result cards
- [ ] Task 6 — Settings shell + `<SettingsSection>` + `<SettingsRow>` primitives
- [ ] Task 7 — General section (region, theme, poster density — only if built per DESIGN.md §4.8)
- [ ] Task 8 — My Data section: export watchlist
- [ ] Task 9 — My Data section: import with merge/replace `<Dialog>` (DESIGN.md §4.9)
- [ ] Task 10 — My Data section: clear cache, full reset with confirm
- [ ] Task 11 — TMDB section: token status badge
- [ ] Task 12 — TMDB section: custom-token masked input + show/hide (DESIGN.md §4.10)
- [ ] Task 13 — About section: version, license, GitHub, credits
- [ ] Task 14 — Locale plumbing (single `messages/ar.json`, no `<LocaleSwitcher>` in P1)
- [ ] Task 15 — URL-state sync for search + discover filters
- [ ] Task 16 — Light-theme token swap (visual polish deferred)
- [ ] Task 17 — Error banners: 429, 404, offline, invalid custom token
- [ ] Task 18 — Plan 3 acceptance: settings round-trip tests, discover URL deep-link test

### P1-4 · Constellation & Gates ([plan](p1-plan-4-constellation-and-gates.md))

- [ ] Task 1 — `<Constellation>` component scaffold (`components/constellation/`)
- [ ] Task 2 — Canvas2D renderer: ambient stars + parallax + twinkle
- [ ] Task 3 — Normalized (0–1) node/connection layout
- [ ] Task 4 — Poster-masked star nodes (DESIGN.md §4.2)
- [ ] Task 5 — Monochrome gold-disc fallback when poster missing
- [ ] Task 6 — `<ConstellationAriaMirror>` — hidden focusable `<a>` per node
- [ ] Task 7 — Home hero at 60/50/44vh, **no auto-advance** (DESIGN.md §4.1)
- [ ] Task 8 — Weekly-featured-collection pointer (`content/collections/featured.json`)
- [ ] Task 9 — Mini-constellation variant for `<CollectionCard>`
- [ ] Task 10 — Deep-page hero variant at 80vh with static render
- [ ] Task 11 — Reduced-motion path: static render, no twinkle, no parallax
- [ ] Task 12 — Visibility-hidden render-loop pause
- [ ] Task 13 — CI collection PR lint: reject if `nodes[].x/y` missing (DESIGN.md §4.11)
- [ ] Task 14 — `scripts/position-constellation.mjs` authoring tool
- [ ] Task 15 — TV focus polish: default focus, 3px gold ring, long-press Enter toggle
- [ ] Task 16 — GitHub Actions workflow (typecheck, lint, unit, component, E2E, axe, Lighthouse)
- [ ] Task 17 — axe-core gate: zero violations on every public route
- [ ] Task 18 — Lighthouse gate: performance ≥ 90 on Home + a Detail page, desktop + mobile
- [ ] Task 19 — Never-Weird E2E suite (logo-home, anchor-shape, contrast)
- [ ] Task 20 — Tag `v0.1-rc1` → manual QA → tag `v0.1.0`

---

## 4. High-level checklist — P2 (v0.2.0)

### P2-1 · Resolver Architecture ([plan](p2-plan-1-resolver-architecture.md))

- [ ] Task 1 — Define `ProviderAdapter` interface + lifecycle
- [ ] Task 2 — `ProviderRegistry` (static + dynamic registration)
- [ ] Task 3 — `FallbackChain` executor with per-attempt timeout
- [ ] Task 4 — `ResolveRequest` / `ResolveResult` DTOs + Zod
- [ ] Task 5 — CORS survey + routing strategy doc (`docs/cors-strategy.md`)
- [ ] Task 6 — Optional Cloudflare Workers proxy adapter (opt-in)
- [ ] Task 7 — Provider health tracking (per-provider rolling success/latency)
- [ ] Task 8 — Rate limiter per provider domain
- [ ] Task 9 — VidSrc adapter (movies + TV)
- [ ] Task 10 — VidLink adapter
- [ ] Task 11 — 2Embed adapter
- [ ] Task 12 — Embed.su adapter
- [ ] Task 13 — SuperEmbed adapter
- [ ] Task 14 — Autoembed aggregator adapter
- [ ] Task 15 — Adapter unit-test harness (fixture HTTP)
- [ ] Task 16 — User-configurable provider order in Settings
- [ ] Task 17 — Resolver telemetry (client-side, opt-in debug log)
- [ ] Task 18 — Failure taxonomy: blocked / geofenced / 404 / DMCA / CORS
- [ ] Task 19 — Error banner UI hooking into failure taxonomy
- [ ] Task 20 — Resolver cache (in-memory per session)
- [ ] Task 21 — Provider block-listing + safe-search toggle
- [ ] Task 22 — Legal/ethics doc (`docs/provider-ethics.md`)
- [ ] Task 23 — E2E: three-of-five providers down, chain still resolves
- [ ] Task 24 — Plan P2-1 acceptance

### P2-2 · Player & Subtitles ([plan](p2-plan-2-player-and-subtitles.md))

- [ ] Task 1 — Player component `<PlayerFrame>` (iframe-sandbox for embeds)
- [ ] Task 2 — Native player `<PlayerNative>` (hls.js for HLS)
- [ ] Task 3 — dash.js adapter (DASH)
- [ ] Task 4 — Direct MP4/WebM fallback
- [ ] Task 5 — Player shell with RTL-aware controls
- [ ] Task 6 — Keyboard map: space/k (pause), ←/→ (seek 10s), ↑/↓ (volume), m (mute), f (fullscreen), c (subs)
- [ ] Task 7 — Subtitle fetcher (OpenSubtitles, Subscene, Subf2m, local file upload)
- [ ] Task 8 — .srt parser
- [ ] Task 9 — .vtt parser
- [ ] Task 10 — .ass/.ssa parser (basic styles)
- [ ] Task 11 — Subtitle offset/timing UI
- [ ] Task 12 — Arabic RTL subtitle rendering (bidi-safe)
- [ ] Task 13 — Picture-in-picture support (where browser allows)
- [ ] Task 14 — Trailer mode reuse (existing TMDB videos endpoint)
- [ ] Task 15 — Episode auto-advance with a 10s skip-prompt
- [ ] Task 16 — Resume-from-last-position logic wired to P2-3 store
- [ ] Task 17 — Error states: stream blocked, CORS, decode fail
- [ ] Task 18 — Swap P1 detail page CTA: "شاهد الآن" becomes primary, "أضف" becomes secondary
- [ ] Task 19 — Player E2E (happy path, fallback chain, subtitle toggle)
- [ ] Task 20 — Plan P2-2 acceptance

### P2-3 · Progress & History ([plan](p2-plan-3-progress-and-history.md))

- [ ] Task 1 — Migrate localStorage schema v1 → v2 (add `progress`, `history`)
- [ ] Task 2 — Progress beacon cadence (every 10s, throttled)
- [ ] Task 3 — `progress.ts` Zustand slice + selectors
- [ ] Task 4 — "Continue Watching" rail on Home (prepended above trending)
- [ ] Task 5 — Per-show progress aggregation (next-unwatched episode)
- [ ] Task 6 — Progress badge on `<PosterCard>` (slim bar along the bottom edge)
- [ ] Task 7 — Mark-as-watched affordance (episode row context menu)
- [ ] Task 8 — Clear-history and per-title-reset flows
- [ ] Task 9 — History page `/history` (chronological, collapsible by week)
- [ ] Task 10 — Export schema v2: include progress + history
- [ ] Task 11 — Import migration for v1 → v2 files
- [ ] Task 12 — Progress heatmap on show detail (light calendar grid)
- [ ] Task 13 — Settings toggle: disable progress tracking
- [ ] Task 14 — Plan P2-3 acceptance

### P2-4 · Global Coverage ([plan](p2-plan-4-global-coverage.md))

- [ ] Task 1 — Anime adapter: Zoro/AniWatch
- [ ] Task 2 — Anime adapter: GogoAnime
- [ ] Task 3 — Anime adapter: HiAnime
- [ ] Task 4 — K-drama adapter: KissKH
- [ ] Task 5 — K-drama adapter: Viki (legal metadata only)
- [ ] Task 6 — Asian drama: Dramacool
- [ ] Task 7 — Turkish: KekikStream adapter
- [ ] Task 8 — Turkish: CinePro scraper
- [ ] Task 9 — Arabic: WeCima adapter
- [ ] Task 10 — Arabic: Aflamedia scraper
- [ ] Task 11 — Indian: MoviesMod / 4KHDHub (via TMDB Embed API)
- [ ] Task 12 — Chinese: BiliBili (legal anime section)
- [ ] Task 13 — African: FilmFlux (catalog only, no scraping)
- [ ] Task 14 — Latin American: Retina Latina (legal metadata)
- [ ] Task 15 — Scraper layer: `lib/scrape/` with Cheerio-server / DOMParser-client dual impl
- [ ] Task 16 — Regional provider priority by user's region preference
- [ ] Task 17 — Safe-search + NSFW filter
- [ ] Task 18 — Coverage matrix page in `/settings` showing per-region health
- [ ] Task 19 — Plan P2-4 acceptance

---

## 5. High-level checklist — P3 (v1.0.0)

### P3-1 · Stabilization ([plan](p3-plan-1-stabilization.md))

- [ ] Task 1 — Repo-wide dead-code sweep (eslint, ts-prune)
- [ ] Task 2 — Bundle analysis + lazy-load audit
- [ ] Task 3 — Image pipeline optimization (next/image loaders, blur placeholders)
- [ ] Task 4 — Canvas constellation profile pass (GPU frame budget)
- [ ] Task 5 — Zustand selectors review (memoization, selector extraction)
- [ ] Task 6 — React Query cache tuning (stale times re-measured)
- [ ] Task 7 — Error taxonomy unification across resolver + TMDB + storage
- [ ] Task 8 — Accessibility second pass (assistive-tech walkthrough, screen-reader diff)
- [ ] Task 9 — RTL integrity sweep (every flex/grid rechecked)
- [ ] Task 10 — Documentation: `docs/architecture.md`, `docs/contributing.md`
- [ ] Task 11 — Documentation: `docs/collections.md` (authoring tool walkthrough)
- [ ] Task 12 — i18n plumbing: add `en.json` shell (English fallback) to prove plumbing
- [ ] Task 13 — Release notes generator
- [ ] Task 14 — User-facing changelog on `/settings/about`
- [ ] Task 15 — Tag `v1.0-rc1` → manual QA → tag `v1.0.0`
- [ ] Task 16 — Plan P3-1 acceptance

---

## 6. High-level checklist — P4 (v1.1.0)

### P4-1 · IPTV Foundation ([plan](p4-plan-1-iptv-foundation.md))

- [ ] Task 1 — M3U/M3U8 parser (`lib/iptv/m3u.ts`)
- [ ] Task 2 — EPG XMLTV parser (`lib/iptv/epg.ts`)
- [ ] Task 3 — IPTV provider model (user-supplied URL or shipped curated default)
- [ ] Task 4 — `/iptv` route: channel grid by category
- [ ] Task 5 — `<ChannelCard>` (logo, name, current programme, now-next bar)
- [ ] Task 6 — `<EpgTimeline>` (horizontal, 24h, now-line)
- [ ] Task 7 — Channel detail page with 7-day EPG
- [ ] Task 8 — Player reuse from P2-2 with live-HLS tuning
- [ ] Task 9 — Favorites (`channels.favorites` slice)
- [ ] Task 10 — Search within IPTV catalog
- [ ] Task 11 — Region/language filter for channels
- [ ] Task 12 — Settings: add/remove IPTV playlists, refresh cadence
- [ ] Task 13 — Sidebar: flip "قريبًا IPTV" disabled → active nav
- [ ] Task 14 — IPTV empty state when no playlist configured
- [ ] Task 15 — Parental-lock toggle for adult categories
- [ ] Task 16 — IPTV E2E: import playlist, browse, tune-in
- [ ] Task 17 — axe-core pass on new routes
- [ ] Task 18 — Plan P4-1 acceptance

### P4-2 · Live Sports ([plan](p4-plan-2-live-sports.md))

- [ ] Task 1 — Sports metadata source (TheSportsDB or similar free API)
- [ ] Task 2 — `/sports` route: today's matches + live badge
- [ ] Task 3 — `<MatchCard>` with kickoff countdown
- [ ] Task 4 — League/competition filter
- [ ] Task 5 — Match detail page: lineup, venue, odds-free stats only
- [ ] Task 6 — Live stream source adapter (IPTV overlap + sports-specific providers)
- [ ] Task 7 — Low-latency HLS tuning (LL-HLS flag in hls.js)
- [ ] Task 8 — Player "LIVE" indicator + "back to live edge" button
- [ ] Task 9 — Match schedule cache (15m)
- [ ] Task 10 — Notifications: opt-in browser reminder 15m before kickoff
- [ ] Task 11 — Sidebar: flip "قريبًا الرياضة المباشرة" disabled → active nav
- [ ] Task 12 — Sports E2E: browse matches, open live match
- [ ] Task 13 — Plan P4-2 acceptance

---

## 7. High-level checklist — P5 (v1.2.0)

### P5-1 · Manga Reader ([plan](p5-plan-1-manga-reader.md))

- [ ] Task 1 — Manga metadata source (MangaDex API, AniList for covers)
- [ ] Task 2 — `/manga` route: catalog grid
- [ ] Task 3 — `<MangaCard>` (cover, title, chapter count)
- [ ] Task 4 — Filter bar (genre, status, language)
- [ ] Task 5 — Manga detail page: synopsis, chapter list, related
- [ ] Task 6 — `<ChapterList>` with read/unread state
- [ ] Task 7 — `/manga/[id]/chapter/[c]` reader route
- [ ] Task 8 — `<Reader>` component: single-page vertical + two-page spread
- [ ] Task 9 — RTL reading mode (default for manga, Arabic script)
- [ ] Task 10 — LTR reading mode toggle (for webcomics)
- [ ] Task 11 — Zoom/pan gestures (touch + keyboard)
- [ ] Task 12 — Chapter navigation (prev/next, jump)
- [ ] Task 13 — Reading progress persisted per-chapter
- [ ] Task 14 — "Continue Reading" rail on Home (alongside P2-3 video rail)
- [ ] Task 15 — Sidebar: flip "قريبًا المانجا" disabled → active nav
- [ ] Task 16 — Reader E2E: open chapter, page through, progress saved
- [ ] Task 17 — Plan P5-1 acceptance

### P5-2 · Manga Sources ([plan](p5-plan-2-manga-sources.md))

- [ ] Task 1 — `MangaAdapter` interface mirroring `ProviderAdapter`
- [ ] Task 2 — MangaDex adapter (official API)
- [ ] Task 3 — Mangakakalot scraper
- [ ] Task 4 — MangaHere scraper
- [ ] Task 5 — Arabic manga source (e.g., Team X, MangaTNT)
- [ ] Task 6 — Page-image CORS strategy doc
- [ ] Task 7 — Source fallback chain
- [ ] Task 8 — Offline download queue (IndexedDB page cache)
- [ ] Task 9 — Storage quota management + eviction
- [ ] Task 10 — Download manager UI in Settings
- [ ] Task 11 — Source E2E: download, read offline
- [ ] Task 12 — Plan P5-2 acceptance

---

## 8. Release gate checklists

Each release must pass every item here before tagging. Gates inherit from the previous release — v0.2 must still satisfy v0.1 gates.

### v0.1.0 gates

- [ ] All P1 checklist items above are ✅
- [ ] `npm run lint` — 0 errors
- [ ] `npm run typecheck` — 0 errors
- [ ] `npm test` — 100% pass
- [ ] `npm run test:e2e` — 100% pass
- [ ] axe-core — 0 violations on every route
- [ ] Lighthouse Performance ≥ 90 on Home + Detail (desktop + mobile)
- [ ] Initial JS ≤ 180KB gzipped on Home
- [ ] Constellation chunk ≤ 40KB gzipped
- [ ] 60fps sustained on mid-tier laptop (Constellation)
- [ ] Never-Weird E2E green
- [ ] Manual QA checklist (see `p1-plan-4-constellation-and-gates.md §Manual QA`)
- [ ] Release notes drafted
- [ ] Tagged `v0.1.0`, GitHub release with static bundle + source zip

### v0.2.0 gates

- [ ] v0.1 gates still green
- [ ] All P2 checklist items above are ✅
- [ ] Resolver E2E: 3-of-5 providers down still resolves
- [ ] Player: happy-path + fallback + subtitle toggle covered
- [ ] Progress round-trip: export → clear → import → resume-from-position works
- [ ] Regional coverage matrix: every region has ≥ 2 working adapters
- [ ] Provider-ethics doc published
- [ ] Manual QA checklist (see `p2-plan-*.md`)
- [ ] Tagged `v0.2.0`

### v1.0.0 gates

- [ ] v0.2 gates still green
- [ ] All P3 checklist items above are ✅
- [ ] Bundle analysis clean (no unused chunks ≥ 10KB)
- [ ] a11y walkthrough report filed
- [ ] Docs shipped: architecture, contributing, collections, providers
- [ ] Tagged `v1.0.0` — first public GitHub release

### v1.1.0 gates

- [ ] v1.0 gates still green
- [ ] All P4 checklist items above are ✅
- [ ] IPTV round-trip: paste M3U → browse → tune works on shipped curated playlist
- [ ] Sports round-trip: browse today → open live match works
- [ ] Tagged `v1.1.0`

### v1.2.0 gates

- [ ] v1.1 gates still green
- [ ] All P5 checklist items above are ✅
- [ ] Reader E2E: open chapter, page through, progress saved, offline read
- [ ] Tagged `v1.2.0`

---

## 9. Cross-phase invariants

Any plan that changes these must update every file that cites them. Never silently drift.

1. **Static export** — no server runtime until proven otherwise. Any plan adding server behavior must justify it against GitHub/Cloudflare Pages hosting.
2. **Arabic-first, RTL, logical properties only.**
3. **localStorage only** — no accounts, no cross-device sync.
4. **Open source, no monetization** — this rules out analytics, ads, paid features.
5. **DESIGN.md §4 deltas** are binding on every plan that touches the referenced surface.
6. **Lint rules from P1-1 Task 2** must stay green across every merge.
7. **Every provider/scraper/embed** must have a legal/ethics disclaimer entry in `docs/provider-ethics.md`.
8. **Every route** must pass axe-core in CI.
9. **Every user-facing string** must live in `messages/<locale>.json`.
10. **Every keyboard shortcut** must work in RTL and with a screen-reader focused.

---

## 10. Decision log

Short, append-only. Cross-link to the plan file where the decision bites.

| Date | Decision | Rationale | Source |
|---|---|---|---|
| 2026-04-23 | Next.js 15 App Router + static export | GitHub/CF Pages hosting, zero backend | spec §1.3 Q3 |
| 2026-04-23 | TMDB only in P1 | P2 ships embed resolution | spec §1.3 Q1 |
| 2026-04-23 | Arabic-only UI strings in P1 | Faster P1, plumbing ready | spec §1.3 Q7 |
| 2026-04-24 | Home hero = 60vh, no auto-advance | DESIGN.md §4.1 | DESIGN.md |
| 2026-04-24 | Detail primary CTA = Add-to-list in P1 | P1 is no-playback | DESIGN.md §4.13 |
| 2026-04-24 | Retire `nodes[].hue` | Noise without legend | DESIGN.md §4.2 |
| 2026-04-24 | No force-directed fallback | Force-directed produces ugly graphs; CI rejects missing positions | DESIGN.md §4.11 |
| 2026-04-24 | Arabic min body = 14px | Script optical size | DESIGN.md §4.5 |
| 2026-04-24 | Episode rows: persistent banner, no per-row toast | Toast spam on 100+ episodes | DESIGN.md §4.3 |
| 2026-04-24 | TMDB token input masked | Screen-share leaks | DESIGN.md §4.10 |
| 2026-04-26 | Poster cards use a production-safe asymmetric silhouette everywhere | Matches the approved reference while preserving grid stability and shared anatomy across surfaces | spec `2026-04-26-fada-p1-poster-card-redesign.md` |

---

## 11. Change log — this TODO

Short, append-only. Bump when you re-scope a plan or add/remove a task.

| Date | Change |
|---|---|
| 2026-04-24 | Initial multi-phase tracker created. Replaces previous P1-only plan set. |
| 2026-04-26 | Marked P1 and P1-1 as in progress, and re-scoped P1-1 Task 18 to the approved global poster-card redesign with a dedicated spec delta. |
| 2026-04-27 | Repository reinitialized: prior `app/` scaffold discarded, fresh git history on Production/Development branches. P1-1 task tracking reset to start over from Task 1 on Development. |

---

## 12. How to use this file

- **Starting a task?** Open the linked plan, read the task block in full, confirm any prerequisite tasks are checked, then start.
- **Finished a task?** Check it here *and* in the source plan file. Keep both in sync.
- **Blocked?** Mark the row with 🟠 and add a one-line note under `## 11. Change log`.
- **Scope changed?** Amend the plan file, amend this tracker, append to `## 10. Decision log` and `## 11. Change log`.
- **New phase landed?** Add a row to `## 1. Roadmap`, a block under `## 3–7`, a gate section under `## 8`.
- **Ran out of context in a long implementation session?** Close it out by updating this file before you stop. Next session starts here.
