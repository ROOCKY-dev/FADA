---
tags: [plan, p2]
date: 2026-04-24
status: ready
phase: P2 (v0.2.0) — Plan 2 of 4
depends_on: [p2-plan-1-resolver-architecture.md]
unlocks: [p2-plan-3-progress-and-history.md]
related:
  - "[[../../DESIGN]]"
  - "[[00-conventions]]"
  - "[[TODO]]"
---

# FADA P2 — Plan 2: Player & Subtitles

> **Sub-skill.** `superpowers:executing-plans`. Tasks 7–10 (subtitle parsers) parallelize.

**Goal.** Give the resolver consumers a real player. Iframe embeds render in `<PlayerFrame>`. Direct HLS/DASH/MP4 sources render in `<PlayerNative>` built on hls.js (HLS), dash.js (DASH), and native `<video>` (MP4). Subtitles fetched from OpenSubtitles and parsed client-side (.srt, .vtt, .ass). Arabic subtitle rendering is bidi-safe. RTL keyboard controls match `docs/keyboard.md`.

**Architecture.** `<Player>` is a route-level shell at `/watch/:type/:id/[:season/:episode]`. It calls `chain.resolve(req)` from Plan 1. If `directUrl` is returned and mime is HLS/DASH/MP4, it mounts `<PlayerNative>`; otherwise `<PlayerFrame>`. Subtitles are resolved via `useSubtitles(req)` — a parallel fetch that races OpenSubtitles + user-upload + embed-discovered tracks.

**Tech stack (new).** `hls.js` (≤ 200KB gz), `dash.js` (optional, lazy), `@opensubtitles/opensubtitles.com` wrapper (or plain fetch against the public API with our key), `iconv-lite` for non-UTF8 subtitles, no full .ass renderer (basic parser for position/italic/bold only).

**Spec.** `vault/index.md` P2 goals.

**Design delta applied at this phase — swap detail-page CTAs.** DESIGN.md §4.13 said "Add to list" is gold-primary in P1 because playback didn't work. Now it does. This plan flips it: **primary = "شاهد الآن"** (gold), **secondary = "أضف إلى قائمتي"** (ghost) on every detail page.

---

## Scope

### In
- `<Player>` route-level shell.
- `<PlayerFrame>` — sandboxed iframe for iframe-only embeds.
- `<PlayerNative>` — hls.js, dash.js, direct MP4.
- `<PlayerControls>` — RTL-aware shell (play/pause, seek, volume, fullscreen, PiP, subs).
- Keyboard map end-to-end.
- Subtitle fetch: OpenSubtitles, Subf2m scraper (optional), user upload.
- `.srt` / `.vtt` / `.ass` parsers (basic).
- Subtitle offset/timing UI.
- Arabic bidi-safe rendering.
- Picture-in-picture (where browser allows).
- Episode auto-advance with a 10s skip-prompt.
- Resume-from-position wiring (consumes the store slice added by P2-3).
- Error states: stream blocked / CORS / decode fail.
- Detail-page CTA swap.

### Out (deferred)
- Continue-watching rail → P2-3.
- History page → P2-3.
- Live HLS tuning → P4.
- Cast / AirPlay → post-P5 roadmap.

---

## File structure

```
app/
├── app/
│   └── watch/
│       ├── movie/[id]/page.tsx                  # new
│       └── tv/[id]/[season]/[episode]/page.tsx  # new
├── components/
│   └── player/
│       ├── Player.tsx
│       ├── PlayerFrame.tsx
│       ├── PlayerNative.tsx
│       ├── PlayerControls.tsx
│       ├── PlayerSubtitles.tsx
│       ├── PlayerError.tsx
│       ├── PiPButton.tsx
│       └── FullscreenButton.tsx
├── lib/
│   └── subtitles/
│       ├── types.ts
│       ├── srt.ts
│       ├── vtt.ts
│       ├── ass.ts
│       ├── normalize.ts                         # offset/scale
│       ├── sources/
│       │   ├── opensubtitles.ts
│       │   ├── subf2m.ts
│       │   └── upload.ts
│       └── bidi.ts
└── tests/
    ├── unit/subtitles/
    │   ├── srt.test.ts
    │   ├── vtt.test.ts
    │   ├── ass.test.ts
    │   ├── normalize.test.ts
    │   └── bidi.test.ts
    └── e2e/
        └── player.spec.ts
```

---

## Task 1: `<Player>` shell

- [ ] **T1 — shell**
  - Props derived from route: `{ type, id, season?, episode? }`.
  - Calls `chain.resolve(req)`; while pending, shows `<StarLoader size="full">`.
  - On success: picks `<PlayerNative>` vs `<PlayerFrame>` based on `directUrl + mime`.
  - On failure: `<PlayerError>` with the resolver's taxonomy entry + "جرّب مشغّلاً آخر" action.
  - Route `/watch/movie/:id` → movie; `/watch/tv/:id/:season/:episode` → episode.

