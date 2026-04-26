---
tags: [plan, p2]
date: 2026-04-24
status: ready
phase: P2 (v0.2.0) — Plan 3 of 4
depends_on: [p2-plan-2-player-and-subtitles.md]
unlocks: [p2-plan-4-global-coverage.md]
related:
  - "[[../../DESIGN]]"
  - "[[00-conventions]]"
  - "[[TODO]]"
---

# FADA P2 — Plan 3: Progress & History

> **Sub-skill.** `superpowers:executing-plans`. Linear — storage migrations can't be parallelized.

**Goal.** Track per-title / per-episode progress locally; surface a "Continue Watching" rail on Home; show a progress badge on cards; let users export/import their progress; provide a history page.

**Architecture.** Migrate `fada.v1` → `fada.v2` adding `progress` and `history` slices. Progress beacons fire every 10s from `<PlayerNative>` and on `pause`/`ended`. All reads go through Zustand selectors. Old exports (v1) auto-migrate on import. New export envelope includes both.

**Tech stack.** No new runtime deps.

**Spec.** `vault/index.md` P2 goals.

---

## Scope

### In
- `fada.v1` → `fada.v2` migration.
- `progress` slice (per-item position / completion).
- `history` slice (ordered activity log).
- Beacon cadence + throttle.
- "Continue Watching" rail on Home.
- Per-show progress aggregation (next-unwatched episode).
- Progress badge on `<PosterCard>`.
- Mark-as-watched affordance.
- Clear history and per-title reset.
- `/history` page.
- Export schema v2 + v1 import compat.
- Progress heatmap on show detail.
- Settings toggle: disable progress tracking.

### Out (deferred)
- Cross-device sync → not planned (see invariants).
- Calendar widget → P3.

---

## File structure

```
app/
├── app/
│   └── history/page.tsx                         # new
├── lib/
│   ├── storage/
│   │   ├── schema.v2.ts                         # new
│   │   └── migrate.v1-to-v2.ts                  # new
│   └── progress/
│       ├── slice.ts                             # new Zustand slice
│       ├── beacon.ts                            # new
│       ├── aggregate.ts                         # new — show-level rollup
│       └── types.ts
├── components/fada/
│   ├── ContinueWatchingRail.tsx                 # new
│   ├── ProgressBadge.tsx                        # new
│   ├── ProgressHeatmap.tsx                      # new
│   └── HistoryList.tsx                          # new
└── tests/
    ├── unit/
    │   ├── migrate-v1-to-v2.test.ts
    │   ├── progress-aggregate.test.ts
    │   └── beacon-throttle.test.ts
    └── e2e/
        ├── continue-watching.spec.ts
        └── history.spec.ts
```

---

## Task 1: v1 → v2 migration

- [ ] **T1 — migrate.v1-to-v2.ts**
  - Add top-level `version: 2`.
  - Introduce:
    ```ts
    progress: {
      movies: Record<number, MovieProgress>;
      episodes: Record<string, EpisodeProgress>; // key = `${tvId}:${season}:${episode}`
    },
    history: Array<HistoryEvent>, // ordered, newest first, cap 500
    preferences: {
      ...,
      autoAdvance: boolean,
      progressEnabled: boolean,
    }
    ```
  - Types:
    ```ts
    type MovieProgress = { position: number; duration: number; updatedAt: string; completed: boolean };
    type EpisodeProgress = MovieProgress & { nextEpisode?: { season: number; episode: number } };
    type HistoryEvent =
      | { kind: 'play-start'; at: string; ref: { type: 'movie'|'tv'; tmdbId: number; season?: number; episode?: number }; title: string }
      | { kind: 'play-end'; at: string; ref: ...; title: string; percent: number };
    ```

- [ ] **T1.B — tests**
  - Seed a v1 dump, migrate, assert shape.
  - Corruption path tested.

**Acceptance.** Round-trip without data loss.

---

## Task 2: Beacon cadence

- [ ] **T2 — beacon.ts**
  - Exports `recordBeacon({ ref, position, duration })`.
  - Throttles writes: max 1 per 10s per ref.
  - On `pause` / `ended` / `route-change`: flushes pending beacon immediately.
  - On `ended`: also marks `completed: true`, emits a `play-end` history event.

**Acceptance.** Unit: 60 events in 10s collapse to 1 write.

---

## Task 3: Progress slice

- [ ] **T3 — slice.ts**
  - Zustand slice with:
    - `setProgress(ref, { position, duration, completed })`
    - `getProgress(ref): MovieProgress | EpisodeProgress | null`
    - `markWatched(ref)` / `markUnwatched(ref)`
    - `clearAll()` / `clearRef(ref)`
    - `selectContinueWatching(limit): Array<{ ref, title, progressPct, resumeSeconds }>`

