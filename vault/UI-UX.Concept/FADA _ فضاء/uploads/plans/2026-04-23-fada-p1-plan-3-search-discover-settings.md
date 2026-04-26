# FADA P1 — Plan 3: Search, Discover, Settings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the unified `/search` page (Search + Discover dual-mode), the full `/settings` page (General, My Data with watchlist export/import UI, TMDB, About), and polish the recent-searches wiring already laid down by Plan 1's store.

**Architecture:** Reuses Plan 1's TMDB client + React Query + Zustand store (action `pushRecentSearch` and state `recentSearches` already exist) and Plan 2's `<FilterBar>`, `<PosterGrid>`, `<PosterCard>`, `<CollectionHero>` components. Only new TMDB endpoint is `multiSearch`. The Settings page is a plain grouped list of form controls composed from shadcn primitives — no custom shell component.

**Tech Stack:** No new runtime deps beyond Plan 1 + Plan 2. Uses shadcn `Switch`, `RadioGroup`, `Separator`, `Dialog`, `AlertDialog` primitives (install any missing ones in Task 1).

---

## Scope of this plan

**In scope:**
- `/search` unified page — two modes on one route:
  - **Search mode** (default when `q` query param present): TMDB `/search/multi`, mixed grid, media-type badge on each card.
  - **Discover mode** (default when no `q`): full `<FilterBar>` driving `/discover/movie` merged with `/discover/tv`, or user-togglable. Defaults to "everything" but user can restrict to movies or shows.
- Recent searches chips below the input (reads `recentSearches` from Plan 1 store, clearable).
- Debounced live search (300ms), URL-driven `?q=…&mode=search|discover`.
- `/settings` page with four sections:
  1. **General** — region preference (for Home rails), theme (dark/light/system), poster density (comfortable/compact).
  2. **My Data** — watchlist export (`fada-watchlist-YYYY-MM-DD.json`) download, import upload with Zod-validated merge, "clear cached metadata" (wipes React Query persister), "reset all data" (confirm dialog, clears localStorage).
  3. **TMDB** — token status badge (shipped / custom), optional "use custom token" input with show/hide toggle and validation ping.
  4. **About** — version, license, GitHub link, credits.
- Theme toggle actually wired up — `ThemeProvider` that sets `data-theme` on `<html>` and respects `system`. Dark is the default; light uses a WCAG-compliant token swap (no visual redesign — just a different CSS variable layer).
- Poster density propagates via a CSS class on `<html>` that adjusts the grid's min card width.
- Unit + component + E2E tests for each new surface.

**Explicitly out of scope:**
- Constellation canvas rendering (→ Plan 4).
- Hero constellation on `/` (→ Plan 4).
- Accessibility (font-size, reduced motion, high-contrast) beyond the baseline already shipped — that sub-section from the spec is `Standard + TMDB` which is what you picked, so no a11y panel is required here.
- CI gates for axe / Lighthouse (→ Plan 4).

---

## File structure created by this plan

```
app/
├── search/
│   └── page.tsx                               # replaces stub (Plan 1 Task 24)
├── settings/
│   └── page.tsx                               # replaces stub
components/fada/
├── SearchInput.tsx                            # new — debounced input + recent chips
├── SearchResults.tsx                          # new — multi-search grid w/ type badge
├── DiscoverResults.tsx                        # new — dual-endpoint discover grid
├── SettingsShell.tsx                          # new — section container
├── SettingsGeneral.tsx                        # new
├── SettingsMyData.tsx                         # new (export/import wiring)
├── SettingsTmdb.tsx                           # new
├── SettingsAbout.tsx                          # new
├── ThemeToggle.tsx                            # new (used inside SettingsGeneral)
└── RegionToggle.tsx                           # new (used inside SettingsGeneral)
lib/
├── tmdb/
│   └── endpoints.ts                           # extended with multiSearch
├── theme/
│   ├── ThemeProvider.tsx                      # new
│   └── tokens.light.css                       # new — light variant of design tokens
└── export/
    ├── exportWatchlist.ts                     # new — JSON builder + download trigger
    ├── importWatchlist.ts                     # new — Zod validate + Zustand merge
    └── exportSchema.ts                        # new — Zod envelope for export JSON
messages/
└── ar.json                                    # extended with search/settings strings
tests/
├── e2e/
│   ├── search.spec.ts                         # new
│   └── settings.spec.ts                       # new
└── unit/
    ├── export-import.test.ts                  # new
    └── tmdb-search.test.ts                    # new
```

---

## Prerequisites

- Plans 1 and 2 complete, tagged `p1-plan-2-done`.
- `app/` working directory, `npm run build` succeeds, Playwright suite green.
- shadcn components installed: Switch, RadioGroup, AlertDialog. If missing:
  ```bash
  cd app && npx shadcn@latest add switch radio-group alert-dialog
  ```

---

## Task 1: Add TMDB `multiSearch` endpoint

**Files:**
- Modify: `app/lib/tmdb/endpoints.ts`
- Modify: `app/lib/tmdb/types.ts`
- Create: `app/tests/unit/tmdb-search.test.ts`

- [ ] **Step 1: Add search types**

Append to `lib/tmdb/types.ts`:

```ts
export type TmdbMultiResult = TmdbListItem & {
  media_type: 'movie' | 'tv' | 'person';
  known_for?: TmdbListItem[];     // only on person results
};
```

- [ ] **Step 2: Write failing test**

`app/tests/unit/tmdb-search.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { multiSearch } from '@/lib/tmdb/endpoints';

beforeEach(() => {
  (globalThis as any).fetch = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ page: 1, total_pages: 1, total_results: 0, results: [] }),
  });
});

describe('multiSearch', () => {
  it('calls /search/multi with encoded query + language', async () => {
    await multiSearch('مارفل', 2);
    const call = (globalThis as any).fetch.mock.calls[0][0] as string;
    expect(call).toContain('/search/multi');
    expect(call).toContain('query=%D9%85%D8%A7%D8%B1%D9%81%D9%84');
    expect(call).toContain('page=2');
    expect(call).toContain('language=ar-SA');
    expect(call).toContain('include_adult=false');
  });

  it('returns empty result set for empty query without hitting the network', async () => {
    const res = await multiSearch('', 1);
    expect((globalThis as any).fetch).not.toHaveBeenCalled();
    expect(res.results).toEqual([]);
    expect(res.total_results).toBe(0);
  });
});
```

