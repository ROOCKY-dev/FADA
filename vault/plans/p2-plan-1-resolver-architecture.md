---
tags: [plan, p2]
date: 2026-04-24
status: ready
phase: P2 (v0.2.0) — Plan 1 of 4
depends_on: [p1-plan-4-constellation-and-gates.md]
unlocks: [p2-plan-2-player-and-subtitles.md, p2-plan-3-progress-and-history.md, p2-plan-4-global-coverage.md]
related:
  - "[[../index]]"
  - "[[../More/Embed Providers]]"
  - "[[../../DESIGN]]"
  - "[[00-conventions]]"
  - "[[TODO]]"
---

# FADA P2 — Plan 1: Resolver Architecture

> **Sub-skill.** `superpowers:subagent-driven-development`. Adapter implementations (Tasks 9–14) are embarrassingly parallel once the core (Tasks 1–8) is in place.

**Goal.** Ship the provider-agnostic resolver: a registry of embed adapters, a fallback chain with per-attempt timeout, per-provider health tracking, and the ethics/CORS policy it runs under. No player UI yet — Plan 2 consumes this resolver. No regional providers yet — Plan 4 adds them.

**Architecture.** Every embed source is a `ProviderAdapter` — a small module implementing `{ id, label, supports, build, resolve }`. The `ProviderRegistry` holds them in a user-configurable order. A `FallbackChain` iterates the registry, times each attempt, records success/latency in the health tracker, and returns the first working `ResolveResult`. A resolver cache keeps session-local positive and negative results. All outbound fetches go through a single `resolverFetch` with adaptive CORS handling (direct → iframe → optional Cloudflare Workers proxy).

**Tech stack (new).** `p-timeout` (35 lines — or write inline), `mitt` (event bus, 200B), optional Cloudflare Workers proxy. No server runtime on the app itself — resolution happens in the browser.

**Spec.** `vault/index.md` (P2 goals). `vault/More/Embed Providers.md` (catalogue).

---

## Scope

### In
- `ProviderAdapter` interface + lifecycle.
- `ProviderRegistry`.
- `FallbackChain` with timeouts.
- `ResolveRequest` / `ResolveResult` DTOs + Zod.
- CORS survey + `docs/cors-strategy.md`.
- Optional Cloudflare Workers proxy adapter (opt-in via Settings).
- Per-provider health tracking (rolling success/latency window).
- Rate limiter per provider domain.
- Five primary adapters: VidSrc, VidLink, 2Embed, Embed.su, SuperEmbed.
- One aggregator adapter: Autoembed.
- Adapter unit-test harness with fixture HTTP.
- User-configurable provider order in Settings (+ block-list).
- Resolver telemetry (opt-in debug log).
- Failure taxonomy: blocked / geofenced / 404 / DMCA / CORS.
- Error banner hooking into taxonomy.
- Safe-search / NSFW toggle.
- Legal/ethics doc (`docs/provider-ethics.md`).
- E2E: 3-of-5 providers down, chain still resolves.

### Out (deferred)
- Regional providers → P2-4.
- Player UI → P2-2.
- Progress tracking → P2-3.
- Subtitles → P2-2.

---

## Prerequisites

- v0.1.0 is tagged and green.
- Legal/ethics stance drafted (see Task 22).

---

## File structure created / modified

```
app/
├── lib/
│   └── resolver/
│       ├── types.ts                             # new — ProviderAdapter, ResolveRequest, ResolveResult
│       ├── registry.ts                          # new
│       ├── chain.ts                             # new — FallbackChain
│       ├── health.ts                            # new — rolling success/latency
│       ├── rate-limit.ts                        # new
│       ├── cache.ts                             # new — session-local
│       ├── fetch.ts                             # new — resolverFetch wrapper
│       ├── bus.ts                               # new — mitt event bus
│       ├── errors.ts                            # new — ResolverError codes
│       └── adapters/
│           ├── vidsrc.ts                        # new
│           ├── vidlink.ts                       # new
│           ├── twoembed.ts                      # new
│           ├── embedsu.ts                       # new
│           ├── superembed.ts                    # new
│           └── autoembed.ts                     # new (aggregator)
├── components/fada/
│   ├── ProviderOrderSettings.tsx                # new — Settings UI
│   └── ResolverDebugPanel.tsx                   # new — opt-in dev panel
├── docs/
│   ├── cors-strategy.md                         # new
│   └── provider-ethics.md                       # new
├── workers/                                     # new (optional CF Workers proxy)
│   ├── proxy.ts
│   └── wrangler.toml
└── tests/
    ├── unit/resolver/
    │   ├── chain.test.ts
    │   ├── health.test.ts
    │   ├── rate-limit.test.ts
    │   ├── cache.test.ts
    │   └── fetch.test.ts
    ├── unit/resolver/adapters/
    │   ├── vidsrc.test.ts
    │   ├── vidlink.test.ts
    │   ├── twoembed.test.ts
    │   ├── embedsu.test.ts
    │   ├── superembed.test.ts
    │   └── autoembed.test.ts
    └── e2e/
        └── resolver.spec.ts
```

