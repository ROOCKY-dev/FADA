---
tags: [plan, p1]
date: 2026-04-24
status: ready
phase: P1 (v0.1.0) — Plan 3 of 4
depends_on: [p1-plan-1-foundation-and-home.md, p1-plan-2-browse-detail-watchlist.md]
unlocks: [p1-plan-4-constellation-and-gates.md]
related:
  - "[[../specs/2026-04-23-fada-p1-ui-ux-design]]"
  - "[[../../DESIGN]]"
  - "[[00-conventions]]"
  - "[[TODO]]"
---

# FADA P1 — Plan 3: Search · Discover · Settings

> **Sub-skill.** `superpowers:executing-plans`. Settings sub-sections (Tasks 7–13) parallelize.

**Goal.** Ship the unified Search + Discover page and the full Settings page (General, My Data, TMDB, About). Wire the error-banner taxonomy for 429 / 404 / offline / bad-token cases. Polish the keyboard map.

**Architecture.** Search and Discover share `/search` as one page with two modes. Settings composes primitives from shadcn + Plan 1 components. Export/Import uses `URL.createObjectURL` + `<input type="file">` — no server. All surface decisions trace DESIGN.md §4 deltas.

**Tech stack.** No new runtime deps. Dev-only: `zod`-validated export/import envelope (already installed).

**Spec.** `vault/specs/2026-04-23-fada-p1-ui-ux-design.md §4.7, §4.8, §9.3, §9.4, §9.6`.

**Design deltas honored here (from `DESIGN.md`):**
- §4.7 — `/` and `Ctrl/Cmd+K` both bind to search (wired in Plan 1 already; this plan consumes).
- §4.8 — Poster-density toggle is only shipped if both modes are built; otherwise drop.
- §4.9 — Import opens a merge/replace `<Dialog>`; no silent merge.
- §4.10 — Custom TMDB token input is masked with show/hide and last-4 display.

---

## Scope

### In
- `/search` unified page (Search mode + Discover mode).
- Recent searches (10 deep, deduped, clearable).
- `<TypeBadge>` for search results.
- Settings shell with four sections.
- General: region, theme, density (only if §4.8 built; otherwise drop toggle).
- My Data: export, import with merge/replace `<Dialog>`, clear cache, full reset.
- TMDB: token status, masked custom-token input with show/hide.
- About: version, license, GitHub link, credits.
- Locale plumbing (single `messages/ar.json`, no `<LocaleSwitcher>` — strings for it are seeded for P3/P4 activation).
- URL-state sync for search/discover filters.
- Error banners: 429, 404, offline, invalid custom token.
- Light-theme token swap (toggle works; visual polish deferred).

### Out (deferred)
- Full light-theme visual polish → P3.
- Second language strings → post-P5 roadmap.
- Discover "mood" or editorial curation → P3.

---

## File structure created / modified

```
app/
├── app/
│   ├── search/page.tsx                          # replaces stub
│   └── settings/page.tsx                        # replaces stub
├── components/fada/
│   ├── SearchInput.tsx                          # new
│   ├── RecentSearches.tsx                       # new
│   ├── TypeBadge.tsx                            # new
│   ├── DiscoverFilters.tsx                      # new — superset of FilterBar
│   ├── SettingsSection.tsx                      # new
│   ├── SettingsRow.tsx                          # new
│   ├── MaskedTokenInput.tsx                     # new
│   ├── ImportDialog.tsx                         # new — merge/replace
│   └── ErrorBanner.tsx                          # new
├── lib/
│   ├── export/
│   │   ├── watchlistExport.ts                   # new
│   │   └── watchlistImport.ts                   # new — Zod envelope + merge/replace
│   ├── tmdb/
│   │   └── hooks/
│   │       └── useMultiSearch.ts                # new
│   └── errors/
│       └── taxonomy.ts                          # new — error code → Arabic message
└── tests/
    ├── unit/
    │   ├── watchlist-export-import.test.ts
    │   └── error-taxonomy.test.ts
    ├── component/
    │   ├── SearchInput.test.tsx
    │   ├── RecentSearches.test.tsx
    │   ├── DiscoverFilters.test.tsx
    │   ├── ImportDialog.test.tsx
    │   ├── MaskedTokenInput.test.tsx
    │   └── ErrorBanner.test.tsx
    └── e2e/
        ├── search.spec.ts
        ├── discover.spec.ts
        └── settings.spec.ts
```