- [ ] **Step 3: Run test to confirm failure**

```bash
cd app && npm test -- tmdb-search --run
```

- [ ] **Step 4: Implement**

Append to `lib/tmdb/endpoints.ts`:

```ts
import type { TmdbMultiResult } from './types';

export async function multiSearch(query: string, page = 1): Promise<TmdbPaged<TmdbMultiResult>> {
  if (!query.trim()) {
    return { page: 1, results: [], total_pages: 0, total_results: 0 };
  }
  return tmdbFetch<TmdbPaged<TmdbMultiResult>>('/search/multi', {
    query,
    language: 'ar-SA',
    include_adult: 'false',
    page: String(page),
  });
}
```

- [ ] **Step 5: Run tests until green**

```bash
cd app && npm test -- tmdb-search --run
```

- [ ] **Step 6: Commit**

```bash
cd app && git add lib/tmdb && git commit -m "feat(tmdb): multiSearch endpoint with short-circuit for empty query"
```

---

## Task 2: Export/Import watchlist — schema, builder, parser

**Files:**
- Create: `app/lib/export/exportSchema.ts`
- Create: `app/lib/export/exportWatchlist.ts`
- Create: `app/lib/export/importWatchlist.ts`
- Create: `app/tests/unit/export-import.test.ts`

- [ ] **Step 1: Zod envelope schema**

`app/lib/export/exportSchema.ts`:

```ts
import { z } from 'zod';

export const WatchlistExportItemSchema = z.object({
  id: z.number().int().positive(),
  type: z.enum(['movie', 'tv']),
  addedAt: z.string().datetime(),
  title: z.string().optional(),
});

export const WatchlistExportSchema = z.object({
  fada_export_version: z.literal(1),
  exported_at: z.string().datetime(),
  watchlist: z.array(WatchlistExportItemSchema),
});

export type WatchlistExport = z.infer<typeof WatchlistExportSchema>;
```

- [ ] **Step 2: Write failing tests**

`app/tests/unit/export-import.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { buildExport, downloadExport } from '@/lib/export/exportWatchlist';
import { parseAndMergeImport } from '@/lib/export/importWatchlist';
import { useFadaStore } from '@/lib/storage/store';

beforeEach(() => {
  localStorage.clear();
  useFadaStore.setState((s) => ({
    ...s,
    watchlist: [],
    recentSearches: [],
  }));
});

describe('buildExport', () => {
  it('produces the correct envelope shape', () => {
    useFadaStore.setState((s) => ({
      ...s,
      watchlist: [
        { id: 550, type: 'movie', addedAt: '2026-04-22T00:00:00.000Z' },
        { id: 1396, type: 'tv', addedAt: '2026-04-23T00:00:00.000Z' },
      ],
    }));
    const json = buildExport({ titles: { 550: 'Fight Club', 1396: 'Breaking Bad' } });
    expect(json.fada_export_version).toBe(1);
    expect(json.watchlist).toHaveLength(2);
    expect(json.watchlist[0].title).toBe('Fight Club');
  });
});

describe('parseAndMergeImport', () => {
  it('merges imported items and dedupes by id+type', () => {
    useFadaStore.setState((s) => ({
      ...s,
      watchlist: [{ id: 550, type: 'movie', addedAt: '2026-04-22T00:00:00.000Z' }],
    }));
    const incoming = JSON.stringify({
      fada_export_version: 1,
      exported_at: new Date().toISOString(),
      watchlist: [
        { id: 550, type: 'movie', addedAt: '2024-01-01T00:00:00.000Z' }, // duplicate, keep earliest
        { id: 1396, type: 'tv', addedAt: '2026-04-23T00:00:00.000Z' },
      ],
    });
    const res = parseAndMergeImport(incoming);
    expect(res).toEqual({ imported: 1 });
    expect(useFadaStore.getState().watchlist).toHaveLength(2);
  });

  it('rejects an invalid envelope', () => {
    const res = parseAndMergeImport('{"not":"valid"}');
    expect('error' in res).toBe(true);
  });

  it('rejects malformed JSON', () => {
    const res = parseAndMergeImport('{ not json');
    expect('error' in res).toBe(true);
  });
});
```

- [ ] **Step 3: Run tests to confirm failure**

```bash
cd app && npm test -- export-import --run
```

- [ ] **Step 4: Implement `buildExport` + `downloadExport`**

`app/lib/export/exportWatchlist.ts`:

```ts
import { useFadaStore } from '@/lib/storage/store';
import { WatchlistExportSchema, type WatchlistExport } from './exportSchema';

type BuildArgs = { titles?: Record<number, string> };

export function buildExport(args: BuildArgs = {}): WatchlistExport {
  const state = useFadaStore.getState();
  const payload: WatchlistExport = {
    fada_export_version: 1,
    exported_at: new Date().toISOString(),
    watchlist: state.watchlist.map((w) => ({
      id: w.id,
      type: w.type,
      addedAt: w.addedAt,
      ...(args.titles?.[w.id] ? { title: args.titles[w.id] } : {}),
    })),
  };
  return WatchlistExportSchema.parse(payload);
}

export function downloadExport(titles?: Record<number, string>) {
  const payload = buildExport({ titles });
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `fada-watchlist-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
```

- [ ] **Step 5: Implement `parseAndMergeImport`**

`app/lib/export/importWatchlist.ts`:

```ts
import { useFadaStore } from '@/lib/storage/store';
import { WatchlistExportSchema } from './exportSchema';

