---
tags: [plan, p2]
date: 2026-04-24
status: ready
phase: P2 (v0.2.0) — Plan 4 of 4
depends_on: [p2-plan-3-progress-and-history.md]
unlocks: [p3-plan-1-stabilization.md]
related:
  - "[[../More/Embed Providers]]"
  - "[[../../DESIGN]]"
  - "[[00-conventions]]"
  - "[[TODO]]"
---

# FADA P2 — Plan 4: Global Coverage & Scraper Layer

> **Sub-skill.** `superpowers:subagent-driven-development`. Adapters are embarrassingly parallel. 10+ agents can split Tasks 1–14.

**Goal.** Add regional providers so every major audience — Arab, Turkish, Korean, Japanese anime, Indian, African, Chinese, Latin, European — finds working embeds. Introduce the scraper layer for providers that don't offer embed URLs. Region-preference-aware chain ordering. Coverage matrix in Settings.

**Architecture.** Every regional provider implements `ProviderAdapter` (from P2-1). For scraper-backed providers, a `lib/scrape/` layer exposes a dual implementation: Cheerio-based when running during build or tests, DOMParser-based in the browser — with the same API. Safe-search filters adult providers.

**Tech stack (new).** `cheerio` (tests only, dev dep), nothing runtime.

**Spec.** `vault/More/Embed Providers.md`.

---

## Scope

### In
- Anime: Zoro/AniWatch, GogoAnime, HiAnime.
- K-drama: KissKH, Viki (metadata only).
- Asian drama: Dramacool.
- Turkish: KekikStream, CinePro (scraper).
- Arabic: WeCima, Aflamedia (scraper).
- Indian: MoviesMod, 4KHDHub (via TMDB Embed API aggregator).
- Chinese: BiliBili (legal anime).
- African: FilmFlux (catalog-only — metadata).
- Latin: Retina Latina (legal metadata).
- `lib/scrape/` shared scraping helpers.
- Region-aware priority.
- Safe-search toggle hard-filters adult sources.
- Coverage matrix page in `/settings/coverage`.

### Out (deferred)
- Live/IPTV sources → P4.
- Manga sources → P5.
- New-region requests from community → post-P5.

---

## File structure

```
app/
├── lib/
│   ├── resolver/adapters/
│   │   ├── anime/
│   │   │   ├── zoro.ts
│   │   │   ├── gogoanime.ts
│   │   │   └── hianime.ts
│   │   ├── kdrama/
│   │   │   ├── kisskh.ts
│   │   │   └── viki.ts
│   │   ├── asian/
│   │   │   └── dramacool.ts
│   │   ├── turkish/
│   │   │   ├── kekikstream.ts
│   │   │   └── cinepro.ts
│   │   ├── arabic/
│   │   │   ├── wecima.ts
│   │   │   └── aflamedia.ts
│   │   ├── indian/
│   │   │   └── tmdb-embed-aggregator.ts
│   │   ├── chinese/
│   │   │   └── bilibili.ts
│   │   ├── african/
│   │   │   └── filmflux.ts
│   │   └── latin/
│   │       └── retina-latina.ts
│   └── scrape/
│       ├── browser.ts                           # DOMParser impl
│       ├── server.ts                            # Cheerio impl (tests)
│       ├── index.ts                             # unified API
│       └── selectors.ts                         # common selectors
├── app/settings/coverage/page.tsx               # new
├── components/fada/
│   └── CoverageMatrix.tsx
└── tests/
    ├── unit/resolver/adapters/
    │   └── ... (one test file per adapter)
    └── unit/scrape/
        └── browser-vs-server-parity.test.ts
```

---

## Task 1: `lib/scrape/` dual impl

- [ ] **T1 — unified API**
  - `load(html): Document` — returns Cheerio `$` in Node, wraps DOMParser in browser.
  - `queryAll(doc, selector) / query(doc, selector) / text(el) / attr(el, name) / html(el)`.
  - Parity tests: same selectors return same nodes across implementations.

**Acceptance.** Parity tests green on 10 real HTML fixtures.

---

## Task 2: Anime — Zoro/AniWatch adapter

- [ ] **T2 — zoro.ts**
  - Search by title (Latin romanization + Arabic fallback map) → resolve to episode URL.
  - Scrape the embed source element for the final iframe URL.
  - Rate limit: 1/s (zoro is fragile).
  - Supports: anime TV + movies.

**Acceptance.** Fixture-based test proves URL construction; live test (skip on CI) proves end-to-end.

---

## Task 3: Anime — GogoAnime

- [ ] **T3 — gogoanime.ts**
  - Direct embed: `https://gogoanime<current-tld>/${slug}-episode-${episode}`.
  - Search scraper maps TMDB title → gogoanime slug.
  - Caches slug in session cache to avoid re-search.

---

## Task 4: Anime — HiAnime