---

## Task 1: Multi-search endpoint

- [ ] **T1 — endpoint**
  - `tmdb.get('/search/multi', { query, language, include_adult: false })`.
  - Zod schema allowing heterogeneous `media_type` in results (movie/tv/person).
  - Hook: `useMultiSearch(q)` with 300ms debounce inside hook.

**Acceptance.** Query "ertug" returns at least one TV result.

---

## Task 2: Discover endpoint with full params

- [ ] **T2 — endpoint**
  - Already stubbed in Plan 2; this task extends to accept all discover params: `with_genres`, `without_genres`, `with_original_language`, `region`, `with_keywords`, `vote_count.gte`, `primary_release_date.gte/lte`, `sort_by`.
  - Hook: `useDiscover({ type, params })`.

**Acceptance.** URL `?type=movie&genre=28&lang=tr&year=2015-2020&sort=top_rated` fetches correct slice.

---

## Task 3: `/search` unified page

- [ ] **T3.A — layout**
  - Head: `<h1>البحث والاستكشاف</h1>` + sub.
  - `<SearchInput>` (Task 4) at top, full-width.
  - Mode switch: if `?q=` present → Search mode; else → Discover mode. Both modes share `<DiscoverFilters>` (type chips + narrow filters). Results grid below.

- [ ] **T3.B — Search mode**
  - Results from `useMultiSearch(q)`. Each card shows `<TypeBadge>` (movie/tv/person).
  - Person results link to person detail (not built in P1 — route to TMDB page externally).

- [ ] **T3.C — Discover mode**
  - `<DiscoverFilters>` panel + `<PosterGrid>` consuming `useDiscover`.
  - Infinite scroll.

- [ ] **T3.D — tests**
  - E2E: type a query → see results → clear → discover mode returns.

**Acceptance.** Typing changes URL (`?q=...`) without hard reload; clearing returns to discover.

---

## Task 4: Recent searches

- [ ] **T4.A — component**
  - `<RecentSearches>` renders chips from `useFadaStore(s => s.recentSearches)`.
  - Each chip sets URL `?q=<term>`.
  - "مسح" button clears all.

- [ ] **T4.B — dedupe + cap**
  - Store action `pushRecentSearch(q)` lowercases, trims, dedupes, caps at 10 (MRU).

- [ ] **T4.C — tests**
  - Unit: cap at 10, dedupe, MRU order.
  - Component: click chip updates URL.

**Acceptance.** Persists across reloads.

---

## Task 5: `<TypeBadge>`

- [ ] **T5 — implement**
  - Tiny pill with mono label: `MOVIE` / `TV` / `PERSON`. Overlay on inline-start top of card. Gold accent.
  - Localized variants: uses `messages/ar.json` keys `type.movie` → "فيلم", `type.tv` → "مسلسل", `type.person` → "شخص".

**Acceptance.** Renders on every search-mode card; hidden in discover mode (all same type).

---

## Task 6: Settings shell

- [ ] **T6 — implement**
  - `app/settings/page.tsx` renders head + four `<SettingsSection>` components.
  - `<SettingsSection title desc>` wraps its children in a bordered surface; title row with separator line to inline-end.
  - `<SettingsRow label hint>` — grid `[flex | auto]`, label column at start.

**Acceptance.** Structurally matches DESIGN.md §5.6 Settings.

---

## Task 7: General section

- [ ] **T7.A — region**
  - Chips: MENA / عالمي. Writes to `preferences.region`.
  - Read by Home rails (Plan 1 hooks) via a selector — when "global", demote Arabic rail below Trending Global.

- [ ] **T7.B — theme**
  - Chips: ليلي / نهاري / تلقائي. Writes to `preferences.theme`.
  - `<ThemeEffect>` component applies `document.documentElement.setAttribute('data-theme', resolved)` on change; listens to `matchMedia('(prefers-color-scheme: dark)')` when theme is system.
  - Light theme reads an alternate token set (`tokens/design-tokens.light.json`) produced by generator; contrast must still hit AA. Visual polish deferred to P3.