---

## Task 1: `ProviderAdapter` interface

- [ ] **T1 — types.ts**
  ```ts
  export interface ProviderAdapter {
    readonly id: string;                 // "vidsrc", "vidlink"
    readonly label: string;              // display name
    readonly homepage: string;
    readonly supports: {
      movie: boolean;
      tv: boolean;
      live?: boolean;
      manga?: boolean;
    };
    build(req: ResolveRequest): URL;     // pure URL construction
    resolve(req: ResolveRequest, signal: AbortSignal): Promise<ResolveResult>;
  }

  export type ResolveRequest =
    | { kind: 'movie'; tmdbId: number; imdbId?: string }
    | { kind: 'tv'; tmdbId: number; imdbId?: string; season: number; episode: number };

  export type ResolveResult = {
    providerId: string;
    embedUrl: string;                    // iframe src
    directUrl?: string;                  // direct HLS/DASH/MP4 if scraped
    subtitleTracks?: SubtitleTrack[];    // populated in P2-2 if discovered
    mime?: string;
    resolvedAt: number;
    expiresAt?: number;
  };
  ```

**Acceptance.** Compiles; Zod schemas for `ResolveRequest`/`ResolveResult` exist; type tests hold.

---

## Task 2: `ProviderRegistry`

- [ ] **T2 — registry.ts**
  - `class ProviderRegistry { register(a), unregister(id), list(), order, setOrder(ids), block(id), unblock(id), isBlocked(id) }`.
  - Ordered list persisted to `fada.v2.resolver.order` (new store slice in P2-3 migration; for now extend `fada.v1` with a `resolver` subtree during Task 23 of this plan).
  - Block-list stored similarly.
  - Static adapters registered at module load; dynamic (future) adapters register at runtime.

**Acceptance.** Order persists across reload.

---

## Task 3: `FallbackChain`

- [ ] **T3.A — chain.ts**
  - `async resolve(req, { timeout = 6000, maxAttempts = 5 }): Promise<ResolveResult>`.
  - Iterates registry in user-defined order, skipping blocked providers and providers whose health score is below a threshold.
  - Per-attempt `AbortController` with `timeout`.
  - On `ResolverError { code: 'CORS'|'404'|'BLOCKED'|'DMCA'|'TIMEOUT'|'NETWORK' }`, records failure and moves on.
  - On success: records success, returns result, inserts into cache.
  - If all fail: throws `ResolverAllFailedError` with a per-provider breakdown.

- [ ] **T3.B — tests**
  - Unit: first provider wins; succeed after 2 failures; all fail; timeout; abort.

**Acceptance.** 3-of-5 providers stubbed to fail → chain still returns the working one's result.

---

## Task 4: DTOs + Zod

- [ ] **T4 — validate**
  - Zod schemas for request/result in `types.ts`.
  - `chain.resolve()` validates the result before returning.
  - Failure to validate → treat as a provider error and continue.

**Acceptance.** Malformed adapter response doesn't poison the user UI.

---

## Task 5: CORS strategy doc

- [ ] **T5 — `docs/cors-strategy.md`**
  - Survey each of the 5 primary providers' CORS behavior (allow-all, iframe-only, origin-locked).
  - Define the three modes:
    1. **Direct fetch** — provider allows CORS; we fetch and parse.
    2. **Iframe-only** — provider only works inside an `<iframe>`; we never fetch, we embed.
    3. **Proxy** — optional Cloudflare Workers proxy (`workers/proxy.ts`), opt-in via Settings.
  - Document `postMessage` protocol between embed iframes and the shell (if a provider supports it).
  - Ethics note: we never bypass DMCA-removed content; Provider adapters that hit blocks must surface `BLOCKED` not retry.

**Acceptance.** Doc committed and linked from `README.md`.

---

## Task 6: Optional Cloudflare Workers proxy

- [ ] **T6.A — worker**
  - `workers/proxy.ts`: a small Worker that fetches a whitelisted URL pattern and returns the body with CORS headers. Rate-limited per Worker request (`/1/5m/IP`).
  - `wrangler.toml` template. The user deploys it to their own CF account. We never ship a shared proxy.

- [ ] **T6.B — adapter integration**
  - `resolverFetch(url, { proxy: 'auto' | 'off' | 'always' })` consults `preferences.resolver.proxy`.
  - If `auto`: tries direct, falls back to proxy when direct CORS fails.
  - Settings UI (Task 16) exposes the toggle and the user's Worker URL.