**Acceptance.** Selectors fully typed; unit tests green.

---

## Task 4: Continue Watching rail

- [ ] **T4.A — `<ContinueWatchingRail>`**
  - Only renders if `selectContinueWatching(7).length > 0`.
  - Appears as the **first** rail on Home, above "Trending Globally".
  - Each card shows poster + title + progress bar (thin gold, bottom edge).

- [ ] **T4.B — per-show rollup**
  - For TV items: show the next-unwatched episode's poster + label "S{N}·E{M}".
  - `lib/progress/aggregate.ts`: given a `tvId`, compute next unwatched episode using the episode cache from P1-2.

**Acceptance.** Start a movie 10% in → reload → rail shows it; finishing it → rail drops it.

---

## Task 5: Progress badge on `<PosterCard>`

- [ ] **T5 — `<ProgressBadge>`**
  - 2px gold bar along the poster's bottom edge inside the poster image.
  - Width = progress %. If `completed`, full width at 30% opacity.
  - Does not render if `preferences.progressEnabled === false`.

**Acceptance.** Visible on Home, Browse, Watchlist; not on Collections deep page (too busy).

---

## Task 6: Mark-as-watched

- [ ] **T6 — context menu**
  - `<EpisodeRow>` and `<PosterCard>` get a context menu (right-click on desktop, long-press on touch):
    - "ضع علامة مشاهَد" / "إزالة علامة المشاهدة"
    - "مسح من السجل"
  - Radix `<DropdownMenu>` primitive.

**Acceptance.** Marking an episode watched clears it from Continue Watching; unmarking re-surfaces it.

---

## Task 7: Clear & per-title reset

- [ ] **T7 — Settings wiring**
  - My Data section adds: "مسح السجل" + "مسح تقدم عنوان واحد" (dropdown of watched titles).
  - Confirm dialog for full clear.

**Acceptance.** Clearing returns to empty state.

---

## Task 8: `/history` page

- [ ] **T8.A — page**
  - Head + a chronological `<HistoryList>`.
  - Grouped by week (Arabic week labels).
  - Each entry: poster thumb, title, "بدأ / أنهى", timestamp (Arabic relative + absolute).
  - Pagination: 50 at a time.

- [ ] **T8.B — empty state**
  - `<StarEmptyState>` "لا يوجد سجل مشاهدة بعد".

**Acceptance.** E2E: watch something → visit /history → entry present.

---

## Task 9: Export schema v2

- [ ] **T9 — exporter**
  - `lib/export/watchlistExport.ts` updated to `fada_export_version: 2`.
  - Includes `progress`, `history` at user's option (checkbox in the export dialog).
  - Default: include watchlist + progress; exclude history (privacy; a viewing diary may be sensitive).

**Acceptance.** Export contains intended sections; "include history" checkbox honored.

---

## Task 10: Import compat

- [ ] **T10 — importer**
  - `lib/export/watchlistImport.ts` detects `fada_export_version`:
    - v1 → migrate shape → merge/replace as before.
    - v2 → accept natively.
  - Per-section merge: user can import watchlist only, progress only, or all.

**Acceptance.** v1 file imports into v2 app without loss.

---

## Task 11: Progress heatmap

- [ ] **T11 — `<ProgressHeatmap>`**
  - On TV detail page, a small calendar grid of season × episode cells.
  - Cell color intensity scales with watched %.
  - Click a cell → scrolls to that episode in the list.

**Acceptance.** Accessibility: alt-text table with the same data for screen readers.

---

## Task 12: Settings toggle

- [ ] **T12 — switch**
  - Settings → General → "تتبّع التقدم" (on by default).
  - When off: beacons no-op, Continue Watching rail hidden, progress badge hidden.

**Acceptance.** Toggling off immediately hides rail + badges.

---

## Task 13: Storage edge-cases

- [ ] **T13 — hardening**
  - 5MB localStorage cap; history is the most likely offender.
  - When size nears cap, evict oldest `history` entries (keep newest 200).
  - Progress trims: cap at 1000 movies / 1000 episodes — LRU eviction on write.

**Acceptance.** Filling up to cap doesn't crash; eviction leaves the app usable.

---

## Task 14: Plan P2-3 acceptance

- [ ] **T14 — gate**
  - All prior plans still green.
  - Migration round-trip test green.
  - Continue Watching E2E green.
  - History E2E green.
  - Bundle still within budget.
  - All TODO.md §4 P2-3 checkboxes ticked.

---

## Handoff to P2-4

Resolver, player, subtitles, and progress are done for the primary providers. P2-4 adds global/regional adapters.