export function parseAndMergeImport(text: string): { imported: number } | { error: string } {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { error: 'INVALID_JSON' };
  }
  const parsed = WatchlistExportSchema.safeParse(raw);
  if (!parsed.success) return { error: 'INVALID_SCHEMA' };

  const current = useFadaStore.getState().watchlist;
  const currentKeys = new Set(current.map((w) => `${w.type}:${w.id}`));
  const additions = parsed.data.watchlist.filter(
    (w) => !currentKeys.has(`${w.type}:${w.id}`),
  );
  useFadaStore.setState((s) => ({
    ...s,
    watchlist: [...current, ...additions.map((a) => ({
      id: a.id,
      type: a.type,
      addedAt: a.addedAt,
    }))],
  }));
  return { imported: additions.length };
}
```

- [ ] **Step 6: Run tests until green**

```bash
cd app && npm test -- export-import --run
```

- [ ] **Step 7: Commit**

```bash
cd app && git add lib/export tests/unit/export-import.test.ts && git commit -m "feat(export): watchlist export/import with Zod-validated envelope"
```

---

## Task 3: Build `<SearchInput>` with debounce + recent chips

**Files:**
- Create: `app/components/fada/SearchInput.tsx`
- Modify: `app/messages/ar.json`

- [ ] **Step 1: Add strings**

```json
{
  "search": {
    "placeholder": "ابحث عن فيلم، مسلسل، أو شخصية…",
    "recent": "عمليات بحث سابقة",
    "clearRecent": "مسح",
    "noResults": "لا توجد نتائج"
  }
}
```

- [ ] **Step 2: Implement**

`app/components/fada/SearchInput.tsx`:

```tsx
'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { useFadaStore } from '@/lib/storage/store';

export function SearchInput() {
  const t = useTranslations('search');
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const recent = useFadaStore((s) => s.recentSearches);
  const pushRecent = useFadaStore((s) => s.pushRecentSearch);
  const clearRecent = () =>
    useFadaStore.setState((s) => ({ ...s, recentSearches: [] }));

  const [value, setValue] = useState(sp.get('q') ?? '');

  useEffect(() => {
    const h = setTimeout(() => {
      const next = new URLSearchParams(sp.toString());
      if (value.trim()) {
        next.set('q', value.trim());
        next.set('mode', 'search');
      } else {
        next.delete('q');
        next.set('mode', 'discover');
      }
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    }, 300);
    return () => clearTimeout(h);
  }, [value, pathname]);   // eslint-disable-line react-hooks/exhaustive-deps

  const commit = () => {
    if (value.trim()) pushRecent(value.trim());
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search aria-hidden className="pointer-events-none absolute inset-y-0 end-3 my-auto h-4 w-4 text-muted" />
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => { if (e.key === 'Enter') commit(); }}
          placeholder={t('placeholder')}
          aria-label={t('placeholder')}
          className="pe-10"
        />
        {value && (
          <button
            type="button"
            aria-label="clear"
            onClick={() => setValue('')}
            className="absolute inset-y-0 start-2 my-auto text-muted hover:text-fg"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {recent.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted">{t('recent')}</span>
          {recent.map((q) => (
            <Button
              key={q}
              variant="outline"
              size="sm"
              onClick={() => setValue(q)}
            >
              {q}
            </Button>
          ))}
          <Button variant="ghost" size="sm" onClick={clearRecent}>
            {t('clearRecent')}
          </Button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
cd app && git add components/fada/SearchInput.tsx messages/ar.json && git commit -m "feat(search): SearchInput with debounce + recent chips"
```

---

## Task 4: Build `<SearchResults>` (multi-search grid with type badge)

**Files:**
- Create: `app/components/fada/SearchResults.tsx`

- [ ] **Step 1: Implement**

```tsx
'use client';
import { useInfiniteQuery } from '@tanstack/react-query';
import { multiSearch } from '@/lib/tmdb/endpoints';
import { STALE } from '@/lib/query/client';
import { PosterCard } from './PosterCard';
import { StarLoader } from './StarLoader';
import { StarEmptyState } from './StarEmptyState';
import { Badge } from '@/components/ui/badge';
import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

type Props = { query: string };

export function SearchResults({ query }: Props) {
  const t = useTranslations('search');
  const q = useInfiniteQuery({
    queryKey: ['search', 'multi', query],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => multiSearch(query, pageParam as number),
    getNextPageParam: (last) => (last.page < last.total_pages ? last.page + 1 : undefined),
    staleTime: STALE.search,
    enabled: query.trim().length > 0,
  });

  const items = q.data?.pages.flatMap((p) => p.results) ?? [];

  const sentinel = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!sentinel.current) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting && q.hasNextPage && !q.isFetching) q.fetchNextPage(); },
      { rootMargin: '400px' },
    );
    obs.observe(sentinel.current);
    return () => obs.disconnect();
  }, [q.hasNextPage, q.isFetching]);   // eslint-disable-line react-hooks/exhaustive-deps

  if (q.isLoading) return <div className="py-12 flex justify-center"><StarLoader /></div>;
  if (!items.length) return <StarEmptyState title={t('noResults')} description="" />;

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8">
      {items.map((item) => {
        if (item.media_type === 'person') {
          // Person result — link to first known-for, or skip
          return null;
        }
        return (
          <div key={`${item.media_type}-${item.id}`} className="relative">
            <PosterCard
              item={item}
              mediaType={item.media_type}
              href={`/title/${item.media_type}/${item.id}`}
            />
            <Badge variant="outline" className="absolute end-2 top-2 bg-bg/80 backdrop-blur">
              {item.media_type === 'movie' ? 'فيلم' : 'مسلسل'}
            </Badge>
          </div>
        );
      })}
      <div ref={sentinel} className="col-span-full h-10" />
      {q.isFetching && q.hasNextPage && (
        <div className="col-span-full flex justify-center py-4"><StarLoader /></div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd app && git add components/fada/SearchResults.tsx && git commit -m "feat(search): SearchResults with multi-search + media-type badge"
```

---

## Task 5: Build `<DiscoverResults>` (dual-endpoint discover grid)

**Files:**
- Create: `app/components/fada/DiscoverResults.tsx`

- [ ] **Step 1: Implement**

```tsx
'use client';
import { useEffect, useRef } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { PosterCard } from './PosterCard';
import { StarLoader } from './StarLoader';
import { StarEmptyState } from './StarEmptyState';
import { FilterBar } from './FilterBar';
import { discoverMovies, discoverTv, genresMovie, genresTv } from '@/lib/tmdb/endpoints';
import { STALE } from '@/lib/query/client';
import type { DiscoverFilters } from '@/lib/tmdb/types';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

type MediaScope = 'all' | 'movie' | 'tv';
type Props = {
  scope: MediaScope;
  onScopeChange: (s: MediaScope) => void;
  filters: DiscoverFilters;
  onFiltersChange: (f: DiscoverFilters) => void;
};

export function DiscoverResults({ scope, onScopeChange, filters, onFiltersChange }: Props) {
  const t = useTranslations('search');
  const { data: movieGenres } = useQuery({
    queryKey: ['genres', 'movie'], queryFn: genresMovie, staleTime: STALE.genres,
  });
  const { data: tvGenres } = useQuery({
    queryKey: ['genres', 'tv'], queryFn: genresTv, staleTime: STALE.genres,
  });

  const movieQ = useInfiniteQuery({
    queryKey: ['discover', 'movie', filters],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => discoverMovies({ ...filters, page: pageParam as number }),
    getNextPageParam: (last) => (last.page < last.total_pages ? last.page + 1 : undefined),
    staleTime: STALE.discover,
    enabled: scope !== 'tv',
  });
  const tvQ = useInfiniteQuery({
    queryKey: ['discover', 'tv', filters],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => discoverTv({ ...filters, page: pageParam as number }),
    getNextPageParam: (last) => (last.page < last.total_pages ? last.page + 1 : undefined),
    staleTime: STALE.discover,
    enabled: scope !== 'movie',
  });

  const movieItems = (movieQ.data?.pages.flatMap((p) => p.results) ?? []).map((m) => ({ ...m, media_type: 'movie' as const }));
  const tvItems = (tvQ.data?.pages.flatMap((p) => p.results) ?? []).map((t) => ({ ...t, media_type: 'tv' as const }));
  const merged = scope === 'movie' ? movieItems : scope === 'tv' ? tvItems : [...movieItems, ...tvItems];

  const isLoading = movieQ.isLoading || tvQ.isLoading;
  const hasMore =
    (scope !== 'tv' && !!movieQ.hasNextPage) ||
    (scope !== 'movie' && !!tvQ.hasNextPage);
  const isFetching = movieQ.isFetching || tvQ.isFetching;

  const sentinel = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!sentinel.current) return;
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || isFetching) return;
      if (scope !== 'tv' && movieQ.hasNextPage) movieQ.fetchNextPage();
      if (scope !== 'movie' && tvQ.hasNextPage) tvQ.fetchNextPage();
    }, { rootMargin: '400px' });
    obs.observe(sentinel.current);
    return () => obs.disconnect();
  }, [isFetching, scope, movieQ.hasNextPage, tvQ.hasNextPage]);  // eslint-disable-line react-hooks/exhaustive-deps

  const genres = scope === 'tv' ? (tvGenres?.genres ?? []) : (movieGenres?.genres ?? []);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {(['all', 'movie', 'tv'] as MediaScope[]).map((s) => (
          <Button
            key={s}
            size="sm"
            variant={scope === s ? 'default' : 'outline'}
            onClick={() => onScopeChange(s)}
            aria-pressed={scope === s}
          >
            {s === 'all' ? 'الكل' : s === 'movie' ? 'أفلام' : 'مسلسلات'}
          </Button>
        ))}
      </div>
      <FilterBar genres={genres} value={filters} onChange={onFiltersChange} />
      {isLoading && !merged.length ? (
        <div className="py-12 flex justify-center"><StarLoader /></div>
      ) : !merged.length ? (
        <StarEmptyState title={t('noResults')} description="" />
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8">
          {merged.map((item) => (
            <PosterCard
              key={`${item.media_type}-${item.id}`}
              item={item}
              mediaType={item.media_type}
              href={`/title/${item.media_type}/${item.id}`}
            />
          ))}
        </div>
      )}
      <div ref={sentinel} className="h-10" />
      {isFetching && hasMore && <div className="flex justify-center py-4"><StarLoader /></div>}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd app && git add components/fada/DiscoverResults.tsx && git commit -m "feat(search): DiscoverResults merging movie + tv discover"
