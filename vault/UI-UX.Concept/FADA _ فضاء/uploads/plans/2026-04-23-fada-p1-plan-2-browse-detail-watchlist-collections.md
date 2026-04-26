# FADA P1 — Plan 2: Browse, Detail, Watchlist, Collections Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship Movies/Shows browse with filters, rich Movie/Show detail pages with cast drawer, the Watchlist page, and plain (non-constellation) Collections pages — building on top of Plan 1's foundation.

**Architecture:** Builds on Plan 1's TMDB client (extended with new typed endpoints), React Query (with new query keys/stale times), Zustand store (reused — no new actions needed; `addToWatchlist` / `removeFromWatchlist` already exist), and Plan 1's components (`<PosterCard>`, `<Rail>`, `<StarLoader>`, `<StarEmptyState>`). New components are composed from the shadcn primitives installed in Plan 1. Constellation rendering for Collections is explicitly deferred to Plan 4 — Plan 2 ships plain grid layouts with cover images so the routes work end-to-end.

**Tech Stack:** Next.js 15 App Router, TypeScript strict, Tailwind v4, shadcn/ui (Sheet, Tabs, Skeleton, Dialog, Badge, Tooltip, Separator), @tanstack/react-query, Zustand, Zod, next-intl, Motion One. Zero new runtime dependencies beyond Plan 1.

---

## Scope of this plan

**In scope:**
- `/movies` and `/shows` browse pages with `<FilterBar>` (genre, year range, original language, sort) and infinite-scroll `<PosterGrid>`. Filter state lives in the URL.
- `/title/movie/[id]` and `/title/tv/[id]` rich detail pages with four tabs: Overview, Cast & Crew, Reviews, More Info.
- `<CastDrawer>` — right-side Sheet with bio and other known credits.
- `<SeasonTabs>` + `<EpisodeRow>` — episode click fires the "المشاهدة قادمة في الإصدار 0.2" toast (no playback stub).
- `<WatchlistButton>` — icon toggle wired into the Zustand store from Plan 1; `aria-pressed` accurate.
- `/watchlist` — grid of saved titles, filter chips (All/Movies/Shows), sort (Added/Alphabetical/Rating), empty state.
- `/collections` index — two tabs (Editorial default, TMDB), plain `<CollectionCard>` grid.
- `/collections/curated/[slug]` — reads editorial JSON from `content/collections/`, plain hero + PosterGrid below.
- `/collections/tmdb/[id]` — fetches TMDB collection, plain hero + PosterGrid below.
- `<SimilarRail>` — thin wrapper around Plan 1's `<Rail>` for the "Similar" section.
- Three ship-ready editorial collections seeded in `content/collections/`.
- Unit + component + E2E tests for every new surface.

**Explicitly out of scope:**
- Constellation canvas rendering on `/collections/*` deep pages and hero (→ Plan 4).
- Search page, Discover page (→ Plan 3).
- Settings page, Watchlist export/import UI (→ Plan 3 — the store action already ships from Plan 1 Task 11).
- Hero constellation on `/` home page (→ Plan 4).
- axe-core and Lighthouse CI gates (→ Plan 4).

---

## File structure created by this plan

(Rooted at `app/` per Plan 1.)

```
app/
├── movies/
│   └── page.tsx                               # replaces stub (Plan 1 Task 24)
├── shows/
│   └── page.tsx                               # replaces stub
├── title/
│   ├── movie/[id]/page.tsx                    # new
│   └── tv/[id]/page.tsx                       # new
├── watchlist/
│   └── page.tsx                               # replaces stub
└── collections/
    ├── page.tsx                               # replaces stub
    ├── curated/[slug]/page.tsx                # new
    └── tmdb/[id]/page.tsx                     # new
components/fada/
├── FilterBar.tsx                              # new
├── PosterGrid.tsx                             # new
├── DetailHero.tsx                             # new
├── DetailTabs.tsx                             # new
├── OverviewTab.tsx                            # new
├── CastList.tsx                               # new
├── CastDrawer.tsx                             # new
├── ReviewsList.tsx                            # new
├── MoreInfoTab.tsx                            # new
├── SeasonTabs.tsx                             # new
├── EpisodeRow.tsx                             # new
├── SimilarRail.tsx                            # new
├── WatchlistButton.tsx                        # new
├── WatchlistGrid.tsx                          # new
├── CollectionCard.tsx                         # new (plain variant)
└── CollectionHero.tsx                         # new (plain variant)
lib/
├── tmdb/
│   └── endpoints.ts                           # extended (genres, discover, details, reviews, season, collection, person)
└── collections/
    ├── schema.ts                              # new — Zod for editorial JSON
    └── loader.ts                              # new — reads content/collections/*.json at build
content/collections/
├── essential-arab-cinema/{collection.json,cover.jpg}
├── turkish-drama-starters/{collection.json,cover.jpg}
└── ghibli-classics/{collection.json,cover.jpg}
messages/
└── ar.json                                    # extended with browse/detail/watchlist/collections strings
tests/
├── e2e/
│   └── browse-detail-watchlist.spec.ts        # new
└── unit/
    ├── collections/
    │   └── loader.test.ts                     # new
    └── tmdb/
        └── endpoints.extended.test.ts         # new
```

---

## Prerequisites

- Plan 1 complete. All 28 tasks done, `npm run build` succeeds, Playwright smoke passes.
- `app/` is the working directory; git repo initialized (at the very least for this phase — recommended for sane execution).
- Env: `NEXT_PUBLIC_TMDB_TOKEN` is set.
- shadcn primitives from Plan 1 Task 15 installed: Button, Input, Sheet, Dialog, Tabs, Badge, Skeleton, Separator, Tooltip, Select, ScrollArea, DropdownMenu, Popover, Slider. If any of these are missing, run `npx shadcn@latest add <name>` first.

---

## Task 1: Extend TMDB endpoints with genres, discover, details, reviews, seasons, collections, person

**Files:**
- Modify: `app/lib/tmdb/endpoints.ts`
- Modify: `app/lib/tmdb/types.ts`
- Create: `app/lib/tmdb/endpoints.extended.test.ts`

- [ ] **Step 1: Add new TMDB types to `lib/tmdb/types.ts`**

```ts
// Append at the bottom of lib/tmdb/types.ts

export type TmdbGenre = { id: number; name: string };

export type TmdbVideo = {
  id: string;
  key: string;
  site: 'YouTube' | 'Vimeo';
  type: 'Trailer' | 'Teaser' | 'Clip' | 'Featurette' | 'Behind the Scenes';
  official: boolean;
  name: string;
  iso_639_1: string;
};

export type TmdbCastMember = {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
};

export type TmdbCrewMember = {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
};

export type TmdbCredits = {
  cast: TmdbCastMember[];
  crew: TmdbCrewMember[];
};

export type TmdbReview = {
  id: string;
  author: string;
  author_details: { name: string; rating: number | null; avatar_path: string | null };
  content: string;
  created_at: string;
  url: string;
};

export type TmdbKeyword = { id: number; name: string };

export type TmdbExternalIds = {
  imdb_id: string | null;
  facebook_id: string | null;
  instagram_id: string | null;
  twitter_id: string | null;
};

export type TmdbProductionCompany = {
  id: number;
  name: string;
  logo_path: string | null;
  origin_country: string;
};

export type TmdbAlternativeTitle = {
  iso_3166_1: string;
  title: string;
  type: string;
};

export type TmdbMovieDetail = TmdbListItem & {
  runtime: number | null;
  genres: TmdbGenre[];
  tagline: string | null;
  status: string;
  imdb_id: string | null;
  production_companies: TmdbProductionCompany[];
  belongs_to_collection: { id: number; name: string; poster_path: string | null } | null;
  videos?: { results: TmdbVideo[] };
  credits?: TmdbCredits;
  reviews?: { results: TmdbReview[]; total_pages: number; page: number };
  recommendations?: TmdbPaged<TmdbListItem>;
  external_ids?: TmdbExternalIds;
  keywords?: { keywords: TmdbKeyword[] };
  alternative_titles?: { titles: TmdbAlternativeTitle[] };
};

export type TmdbEpisode = {
  id: number;
  name: string;
  overview: string;
  episode_number: number;
  season_number: number;
  air_date: string | null;
  still_path: string | null;
  vote_average: number;
  runtime: number | null;
};

export type TmdbSeasonSummary = {
  id: number;
  name: string;
  overview: string;
  season_number: number;
  episode_count: number;
  air_date: string | null;
  poster_path: string | null;
};

export type TmdbSeasonDetail = TmdbSeasonSummary & {
  episodes: TmdbEpisode[];
};

export type TmdbTvDetail = TmdbListItem & {
  number_of_seasons: number;
  number_of_episodes: number;
  genres: TmdbGenre[];
  tagline: string | null;
  status: string;
  seasons: TmdbSeasonSummary[];
  production_companies: TmdbProductionCompany[];
  videos?: { results: TmdbVideo[] };
  credits?: TmdbCredits;
  reviews?: { results: TmdbReview[]; total_pages: number; page: number };
  recommendations?: TmdbPaged<TmdbListItem>;
  external_ids?: TmdbExternalIds & { tvdb_id: number | null };
  keywords?: { results: TmdbKeyword[] };
  alternative_titles?: { results: TmdbAlternativeTitle[] };
};

export type TmdbPersonDetail = {
  id: number;
  name: string;
  biography: string;
  birthday: string | null;
  deathday: string | null;
  place_of_birth: string | null;
  profile_path: string | null;
  also_known_as: string[];
  combined_credits?: {
    cast: Array<TmdbListItem & { character: string; media_type: 'movie' | 'tv' }>;
    crew: Array<TmdbListItem & { job: string; media_type: 'movie' | 'tv' }>;
  };
};

export type TmdbCollectionDetail = {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  parts: TmdbListItem[];
};

export type DiscoverFilters = {
  genres?: number[];        // AND semantics via comma join
  yearFrom?: number;
  yearTo?: number;
  originalLanguage?: string;
  sort?:
    | 'popularity.desc'
    | 'popularity.asc'
    | 'vote_average.desc'
    | 'vote_count.desc'
    | 'primary_release_date.desc'
    | 'first_air_date.desc';
  page?: number;
};
```

- [ ] **Step 2: Write failing tests for new endpoints**