- [ ] **T7.C — poster density**
  - Per DESIGN.md §4.8: **only ship if both modes are implemented.**
  - If yes:
    - `comfortable` (default): 2/4/6/7/8 columns, 14px gap.
    - `compact`: 3/5/7/8/10 columns, 8px gap, title only (year on hover).
    - `<PosterGrid>` reads `preferences.posterDensity`.
  - If not shippable in this sprint: drop the toggle entirely; update DESIGN.md §5.6 and the spec reference.

**Acceptance.** Region / theme work end-to-end. Density either works or isn't shown.

---

## Task 8: My Data — export

- [ ] **T8.A — exporter**
  - `lib/export/watchlistExport.ts`: builds envelope `{ fada_export_version: 1, exported_at, watchlist: [...] }` with titles fetched via a single TMDB batch for human readability.
  - Uses `URL.createObjectURL(new Blob([JSON], { type: 'application/json' }))` + hidden anchor download.
  - Filename: `fada-watchlist-YYYY-MM-DD.json`.

- [ ] **T8.B — tests**
  - Unit: envelope matches Zod schema.
  - Component: clicking Export triggers a download (spy on anchor).

**Acceptance.** Downloaded file opens in a text editor, valid JSON.

---

## Task 9: My Data — import + merge/replace

- [ ] **T9.A — importer**
  - `lib/export/watchlistImport.ts`:
    - Reads file via FileReader.
    - Zod-parses envelope.
    - Returns `{ items, summary }`.
  - Two operations: `merge(items)` and `replace(items)`.

- [ ] **T9.B — `<ImportDialog>`**
  - shadcn `<Dialog>` with:
    - "تم العثور على N عنوانًا في الملف. قائمتك الحالية تحتوي M."
    - Three buttons: **دمج** · **استبدال** · **إلغاء**.
    - "استبدال" requires a second confirm (nested dialog or inline confirm step): "سيتم حذف العناوين الحالية. هل تريد المتابعة؟".
  - Accessible: `role="alertdialog"`, focus-trap.

- [ ] **T9.C — toasts**
  - On success: "تم استيراد X عنوانًا" / "تم استبدال القائمة (M → N)".
  - On invalid file: error banner (Task 17).

- [ ] **T9.D — tests**
  - Unit: merge dedupe by id+type.
  - Unit: replace wipes existing.
  - Component: dialog flow keyboard-only.
  - E2E: export → clear → import → watchlist restored.

**Acceptance.** Silent merge is no longer the default. DESIGN.md §4.9 satisfied.

---

## Task 10: My Data — clear cache + full reset

- [ ] **T10.A — clear cache**
  - Row: "البيانات المخزّنة مؤقتًا" with size estimate from `navigator.storage.estimate()`.
  - Button "مسح" clears only `fada.rq.v1` (React Query persistence). Toast: "تم مسح الذاكرة المؤقتة".

- [ ] **T10.B — full reset**
  - Row: "إعادة ضبط كامل" with danger-tinted border.
  - Button opens a confirmation dialog ("سيتم حذف كل بياناتك — لا يمكن التراجع"). Requires typing `حذف` to enable the confirm button (friction against accidents).
  - On confirm: clear `fada.v1`, `fada.rq.v1`, `sessionStorage`. Reload.

**Acceptance.** Clear-cache keeps watchlist; full reset wipes everything.

---

## Task 11: TMDB — token status

- [ ] **T11 — component**
  - Row: "المفتاح الحالي".
  - Badge: green pill "نشط · SHIPPED" or gold pill "نشط · CUSTOM" based on `tmdb.customToken` presence.
  - Sub-label (mono): rate-limit status pulled from last TMDB response headers (cached in a small `useTmdbHealth()` selector).

**Acceptance.** Pasting a token flips badge to CUSTOM; clearing flips back to SHIPPED.

---

## Task 12: TMDB — `<MaskedTokenInput>`

- [ ] **T12 — implement**
  - Input starts `type="password"` when value present; show/hide eye toggle on inline-end.
  - After save: displays `Bearer ··········${last4}` with a "تعديل" pencil that re-enters edit mode.
  - On save: validate by making a test call to TMDB `/configuration`; on 401 → error banner "المفتاح غير صالح" and fall back to shipped.
  - Hint: "يُحفظ محليًا فقط — لا يُرسل إلى أي خادم."