```

---

## Task 6: Build `/search` page

**Files:**
- Modify: `app/app/search/page.tsx`
- Modify: `app/messages/ar.json`

- [ ] **Step 1: Add strings**

```json
{
  "searchPage": {
    "title": "البحث والاستكشاف",
    "modeSearch": "بحث",
    "modeDiscover": "استكشاف"
  }
}
```

- [ ] **Step 2: Replace stub**

```tsx
'use client';
import { useMemo } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { SearchInput } from '@/components/fada/SearchInput';
import { SearchResults } from '@/components/fada/SearchResults';
import { DiscoverResults } from '@/components/fada/DiscoverResults';
import { useTranslations } from 'next-intl';
import type { DiscoverFilters } from '@/lib/tmdb/types';

function parseFilters(sp: URLSearchParams): DiscoverFilters {
  return {
    genres: sp.get('genres')?.split(',').map(Number).filter(Boolean),
    yearFrom: sp.get('from') ? Number(sp.get('from')) : undefined,
    yearTo: sp.get('to') ? Number(sp.get('to')) : undefined,
    originalLanguage: sp.get('lang') ?? undefined,
    sort: (sp.get('sort') as DiscoverFilters['sort']) ?? undefined,
  };
}
function setFilterParams(sp: URLSearchParams, f: DiscoverFilters) {
  ['genres', 'from', 'to', 'lang', 'sort'].forEach((k) => sp.delete(k));
  if (f.genres?.length) sp.set('genres', f.genres.join(','));
  if (f.yearFrom) sp.set('from', String(f.yearFrom));
  if (f.yearTo) sp.set('to', String(f.yearTo));
  if (f.originalLanguage) sp.set('lang', f.originalLanguage);
  if (f.sort) sp.set('sort', f.sort);
  return sp;
}