Create `app/lib/tmdb/endpoints.extended.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  genresMovie,
  genresTv,
  discoverMovies,
  discoverTv,
  movieDetail,
  tvDetail,
  seasonDetail,
  personDetail,
  collectionDetail,
  movieReviews,
} from '@/lib/tmdb/endpoints';

describe('genresMovie', () => {
  beforeEach(() => {
    (globalThis as any).fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ genres: [{ id: 28, name: 'Action' }] }),
    });
  });
  it('fetches movie genres with ar-SA language', async () => {
    const res = await genresMovie();
    expect(res.genres[0].name).toBe('Action');
    const call = (globalThis as any).fetch.mock.calls[0][0] as string;
    expect(call).toContain('/genre/movie/list');
    expect(call).toContain('language=ar-SA');
  });
});

describe('discoverMovies', () => {
  it('composes filter params correctly', async () => {
    (globalThis as any).fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ page: 1, results: [], total_pages: 1, total_results: 0 }),
    });
    await discoverMovies({
      genres: [28, 12],
      yearFrom: 2010,
      yearTo: 2020,
      originalLanguage: 'ar',
      sort: 'vote_average.desc',
      page: 2,
    });
    const call = (globalThis as any).fetch.mock.calls[0][0] as string;
    expect(call).toContain('with_genres=28%2C12');
    expect(call).toContain('primary_release_date.gte=2010-01-01');
    expect(call).toContain('primary_release_date.lte=2020-12-31');
    expect(call).toContain('with_original_language=ar');
    expect(call).toContain('sort_by=vote_average.desc');
    expect(call).toContain('page=2');
  });
});

describe('discoverTv', () => {
  it('uses first_air_date.{gte,lte} for year range', async () => {
    (globalThis as any).fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ page: 1, results: [], total_pages: 1, total_results: 0 }),
    });
    await discoverTv({ yearFrom: 2015, yearTo: 2020 });
    const call = (globalThis as any).fetch.mock.calls[0][0] as string;
    expect(call).toContain('first_air_date.gte=2015-01-01');
    expect(call).toContain('first_air_date.lte=2020-12-31');
  });
});

describe('movieDetail', () => {
  it('appends videos,credits,reviews,recommendations,external_ids,keywords,alternative_titles', async () => {
    (globalThis as any).fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: 550, title: 'Fight Club' }),
    });
    await movieDetail(550);
    const call = (globalThis as any).fetch.mock.calls[0][0] as string;
    expect(call).toContain('/movie/550');
    expect(call).toContain('append_to_response=videos%2Ccredits%2Creviews%2Crecommendations%2Cexternal_ids%2Ckeywords%2Calternative_titles');
  });
});

describe('tvDetail', () => {
  it('calls /tv/:id with appends', async () => {
    (globalThis as any).fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: 1396, name: 'Breaking Bad', seasons: [] }),
    });
    await tvDetail(1396);
    const call = (globalThis as any).fetch.mock.calls[0][0] as string;
    expect(call).toContain('/tv/1396');
    expect(call).toContain('append_to_response');
  });
});

describe('seasonDetail', () => {
  it('calls /tv/:id/season/:n', async () => {
    (globalThis as any).fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: 1, season_number: 1, episodes: [] }),
    });
    await seasonDetail(1396, 1);
    const call = (globalThis as any).fetch.mock.calls[0][0] as string;
    expect(call).toContain('/tv/1396/season/1');
  });
});

describe('personDetail', () => {
  it('appends combined_credits', async () => {
    (globalThis as any).fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: 287, name: 'Brad Pitt' }),
    });
    await personDetail(287);
    const call = (globalThis as any).fetch.mock.calls[0][0] as string;
    expect(call).toContain('/person/287');
    expect(call).toContain('append_to_response=combined_credits');
  });
});

describe('collectionDetail', () => {
  it('calls /collection/:id', async () => {
    (globalThis as any).fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: 1241, name: 'HP Collection', parts: [] }),
    });
    await collectionDetail(1241);
    const call = (globalThis as any).fetch.mock.calls[0][0] as string;
    expect(call).toContain('/collection/1241');
  });
});

describe('movieReviews', () => {
  it('paginates by passing page', async () => {
    (globalThis as any).fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ page: 3, results: [], total_pages: 5, total_results: 0 }),
    });
    await movieReviews(550, 3);
    const call = (globalThis as any).fetch.mock.calls[0][0] as string;
    expect(call).toContain('/movie/550/reviews');
    expect(call).toContain('page=3');
  });
});
```

- [ ] **Step 3: Run failing tests**

```bash
cd app && npm test -- endpoints.extended --run
```

Expected: 9 failures, all "function is not defined" or "undefined is not a function".

- [ ] **Step 4: Extend `lib/tmdb/endpoints.ts`**

Append to `app/lib/tmdb/endpoints.ts`:

```ts
import type {
  TmdbGenre,
  TmdbMovieDetail,
  TmdbTvDetail,
  TmdbSeasonDetail,
  TmdbPersonDetail,
  TmdbCollectionDetail,
  TmdbReview,
  TmdbPaged,
  TmdbListItem,
  DiscoverFilters,
} from './types';

const DETAIL_APPENDS =
  'videos,credits,reviews,recommendations,external_ids,keywords,alternative_titles';

function yearGte(from: number | undefined, key: 'primary_release_date' | 'first_air_date') {
  return from ? { [`${key}.gte`]: `${from}-01-01` } : {};
}
function yearLte(to: number | undefined, key: 'primary_release_date' | 'first_air_date') {
  return to ? { [`${key}.lte`]: `${to}-12-31` } : {};
}

export async function genresMovie() {
  return tmdbFetch<{ genres: TmdbGenre[] }>('/genre/movie/list', { language: 'ar-SA' });
}

export async function genresTv() {
  return tmdbFetch<{ genres: TmdbGenre[] }>('/genre/tv/list', { language: 'ar-SA' });
}

export async function discoverMovies(f: DiscoverFilters = {}) {
  return tmdbFetch<TmdbPaged<TmdbListItem>>('/discover/movie', {
    language: 'ar-SA',
    include_adult: 'false',
    ...(f.genres?.length ? { with_genres: f.genres.join(',') } : {}),
    ...yearGte(f.yearFrom, 'primary_release_date'),
    ...yearLte(f.yearTo, 'primary_release_date'),
    ...(f.originalLanguage ? { with_original_language: f.originalLanguage } : {}),
    sort_by: f.sort ?? 'popularity.desc',
    page: String(f.page ?? 1),
  });
}

export async function discoverTv(f: DiscoverFilters = {}) {
  return tmdbFetch<TmdbPaged<TmdbListItem>>('/discover/tv', {
    language: 'ar-SA',
    include_adult: 'false',
    ...(f.genres?.length ? { with_genres: f.genres.join(',') } : {}),
    ...yearGte(f.yearFrom, 'first_air_date'),
    ...yearLte(f.yearTo, 'first_air_date'),
    ...(f.originalLanguage ? { with_original_language: f.originalLanguage } : {}),
    sort_by: f.sort ?? 'popularity.desc',
    page: String(f.page ?? 1),
  });
}

export async function movieDetail(id: number) {
  return tmdbFetch<TmdbMovieDetail>(`/movie/${id}`, {
    language: 'ar-SA',
    append_to_response: DETAIL_APPENDS,
  });
}

export async function tvDetail(id: number) {
  return tmdbFetch<TmdbTvDetail>(`/tv/${id}`, {
    language: 'ar-SA',
    append_to_response: DETAIL_APPENDS,
  });
}

export async function seasonDetail(tvId: number, seasonNumber: number) {
  return tmdbFetch<TmdbSeasonDetail>(`/tv/${tvId}/season/${seasonNumber}`, {
    language: 'ar-SA',
  });
}

export async function personDetail(id: number) {
  return tmdbFetch<TmdbPersonDetail>(`/person/${id}`, {
    language: 'ar-SA',
    append_to_response: 'combined_credits',
  });
}

export async function collectionDetail(id: number) {
  return tmdbFetch<TmdbCollectionDetail>(`/collection/${id}`, { language: 'ar-SA' });
}

export async function movieReviews(id: number, page = 1) {
  return tmdbFetch<TmdbPaged<TmdbReview>>(`/movie/${id}/reviews`, {
    language: 'en-US',   // reviews are English-native on TMDB
    page: String(page),
  });
}

export async function tvReviews(id: number, page = 1) {
  return tmdbFetch<TmdbPaged<TmdbReview>>(`/tv/${id}/reviews`, {
    language: 'en-US',
    page: String(page),
  });
}
```

- [ ] **Step 5: Run tests until green**

```bash
cd app && npm test -- endpoints.extended --run
```

Expected: 9 PASS.

- [ ] **Step 6: Add STALE entries for new endpoint families**

Modify `app/lib/query/client.ts` — extend the `STALE` object:

```ts
export const STALE = {
  trending: 1000 * 60 * 60,          // 1h
  detail: 1000 * 60 * 60 * 24,       // 24h
  collection: 1000 * 60 * 60 * 24,   // 24h
  discover: 1000 * 60 * 15,          // 15m
  search: 1000 * 60 * 5,             // 5m
  genres: 1000 * 60 * 60 * 24 * 7,   // 7d
  reviews: 1000 * 60 * 30,           // 30m
} as const;
```

- [ ] **Step 7: Commit**

```bash
cd app && git add lib/tmdb src/lib/query/client.ts && git commit -m "feat(tmdb): extend endpoints for discover, detail, season, collection, person"
```

---

## Task 2: Build `<FilterBar>` with URL-state driven filters

**Files:**
- Create: `app/components/fada/FilterBar.tsx`
- Create: `app/components/fada/FilterBar.test.tsx`
- Modify: `app/messages/ar.json`

- [ ] **Step 1: Add Arabic strings**

Append to `app/messages/ar.json` under a new `filters` key:

```json
{
  "filters": {
    "genre": "النوع",
    "year": "السنة",
    "language": "اللغة الأصلية",
    "sort": "ترتيب",
    "sortPopular": "الأكثر شهرة",
    "sortTopRated": "الأعلى تقييمًا",
    "sortNewest": "الأحدث",
    "sortOldest": "الأقدم",
    "applyFilters": "تطبيق",
    "clearFilters": "مسح المرشحات",
    "anyGenre": "كل الأنواع",
    "anyLanguage": "كل اللغات",
    "from": "من",
    "to": "إلى"
  }
}
```

- [ ] **Step 2: Write failing component tests**

Create `app/components/fada/FilterBar.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FilterBar } from './FilterBar';

const GENRES = [
  { id: 28, name: 'Action' },
  { id: 18, name: 'Drama' },
];

describe('<FilterBar>', () => {
  it('renders all four filter groups', () => {
    render(<FilterBar genres={GENRES} value={{}} onChange={vi.fn()} />);
    expect(screen.getByText(/النوع/)).toBeInTheDocument();
    expect(screen.getByText(/السنة/)).toBeInTheDocument();
    expect(screen.getByText(/اللغة الأصلية/)).toBeInTheDocument();
    expect(screen.getByText(/ترتيب/)).toBeInTheDocument();
  });

  it('toggles a genre chip and fires onChange', () => {
    const onChange = vi.fn();
    render(<FilterBar genres={GENRES} value={{}} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /Action/ }));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ genres: [28] }));
  });

  it('clears filters when "مسح" pressed', () => {
    const onChange = vi.fn();
    render(
      <FilterBar
        genres={GENRES}
        value={{ genres: [28], yearFrom: 2020, sort: 'vote_average.desc' }}
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /مسح المرشحات/ }));
    expect(onChange).toHaveBeenCalledWith({});
  });
});
```

- [ ] **Step 3: Run tests to confirm failure**

```bash
cd app && npm test -- FilterBar --run
```

Expected: 3 FAIL, "FilterBar is not defined".

- [ ] **Step 4: Implement `<FilterBar>`**

Create `app/components/fada/FilterBar.tsx`:

```tsx
'use client';
import { useTranslations } from 'next-intl';
import type { TmdbGenre, DiscoverFilters } from '@/lib/tmdb/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
} from '@/components/ui/select';

type Props = {
  genres: TmdbGenre[];
  value: DiscoverFilters;
  onChange: (next: DiscoverFilters) => void;
};

const LANGUAGES: Array<{ code: string; label: string }> = [
  { code: 'ar', label: 'العربية' },
  { code: 'en', label: 'الإنجليزية' },
  { code: 'tr', label: 'التركية' },
  { code: 'ko', label: 'الكورية' },
  { code: 'ja', label: 'اليابانية' },
  { code: 'fr', label: 'الفرنسية' },
  { code: 'es', label: 'الإسبانية' },
];

const SORTS: Array<{ value: NonNullable<DiscoverFilters['sort']>; tKey: string }> = [
  { value: 'popularity.desc', tKey: 'sortPopular' },
  { value: 'vote_average.desc', tKey: 'sortTopRated' },
  { value: 'primary_release_date.desc', tKey: 'sortNewest' },
  { value: 'primary_release_date.asc', tKey: 'sortOldest' },
];

export function FilterBar({ genres, value, onChange }: Props) {
  const t = useTranslations('filters');

  const toggleGenre = (id: number) => {
    const current = value.genres ?? [];
    const next = current.includes(id) ? current.filter((g) => g !== id) : [...current, id];
    onChange({ ...value, genres: next.length ? next : undefined });
  };

  const clear = () => onChange({});
  const isDirty =
    (value.genres?.length ?? 0) > 0 ||
    value.yearFrom !== undefined ||
    value.yearTo !== undefined ||
    !!value.originalLanguage ||
    !!value.sort;

  return (
    <div className="sticky top-2 z-10 rounded-lg border border-border bg-surface/80 p-3 backdrop-blur">
      <div className="flex flex-wrap items-center gap-3">
        <section aria-label={t('genre')} className="flex flex-wrap items-center gap-1.5">
          <span className="text-sm text-muted">{t('genre')}</span>
          {genres.map((g) => {
            const active = (value.genres ?? []).includes(g.id);
            return (
              <Button
                key={g.id}
                type="button"
                variant={active ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleGenre(g.id)}
                aria-pressed={active}
              >
                {g.name}
              </Button>
            );
          })}
        </section>

        <section aria-label={t('year')} className="flex items-center gap-2">
          <span className="text-sm text-muted">{t('year')}</span>
          <input
            type="number"
            min={1900}
            max={2100}
            aria-label={t('from')}
            className="w-20 rounded border border-border bg-bg px-2 py-1 text-sm"
            value={value.yearFrom ?? ''}
            onChange={(e) =>
              onChange({
                ...value,
                yearFrom: e.target.value ? Number(e.target.value) : undefined,
              })
            }
          />
          <span className="text-muted">—</span>
          <input
            type="number"
            min={1900}
            max={2100}
            aria-label={t('to')}
            className="w-20 rounded border border-border bg-bg px-2 py-1 text-sm"
            value={value.yearTo ?? ''}
            onChange={(e) =>
              onChange({
                ...value,
                yearTo: e.target.value ? Number(e.target.value) : undefined,
              })
            }
          />
        </section>

        <section aria-label={t('language')} className="flex items-center gap-2">
          <span className="text-sm text-muted">{t('language')}</span>
          <Select
            value={value.originalLanguage ?? ''}
            onValueChange={(v) =>
              onChange({ ...value, originalLanguage: v || undefined })
            }
          >
            <SelectTrigger className="w-32"><SelectValue placeholder={t('anyLanguage')} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">{t('anyLanguage')}</SelectItem>
              {LANGUAGES.map((l) => (
                <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </section>

        <section aria-label={t('sort')} className="flex items-center gap-2">
          <span className="text-sm text-muted">{t('sort')}</span>
          <Select
            value={value.sort ?? 'popularity.desc'}
            onValueChange={(v) =>
              onChange({ ...value, sort: v as DiscoverFilters['sort'] })
            }
          >
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              {SORTS.map((s) => (
                <SelectItem key={s.value} value={s.value}>{t(s.tKey)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </section>

        {isDirty && (
          <Button type="button" variant="ghost" size="sm" onClick={clear}>
            {t('clearFilters')}
          </Button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Run tests until green**

```bash
cd app && npm test -- FilterBar --run
```

Expected: 3 PASS.

- [ ] **Step 6: Commit**

```bash
cd app && git add components/fada/FilterBar.tsx components/fada/FilterBar.test.tsx messages/ar.json && git commit -m "feat(fada): FilterBar component with URL-ready value/onChange contract"
```

---

## Task 3: Build `<PosterGrid>` with infinite-scroll

**Files:**
- Create: `app/components/fada/PosterGrid.tsx`
- Create: `app/components/fada/PosterGrid.test.tsx`

- [ ] **Step 1: Write failing component tests**

Create `app/components/fada/PosterGrid.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PosterGrid } from './PosterGrid';
import type { TmdbListItem } from '@/lib/tmdb/types';

const ITEMS: TmdbListItem[] = [
  { id: 1, media_type: 'movie', title: 'A', poster_path: null, vote_average: 7, release_date: '2020-01-01' } as any,
  { id: 2, media_type: 'movie', title: 'B', poster_path: null, vote_average: 6, release_date: '2021-01-01' } as any,
];