- [ ] **T4 — hianime.ts**
  - Same pattern; adapter just changes URL template.

---

## Task 5: K-drama — KissKH

- [ ] **T5 — kisskh.ts**
  - Scrape search, pick the show, walk episodes.
  - Arabic dubbed filter — when user's region is MENA, prefer dubbed tracks.

---

## Task 6: K-drama — Viki (metadata only)

- [ ] **T6 — viki.ts**
  - Does not resolve playback — Viki is licensed.
  - Returns a `ResolveResult` marked `playbackExternal: true` with a deep-link to Viki.
  - Surfaces in the UI as "يتوفر رسميًا على Viki".

**Acceptance.** Adapter never returns a direct embed URL; UI shows the external-link treatment.

---

## Task 7: Asian drama — Dramacool

- [ ] **T7 — dramacool.ts**
  - Scrape search + episode.
  - Multiple mirrors — retry across `.com` / `.bz` / `.tv` TLDs on DNS failure.

---

## Task 8: Turkish — KekikStream

- [ ] **T8 — kekikstream.ts**
  - Library-style API; call via HTTP to `api.kekik.cf` (if public) or through a user-configured endpoint.
  - Tests against fixtures.

---

## Task 9: Turkish — CinePro scraper

- [ ] **T9 — cinepro.ts**
  - Uses `lib/scrape/`. Adapter documents that robots.txt is respected.

---

## Task 10: Arabic — WeCima

- [ ] **T10 — wecima.ts**
  - Scrape search by Arabic title → show page → episode → embed iframe URL.
  - Arabic URL segments are URL-encoded correctly (Windows-1256 legacy not expected; UTF-8 confirmed).

---

## Task 11: Arabic — Aflamedia scraper

- [ ] **T11 — aflamedia.ts**
  - Adapter with scraper-backed resolution.
  - Explicit note: respects robots.txt; if the user's configured scraper is blocked, the adapter throws `RESOLVER_BLOCKED`.

---

## Task 12: Indian — TMDB Embed API aggregator

- [ ] **T12 — tmdb-embed-aggregator.ts**
  - Calls the community TMDB Embed API (if currently operational).
  - Aggregates MoviesMod + 4KHDHub + UHDMovies behind one adapter.

---

## Task 13: Chinese — BiliBili (legal anime)

- [ ] **T13 — bilibili.ts**
  - Official anime section only. Uses BiliBili's official embed.
  - Same `playbackExternal: false` treatment — embeddable.

---

## Task 14: African — FilmFlux (catalog only)

- [ ] **T14 — filmflux.ts**
  - Metadata-only. Returns a deep-link to the FilmFlux app.
  - Marks the adapter as `supports: { movie: true }` with `playbackExternal: true`.

---

## Task 15: Latin — Retina Latina

- [ ] **T15 — retina-latina.ts**
  - Metadata-only.
  - Same external-link treatment.

---

## Task 16: Region-aware priority

- [ ] **T16 — chain modifier**
  - `FallbackChain.resolve(req, { regionHint })` re-orders providers by `region-affinity`:
    - MENA → WeCima, Aflamedia, 2Embed first
    - TR → KekikStream, CinePro first
    - JP → Zoro, HiAnime, GogoAnime first (when genre=anime)
    - KR → KissKH first
    - ZH → BiliBili first
  - Region hint from `preferences.region` + TMDB content `original_language`.

**Acceptance.** Unit test: same movie resolves through a different top-pick for MENA vs global.

---

## Task 17: Safe-search hard filter

- [ ] **T17 — filter**
  - When `preferences.safeSearch: true`, registry hides adult adapters (none currently shipped, but scaffolded for contributors).
  - TMDB calls pass `include_adult=false`.

---

## Task 18: `<CoverageMatrix>` in Settings

- [ ] **T18 — page**
  - `/settings/coverage` shows a table:
    | Region | Providers | Health | Status |
    |--------|-----------|--------|--------|
    | MENA   | WeCima, Aflamedia, 2Embed | 82% | ✅ |
    | TR     | KekikStream, CinePro | 61% | ⚠️ |
    | …      | … | … | … |
  - Click a row → opens provider-order UI pre-filtered.
  - Link to "propose a provider" → GitHub issue template.

**Acceptance.** Page renders live health per region.

---

## Task 19: Plan P2-4 acceptance

- [ ] **T19 — gate**
  - Every new adapter has a unit test.
  - Every region has ≥ 2 working adapters (fixture or opt-in live).
  - Coverage matrix renders without errors.
  - `docs/provider-ethics.md` updated to include regional providers.
  - All TODO.md §4 P2-4 checkboxes ticked.

---

## v0.2.0 release

- [ ] Bump version, draft release notes, run full v0.1 + v0.2 manual QA, tag `v0.2.0-rc.1` → verify → `v0.2.0`.

## Handoff to Phase 3

Playback works globally. Time for the stabilization pass.