**Acceptance.** DESIGN.md §4.10 satisfied. Screen-share reveals masked token only.

---

## Task 13: About section

- [ ] **T13 — implement**
  - Rows: الإصدار (mono, from package.json) · الرخصة (`MIT · OPEN SOURCE`) · الكود المصدري (GitHub link) · المعتمدون (credits).
  - Also shows a "تنزيل حزمة التشخيص" button — exports a sanitized JSON of app state (no tokens, no watchlist titles, only counts + versions + error-log tail) for bug reports. Wired fully in P3 Task 7.

**Acceptance.** Version matches `package.json` exactly.

---

## Task 14: Keyboard map documentation

- [ ] **T14 — docs**
  - Create `docs/keyboard.md` (canonical shortcuts reference per `00-conventions.md §15`).
  - Settings → About adds a link "اختصارات لوحة المفاتيح" → opens a `<Dialog>` rendering the content of `docs/keyboard.md` (parsed at build).

**Acceptance.** Table: `/`, `Ctrl/Cmd+K`, `G` + `H/M/S/C/W`, arrow keys, `Esc`, long-press `Enter` all listed with Arabic descriptions.

---

## Task 15: URL-state sync

- [ ] **T15 — library**
  - `lib/utils/urlState.ts`: hook `useUrlState<T>({ parse, serialize })` returning `[state, setState]` that syncs to `useSearchParams` + `router.replace({ scroll: false })`.
  - Used by search, discover, browse, watchlist filter, season tabs.

**Acceptance.** Reloading `/search?q=ertug&type=tv` restores both.

---

## Task 16: Light-theme token swap

- [ ] **T16 — light tokens**
  - `tokens/design-tokens.light.json` with an initial palette: `bg.base #FAF7EE`, `bg.surface #F2EEE0`, `fg.primary #1A1D28`, `fg.muted #555B70`, `accent.gold #A07D2A` (AA-compliant).
  - Generator extended to emit both, toggled by `data-theme` attribute.
  - Spot-check contrast in the unit test suite: walk a sample of token pairs, assert AA.

**Acceptance.** Toggle to light in Settings changes colors; AA spot-check passes. Full visual polish (shadows, gradients) is a P3 item.

---

## Task 17: Error banners + taxonomy

- [ ] **T17.A — taxonomy**
  - `lib/errors/taxonomy.ts`:
    - `TMDB_RATE_LIMIT` → "الخدمة مشغولة — جرّب مفتاح TMDB خاص من الإعدادات"
    - `TMDB_NOT_FOUND` → "ربما حُذف العنوان — عد إلى الرئيسية"
    - `NETWORK_OFFLINE` → "لا يوجد اتصال — البيانات المعروضة من الذاكرة"
    - `TMDB_CUSTOM_TOKEN_INVALID` → "المفتاح غير صالح — يُستخدم المفتاح الافتراضي"
    - `IMPORT_INVALID_FILE` → "ملف غير صالح — تحقق من التنسيق"
    - `STORAGE_PARSE_FAILED` → "حدث خطأ بقراءة بياناتك — تمت العودة للإعدادات الافتراضية"
  - Each entry: `{ code, severity: 'info'|'warn'|'error', message, action?: { label, href } }`.

- [ ] **T17.B — `<ErrorBanner>`**
  - Dismissible banner rendered via a small event bus that the TMDB client, storage layer, and import pipeline all emit to.
  - Offline banner sticky-top when `navigator.onLine === false`.

- [ ] **T17.C — tests**
  - Unit: taxonomy table round-trip.
  - Component: banner dismiss.

**Acceptance.** Simulated 429 in devtools surfaces the correct banner + action.

---

## Task 18: Plan 3 acceptance gate

- [ ] **T18 — gate**
  - Full type/lint/test/e2e green.
  - Export → clear → import round-trip passes.
  - TMDB custom-token path end-to-end (set, validate, unset) passes.
  - Search → Discover mode switch via URL passes.
  - All TODO.md §3 P1-3 checkboxes ticked.

---

## Handoff to Plan 4

After Plan 3:
- Every P1 route works except that Home hero is a placeholder and collection cards are plain.
- Every user-facing copy string lives in `messages/ar.json`.
- Export/import round-trip works.

Plan 4 ships the constellation, TV focus polish, CI gates, and the v0.1 release.