**Acceptance.** Setting a valid Worker URL in Settings routes VidLink through it when CORS blocks direct.

---

## Task 7: Health tracking

- [ ] **T7 — health.ts**
  - Per-provider rolling window: last 20 attempts.
  - Score = success_rate · 0.7 + (1 / avg_latency_ms_normalized) · 0.3.
  - `health.record(providerId, { ok, latencyMs })`, `health.score(providerId)`.
  - Persisted in `sessionStorage` only (health shouldn't leak between sessions — providers come and go).

**Acceptance.** Unit: 10 wins then 10 losses → score drops correctly.

---

## Task 8: Per-provider rate limiter

- [ ] **T8 — rate-limit.ts**
  - Token bucket per provider domain (`bucket[provider] = { tokens, refillRate, lastRefill }`).
  - `await rateLimiter.take(providerId)` blocks until a token is available.
  - Defaults: 2/sec per provider, configurable per adapter via an optional `rateLimit` field.

**Acceptance.** Unit: 10 parallel requests against a 2/s provider serialize correctly.

---

## Task 9: VidSrc adapter

- [ ] **T9 — vidsrc.ts**
  - `id: 'vidsrc'`, `label: 'VidSrc'`.
  - `build({ kind, tmdbId, season, episode })`:
    - Movie: `https://vidsrc.to/embed/movie/${tmdbId}`
    - TV: `https://vidsrc.to/embed/tv/${tmdbId}/${season}/${episode}`
  - `resolve`: return `{ embedUrl: build(req).toString(), mime: 'text/html' }`. VidSrc is iframe-only.
  - Tests: three URL patterns, handling of missing fields, handling of imdbId alternative.

**Acceptance.** Test URLs match known-good VidSrc patterns.

---

## Task 10: VidLink adapter

- [ ] **T10 — vidlink.ts**
  - `id: 'vidlink'`, `label: 'VidLink'`.
  - Movie: `https://vidlink.pro/movie/${tmdbId}`; TV: `https://vidlink.pro/tv/${tmdbId}/${season}/${episode}`.
  - Supports `postMessage` progress events — documented in CORS strategy doc, consumed by P2-3 progress tracker.

**Acceptance.** Same as Task 9.

---

## Task 11: 2Embed adapter

- [ ] **T11 — twoembed.ts**
  - `id: '2embed'`, `label: '2Embed'`.
  - Movie: `https://www.2embed.cc/embed/${imdbId}` (prefers IMDb); TV: `https://www.2embed.cc/embedtv/${imdbId}&s=${season}&e=${episode}`.
  - If no IMDb ID, resolver throws `RESOLVER_MISSING_IDS`; the FallbackChain continues.

**Acceptance.** Test covers missing-imdbId path.

---

## Task 12: Embed.su adapter

- [ ] **T12 — embedsu.ts**
  - `id: 'embedsu'`, `label: 'Embed.su'`.
  - Movie: `https://embed.su/embed/movie/${tmdbId}`; TV: `https://embed.su/embed/tv/${tmdbId}/${season}/${episode}`.

---

## Task 13: SuperEmbed adapter

- [ ] **T13 — superembed.ts**
  - `id: 'superembed'`, `label: 'SuperEmbed'`.
  - Uses the API pattern `https://getsuperembed.link/?video_id=${imdbId}` (GET returns a final URL, which becomes the embed URL).
  - Requires an actual fetch (not pure URL build) — uses `resolverFetch`.
  - Handles timeout and 404 gracefully.

---

## Task 14: Autoembed aggregator

- [ ] **T14 — autoembed.ts**
  - `id: 'autoembed'`, `label: 'Autoembed'`. `https://autoembed.cc/embed/...`.
  - Documentation note: Autoembed itself calls multiple upstream providers. Treating it as one adapter is a simplification; if it fails, the FallbackChain moves to the next.

**Acceptance.** Each adapter: URL pattern test, error-case test, rate-limit compliance test.

---

## Task 15: Adapter test harness

- [ ] **T15 — harness**
  - `tests/unit/resolver/adapters/_harness.ts`: a MSW-backed factory that hands each adapter:
    - Simulated responses (success HTML, 404, 403, CORS failure, timeout).
    - Scenario builder: `scenario().resolveWith(body).slowBy(ms)`.
  - Each adapter test reuses the harness.

**Acceptance.** Harness powers all six adapter test files.

---

## Task 16: User-configurable provider order

- [ ] **T16 — `<ProviderOrderSettings>`**
  - Settings page adds a "المشغّلات" section.
  - List of providers with drag handles (keyboard accessible via `aria-keyshortcuts` + arrow up/down to reorder, Space to pick-up/drop).
  - Per-row toggle: "تفعيل / إيقاف".
  - Shows current health score as a mono-numeric (0–100) badge.
  - Reset-to-default button.

**Acceptance.** Reorder persists; disabled providers skipped in chain.

---

## Task 17: Resolver telemetry

- [ ] **T17 — debug panel**
  - `<ResolverDebugPanel>` opens via keyboard `Ctrl+Shift+D` (production-safe; does nothing if user hasn't opted-in in Settings → Advanced).
  - Lists: providers attempted, latency per attempt, final result, error codes.
  - Copy-as-JSON button for bug reports (sanitized — no tokens, no identifying info).

**Acceptance.** Opening the panel during a resolve shows live attempts.

---

## Task 18: Failure taxonomy

- [ ] **T18 — errors.ts**
  - `ResolverError` subclasses: `ResolverTimeoutError`, `ResolverBlockedError`, `ResolverDmcaError`, `ResolverGeoError`, `ResolverCorsError`, `ResolverNotFoundError`, `ResolverAllFailedError`.
  - Each has `code`, `provider`, `statusCode?`, `detail?`.
  - Maps into `lib/errors/taxonomy.ts` (P1-3 T17) with Arabic user-facing messages:
    - `RESOLVER_ALL_FAILED` → "تعذّر العثور على مصدر للمشاهدة — جرّب لاحقًا أو أعد ترتيب المشغّلات."
    - `RESOLVER_GEOFENCED` → "المحتوى غير متوفر في منطقتك — جرّب مشغّلاً آخر."
    - `RESOLVER_DMCA` → "تمت إزالة هذا المحتوى — اختر عنوانًا آخر."

**Acceptance.** Every taxonomy entry lands in `messages/ar.json`.

---

## Task 19: Error banner hookup

- [ ] **T19 — wire**
  - When the chain fails, emit a typed event on `bus`; `<ErrorBanner>` (P1-3 T17) listens and renders the right taxonomy entry with an action link (`/settings#resolver`).

**Acceptance.** Simulated all-fail shows the banner with a working link.

---

## Task 20: Resolver cache

- [ ] **T20 — cache.ts**
  - Positive cache: session-scoped `Map<key, ResolveResult>` keyed by `${type}:${tmdbId}:${season?}:${episode?}:${providerId}`.
  - Negative cache: short-lived (5m) to avoid retry storms on hard failures.
  - `ResolveResult.expiresAt` respected (some embeds are short-lived signed URLs).

**Acceptance.** Same request twice in a session → second returns without network.

---

## Task 21: Provider block-listing + safe-search

- [ ] **T21 — toggles**
  - Settings → Advanced:
    - Per-provider block toggle (persisted).
    - "البحث الآمن" global toggle: when on, passes `include_adult=false` to TMDB and filters adult provider URLs. On by default.
  - Enforced in registry (`isBlocked`) and TMDB client.

**Acceptance.** Blocking all providers → chain throws `RESOLVER_ALL_FAILED` immediately.

---

## Task 22: Provider-ethics doc

- [ ] **T22 — `docs/provider-ethics.md`**
  - Project stance: FADA is a user-configurable index of publicly-available embed endpoints; it does not host, store, or scrape against robots.txt.
  - Disclaimer: responsibility for the legality of accessed content lies with the user.
  - DMCA workflow: a provider issuing a block surfaces `DMCA` to the user; we never cache or re-surface DMCA'd content.
  - Contributor guidelines: new providers must pass the "no-robots-violation" review; any obfuscated scraping or JS-bundle stealing is rejected.
  - Geolocation respect: no VPN instructions; if a provider geofences, we surface the error and move on.

**Acceptance.** Doc reviewed and committed. Linked from `README.md` and `/settings/about`.

---

## Task 23: Storage schema v1 extension

- [ ] **T23 — extend `fada.v1`**
  - Add optional `resolver: { order: string[], blocked: string[], proxy: 'auto'|'off'|'always', proxyUrl: string|null }`.
  - Backward-compatible migration — missing subtree fills with defaults.
  - Defer the major v1 → v2 migration to P2-3 (history + progress), but prep the key namespace now.

**Acceptance.** Old v0.1 users upgrade cleanly.

---

## Task 24: Plan P2-1 acceptance

- [ ] **T24 — gate**
  - `npm run typecheck`, `lint`, `test`, `test:e2e` — all green.
  - Resolver E2E: stub 3 adapters to fail, chain still returns the 4th's result.
  - Provider order persists across reload.
  - Error banner surfaces correct taxonomy entry for simulated CORS failure.
  - `docs/cors-strategy.md` and `docs/provider-ethics.md` committed.
  - All TODO.md §4 P2-1 checkboxes ticked.

---

## Handoff to Plan P2-2

Resolver is callable but nothing consumes it yet. Plan P2-2 builds the player UI that invokes `chain.resolve(req)` and renders the result (iframe or native hls.js).