export default function SearchPage() {
  const t = useTranslations('searchPage');
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const query = (sp.get('q') ?? '').trim();
  const mode = sp.get('mode') === 'search' || query ? 'search' : 'discover';
  const scope = (sp.get('scope') as 'all' | 'movie' | 'tv' | null) ?? 'all';
  const filters = useMemo(() => parseFilters(new URLSearchParams(sp.toString())), [sp]);

  const replace = (mutate: (p: URLSearchParams) => void) => {
    const next = new URLSearchParams(sp.toString());
    mutate(next);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  };

  return (
    <main className="mx-auto max-w-screen-2xl px-4 py-6 space-y-6">
      <h1 className="text-2xl font-semibold">{t('title')}</h1>
      <SearchInput />
      <section aria-label={mode === 'search' ? t('modeSearch') : t('modeDiscover')}>
        {mode === 'search' ? (
          <SearchResults query={query} />
        ) : (
          <DiscoverResults
            scope={scope}
            onScopeChange={(s) => replace((p) => p.set('scope', s))}
            filters={filters}
            onFiltersChange={(f) => replace((p) => setFilterParams(p, f))}
          />
        )}
      </section>
    </main>
  );
}
```

- [ ] **Step 3: Verify manually**

Visit `/search`. Empty → Discover mode, filters apply, grid updates. Type a query → switches to Search mode, recent chips appear after blur. Clear query → back to Discover.

- [ ] **Step 4: Commit**

```bash
cd app && git add app/search/page.tsx messages/ar.json && git commit -m "feat(search): unified /search page with mode+scope+filters in URL"
```

---

## Task 7: Build `ThemeProvider` + light token layer

**Files:**
- Create: `app/lib/theme/ThemeProvider.tsx`
- Create: `app/lib/theme/tokens.light.css`
- Modify: `app/styles/globals.css`
- Modify: `app/app/layout.tsx`

- [ ] **Step 1: Add light token layer**

`app/lib/theme/tokens.light.css`:

```css
/* Light theme override — WCAG-compliant swap of dark tokens. No redesign. */
:root[data-theme='light'] {
  --color-bg: #F7F8FA;
  --color-surface: #FFFFFF;
  --color-fg: #0F1116;
  --color-muted: #4B526A;
  --color-border: #D8DCE5;
  --color-gold: #B8862B;
  /* Gold is darkened in light mode to preserve AA contrast. */
}
```

- [ ] **Step 2: Wire into `globals.css`**

Append to `app/styles/globals.css`:

```css
@import '../lib/theme/tokens.light.css';

:root[data-density='compact'] {
  --poster-min: 120px;
}
:root[data-density='comfortable'] {
  --poster-min: 160px;
}
```

- [ ] **Step 3: Implement `ThemeProvider`**

`app/lib/theme/ThemeProvider.tsx`:

```tsx
'use client';
import { useEffect } from 'react';
import { useFadaStore } from '@/lib/storage/store';

function apply(theme: 'dark' | 'light' | 'system', density: 'comfortable' | 'compact') {
  const root = document.documentElement;
  if (theme === 'system') {
    root.removeAttribute('data-theme');
  } else {
    root.setAttribute('data-theme', theme);
  }
  root.setAttribute('data-density', density);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useFadaStore((s) => s.preferences.theme);
  const density = useFadaStore((s) => s.preferences.posterDensity);
  useEffect(() => { apply(theme, density); }, [theme, density]);
  return <>{children}</>;
}
```

- [ ] **Step 4: Mount in layout**

Modify `app/app/layout.tsx` to wrap children with `<ThemeProvider>` (inside the existing providers chain).

- [ ] **Step 5: Commit**

```bash
cd app && git add lib/theme styles/globals.css app/layout.tsx && git commit -m "feat(theme): ThemeProvider + light token layer + density CSS"
```

---

## Task 8: Build `<ThemeToggle>` + `<RegionToggle>`

**Files:**
- Create: `app/components/fada/ThemeToggle.tsx`
- Create: `app/components/fada/RegionToggle.tsx`

- [ ] **Step 1: Implement `<ThemeToggle>`**

```tsx
'use client';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useFadaStore } from '@/lib/storage/store';

const OPTIONS = [
  { value: 'dark', label: 'داكن' },
  { value: 'light', label: 'فاتح' },
  { value: 'system', label: 'حسب النظام' },
] as const;

export function ThemeToggle() {
  const theme = useFadaStore((s) => s.preferences.theme);
  const setTheme = (t: 'dark' | 'light' | 'system') =>
    useFadaStore.setState((s) => ({ ...s, preferences: { ...s.preferences, theme: t } }));

  return (
    <RadioGroup
      value={theme}
      onValueChange={(v) => setTheme(v as 'dark' | 'light' | 'system')}
      className="flex flex-wrap gap-4"
    >
      {OPTIONS.map((o) => (
        <div key={o.value} className="flex items-center gap-2">
          <RadioGroupItem value={o.value} id={`theme-${o.value}`} />
          <Label htmlFor={`theme-${o.value}`}>{o.label}</Label>
        </div>
      ))}
    </RadioGroup>
  );
}
```

- [ ] **Step 2: Implement `<RegionToggle>`**

```tsx
'use client';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useFadaStore } from '@/lib/storage/store';

const OPTIONS = [
  { value: 'MENA', label: 'الشرق الأوسط وشمال أفريقيا' },
  { value: 'global', label: 'عالمي' },
] as const;

export function RegionToggle() {
  const region = useFadaStore((s) => s.preferences.region);
  const set = (r: 'MENA' | 'global') =>
    useFadaStore.setState((s) => ({ ...s, preferences: { ...s.preferences, region: r } }));
  return (
    <RadioGroup value={region} onValueChange={(v) => set(v as 'MENA' | 'global')} className="flex flex-wrap gap-4">
      {OPTIONS.map((o) => (
        <div key={o.value} className="flex items-center gap-2">
          <RadioGroupItem value={o.value} id={`region-${o.value}`} />
          <Label htmlFor={`region-${o.value}`}>{o.label}</Label>
        </div>
      ))}
    </RadioGroup>
  );
}
```

- [ ] **Step 3: Commit**

```bash
cd app && git add components/fada/ThemeToggle.tsx components/fada/RegionToggle.tsx && git commit -m "feat(settings): Theme + Region radio toggles"
```

---

## Task 9: Build `<SettingsShell>` and `<SettingsGeneral>`

**Files:**
- Create: `app/components/fada/SettingsShell.tsx`
- Create: `app/components/fada/SettingsGeneral.tsx`
- Modify: `app/messages/ar.json`

- [ ] **Step 1: Add strings**

```json
{
  "settings": {
    "title": "الإعدادات",
    "general": "عام",
    "myData": "بياناتي",
    "tmdb": "TMDB",
    "about": "حول",
    "region": "المنطقة",
    "regionHint": "تُستخدم في تخصيص الصفحة الرئيسية.",
    "theme": "السمة",
    "density": "كثافة الملصقات",
    "densityComfortable": "مريح",
    "densityCompact": "مدمج"
  }
}
```

- [ ] **Step 2: Implement `<SettingsShell>`**

```tsx
'use client';
import type { ReactNode } from 'react';
import { Separator } from '@/components/ui/separator';