**Acceptance.** Loading a known-good embed renders a playable frame.

---

## Task 2: `<PlayerFrame>` (iframe sandbox)

- [ ] **T2 — iframe**
  - Attributes: `allow="autoplay; encrypted-media; picture-in-picture; fullscreen"`, `sandbox="allow-forms allow-scripts allow-same-origin allow-popups-to-escape-sandbox"`.
  - Strict `referrerpolicy="no-referrer"`.
  - Listens for `postMessage` events on a whitelist of provider origins; forwards to a provider-specific parser (currently: VidLink progress events).

**Acceptance.** Sandbox flags allow the embed to function; no escape-script can modify the host.

---

## Task 3: `<PlayerNative>` — hls.js

- [ ] **T3.A — install**
  - `npm i hls.js@latest`.

- [ ] **T3.B — integrate**
  - Lazy-load hls.js via `next/dynamic`.
  - If `Hls.isSupported()` → attach to `<video>`; else rely on Safari native HLS.
  - Surface `Hls.Events.ERROR` into `<PlayerError>` taxonomy.

**Acceptance.** Playing a test-bunny HLS URL works in Chromium and Safari.

---

## Task 4: `<PlayerNative>` — dash.js (optional)

- [ ] **T4 — adapter**
  - Lazy-load dash.js only when `mime === 'application/dash+xml'`.
  - Keep out of the main bundle.

**Acceptance.** Lighthouse shows dash.js chunk loaded only on DASH pages.

---

## Task 5: Direct MP4 fallback

- [ ] **T5 — native video**
  - When `mime === 'video/mp4'` (or `.mp4` extension), use native `<video src>`.

**Acceptance.** Any `.mp4` direct URL plays.

---

## Task 6: `<PlayerControls>` (RTL-aware)

- [ ] **T6.A — layout**
  - Bottom bar: play/pause · seek bar · time mono · volume · subtitles · PiP · fullscreen.
  - In RTL, play/pause is at the inline-start (the "left" visual edge — user expectation in RTL video UIs).
  - Time display: `<current> / <total>` with Western digits in Plex Mono.

- [ ] **T6.B — seek bar**
  - Shows buffered ranges; click to seek; drag to scrub.
  - Keyboard: focusable, `←`/`→` for ±10s.

- [ ] **T6.C — volume**
  - Slider + mute toggle.

- [ ] **T6.D — PiP & fullscreen**
  - `requestPictureInPicture` / `requestFullscreen` with graceful degrade.

**Acceptance.** Tab cycles through controls in logical reading order.

---

## Task 7: Keyboard map

- [ ] **T7 — shortcuts**
  - Space / `k` — play/pause
  - `←` / `→` — seek ±10s
  - `J` / `L` — seek ±5s (YouTube parity)
  - `↑` / `↓` — volume
  - `M` — mute
  - `F` — fullscreen
  - `C` — toggle captions
  - `,` / `.` — frame step (paused)
  - `0`–`9` — seek to 0%–90%
  - Register only while the player has focus (avoid hijacking site-wide).

**Acceptance.** Tests each shortcut. Document in `docs/keyboard.md`.

---

## Task 8: Subtitle fetcher — OpenSubtitles

- [ ] **T8.A — API key**
  - Register a public app ID with OpenSubtitles. Token is `NEXT_PUBLIC_OPEN_SUBS_APP_ID`. Note: this is a per-app rate-limit, not per-user.
  - Settings exposes an optional user-supplied `user_token` (same masked treatment as TMDB token).

- [ ] **T8.B — search**
  - `lib/subtitles/sources/opensubtitles.ts`: search by `tmdbId`, `season`, `episode`, language list `['ar', 'en']`.
  - Download the top Arabic match by default; English as fallback.

- [ ] **T8.C — download & parse**
  - Download URL → convert to UTF-8 via `iconv-lite` if needed (many subs are Windows-1256 for Arabic).

**Acceptance.** For a known TMDB movie, Arabic subtitle track loads.

---

## Task 9: `.srt` parser

- [ ] **T9 — srt.ts**
  - Parses `1\n00:00:01,000 --> 00:00:04,000\nText\n\n` blocks.
  - Strips HTML tags (`<i>`, `<b>`, `<u>`, `<font>`).
  - Handles BOM, mixed CRLF/LF.
  - Outputs `Array<{ start, end, text }>`.

**Acceptance.** Round-trip test against 3 real Arabic .srt files.

---

## Task 10: `.vtt` parser

- [ ] **T10 — vtt.ts**
  - Uses `window.VTTCue` and native `TextTrack`s when possible.
  - Custom parser for cases where we need to manipulate cues before rendering.
  - Respects `WEBVTT` header.

**Acceptance.** Native HTML5 captions rendering on Chrome.

---

## Task 11: `.ass/.ssa` parser (basic)