describe('<PosterGrid>', () => {
  it('renders each item as a link to its detail page', () => {
    render(
      <PosterGrid items={ITEMS} hasMore={false} isLoading={false} onLoadMore={vi.fn()} mediaType="movie" />,
    );
    expect(screen.getByRole('link', { name: /A/ })).toHaveAttribute('href', '/title/movie/1');
    expect(screen.getByRole('link', { name: /B/ })).toHaveAttribute('href', '/title/movie/2');
  });

  it('shows loader when loading', () => {
    render(
      <PosterGrid items={[]} hasMore={true} isLoading={true} onLoadMore={vi.fn()} mediaType="movie" />,
    );
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows empty state when no items and not loading', () => {
    render(
      <PosterGrid items={[]} hasMore={false} isLoading={false} onLoadMore={vi.fn()} mediaType="movie" />,
    );
    expect(screen.getByText(/لا توجد نتائج/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to confirm failure**

```bash
cd app && npm test -- PosterGrid --run
```

- [ ] **Step 3: Implement `<PosterGrid>`**

Create `app/components/fada/PosterGrid.tsx`:

```tsx
'use client';
import { useEffect, useRef } from 'react';
import { PosterCard } from './PosterCard';
import { StarLoader } from './StarLoader';
import { StarEmptyState } from './StarEmptyState';
import type { TmdbListItem } from '@/lib/tmdb/types';
import { useTranslations } from 'next-intl';

type Props = {
  items: TmdbListItem[];
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  mediaType: 'movie' | 'tv';
};

export function PosterGrid({ items, hasMore, isLoading, onLoadMore, mediaType }: Props) {
  const t = useTranslations('browse');
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !isLoading) onLoadMore();
      },
      { rootMargin: '400px' },
    );
    obs.observe(sentinelRef.current);
    return () => obs.disconnect();
  }, [hasMore, isLoading, onLoadMore]);

  if (!items.length && isLoading) {
    return (
      <div role="status" aria-live="polite" className="flex min-h-64 items-center justify-center">
        <StarLoader />
      </div>
    );
  }

  if (!items.length) {
    return <StarEmptyState title={t('emptyTitle')} description={t('emptyDescription')} />;
  }

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8">
      {items.map((item) => (
        <PosterCard
          key={`${item.id}-${mediaType}`}
          item={item}
          mediaType={mediaType}
          href={`/title/${mediaType}/${item.id}`}
        />
      ))}
      <div ref={sentinelRef} className="col-span-full h-10" />
      {isLoading && hasMore && (
        <div role="status" className="col-span-full flex justify-center py-4">
          <StarLoader />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Add Arabic strings**

Append to `app/messages/ar.json` under a new `browse` key:

```json
{
  "browse": {
    "emptyTitle": "لا توجد نتائج",
    "emptyDescription": "جرّب تعديل المرشحات"
  }
}
```

- [ ] **Step 5: Run tests until green**

```bash
cd app && npm test -- PosterGrid --run
```

- [ ] **Step 6: Commit**

```bash
cd app && git add components/fada/PosterGrid.tsx components/fada/PosterGrid.test.tsx messages/ar.json && git commit -m "feat(fada): PosterGrid with IntersectionObserver infinite-scroll"
```

---

## Task 4: Build `/movies` browse page

**Files:**
- Modify: `app/app/movies/page.tsx` (replaces Plan 1 stub)

- [ ] **Step 1: Replace the stub**

```tsx
'use client';
import { useMemo } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { FilterBar } from '@/components/fada/FilterBar';
import { PosterGrid } from '@/components/fada/PosterGrid';
import { discoverMovies, genresMovie } from '@/lib/tmdb/endpoints';
import { STALE } from '@/lib/query/client';
import type { DiscoverFilters } from '@/lib/tmdb/types';
import { useTranslations } from 'next-intl';

function parseFilters(sp: URLSearchParams): DiscoverFilters {
  return {
    genres: sp.get('genres')?.split(',').map(Number).filter(Boolean),
    yearFrom: sp.get('from') ? Number(sp.get('from')) : undefined,
    yearTo: sp.get('to') ? Number(sp.get('to')) : undefined,
    originalLanguage: sp.get('lang') ?? undefined,
    sort: (sp.get('sort') as DiscoverFilters['sort']) ?? undefined,
  };
}

function serializeFilters(f: DiscoverFilters): string {
  const p = new URLSearchParams();
  if (f.genres?.length) p.set('genres', f.genres.join(','));
  if (f.yearFrom) p.set('from', String(f.yearFrom));
  if (f.yearTo) p.set('to', String(f.yearTo));
  if (f.originalLanguage) p.set('lang', f.originalLanguage);
  if (f.sort) p.set('sort', f.sort);
  return p.toString();
}

export default function MoviesPage() {
  const t = useTranslations('nav');
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const filters = useMemo(() => parseFilters(new URLSearchParams(sp.toString())), [sp]);

  const { data: genresData } = useQuery({
    queryKey: ['genres', 'movie'],
    queryFn: genresMovie,
    staleTime: STALE.genres,
  });

  const query = useInfiniteQuery({
    queryKey: ['discover', 'movie', filters],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => discoverMovies({ ...filters, page: pageParam as number }),
    getNextPageParam: (last) => (last.page < last.total_pages ? last.page + 1 : undefined),
    staleTime: STALE.discover,
  });

  const items = query.data?.pages.flatMap((p) => p.results) ?? [];

  const onFilterChange = (next: DiscoverFilters) => {
    const qs = serializeFilters(next);
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  return (
    <main className="mx-auto max-w-screen-2xl px-4 py-6">
      <h1 className="mb-4 text-2xl font-semibold">{t('movies')}</h1>
      <FilterBar genres={genresData?.genres ?? []} value={filters} onChange={onFilterChange} />
      <div className="mt-4">
        <PosterGrid
          items={items}
          hasMore={!!query.hasNextPage}
          isLoading={query.isFetching}
          onLoadMore={() => query.fetchNextPage()}
          mediaType="movie"
        />
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Verify page renders**

```bash
cd app && npm run dev
```

Open `http://localhost:3000/movies`. Expected: filter bar visible, 6-column grid of Arabic-language movie posters (because TMDB `language=ar-SA` surfaces localized titles first), infinite scroll works, URL updates when a filter changes.

- [ ] **Step 3: Commit**

```bash
cd app && git add app/movies/page.tsx && git commit -m "feat(movies): browse page with FilterBar + PosterGrid + URL state"
```

---

## Task 5: Build `/shows` browse page

**Files:**
- Modify: `app/app/shows/page.tsx`

- [ ] **Step 1: Replace the stub**

```tsx
'use client';
import { useMemo } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { FilterBar } from '@/components/fada/FilterBar';
import { PosterGrid } from '@/components/fada/PosterGrid';
import { discoverTv, genresTv } from '@/lib/tmdb/endpoints';
import { STALE } from '@/lib/query/client';
import type { DiscoverFilters } from '@/lib/tmdb/types';
import { useTranslations } from 'next-intl';

function parseFilters(sp: URLSearchParams): DiscoverFilters {
  return {
    genres: sp.get('genres')?.split(',').map(Number).filter(Boolean),
    yearFrom: sp.get('from') ? Number(sp.get('from')) : undefined,
    yearTo: sp.get('to') ? Number(sp.get('to')) : undefined,
    originalLanguage: sp.get('lang') ?? undefined,
    sort: (sp.get('sort') as DiscoverFilters['sort']) ?? undefined,
  };
}
function serializeFilters(f: DiscoverFilters): string {
  const p = new URLSearchParams();
  if (f.genres?.length) p.set('genres', f.genres.join(','));
  if (f.yearFrom) p.set('from', String(f.yearFrom));
  if (f.yearTo) p.set('to', String(f.yearTo));
  if (f.originalLanguage) p.set('lang', f.originalLanguage);
  if (f.sort) p.set('sort', f.sort);
  return p.toString();
}

export default function ShowsPage() {
  const t = useTranslations('nav');
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const filters = useMemo(() => parseFilters(new URLSearchParams(sp.toString())), [sp]);

  const { data: genresData } = useQuery({
    queryKey: ['genres', 'tv'],
    queryFn: genresTv,
    staleTime: STALE.genres,
  });

  const query = useInfiniteQuery({
    queryKey: ['discover', 'tv', filters],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => discoverTv({ ...filters, page: pageParam as number }),
    getNextPageParam: (last) => (last.page < last.total_pages ? last.page + 1 : undefined),
    staleTime: STALE.discover,
  });

  const items = query.data?.pages.flatMap((p) => p.results) ?? [];

  const onFilterChange = (next: DiscoverFilters) => {
    const qs = serializeFilters(next);
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  return (
    <main className="mx-auto max-w-screen-2xl px-4 py-6">
      <h1 className="mb-4 text-2xl font-semibold">{t('shows')}</h1>
      <FilterBar genres={genresData?.genres ?? []} value={filters} onChange={onFilterChange} />
      <div className="mt-4">
        <PosterGrid
          items={items}
          hasMore={!!query.hasNextPage}
          isLoading={query.isFetching}
          onLoadMore={() => query.fetchNextPage()}
          mediaType="tv"
        />
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Verify and commit**

Open `/shows`, confirm filter + grid behavior.

```bash
cd app && git add app/shows/page.tsx && git commit -m "feat(shows): browse page mirrors /movies with TV discover"
```

---

## Task 6: Build `<WatchlistButton>` wired to Zustand

**Files:**
- Create: `app/components/fada/WatchlistButton.tsx`
- Create: `app/components/fada/WatchlistButton.test.tsx`
- Modify: `app/messages/ar.json`

- [ ] **Step 1: Add Arabic strings**

Add to `ar.json`:

```json
{
  "watchlist": {
    "add": "أضف إلى قائمتي",
    "remove": "إزالة من قائمتي",
    "addedToast": "أُضيف إلى قائمتك",
    "removedToast": "تم الإزالة"
  }
}
```

- [ ] **Step 2: Write failing component tests**

Create `app/components/fada/WatchlistButton.test.tsx`:

```tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WatchlistButton } from './WatchlistButton';
import { useFadaStore } from '@/lib/storage/store';

describe('<WatchlistButton>', () => {
  beforeEach(() => {
    localStorage.clear();
    useFadaStore.setState({
      watchlist: [],
      preferences: useFadaStore.getState().preferences,
      recentSearches: [],
      tmdb: { customToken: null },
    } as any);
  });

  it('renders as not-saved by default', () => {
    render(<WatchlistButton id={550} type="movie" />);
    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('aria-pressed', 'false');
  });

  it('toggles on click and reflects aria-pressed', () => {
    render(<WatchlistButton id={550} type="movie" />);
    const btn = screen.getByRole('button');
    fireEvent.click(btn);
    expect(btn).toHaveAttribute('aria-pressed', 'true');
    expect(useFadaStore.getState().watchlist).toHaveLength(1);
    fireEvent.click(btn);
    expect(btn).toHaveAttribute('aria-pressed', 'false');
    expect(useFadaStore.getState().watchlist).toHaveLength(0);
  });
});
```

- [ ] **Step 3: Run tests to confirm failure**

```bash
cd app && npm test -- WatchlistButton --run
```

- [ ] **Step 4: Implement `<WatchlistButton>`**

Create `app/components/fada/WatchlistButton.tsx`:

```tsx
'use client';
import { useTranslations } from 'next-intl';
import { Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFadaStore } from '@/lib/storage/store';

type Props = {
  id: number;
  type: 'movie' | 'tv';
  size?: 'sm' | 'md';
};

export function WatchlistButton({ id, type, size = 'md' }: Props) {
  const t = useTranslations('watchlist');
  const saved = useFadaStore((s) =>
    s.watchlist.some((w) => w.id === id && w.type === type),
  );
  const add = useFadaStore((s) => s.addToWatchlist);
  const remove = useFadaStore((s) => s.removeFromWatchlist);

  const onClick = () => (saved ? remove({ id, type }) : add({ id, type }));

  return (
    <Button
      type="button"
      variant={saved ? 'default' : 'outline'}
      size={size === 'sm' ? 'sm' : 'default'}
      aria-pressed={saved}
      aria-label={saved ? t('remove') : t('add')}
      onClick={onClick}
      className={saved ? 'bg-gold text-bg hover:bg-gold/90' : ''}
    >
      <Bookmark className="me-1 h-4 w-4" fill={saved ? 'currentColor' : 'none'} />
      {saved ? t('remove') : t('add')}
    </Button>
  );
}
```

- [ ] **Step 5: Run tests until green**

```bash
cd app && npm test -- WatchlistButton --run
```

- [ ] **Step 6: Commit**

```bash
cd app && git add components/fada/WatchlistButton.tsx components/fada/WatchlistButton.test.tsx messages/ar.json && git commit -m "feat(fada): WatchlistButton with aria-pressed + store wiring"
```

---

## Task 7: Build `<DetailHero>` (backdrop + poster + metadata + actions)

**Files:**
- Create: `app/components/fada/DetailHero.tsx`
- Modify: `app/messages/ar.json`

- [ ] **Step 1: Add Arabic strings**

```json
{
  "detail": {
    "minutes": "دقيقة",
    "rating": "التقييم",
    "imdb": "IMDb",
    "releaseDate": "تاريخ الإصدار",
    "seasons": "المواسم",
    "episodes": "الحلقات",
    "tagline": "الشعار"
  }
}
```

- [ ] **Step 2: Implement `<DetailHero>`**

Create `app/components/fada/DetailHero.tsx`:

```tsx
'use client';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Star, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { WatchlistButton } from './WatchlistButton';
import type { TmdbGenre } from '@/lib/tmdb/types';

type Props = {
  id: number;
  type: 'movie' | 'tv';
  title: string;
  originalTitle?: string;
  year?: string;
  runtimeMin?: number | null;
  numberOfSeasons?: number;
  numberOfEpisodes?: number;
  genres: TmdbGenre[];
  rating?: number;
  imdbId?: string | null;
  tagline?: string | null;
  posterPath: string | null;
  backdropPath: string | null;
};

function img(path: string | null, width: 'w342' | 'w780' | 'original') {
  return path ? `https://image.tmdb.org/t/p/${width}${path}` : null;
}

export function DetailHero(p: Props) {
  const t = useTranslations('detail');
  const backdrop = img(p.backdropPath, 'original');
  const poster = img(p.posterPath, 'w342');

  return (
    <section className="relative overflow-hidden">
      {backdrop && (
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-cover bg-center opacity-30"
          style={{ backgroundImage: `url(${backdrop})` }}
        />
      )}
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-bg via-bg/80 to-bg/40" />
      <div className="mx-auto flex max-w-screen-2xl flex-col gap-6 px-4 py-12 md:flex-row">
        {poster && (
          <Image
            src={poster}
            alt=""
            width={220}
            height={330}
            className="h-auto w-40 flex-shrink-0 rounded-lg shadow-lg md:w-52"
            priority
          />
        )}
        <div className="flex-1 space-y-4">
          <h1 className="text-3xl font-semibold md:text-4xl">{p.title}</h1>
          {p.originalTitle && p.originalTitle !== p.title && (
            <p className="text-muted" dir="auto">{p.originalTitle}</p>
          )}
          {p.tagline && <p className="italic text-muted">{p.tagline}</p>}

          <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
            {p.year && <span className="font-mono">{p.year}</span>}
            {p.runtimeMin ? (
              <span className="font-mono">{p.runtimeMin} {t('minutes')}</span>
            ) : null}
            {p.numberOfSeasons !== undefined && (
              <span className="font-mono">{p.numberOfSeasons} {t('seasons')}</span>
            )}
            {p.numberOfEpisodes !== undefined && (
              <span className="font-mono">{p.numberOfEpisodes} {t('episodes')}</span>
            )}
            {p.rating !== undefined && (
              <span className="inline-flex items-center gap-1">
                <Star className="h-4 w-4 fill-gold text-gold" />
                <span className="font-mono">{p.rating.toFixed(1)}</span>
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {p.genres.map((g) => (
              <Badge key={g.id} variant="secondary">{g.name}</Badge>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <WatchlistButton id={p.id} type={p.type} />
            {p.imdbId && (
              <a
                href={`https://www.imdb.com/title/${p.imdbId}/`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-muted hover:text-fg"
              >
                <ExternalLink className="h-4 w-4" />
                {t('imdb')}
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Commit**

```bash
cd app && git add components/fada/DetailHero.tsx messages/ar.json && git commit -m "feat(fada): DetailHero with backdrop, poster, metadata, watchlist action"
```

---

## Task 8: Build `<OverviewTab>` with description + trailer embed + "Part of Collection"

**Files:**
- Create: `app/components/fada/OverviewTab.tsx`

- [ ] **Step 1: Implement**

```tsx
'use client';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { TmdbVideo } from '@/lib/tmdb/types';

type Props = {
  overview: string;
  videos?: TmdbVideo[];
  belongsToCollection?: { id: number; name: string; poster_path: string | null } | null;
};

export function OverviewTab({ overview, videos, belongsToCollection }: Props) {
  const t = useTranslations('detail');
  const trailer = videos?.find(
    (v) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser') && v.official,
  ) ?? videos?.find((v) => v.site === 'YouTube');

  return (
    <div className="space-y-6 py-4">
      {overview ? (
        <p className="leading-relaxed text-fg/90">{overview}</p>
      ) : (
        <p className="text-muted">—</p>
      )}

      {trailer && (
        <div className="aspect-video w-full overflow-hidden rounded-lg">
          <iframe
            className="h-full w-full"
            src={`https://www.youtube-nocookie.com/embed/${trailer.key}`}
            title={trailer.name}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      {belongsToCollection && (
        <Link
          href={`/collections/tmdb/${belongsToCollection.id}`}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-3 transition-colors hover:bg-surface/80"
        >
          <span className="text-muted">جزء من</span>
          <span className="font-medium">{belongsToCollection.name}</span>
        </Link>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd app && git add components/fada/OverviewTab.tsx && git commit -m "feat(fada): OverviewTab with YouTube trailer + collection link"
```

---

## Task 9: Build `<CastList>` + `<CastDrawer>`

**Files:**
- Create: `app/components/fada/CastList.tsx`
- Create: `app/components/fada/CastDrawer.tsx`
- Modify: `app/messages/ar.json`

- [ ] **Step 1: Add Arabic strings**

```json
{
  "cast": {
    "title": "الطاقم",
    "noBio": "لا توجد سيرة متاحة",
    "knownFor": "معروف بـ",
    "born": "تاريخ الميلاد",
    "diedOn": "تاريخ الوفاة",
    "placeOfBirth": "مكان الميلاد"
  }
}
```

- [ ] **Step 2: Implement `<CastDrawer>` (uses shadcn Sheet)**

`app/components/fada/CastDrawer.tsx`:

```tsx
'use client';
import { useQuery } from '@tanstack/react-query';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { personDetail } from '@/lib/tmdb/endpoints';
import { STALE } from '@/lib/query/client';
import { StarLoader } from './StarLoader';

type Props = {
  personId: number | null;
  onClose: () => void;
};

export function CastDrawer({ personId, onClose }: Props) {
  const t = useTranslations('cast');
  const { data, isLoading } = useQuery({
    queryKey: ['person', personId],
    queryFn: () => personDetail(personId as number),
    enabled: personId !== null,
    staleTime: STALE.detail,
  });

  return (
    <Sheet open={personId !== null} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="left" className="w-full max-w-md overflow-y-auto">
        {isLoading && <div className="flex justify-center py-8"><StarLoader /></div>}
        {data && (
          <>
            <SheetHeader>
              <SheetTitle>{data.name}</SheetTitle>
            </SheetHeader>
            <div className="mt-4 space-y-4">
              {data.profile_path && (
                <Image
                  src={`https://image.tmdb.org/t/p/w342${data.profile_path}`}
                  alt=""
                  width={342}
                  height={513}
                  className="h-auto w-full rounded-lg"
                />
              )}
              <dl className="grid grid-cols-3 gap-2 text-sm">
                {data.birthday && (<><dt className="text-muted">{t('born')}</dt><dd className="col-span-2 font-mono">{data.birthday}</dd></>)}
                {data.deathday && (<><dt className="text-muted">{t('diedOn')}</dt><dd className="col-span-2 font-mono">{data.deathday}</dd></>)}
                {data.place_of_birth && (<><dt className="text-muted">{t('placeOfBirth')}</dt><dd className="col-span-2">{data.place_of_birth}</dd></>)}
              </dl>
              {data.biography ? (
                <p className="whitespace-pre-line text-sm leading-relaxed">{data.biography}</p>
              ) : (
                <p className="text-sm text-muted">{t('noBio')}</p>
              )}
              {data.combined_credits?.cast?.length ? (
                <section>
                  <h3 className="mb-2 text-sm font-semibold text-muted">{t('knownFor')}</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {data.combined_credits.cast.slice(0, 9).map((c) => (
                      <Link
                        key={`${c.id}-${c.media_type}`}
                        href={`/title/${c.media_type}/${c.id}`}
                        className="space-y-1 text-xs"
                        onClick={onClose}
                      >
                        {c.poster_path ? (
                          <Image
                            src={`https://image.tmdb.org/t/p/w185${c.poster_path}`}
                            alt=""
                            width={185}
                            height={278}
                            className="h-auto w-full rounded"
                          />
                        ) : (
                          <div className="aspect-[2/3] rounded bg-surface" />
                        )}
                        <div className="line-clamp-2">{(c as any).title ?? (c as any).name}</div>
                      </Link>
                    ))}
                  </div>
                </section>
              ) : null}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
```

- [ ] **Step 3: Implement `<CastList>`**

`app/components/fada/CastList.tsx`:

```tsx
'use client';
import { useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { CastDrawer } from './CastDrawer';
import type { TmdbCastMember } from '@/lib/tmdb/types';

type Props = { cast: TmdbCastMember[] };

export function CastList({ cast }: Props) {
  const t = useTranslations('cast');
  const [openPerson, setOpenPerson] = useState<number | null>(null);

  if (!cast?.length) return <p className="py-8 text-muted">—</p>;

  return (
    <>
      <h2 className="sr-only">{t('title')}</h2>
      <div className="grid grid-cols-2 gap-3 py-4 md:grid-cols-3 lg:grid-cols-5">
        {cast.slice(0, 10).map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setOpenPerson(c.id)}
            className="text-start transition-transform hover:-translate-y-0.5"
          >
            {c.profile_path ? (
              <Image
                src={`https://image.tmdb.org/t/p/w185${c.profile_path}`}
                alt=""
                width={185}
                height={278}
                className="h-auto w-full rounded-lg"
              />
            ) : (
              <div className="aspect-[2/3] w-full rounded-lg bg-surface" />
            )}
            <div className="mt-1.5 space-y-0.5">
              <div className="line-clamp-1 text-sm font-medium">{c.name}</div>
              <div className="line-clamp-1 text-xs text-muted">{c.character}</div>
            </div>
          </button>
        ))}
      </div>
      <CastDrawer personId={openPerson} onClose={() => setOpenPerson(null)} />
    </>
  );
}
```

- [ ] **Step 4: Commit**

```bash
cd app && git add components/fada/CastList.tsx components/fada/CastDrawer.tsx messages/ar.json && git commit -m "feat(fada): CastList + CastDrawer with person detail + credits"
```

---

## Task 10: Build `<ReviewsList>` with pagination

**Files:**
- Create: `app/components/fada/ReviewsList.tsx`
- Modify: `app/messages/ar.json`

- [ ] **Step 1: Add strings**

```json
{
  "reviews": {
    "empty": "لا توجد مراجعات بعد",
    "by": "بواسطة",
    "prev": "السابق",
    "next": "التالي",
    "page": "صفحة"
  }
}
```

- [ ] **Step 2: Implement**

```tsx
'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { movieReviews, tvReviews } from '@/lib/tmdb/endpoints';
import { STALE } from '@/lib/query/client';
import { useTranslations } from 'next-intl';
import { StarLoader } from './StarLoader';
import { Button } from '@/components/ui/button';

type Props = { id: number; type: 'movie' | 'tv' };

export function ReviewsList({ id, type }: Props) {
  const [page, setPage] = useState(1);
  const t = useTranslations('reviews');
  const { data, isLoading } = useQuery({
    queryKey: ['reviews', type, id, page],
    queryFn: () => (type === 'movie' ? movieReviews(id, page) : tvReviews(id, page)),
    staleTime: STALE.reviews,
  });

  if (isLoading) return <div className="py-8 flex justify-center"><StarLoader /></div>;
  if (!data?.results.length) return <p className="py-8 text-muted">{t('empty')}</p>;

  return (
    <div className="space-y-4 py-4">
      {data.results.map((r) => (
        <article key={r.id} className="rounded-lg border border-border bg-surface p-4">
          <header className="mb-2 text-sm text-muted">
            <span>{t('by')} </span>
            <span className="font-medium text-fg">{r.author}</span>
            <span> · </span>
            <span className="font-mono">{new Date(r.created_at).toLocaleDateString('ar-EG')}</span>
          </header>
          <p className="whitespace-pre-line text-sm leading-relaxed">{r.content}</p>
        </article>
      ))}
      {data.total_pages > 1 && (
        <nav className="flex items-center justify-between pt-2">
          <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            {t('prev')}
          </Button>
          <span className="text-sm text-muted font-mono">{t('page')} {page} / {data.total_pages}</span>
          <Button variant="ghost" size="sm" disabled={page >= data.total_pages} onClick={() => setPage((p) => p + 1)}>
            {t('next')}
          </Button>
        </nav>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
cd app && git add components/fada/ReviewsList.tsx messages/ar.json && git commit -m "feat(fada): ReviewsList with TMDB pagination"
```

---

## Task 11: Build `<MoreInfoTab>` (production, keywords, external IDs, alt titles)

**Files:**
- Create: `app/components/fada/MoreInfoTab.tsx`
- Modify: `app/messages/ar.json`

- [ ] **Step 1: Add strings**

```json
{
  "moreInfo": {
    "production": "شركات الإنتاج",
    "keywords": "كلمات مفتاحية",
    "alternativeTitles": "عناوين بديلة",
    "externalLinks": "روابط خارجية",
    "status": "الحالة"
  }
}
```

- [ ] **Step 2: Implement**

```tsx
'use client';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import type {
  TmdbProductionCompany, TmdbKeyword, TmdbAlternativeTitle, TmdbExternalIds,
} from '@/lib/tmdb/types';

type Props = {
  status?: string;
  productionCompanies?: TmdbProductionCompany[];
  keywords?: TmdbKeyword[];
  alternativeTitles?: TmdbAlternativeTitle[];
  externalIds?: TmdbExternalIds;
};

export function MoreInfoTab(p: Props) {
  const t = useTranslations('moreInfo');
  return (
    <div className="space-y-6 py-4">
      {p.status && (
        <div>
          <h3 className="mb-1 text-sm font-semibold text-muted">{t('status')}</h3>
          <p>{p.status}</p>
        </div>
      )}
      {p.productionCompanies?.length ? (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-muted">{t('production')}</h3>
          <ul className="flex flex-wrap gap-2">
            {p.productionCompanies.map((c) => (
              <li key={c.id} className="rounded border border-border bg-surface px-3 py-1 text-sm">{c.name}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {p.keywords?.length ? (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-muted">{t('keywords')}</h3>
          <div className="flex flex-wrap gap-1.5">
            {p.keywords.map((k) => (<Badge key={k.id} variant="outline">{k.name}</Badge>))}
          </div>
        </div>
      ) : null}
      {p.alternativeTitles?.length ? (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-muted">{t('alternativeTitles')}</h3>
          <ul className="space-y-1 text-sm">
            {p.alternativeTitles.map((a, i) => (
              <li key={`${a.iso_3166_1}-${i}`} className="flex justify-between">
                <span>{a.title}</span>
                <span className="text-muted font-mono">{a.iso_3166_1}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
cd app && git add components/fada/MoreInfoTab.tsx messages/ar.json && git commit -m "feat(fada): MoreInfoTab with production, keywords, alt titles"
```

---

## Task 12: Build `<DetailTabs>` wrapper

**Files:**
- Create: `app/components/fada/DetailTabs.tsx`
- Modify: `app/messages/ar.json`

- [ ] **Step 1: Add tab labels**

```json
{
  "detailTabs": {
    "overview": "نظرة عامة",
    "cast": "الطاقم",
    "reviews": "المراجعات",
    "more": "المزيد"
  }
}
```

- [ ] **Step 2: Implement**

```tsx
'use client';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

type Props = {
  overview: ReactNode;
  cast: ReactNode;
  reviews: ReactNode;
  more: ReactNode;
};

export function DetailTabs(p: Props) {
  const t = useTranslations('detailTabs');
  return (
    <Tabs defaultValue="overview" className="mt-6">
      <TabsList className="w-full justify-start gap-1 border-b border-border bg-transparent">
        <TabsTrigger value="overview">{t('overview')}</TabsTrigger>
        <TabsTrigger value="cast">{t('cast')}</TabsTrigger>
        <TabsTrigger value="reviews">{t('reviews')}</TabsTrigger>
        <TabsTrigger value="more">{t('more')}</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">{p.overview}</TabsContent>
      <TabsContent value="cast">{p.cast}</TabsContent>
      <TabsContent value="reviews">{p.reviews}</TabsContent>
      <TabsContent value="more">{p.more}</TabsContent>
    </Tabs>
  );
}
```

- [ ] **Step 3: Commit**

```bash
cd app && git add components/fada/DetailTabs.tsx messages/ar.json && git commit -m "feat(fada): DetailTabs wrapper around shadcn Tabs"
```

---

## Task 13: Build `<SimilarRail>` (extends existing `<Rail>`)

**Files:**
- Create: `app/components/fada/SimilarRail.tsx`
- Modify: `app/messages/ar.json`

- [ ] **Step 1: Add string**

```json
{
  "similar": { "title": "أعمال مشابهة" }
}
```

- [ ] **Step 2: Implement**

```tsx
'use client';
import { Rail } from './Rail';
import { PosterCard } from './PosterCard';
import { useTranslations } from 'next-intl';
import type { TmdbListItem } from '@/lib/tmdb/types';

type Props = { items: TmdbListItem[]; mediaType: 'movie' | 'tv' };

export function SimilarRail({ items, mediaType }: Props) {
  const t = useTranslations('similar');
  if (!items?.length) return null;
  return (
    <section className="mt-10">
      <Rail title={t('title')}>
        {items.slice(0, 20).map((item) => (
          <PosterCard
            key={item.id}
            item={item}
            mediaType={mediaType}
            href={`/title/${mediaType}/${item.id}`}
            size="md"
          />
        ))}
      </Rail>
    </section>
  );
}
```

- [ ] **Step 3: Commit**

```bash
cd app && git add components/fada/SimilarRail.tsx messages/ar.json && git commit -m "feat(fada): SimilarRail wraps Rail for recommendations"
```

---

## Task 14: Build `/title/movie/[id]` page

**Files:**
- Create: `app/app/title/movie/[id]/page.tsx`

- [ ] **Step 1: Implement**

```tsx
'use client';
import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { notFound } from 'next/navigation';
import { movieDetail } from '@/lib/tmdb/endpoints';
import { STALE } from '@/lib/query/client';
import { DetailHero } from '@/components/fada/DetailHero';
import { DetailTabs } from '@/components/fada/DetailTabs';
import { OverviewTab } from '@/components/fada/OverviewTab';
import { CastList } from '@/components/fada/CastList';
import { ReviewsList } from '@/components/fada/ReviewsList';
import { MoreInfoTab } from '@/components/fada/MoreInfoTab';
import { SimilarRail } from '@/components/fada/SimilarRail';
import { StarLoader } from '@/components/fada/StarLoader';

export default function MovieDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const movieId = Number(id);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['detail', 'movie', movieId],
    queryFn: () => movieDetail(movieId),
    staleTime: STALE.detail,
  });

  if (isLoading) {
    return <main className="flex min-h-[50vh] items-center justify-center"><StarLoader /></main>;
  }
  if (isError || !data) return notFound();

  const year = data.release_date ? data.release_date.slice(0, 4) : undefined;

  return (
    <main>
      <DetailHero
        id={data.id}
        type="movie"
        title={data.title ?? ''}
        originalTitle={data.original_title}
        year={year}
        runtimeMin={data.runtime}
        genres={data.genres}
        rating={data.vote_average}
        imdbId={data.imdb_id}
        tagline={data.tagline}
        posterPath={data.poster_path}
        backdropPath={data.backdrop_path}
      />
      <div className="mx-auto max-w-screen-2xl px-4">
        <DetailTabs
          overview={
            <OverviewTab
              overview={data.overview ?? ''}
              videos={data.videos?.results}
              belongsToCollection={data.belongs_to_collection}
            />
          }
          cast={<CastList cast={data.credits?.cast ?? []} />}
          reviews={<ReviewsList id={data.id} type="movie" />}
          more={
            <MoreInfoTab
              status={data.status}
              productionCompanies={data.production_companies}
              keywords={data.keywords?.keywords}
              alternativeTitles={data.alternative_titles?.titles}
              externalIds={data.external_ids}
            />
          }
        />
        <SimilarRail
          items={data.recommendations?.results ?? []}
          mediaType="movie"
        />
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Add static params export (for static export)**

Since the project uses `output: 'export'`, dynamic routes need `generateStaticParams` or must be marked client-side. For a known-small set, return an empty array so the route becomes a client-rendered SPA path (still works with static export via the fallback in `next.config.mjs`).

At the top of the file, add:

```tsx
export async function generateStaticParams() {
  return [];
}
```

Verify `next.config.mjs` (Plan 1 Task 1) has `trailingSlash: true` and the export handles client-only dynamic routes correctly — if not, patch it.

- [ ] **Step 3: Verify manually**

```bash
cd app && npm run dev
```

Navigate to `/movies` → click a poster → lands on `/title/movie/:id` with full detail hero + tabs rendering.

- [ ] **Step 4: Commit**

```bash
cd app && git add app/title/movie/[id]/page.tsx && git commit -m "feat(detail): movie detail page with hero + 4 tabs + similar rail"
```

---

## Task 15: Build `<SeasonTabs>` + `<EpisodeRow>`

**Files:**
- Create: `app/components/fada/SeasonTabs.tsx`
- Create: `app/components/fada/EpisodeRow.tsx`
- Modify: `app/messages/ar.json`

- [ ] **Step 1: Add strings**

```json
{
  "seasons": {
    "season": "موسم",
    "playbackSoon": "المشاهدة قادمة في الإصدار 0.2"
  }
}
```

- [ ] **Step 2: Implement `<EpisodeRow>`**

```tsx
'use client';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Play, Star } from 'lucide-react';
import type { TmdbEpisode } from '@/lib/tmdb/types';

type Props = { ep: TmdbEpisode };

export function EpisodeRow({ ep }: Props) {
  const t = useTranslations('seasons');
  const still = ep.still_path ? `https://image.tmdb.org/t/p/w300${ep.still_path}` : null;

  return (
    <button
      type="button"
      onClick={() => toast(t('playbackSoon'))}
      className="group flex w-full items-start gap-3 rounded-lg p-2 text-start transition-colors hover:bg-surface"
    >
      <div className="relative flex-shrink-0 aspect-video w-40 overflow-hidden rounded bg-surface">
        {still ? (
          <Image src={still} alt="" fill sizes="160px" className="object-cover" />
        ) : null}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
          <Play className="h-8 w-8 text-fg drop-shadow" fill="currentColor" />
        </div>
      </div>
      <div className="flex-1">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-muted">{ep.episode_number}.</span>
          <h3 className="font-medium">{ep.name}</h3>
        </div>
        <div className="mt-1 flex items-center gap-3 text-xs text-muted">
          {ep.air_date && <span className="font-mono">{ep.air_date}</span>}
          {ep.vote_average ? (
            <span className="inline-flex items-center gap-1">
              <Star className="h-3 w-3 fill-gold text-gold" />
              <span className="font-mono">{ep.vote_average.toFixed(1)}</span>
            </span>
          ) : null}
        </div>
        <p className="mt-2 line-clamp-2 text-sm text-muted">{ep.overview}</p>
      </div>
    </button>
  );
}
```

- [ ] **Step 3: Implement `<SeasonTabs>`**

```tsx
'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { EpisodeRow } from './EpisodeRow';
import { seasonDetail } from '@/lib/tmdb/endpoints';
import { STALE } from '@/lib/query/client';
import { StarLoader } from './StarLoader';
import type { TmdbSeasonSummary } from '@/lib/tmdb/types';

type Props = { tvId: number; seasons: TmdbSeasonSummary[] };

function EpisodesForSeason({ tvId, seasonNumber }: { tvId: number; seasonNumber: number }) {
  const { data, isLoading } = useQuery({
    queryKey: ['season', tvId, seasonNumber],
    queryFn: () => seasonDetail(tvId, seasonNumber),
    staleTime: STALE.detail,
  });
  if (isLoading) return <div className="py-6 flex justify-center"><StarLoader /></div>;
  if (!data?.episodes?.length) return null;
  return (
    <div className="space-y-1 py-3">
      {data.episodes.map((ep) => <EpisodeRow key={ep.id} ep={ep} />)}
    </div>
  );
}

export function SeasonTabs({ tvId, seasons }: Props) {
  const t = useTranslations('seasons');
  const real = seasons.filter((s) => s.season_number > 0);
  const [current, setCurrent] = useState(String(real[0]?.season_number ?? 1));
  if (!real.length) return null;

  return (
    <Tabs value={current} onValueChange={setCurrent} className="mt-6">
      <TabsList className="flex flex-wrap gap-1 bg-transparent">
        {real.map((s) => (
          <TabsTrigger key={s.season_number} value={String(s.season_number)}>
            {t('season')} {s.season_number}
          </TabsTrigger>
        ))}
      </TabsList>
      {real.map((s) => (
        <TabsContent key={s.season_number} value={String(s.season_number)}>
          <EpisodesForSeason tvId={tvId} seasonNumber={s.season_number} />
        </TabsContent>
      ))}
    </Tabs>
  );
}
```

- [ ] **Step 4: Wire the `sonner` toast provider**

If Plan 1 didn't install it, add it:

```bash
cd app && npm install sonner
```

Add to `app/app/layout.tsx` (inside providers):

```tsx
import { Toaster } from 'sonner';
// ... inside the layout, after children:
<Toaster position="top-start" richColors closeButton dir="rtl" />
```

- [ ] **Step 5: Commit**

```bash
cd app && git add components/fada/SeasonTabs.tsx components/fada/EpisodeRow.tsx app/layout.tsx messages/ar.json package.json package-lock.json && git commit -m "feat(fada): SeasonTabs + EpisodeRow with v0.2 toast"
```

---

## Task 16: Build `/title/tv/[id]` page

**Files:**
- Create: `app/app/title/tv/[id]/page.tsx`

- [ ] **Step 1: Implement**

```tsx
'use client';
import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { notFound } from 'next/navigation';
import { tvDetail } from '@/lib/tmdb/endpoints';
import { STALE } from '@/lib/query/client';
import { DetailHero } from '@/components/fada/DetailHero';
import { DetailTabs } from '@/components/fada/DetailTabs';
import { OverviewTab } from '@/components/fada/OverviewTab';
import { CastList } from '@/components/fada/CastList';
import { ReviewsList } from '@/components/fada/ReviewsList';
import { MoreInfoTab } from '@/components/fada/MoreInfoTab';
import { SimilarRail } from '@/components/fada/SimilarRail';
import { SeasonTabs } from '@/components/fada/SeasonTabs';
import { StarLoader } from '@/components/fada/StarLoader';

export async function generateStaticParams() {
  return [];
}

export default function TvDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const tvId = Number(id);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['detail', 'tv', tvId],
    queryFn: () => tvDetail(tvId),
    staleTime: STALE.detail,
  });

  if (isLoading) {
    return <main className="flex min-h-[50vh] items-center justify-center"><StarLoader /></main>;
  }
  if (isError || !data) return notFound();

  const year = data.first_air_date ? data.first_air_date.slice(0, 4) : undefined;

  return (
    <main>
      <DetailHero
        id={data.id}
        type="tv"
        title={data.name ?? ''}
        originalTitle={data.original_name}
        year={year}
        numberOfSeasons={data.number_of_seasons}
        numberOfEpisodes={data.number_of_episodes}
        genres={data.genres}
        rating={data.vote_average}
        imdbId={data.external_ids?.imdb_id ?? null}
        tagline={data.tagline}
        posterPath={data.poster_path}
        backdropPath={data.backdrop_path}
      />
      <div className="mx-auto max-w-screen-2xl px-4">
        <SeasonTabs tvId={data.id} seasons={data.seasons} />
        <DetailTabs
          overview={
            <OverviewTab
              overview={data.overview ?? ''}
              videos={data.videos?.results}
              belongsToCollection={null}
            />
          }
          cast={<CastList cast={data.credits?.cast ?? []} />}
          reviews={<ReviewsList id={data.id} type="tv" />}
          more={
            <MoreInfoTab
              status={data.status}
              productionCompanies={data.production_companies}
              keywords={data.keywords?.results}
              alternativeTitles={data.alternative_titles?.results}
              externalIds={data.external_ids as any}
            />
          }
        />
        <SimilarRail
          items={data.recommendations?.results ?? []}
          mediaType="tv"
        />
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Verify and commit**

Navigate `/shows` → poster → `/title/tv/:id`. Confirm seasons tab row, episode click shows the Arabic "v0.2" toast.

```bash
cd app && git add app/title/tv/[id]/page.tsx && git commit -m "feat(detail): TV detail page with seasons + episodes + v0.2 toast"
```

---

## Task 17: Build `<WatchlistGrid>` + `/watchlist` page

**Files:**
- Create: `app/components/fada/WatchlistGrid.tsx`
- Modify: `app/app/watchlist/page.tsx`
- Modify: `app/messages/ar.json`

- [ ] **Step 1: Add strings**

```json
{
  "watchlistPage": {
    "title": "قائمتي",
    "empty": "قائمتك فارغة",
    "emptyDescription": "أضف عنوانًا من أي صفحة",
    "filterAll": "الكل",
    "filterMovies": "أفلام",
    "filterShows": "مسلسلات",
    "sortAdded": "الأحدث إضافة",
    "sortAlpha": "أبجديًا",
    "sortRating": "الأعلى تقييمًا"
  }
}
```

- [ ] **Step 2: Implement `<WatchlistGrid>`**

`app/components/fada/WatchlistGrid.tsx`:

```tsx
'use client';
import { useMemo, useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
} from '@/components/ui/select';
import { useFadaStore } from '@/lib/storage/store';
import { movieDetail, tvDetail } from '@/lib/tmdb/endpoints';
import { STALE } from '@/lib/query/client';
import { PosterCard } from './PosterCard';
import { StarEmptyState } from './StarEmptyState';
import { StarLoader } from './StarLoader';

type Filter = 'all' | 'movie' | 'tv';
type Sort = 'added' | 'alpha' | 'rating';

export function WatchlistGrid() {
  const t = useTranslations('watchlistPage');
  const watchlist = useFadaStore((s) => s.watchlist);
  const [filter, setFilter] = useState<Filter>('all');
  const [sort, setSort] = useState<Sort>('added');

  const entries = useMemo(
    () => (filter === 'all' ? watchlist : watchlist.filter((w) => w.type === filter)),
    [watchlist, filter],
  );

  const results = useQueries({
    queries: entries.map((e) => ({
      queryKey: ['detail', e.type, e.id],
      queryFn: () => (e.type === 'movie' ? movieDetail(e.id) : tvDetail(e.id)),
      staleTime: STALE.detail,
    })),
  });

  const loading = results.some((r) => r.isLoading);
  const hydrated = results
    .map((r, i) => (r.data ? { entry: entries[i], data: r.data } : null))
    .filter(Boolean) as Array<{ entry: typeof entries[number]; data: any }>;

  const sorted = useMemo(() => {
    const copy = [...hydrated];
    if (sort === 'alpha') {
      copy.sort((a, b) =>
        (a.data.title ?? a.data.name ?? '').localeCompare(b.data.title ?? b.data.name ?? ''),
      );
    } else if (sort === 'rating') {
      copy.sort((a, b) => (b.data.vote_average ?? 0) - (a.data.vote_average ?? 0));
    } else {
      copy.sort((a, b) => b.entry.addedAt.localeCompare(a.entry.addedAt));
    }
    return copy;
  }, [hydrated, sort]);

  if (!watchlist.length) {
    return <StarEmptyState title={t('empty')} description={t('emptyDescription')} />;
  }
  if (loading && !hydrated.length) {
    return <div className="flex min-h-64 items-center justify-center"><StarLoader /></div>;
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex gap-1">
          {(['all', 'movie', 'tv'] as Filter[]).map((f) => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? 'default' : 'outline'}
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
            >
              {t(f === 'all' ? 'filterAll' : f === 'movie' ? 'filterMovies' : 'filterShows')}
            </Button>
          ))}
        </div>
        <Select value={sort} onValueChange={(v) => setSort(v as Sort)}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="added">{t('sortAdded')}</SelectItem>
            <SelectItem value="alpha">{t('sortAlpha')}</SelectItem>
            <SelectItem value="rating">{t('sortRating')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8">
        {sorted.map(({ entry, data }) => (
          <PosterCard
            key={`${entry.type}-${entry.id}`}
            item={data}
            mediaType={entry.type}
            href={`/title/${entry.type}/${entry.id}`}
          />
        ))}
      </div>
    </>
  );
}
```

- [ ] **Step 3: Wire the page**

Replace `app/app/watchlist/page.tsx`:

```tsx
'use client';
import { WatchlistGrid } from '@/components/fada/WatchlistGrid';
import { useTranslations } from 'next-intl';

export default function WatchlistPage() {
  const t = useTranslations('watchlistPage');
  return (
    <main className="mx-auto max-w-screen-2xl px-4 py-6">
      <h1 className="mb-4 text-2xl font-semibold">{t('title')}</h1>
      <WatchlistGrid />
    </main>
  );
}
```

- [ ] **Step 4: Verify and commit**

Save a movie from detail → visit `/watchlist` → it appears → remove → empty state.

```bash
cd app && git add components/fada/WatchlistGrid.tsx app/watchlist/page.tsx messages/ar.json && git commit -m "feat(watchlist): grid page with filter + sort + empty state"
```

---

## Task 18: Editorial collections — schema, loader, seed data

**Files:**
- Create: `app/lib/collections/schema.ts`
- Create: `app/lib/collections/loader.ts`
- Create: `app/lib/collections/loader.test.ts`
- Create: `app/content/collections/essential-arab-cinema/collection.json`
- Create: `app/content/collections/essential-arab-cinema/cover.jpg` (placeholder 1920×800 jpg)
- Create: `app/content/collections/turkish-drama-starters/{collection.json, cover.jpg}`
- Create: `app/content/collections/ghibli-classics/{collection.json, cover.jpg}`

- [ ] **Step 1: Zod schema**

`app/lib/collections/schema.ts`:

```ts
import { z } from 'zod';

export const CollectionNodeSchema = z.object({
  tmdbId: z.number().int().positive(),
  type: z.enum(['movie', 'tv']),
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
});

export const CollectionSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(1),
  description: z.string(),
  cover: z.string().min(1),
  nodes: z.array(CollectionNodeSchema).min(1),
  connections: z.array(z.tuple([z.number().int(), z.number().int()])).default([]),
});

export type Collection = z.infer<typeof CollectionSchema>;
```

- [ ] **Step 2: Write failing loader tests**

`app/lib/collections/loader.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { loadAllCollections, loadCollection } from './loader';

describe('editorial collection loader', () => {
  it('loads every collection under content/collections', async () => {
    const all = await loadAllCollections();
    expect(all.length).toBeGreaterThanOrEqual(3);
    expect(all.map((c) => c.slug)).toEqual(
      expect.arrayContaining(['essential-arab-cinema', 'turkish-drama-starters', 'ghibli-classics']),
    );
  });

  it('loads a single collection by slug', async () => {
    const c = await loadCollection('essential-arab-cinema');
    expect(c).not.toBeNull();
    expect(c!.title).toMatch(/سينما/);
    expect(c!.nodes.length).toBeGreaterThan(0);
  });

  it('returns null for an unknown slug', async () => {
    expect(await loadCollection('does-not-exist')).toBeNull();
  });
});
```

- [ ] **Step 3: Implement loader**

`app/lib/collections/loader.ts`:

```ts
import fs from 'node:fs/promises';
import path from 'node:path';
import { CollectionSchema, type Collection } from './schema';

const ROOT = path.resolve(process.cwd(), 'content/collections');

export async function loadAllCollections(): Promise<Collection[]> {
  const entries = await fs.readdir(ROOT, { withFileTypes: true });
  const dirs = entries.filter((e) => e.isDirectory());
  const loaded = await Promise.all(
    dirs.map(async (d) => {
      const file = path.join(ROOT, d.name, 'collection.json');
      const raw = await fs.readFile(file, 'utf8');
      return CollectionSchema.parse(JSON.parse(raw));
    }),
  );
  return loaded;
}

export async function loadCollection(slug: string): Promise<Collection | null> {
  const file = path.join(ROOT, slug, 'collection.json');
  try {
    const raw = await fs.readFile(file, 'utf8');
    return CollectionSchema.parse(JSON.parse(raw));
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: Seed editorial JSON files**

`app/content/collections/essential-arab-cinema/collection.json`:

```json
{
  "slug": "essential-arab-cinema",
  "title": "أساسيات السينما العربية",
  "description": "مختارات من الأفلام العربية التي شكّلت السينما في المنطقة.",
  "cover": "/content/collections/essential-arab-cinema/cover.jpg",
  "nodes": [
    { "tmdbId": 42289, "type": "movie", "x": 0.2, "y": 0.3 },
    { "tmdbId": 40096, "type": "movie", "x": 0.5, "y": 0.25 },
    { "tmdbId": 299198, "type": "movie", "x": 0.8, "y": 0.35 },
    { "tmdbId": 521719, "type": "movie", "x": 0.35, "y": 0.6 },
    { "tmdbId": 602734, "type": "movie", "x": 0.65, "y": 0.65 }
  ],
  "connections": [[0,1],[1,2],[1,3],[2,4],[3,4]]
}
```

`app/content/collections/turkish-drama-starters/collection.json`:

```json
{
  "slug": "turkish-drama-starters",
  "title": "بداية مع الدراما التركية",
  "description": "محطات أولى لاستكشاف الدراما التركية المعاصرة.",
  "cover": "/content/collections/turkish-drama-starters/cover.jpg",
  "nodes": [
    { "tmdbId": 37854, "type": "tv", "x": 0.25, "y": 0.3 },
    { "tmdbId": 80732, "type": "tv", "x": 0.55, "y": 0.2 },
    { "tmdbId": 46156, "type": "tv", "x": 0.75, "y": 0.45 },
    { "tmdbId": 45263, "type": "tv", "x": 0.4, "y": 0.65 }
  ],
  "connections": [[0,1],[1,2],[0,3],[2,3]]
}
```

`app/content/collections/ghibli-classics/collection.json`:

```json
{
  "slug": "ghibli-classics",
  "title": "كلاسيكيّات استوديو جيبلي",
  "description": "اختيارات من أشهر أعمال استوديو جيبلي.",
  "cover": "/content/collections/ghibli-classics/cover.jpg",
  "nodes": [
    { "tmdbId": 129, "type": "movie", "x": 0.2, "y": 0.35 },
    { "tmdbId": 4935, "type": "movie", "x": 0.45, "y": 0.25 },
    { "tmdbId": 149, "type": "movie", "x": 0.7, "y": 0.35 },
    { "tmdbId": 128, "type": "movie", "x": 0.3, "y": 0.6 },
    { "tmdbId": 8392, "type": "movie", "x": 0.6, "y": 0.65 }
  ],
  "connections": [[0,1],[1,2],[0,3],[2,4],[3,4]]
}
```

- [ ] **Step 5: Placeholder cover images**

Drop a 1920×800 JPG at each cover path. Any placeholder is fine for P2 — real art can be swapped later. If you don't have one handy, generate a solid-color JPG:

```bash
cd app
mkdir -p content/collections/essential-arab-cinema content/collections/turkish-drama-starters content/collections/ghibli-classics
# Use ImageMagick if available:
convert -size 1920x800 xc:'#12151F' content/collections/essential-arab-cinema/cover.jpg
convert -size 1920x800 xc:'#1F1512' content/collections/turkish-drama-starters/cover.jpg
convert -size 1920x800 xc:'#0F1F19' content/collections/ghibli-classics/cover.jpg
```

- [ ] **Step 6: Run tests until green**

```bash
cd app && npm test -- loader --run
```

- [ ] **Step 7: Commit**

```bash
cd app && git add lib/collections content/collections && git commit -m "feat(collections): editorial schema + loader + 3 seed collections"
```

---

## Task 19: Build `<CollectionCard>` (plain variant)

**Files:**
- Create: `app/components/fada/CollectionCard.tsx`

- [ ] **Step 1: Implement**

```tsx
'use client';
import Link from 'next/link';
import Image from 'next/image';

type Props = {
  href: string;
  title: string;
  description?: string;
  cover: string;
};

export function CollectionCard({ href, title, description, cover }: Props) {
  return (
    <Link
      href={href}
      className="group block overflow-hidden rounded-lg border border-border bg-surface transition-colors hover:border-gold/40"
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden">
        <Image
          src={cover}
          alt=""
          fill
          sizes="(min-width: 1024px) 33vw, 100vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-bg/80 via-bg/20 to-transparent" />
      </div>
      <div className="p-4">
        <h3 className="font-medium">{title}</h3>
        {description && <p className="mt-1 line-clamp-2 text-sm text-muted">{description}</p>}
      </div>
    </Link>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd app && git add components/fada/CollectionCard.tsx && git commit -m "feat(fada): plain CollectionCard with hover scale"
```

---

## Task 20: Build `/collections` index with Editorial/TMDB tabs

**Files:**
- Modify: `app/app/collections/page.tsx`
- Modify: `app/messages/ar.json`

- [ ] **Step 1: Add strings**

```json
{
  "collections": {
    "title": "المجموعات",
    "tabEditorial": "مختاراتنا",
    "tabTmdb": "TMDB",
    "tmdbHint": "تُظهر هذه اللوحة التشكيلات الرسمية للأفلام. افتح أي فيلم لترى مجموعتها إن وُجدت."
  }
}
```

- [ ] **Step 2: Create editorial collections data file for client use**

Since the loader uses `node:fs`, it can't run in the client bundle. Create a server-loaded list that gets imported at build time.

Add a server-only wrapper `app/lib/collections/server.ts`:

```ts
import 'server-only';
import { loadAllCollections } from './loader';

export async function getAllEditorial() {
  return loadAllCollections();
}
```

And a simple client-usable data exporter that imports JSONs directly (Next.js handles this fine for JSON imports):

Create `app/content/collections/index.ts`:

```ts
import essentialArabCinema from './essential-arab-cinema/collection.json';
import turkishDramaStarters from './turkish-drama-starters/collection.json';
import ghibliClassics from './ghibli-classics/collection.json';
import { CollectionSchema, type Collection } from '@/lib/collections/schema';

export const ALL_COLLECTIONS: Collection[] = [
  essentialArabCinema,
  turkishDramaStarters,
  ghibliClassics,
].map((c) => CollectionSchema.parse(c));

export function getBySlug(slug: string): Collection | undefined {
  return ALL_COLLECTIONS.find((c) => c.slug === slug);
}
```

Also add `tsconfig.json` `"resolveJsonModule": true` (it's already on by default in Next.js, but verify).

- [ ] **Step 3: Replace collections stub**

```tsx
'use client';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useTranslations } from 'next-intl';
import { CollectionCard } from '@/components/fada/CollectionCard';
import { ALL_COLLECTIONS } from '@/content/collections';

export default function CollectionsPage() {
  const t = useTranslations('collections');
  return (
    <main className="mx-auto max-w-screen-2xl px-4 py-6">
      <h1 className="mb-4 text-2xl font-semibold">{t('title')}</h1>
      <Tabs defaultValue="editorial">
        <TabsList className="gap-1 bg-transparent">
          <TabsTrigger value="editorial">{t('tabEditorial')}</TabsTrigger>
          <TabsTrigger value="tmdb">{t('tabTmdb')}</TabsTrigger>
        </TabsList>
        <TabsContent value="editorial">
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ALL_COLLECTIONS.map((c) => (
              <CollectionCard
                key={c.slug}
                href={`/collections/curated/${c.slug}`}
                title={c.title}
                description={c.description}
                cover={c.cover}
              />
            ))}
          </div>
        </TabsContent>
        <TabsContent value="tmdb">
          <p className="mt-4 max-w-prose text-muted">{t('tmdbHint')}</p>
        </TabsContent>
      </Tabs>
    </main>
  );
}
```

- [ ] **Step 4: Verify and commit**

```bash
cd app && git add app/collections/page.tsx content/collections/index.ts lib/collections/server.ts messages/ar.json && git commit -m "feat(collections): index page with editorial tab + 3 seed cards"
```

---

## Task 21: Build `<CollectionHero>` (plain variant) and `/collections/curated/[slug]`

**Files:**
- Create: `app/components/fada/CollectionHero.tsx`
- Create: `app/app/collections/curated/[slug]/page.tsx`

- [ ] **Step 1: Implement `<CollectionHero>` (plain)**

```tsx
'use client';
import Image from 'next/image';

type Props = { title: string; description: string; cover: string };

export function CollectionHero({ title, description, cover }: Props) {
  return (
    <section className="relative overflow-hidden">
      <div className="relative h-[40vh] w-full min-h-72">
        <Image src={cover} alt="" fill priority className="object-cover" />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-bg via-bg/60 to-bg/20" />
      </div>
      <div className="mx-auto -mt-24 max-w-screen-2xl px-4 pb-6 relative">
        <h1 className="text-3xl font-semibold md:text-4xl">{title}</h1>
        <p className="mt-2 max-w-prose text-muted">{description}</p>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Implement `/collections/curated/[slug]`**

```tsx
'use client';
import { use } from 'react';
import { useQueries } from '@tanstack/react-query';
import { notFound } from 'next/navigation';
import { getBySlug, ALL_COLLECTIONS } from '@/content/collections';
import { CollectionHero } from '@/components/fada/CollectionHero';
import { PosterCard } from '@/components/fada/PosterCard';
import { movieDetail, tvDetail } from '@/lib/tmdb/endpoints';
import { STALE } from '@/lib/query/client';
import { StarLoader } from '@/components/fada/StarLoader';

export async function generateStaticParams() {
  return ALL_COLLECTIONS.map((c) => ({ slug: c.slug }));
}

export default function CuratedCollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const coll = getBySlug(slug);
  if (!coll) return notFound();

  const results = useQueries({
    queries: coll.nodes.map((n) => ({
      queryKey: ['detail', n.type, n.tmdbId],
      queryFn: () => (n.type === 'movie' ? movieDetail(n.tmdbId) : tvDetail(n.tmdbId)),
      staleTime: STALE.detail,
    })),
  });
  const loading = results.some((r) => r.isLoading);

  return (
    <main>
      <CollectionHero title={coll.title} description={coll.description} cover={coll.cover} />
      <div className="mx-auto max-w-screen-2xl px-4 py-6">
        {loading && <div className="flex justify-center py-8"><StarLoader /></div>}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
          {results.map((r, i) =>
            r.data ? (
              <PosterCard
                key={`${coll.nodes[i].type}-${coll.nodes[i].tmdbId}`}
                item={r.data as any}
                mediaType={coll.nodes[i].type}
                href={`/title/${coll.nodes[i].type}/${coll.nodes[i].tmdbId}`}
              />
            ) : null,
          )}
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Commit**

```bash
cd app && git add components/fada/CollectionHero.tsx app/collections/curated/[slug]/page.tsx && git commit -m "feat(collections): curated deep page (plain hero + grid)"
```

---

## Task 22: Build `/collections/tmdb/[id]`

**Files:**
- Create: `app/app/collections/tmdb/[id]/page.tsx`

- [ ] **Step 1: Implement**

```tsx
'use client';
import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { notFound } from 'next/navigation';
import { collectionDetail } from '@/lib/tmdb/endpoints';
import { STALE } from '@/lib/query/client';
import { CollectionHero } from '@/components/fada/CollectionHero';
import { PosterCard } from '@/components/fada/PosterCard';
import { StarLoader } from '@/components/fada/StarLoader';

export async function generateStaticParams() {
  return [];
}

export default function TmdbCollectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const cid = Number(id);
  const { data, isLoading, isError } = useQuery({
    queryKey: ['collection', cid],
    queryFn: () => collectionDetail(cid),
    staleTime: STALE.collection,
  });

  if (isLoading) {
    return <main className="flex min-h-[40vh] items-center justify-center"><StarLoader /></main>;
  }
  if (isError || !data) return notFound();

  const cover = data.backdrop_path
    ? `https://image.tmdb.org/t/p/original${data.backdrop_path}`
    : data.poster_path
    ? `https://image.tmdb.org/t/p/original${data.poster_path}`
    : '/placeholder-cover.jpg';

  return (
    <main>
      <CollectionHero title={data.name} description={data.overview ?? ''} cover={cover} />
      <div className="mx-auto max-w-screen-2xl px-4 py-6">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
          {data.parts.map((p) => (
            <PosterCard key={p.id} item={p} mediaType="movie" href={`/title/movie/${p.id}`} />
          ))}
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd app && git add app/collections/tmdb/[id]/page.tsx && git commit -m "feat(collections): TMDB collection deep page"
```

---

## Task 23: Playwright E2E for browse → detail → watchlist flow

**Files:**
- Create: `app/tests/e2e/browse-detail-watchlist.spec.ts`

- [ ] **Step 1: Write the spec**

```ts
import { test, expect } from '@playwright/test';

test('browse → detail → add to watchlist → watchlist → open', async ({ page }) => {
  await page.goto('/movies');
  await expect(page.getByRole('heading', { name: /الأفلام/ })).toBeVisible();

  // Click the first poster
  const firstLink = page.locator('main a[href^="/title/movie/"]').first();
  await firstLink.waitFor();
  const href = await firstLink.getAttribute('href');
  await firstLink.click();

  // On detail page
  await expect(page).toHaveURL(new RegExp(href!));
  await expect(page.getByRole('heading').first()).toBeVisible();

  // Add to watchlist
  const wlBtn = page.getByRole('button', { name: /أضف إلى قائمتي/ });
  await wlBtn.click();
  await expect(page.getByRole('button', { name: /إزالة من قائمتي/ })).toBeVisible();

  // Go to watchlist
  await page.goto('/watchlist');
  await expect(page.getByRole('heading', { name: /قائمتي/ })).toBeVisible();
  await expect(page.locator('a[href^="/title/movie/"]').first()).toBeVisible();
});

test('rail scroll starts from the right in RTL', async ({ page }) => {
  await page.goto('/');
  const firstRail = page.locator('[role="region"][aria-label]').first();
  await firstRail.waitFor();
  // In RTL, scrollLeft of an unscrolled container is 0 or negative depending on browser
  // Simpler invariant: the first visible poster should be on the right edge.
  const box = await firstRail.boundingBox();
  const firstPoster = firstRail.locator('a[href^="/title/"]').first();
  const pbox = await firstPoster.boundingBox();
  expect(pbox!.x + pbox!.width).toBeGreaterThan(box!.x + box!.width * 0.5);
});

test('episode click shows v0.2 toast (no playback)', async ({ page }) => {
  // Pick a known-popular TV ID (Breaking Bad: 1396)
  await page.goto('/title/tv/1396');
  await page.getByRole('tab', { name: /موسم 1/ }).click();
  const firstEp = page.getByRole('button').filter({ hasText: /1\./ }).first();
  await firstEp.click();
  await expect(page.getByText(/المشاهدة قادمة في الإصدار 0\.2/)).toBeVisible();
});
```

- [ ] **Step 2: Run**

```bash
cd app && npx playwright test browse-detail-watchlist --reporter=list
```

Expected: 3 PASS. (If the TMDB-backed test is flaky, mark it as `test.skip.runIf(!process.env.TMDB_LIVE)` for now and add a mocked variant in Plan 4.)

- [ ] **Step 3: Commit**

```bash
cd app && git add tests/e2e/browse-detail-watchlist.spec.ts && git commit -m "test(e2e): browse, detail, watchlist, RTL rail, v0.2 toast"
```

---

## Task 24: Final Plan 2 acceptance pass

- [ ] **Step 1: Typecheck and build**

```bash
cd app && npx tsc --noEmit && npm run build
```

Both must exit 0.

- [ ] **Step 2: Manual QA walk**

- `/movies` — filter by genre `Action`, year `2015–2025`, sort `Top Rated`. URL reflects state. Hard reload → filters restored.
- `/shows` — same, for TV.
- Click a movie poster → detail loads → all four tabs render → cast photo opens drawer → drawer has bio and credits → clicking a credit navigates + closes drawer.
- Click a show poster → seasons tabs render → episode click fires toast.
- Add to watchlist → icon fills gold → `/watchlist` shows it → filter `Movies` → sort `Alphabetical` → remove → empty state.
- `/collections` → Editorial tab shows 3 cards. Click "أساسيات السينما العربية" → deep page hero + grid of 5 posters.
- Click a movie with a `belongs_to_collection` → Overview tab shows "جزء من …" link → clicks through to `/collections/tmdb/:id` deep page.
- RTL: sidebar on right, rails scroll from right, chevrons point left, layout correct.
- Keyboard: `/` focuses search pill (still working from Plan 1), Tab moves through interactive elements in sensible order.

- [ ] **Step 3: Update Plan 2 changelog at the bottom of this file**

Add a line: `- YYYY-MM-DD — completed all 24 tasks; see git log from tag p1-plan-1-done to p1-plan-2-done`.

- [ ] **Step 4: Tag**

```bash
cd app && git tag p1-plan-2-done && git log --oneline p1-plan-1-done..p1-plan-2-done
```

---

## Deferred to later plans

- Constellation canvas rendering on Home hero, collection cards, and `/collections/*` deep pages → **Plan 4**
- Search page (`/search`) with unified Search + Discover modes → **Plan 3**
- Settings page (`/settings`) — general, my-data (watchlist export/import UI), TMDB, about → **Plan 3**
- axe-core CI gate per route → **Plan 4**
- Lighthouse perf gate ≥ 90 → **Plan 4**
- Full E2E suite for Never-Weird acceptance (logo always links home, contrast, anchor shapes) → **Plan 4**
- TV focus model polish (focus-first on load, long-press watchlist toggle) → **Plan 4**

## Changelog

- 2026-04-23 — plan written (24 tasks, covers browse + detail + watchlist + collections non-constellation)