type Section = { id: string; title: string; body: ReactNode };
type Props = { sections: Section[] };

export function SettingsShell({ sections }: Props) {
  return (
    <div className="mx-auto max-w-4xl space-y-10 py-6">
      {sections.map((s, i) => (
        <section key={s.id} id={s.id} className="space-y-4">
          {i > 0 && <Separator className="my-4" />}
          <h2 className="text-xl font-semibold">{s.title}</h2>
          {s.body}
        </section>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Implement `<SettingsGeneral>`**

```tsx
'use client';
import { useTranslations } from 'next-intl';
import { ThemeToggle } from './ThemeToggle';
import { RegionToggle } from './RegionToggle';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useFadaStore } from '@/lib/storage/store';

export function SettingsGeneral() {
  const t = useTranslations('settings');
  const density = useFadaStore((s) => s.preferences.posterDensity);
  const setDensity = (d: 'comfortable' | 'compact') =>
    useFadaStore.setState((s) => ({ ...s, preferences: { ...s.preferences, posterDensity: d } }));

  return (
    <div className="space-y-6">
      <Field label={t('region')} hint={t('regionHint')}>
        <RegionToggle />
      </Field>
      <Field label={t('theme')}>
        <ThemeToggle />
      </Field>
      <Field label={t('density')}>
        <RadioGroup
          value={density}
          onValueChange={(v) => setDensity(v as 'comfortable' | 'compact')}
          className="flex flex-wrap gap-4"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="comfortable" id="d-comf" />
            <Label htmlFor="d-comf">{t('densityComfortable')}</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="compact" id="d-comp" />
            <Label htmlFor="d-comp">{t('densityCompact')}</Label>
          </div>
        </RadioGroup>
      </Field>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div>
        <div className="text-sm font-medium">{label}</div>
        {hint && <div className="text-xs text-muted">{hint}</div>}
      </div>
      {children}
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
cd app && git add components/fada/SettingsShell.tsx components/fada/SettingsGeneral.tsx messages/ar.json && git commit -m "feat(settings): Shell + General (region/theme/density)"
```

---

## Task 10: Build `<SettingsMyData>` (export/import + clear/reset)

**Files:**
- Create: `app/components/fada/SettingsMyData.tsx`
- Modify: `app/messages/ar.json`

- [ ] **Step 1: Add strings**

```json
{
  "myDataSettings": {
    "exportWatchlist": "تصدير قائمتي",
    "exportHint": "نزّل قائمتك كملف JSON.",
    "importWatchlist": "استيراد قائمة",
    "importHint": "ارفع ملف FADA لاستيراد عناوين إضافية (بدون حذف الموجود).",
    "clearCache": "مسح بيانات TMDB المخزّنة",
    "clearCacheHint": "يُسرّع إعادة التحميل، لكنه لا يمسّ قائمتك.",
    "resetAll": "إعادة التعيين الكاملة",
    "resetAllHint": "يحذف جميع البيانات المحلّية.",
    "resetConfirmTitle": "تأكيد الحذف",
    "resetConfirmBody": "سيتم حذف قائمتك، تفضيلاتك، ومفتاح TMDB المحفوظ. لا يمكن التراجع.",
    "cancel": "إلغاء",
    "confirmReset": "احذف كل شيء",
    "importedToast": "تم الاستيراد: {count}",
    "importError": "ملف غير صالح"
  }
}
```

- [ ] **Step 2: Implement**

```tsx
'use client';
import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { downloadExport } from '@/lib/export/exportWatchlist';
import { parseAndMergeImport } from '@/lib/export/importWatchlist';
import { useFadaStore } from '@/lib/storage/store';

export function SettingsMyData() {
  const t = useTranslations('myDataSettings');
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const onImportFile = async (file: File) => {
    const text = await file.text();
    const res = parseAndMergeImport(text);
    if ('error' in res) {
      toast.error(t('importError'));
    } else {
      toast.success(t('importedToast', { count: res.imported }));
    }
  };

  const clearCache = () => {
    Object.keys(localStorage).forEach((k) => {
      if (k.startsWith('fada.rq.')) localStorage.removeItem(k);
    });
    location.reload();
  };

  const resetAll = () => {
    Object.keys(localStorage).forEach((k) => {
      if (k.startsWith('fada.')) localStorage.removeItem(k);
    });
    location.reload();
  };

  return (
    <div className="space-y-6">
      <Row label={t('exportWatchlist')} hint={t('exportHint')}>
        <Button onClick={() => downloadExport()}>{t('exportWatchlist')}</Button>
      </Row>
      <Row label={t('importWatchlist')} hint={t('importHint')}>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onImportFile(f); e.currentTarget.value = ''; }}
        />
        <Button variant="outline" onClick={() => fileRef.current?.click()}>
          {t('importWatchlist')}
        </Button>
      </Row>
      <Row label={t('clearCache')} hint={t('clearCacheHint')}>
        <Button variant="outline" onClick={clearCache}>{t('clearCache')}</Button>
      </Row>
      <Row label={t('resetAll')} hint={t('resetAllHint')}>
        <Button variant="destructive" onClick={() => setConfirmOpen(true)}>{t('resetAll')}</Button>
      </Row>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('resetConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('resetConfirmBody')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={resetAll}>{t('confirmReset')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Row({ label, hint, children }: { label: string; hint: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-border bg-surface p-4">
      <div>
        <div className="font-medium">{label}</div>
        <div className="mt-1 text-xs text-muted">{hint}</div>
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
cd app && git add components/fada/SettingsMyData.tsx messages/ar.json && git commit -m "feat(settings): My Data with export, import, clear cache, reset"
```

---

## Task 11: Build `<SettingsTmdb>` (token status + custom token)

**Files:**
- Create: `app/components/fada/SettingsTmdb.tsx`
- Modify: `app/messages/ar.json`

- [ ] **Step 1: Add strings**

```json
{
  "tmdbSettings": {
    "title": "مفتاح TMDB",
    "statusShipped": "يستخدم المفتاح العام المُرفَق",
    "statusCustom": "يستخدم مفتاحًا خاصًا محفوظًا محليًا",
    "customLabel": "مفتاح خاص (اختياري)",
    "customHint": "استخدم مفتاحًا خاصًا إذا وصلت إلى حد الاستخدام. يُحفظ محلّيًا فقط ولا يُرسل لأي خادم سوى TMDB.",
    "save": "حفظ",
    "remove": "إزالة",
    "show": "إظهار",
    "hide": "إخفاء",
    "validating": "يتحقق…",
    "valid": "المفتاح صالح",
    "invalid": "المفتاح غير صالح"
  }
}
```

- [ ] **Step 2: Implement**

```tsx
'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff } from 'lucide-react';
import { useFadaStore } from '@/lib/storage/store';

type Status = 'idle' | 'validating' | 'valid' | 'invalid';

async function pingToken(token: string): Promise<boolean> {
  try {
    const res = await fetch('https://api.themoviedb.org/3/configuration', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function SettingsTmdb() {
  const t = useTranslations('tmdbSettings');
  const current = useFadaStore((s) => s.tmdb.customToken);
  const setCustom = (tok: string | null) =>
    useFadaStore.setState((s) => ({ ...s, tmdb: { customToken: tok } }));

  const [draft, setDraft] = useState(current ?? '');
  const [show, setShow] = useState(false);
  const [status, setStatus] = useState<Status>('idle');

  const save = async () => {
    const trimmed = draft.trim();
    if (!trimmed) { setCustom(null); return; }
    setStatus('validating');
    const ok = await pingToken(trimmed);
    setStatus(ok ? 'valid' : 'invalid');
    if (ok) setCustom(trimmed);
  };

  return (
    <div className="space-y-4">
      <Badge variant={current ? 'default' : 'outline'}>
        {current ? t('statusCustom') : t('statusShipped')}
      </Badge>

      <div className="space-y-2">
        <label htmlFor="tmdb-token" className="text-sm font-medium">{t('customLabel')}</label>
        <p className="text-xs text-muted">{t('customHint')}</p>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Input
              id="tmdb-token"
              type={show ? 'text' : 'password'}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              dir="ltr"
              className="font-mono"
            />
            <button
              type="button"
              aria-label={show ? t('hide') : t('show')}
              onClick={() => setShow((v) => !v)}
              className="absolute inset-y-0 start-2 my-auto text-muted hover:text-fg"
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <Button onClick={save}>{t('save')}</Button>
          {current && (
            <Button
              variant="ghost"
              onClick={() => { setCustom(null); setDraft(''); setStatus('idle'); }}
            >
              {t('remove')}
            </Button>
          )}
        </div>
        {status === 'validating' && <p className="text-xs text-muted">{t('validating')}</p>}
        {status === 'valid' && <p className="text-xs text-success">{t('valid')}</p>}
        {status === 'invalid' && <p className="text-xs text-danger">{t('invalid')}</p>}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
cd app && git add components/fada/SettingsTmdb.tsx messages/ar.json && git commit -m "feat(settings): TMDB token management with live validation"
```

---

## Task 12: Build `<SettingsAbout>`

**Files:**
- Create: `app/components/fada/SettingsAbout.tsx`
- Modify: `app/messages/ar.json`

- [ ] **Step 1: Add strings**

```json
{
  "about": {
    "version": "الإصدار",
    "license": "الترخيص",
    "github": "المستودع على GitHub",
    "credits": "الحقوق",
    "creditsBody": "الأيقونات من Lucide. بيانات المحتوى من TMDB. الخطوط من IBM Plex."
  }
}
```

- [ ] **Step 2: Implement**

```tsx
'use client';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

const VERSION = process.env.NEXT_PUBLIC_FADA_VERSION ?? '0.1.0-alpha';
const GITHUB_URL = 'https://github.com/fada-project/fada';   // swap for real URL when public

export function SettingsAbout() {
  const t = useTranslations('about');
  return (
    <dl className="grid grid-cols-3 gap-3 text-sm">
      <dt className="text-muted">{t('version')}</dt>
      <dd className="col-span-2 font-mono">{VERSION}</dd>
      <dt className="text-muted">{t('license')}</dt>
      <dd className="col-span-2">MIT</dd>
      <dt className="text-muted">{t('github')}</dt>
      <dd className="col-span-2">
        <Link href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="underline">
          {GITHUB_URL}
        </Link>
      </dd>
      <dt className="text-muted">{t('credits')}</dt>
      <dd className="col-span-2">{t('creditsBody')}</dd>
    </dl>
  );
}
```

- [ ] **Step 3: Commit**

```bash
cd app && git add components/fada/SettingsAbout.tsx messages/ar.json && git commit -m "feat(settings): About section"
```

---

## Task 13: Wire `/settings` page

**Files:**
- Modify: `app/app/settings/page.tsx`

- [ ] **Step 1: Replace stub**

```tsx
'use client';
import { useTranslations } from 'next-intl';
import { SettingsShell } from '@/components/fada/SettingsShell';
import { SettingsGeneral } from '@/components/fada/SettingsGeneral';
import { SettingsMyData } from '@/components/fada/SettingsMyData';
import { SettingsTmdb } from '@/components/fada/SettingsTmdb';
import { SettingsAbout } from '@/components/fada/SettingsAbout';

export default function SettingsPage() {
  const t = useTranslations('settings');
  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="text-2xl font-semibold">{t('title')}</h1>
      <SettingsShell
        sections={[
          { id: 'general', title: t('general'), body: <SettingsGeneral /> },
          { id: 'my-data', title: t('myData'), body: <SettingsMyData /> },
          { id: 'tmdb', title: t('tmdb'), body: <SettingsTmdb /> },
          { id: 'about', title: t('about'), body: <SettingsAbout /> },
        ]}
      />
    </main>
  );
}
```

- [ ] **Step 2: Verify and commit**

Visit `/settings`, toggle theme, confirm `<html data-theme="light">` appears in devtools, toggle region, density. Export watchlist, re-import, observe toast.

```bash
cd app && git add app/settings/page.tsx && git commit -m "feat(settings): assemble /settings page from section components"
```

---

## Task 14: E2E — search flow

**Files:**
- Create: `app/tests/e2e/search.spec.ts`

- [ ] **Step 1: Write the spec**

```ts
import { test, expect } from '@playwright/test';

test('search mode → result → open → back → recent chip', async ({ page }) => {
  await page.goto('/search');
  await expect(page.getByRole('heading', { name: /البحث والاستكشاف/ })).toBeVisible();

  const input = page.getByRole('textbox', { name: /ابحث/ });
  await input.fill('matrix');
  await expect(page).toHaveURL(/q=matrix.*mode=search|mode=search.*q=matrix/);

  const firstResult = page.locator('a[href^="/title/"]').first();
  await firstResult.waitFor();
  await firstResult.click();

  await page.goBack();
  // On blur the recent chip should exist
  await page.click('body');
  await expect(page.getByRole('button', { name: 'matrix' })).toBeVisible();
});

test('discover mode adjusts URL and re-renders', async ({ page }) => {
  await page.goto('/search');
  // With no query, should be in discover
  await expect(page.getByText(/استكشاف/).first()).toBeVisible();

  // Toggle scope to Movies
  await page.getByRole('button', { name: 'أفلام' }).first().click();
  await expect(page).toHaveURL(/scope=movie/);
});
```

- [ ] **Step 2: Run and commit**

```bash
cd app && npx playwright test search.spec --reporter=list && git add tests/e2e/search.spec.ts && git commit -m "test(e2e): search + discover flows"
```

---

## Task 15: E2E — settings flow

**Files:**
- Create: `app/tests/e2e/settings.spec.ts`

- [ ] **Step 1: Write the spec**

```ts
import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

test('theme toggle flips data-theme on <html>', async ({ page }) => {
  await page.goto('/settings');
  await page.getByLabel('فاتح').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.getByLabel('داكن').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('region + density updates reflect in storage', async ({ page }) => {
  await page.goto('/settings');
  await page.getByLabel('عالمي').click();
  const prefs = await page.evaluate(() => localStorage.getItem('fada.v1'));
  expect(prefs).toContain('"region":"global"');
});

test('export produces a download and import round-trips', async ({ page }, testInfo) => {
  await page.goto('/title/movie/550');
  await page.getByRole('button', { name: /أضف إلى قائمتي/ }).click();

  await page.goto('/settings');
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: /تصدير قائمتي/ }).first().click(),
  ]);
  const file = path.join(testInfo.outputDir, download.suggestedFilename());
  await download.saveAs(file);
  const text = await fs.readFile(file, 'utf8');
  const parsed = JSON.parse(text);
  expect(parsed.fada_export_version).toBe(1);
  expect(parsed.watchlist.some((w: any) => w.id === 550)).toBe(true);

  // Clear watchlist via reset, then re-import
  await page.getByRole('button', { name: /إعادة التعيين الكاملة/ }).click();
  await page.getByRole('button', { name: /احذف كل شيء/ }).click();
  await page.waitForURL(/settings/);
  await page.reload();
  // Re-import
  const input = page.locator('input[type="file"]');
  await input.setInputFiles(file);
  await expect(page.getByText(/تم الاستيراد/)).toBeVisible();
  await page.goto('/watchlist');
  await expect(page.locator('a[href="/title/movie/550"]')).toBeVisible();
});
```

- [ ] **Step 2: Run and commit**

```bash
cd app && npx playwright test settings.spec --reporter=list && git add tests/e2e/settings.spec.ts && git commit -m "test(e2e): settings theme/region/density + export round-trip"
```

---

## Task 16: Final Plan 3 acceptance pass

- [ ] **Step 1: Typecheck and build**

```bash
cd app && npx tsc --noEmit && npm run build
```

- [ ] **Step 2: Manual QA walk**

- `/search` — empty: Discover mode with scope toggle. Type `matrix` → Search mode, chips of recent after blur. Clear → back to Discover. Filter/scope changes reflect in URL, survive reload.
- `/settings` → General: toggle theme → background + text invert (light mode preserves contrast); density compact → poster cards shrink in `/movies`. Region toggle persists in localStorage.
- Settings → My Data → export: file downloads with correct name. Re-import the same file → toast "تم الاستيراد: 0" (no dupes added). Clear TMDB cache → page reloads, first TMDB fetch refills it. Reset all → confirm dialog → clears everything → landing on fresh state.
- Settings → TMDB: empty field shows "يستخدم المفتاح العام". Paste a valid v4 token → Save → badge flips to "مفتاحًا خاصًا". Paste garbage → Save → "المفتاح غير صالح" stays.
- Sidebar → Settings link works; keyboard `/` still focuses search; theme toggle from Settings replaces the removed global theme toggle from Plan 1 spec revision.

- [ ] **Step 3: Tag**

```bash
cd app && git tag p1-plan-3-done && git log --oneline p1-plan-2-done..p1-plan-3-done
```

- [ ] **Step 4: Update this file's changelog**

Append: `- YYYY-MM-DD — completed all 16 tasks; Search/Discover/Settings shipped.`

---

## Deferred to Plan 4

- Constellation canvas rendering on Home hero and `/collections/*` → **Plan 4**
- Collection card as mini-constellation on `/collections` index → **Plan 4**
- TV focus model polish (focus-first on load, long-press quick toggle) → **Plan 4**
- axe-core CI gate per route → **Plan 4**
- Lighthouse perf gate ≥ 90 → **Plan 4**
- Full E2E suite for Never-Weird acceptance (logo link, contrast, anchor shapes) → **Plan 4**
- Progress tracking / Continue Watching (→ P2, post-v0.1)

## Changelog

- 2026-04-23 — plan written (16 tasks; search + discover + settings full)