- [ ] **T11 — ass.ts**
  - Parses `[Events]` section and the basic `Dialogue:` lines.
  - Recognizes `{\i1}`, `{\b1}`, `{\u1}`, `{\an8}` (position), `{\c&HRRGGBB&}` (color). Ignores fancy transforms.
  - Outputs the same cue shape as SRT.

**Acceptance.** Real-world Arabic anime subtitles render legibly (accepting loss of elaborate styling).

---

## Task 12: Offset / timing UI

- [ ] **T12 — normalize.ts**
  - `applyOffset(cues, ms)` shifts every cue.
  - `applyScale(cues, factor)` for frame-rate mismatches (rare but documented).
  - UI: small gear on the subtitle toggle → popover with `-500 / -100 / 0 / +100 / +500` ms quick buttons and fine slider.

**Acceptance.** Offset persists per-title in `sessionStorage` (not worth writing to localStorage).

---

## Task 13: Arabic bidi-safe rendering

- [ ] **T13 — bidi.ts**
  - Arabic cues wrap in `unicode-bidi: isolate; direction: rtl`.
  - Latin-in-Arabic (e.g., "السلسلة XYZ") inside Arabic cue stays LTR thanks to `isolate`.
  - CSS subtitle style: Plex Sans Arabic, 22px base, weight 500, color `#FFFFFF`, text-shadow `0 2px 4px rgba(0,0,0,0.6)`.
  - Accessibility: `role="region" aria-live="polite"` on the subtitle container.

**Acceptance.** A cue mixing Arabic + Latin + numbers renders correctly.

---

## Task 14: Picture-in-picture

- [ ] **T14 — implement**
  - `<PiPButton>` — on click calls `video.requestPictureInPicture()`.
  - Disabled when browser doesn't support (WebKit on Linux).
  - Aria-label per state.

**Acceptance.** Opens PiP on supported browsers; button disabled otherwise.

---

## Task 15: Trailer mode reuse

- [ ] **T15 — trailer**
  - Detail page "trailer" CTA opens `<Player>` with `kind: 'trailer'` using TMDB's `videos` endpoint. The `<PlayerNative>` is embedded YouTube via iframe (or native if TMDB provides a direct URL — rare).

**Acceptance.** Trailers play on movie detail.

---

## Task 16: Episode auto-advance

- [ ] **T16 — implement**
  - On `<PlayerNative>` `ended` event (for TV episodes): show a 10s countdown overlay "الحلقة التالية في N ثوانٍ" with a cancel button.
  - On countdown complete, navigate to `/watch/tv/{id}/{season}/{next-episode}`.
  - Respect `preferences.autoAdvance: boolean` (add to Settings > General).

**Acceptance.** Countdown visible, cancel works, next-episode route loads.

---

## Task 17: Resume-from-position

- [ ] **T17 — wire**
  - Hook `useResume({ type, tmdbId, season?, episode? })` reads from the progress slice (added by P2-3).
  - On first `canplay`, if saved position exists ≥ 30s and ≤ 95%, seek to that position. Show a "استكمال من د:س" toast with undo.

**Acceptance.** Re-opening a partially watched title seeks; clicking undo seeks to 0.

---

## Task 18: Error states

- [ ] **T18 — `<PlayerError>`**
  - Renders when resolver throws or player decodes fail.
  - Shows taxonomy message + three actions: جرّب مشغّلاً آخر (calls `chain.resolve` with the failed provider blocked for this session), أبلغ عن مشكلة (opens GitHub Issues link with sanitized diagnostic), رجوع.

**Acceptance.** Simulated decode error surfaces the panel with all three actions.

---

## Task 19: Swap detail-page CTAs

- [ ] **T19 — edit**
  - `<DetailHero>` (from P1-2 T6): primary becomes `"شاهد الآن"` (gold) → navigates to `/watch/...`. Secondary becomes `"أضف إلى قائمتي"` (ghost).
  - `<EpisodeRow>` (from P1-2 T11): now **activating** — click/Enter navigates to the watch route.
  - `<EpisodesBanner>` (P1-2 T11.A) removed in this release (no longer accurate).

**Acceptance.** Detail page now offers real playback; watchlist button still accessible.

---

## Task 20: Plan P2-2 acceptance

- [ ] **T20 — gate**
  - Unit: all subtitle parsers green against fixtures.
  - Component: PlayerControls keyboard matrix green.
  - E2E: open a known movie → resolver resolves → player plays → subtitle toggle loads Arabic track → `F` fullscreens → `M` mutes.
  - E2E: fail first 2 providers in chain → user hits "جرّب مشغّلاً آخر" → 3rd succeeds.
  - Bundle budget re-checked; hls.js is lazy-loaded.
  - All TODO.md §4 P2-2 checkboxes ticked.

---

## Handoff to P2-3

Player works but plays blind — no progress is recorded, no Continue Watching rail exists. P2-3 wires the progress store, beacons, and Home rail.
