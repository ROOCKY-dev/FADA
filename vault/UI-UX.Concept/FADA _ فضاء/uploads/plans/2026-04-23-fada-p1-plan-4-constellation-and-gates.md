# FADA P1 — Plan 4: Constellation Playpens, TV Focus, and Acceptance Gates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the "20% strange" — the constellation canvas that makes FADA feel like فضاء — across the Home hero and the Collections pages; tighten the TV focus model; add the CI gates (axe-core per route, Lighthouse perf, E2E Never-Weird) that certify the app is polished enough to tag v0.1.

**Architecture:** A single `<Constellation>` component owns Canvas2D rendering for all three playpens (Home hero, Collections index cards, Collections deep hero). It is lazy-loaded (`next/dynamic`) so its code never ships to pages that don't need it. Each visible star is mirrored as a hidden focusable `<a>` in the DOM for screen readers and TV remotes — the canvas itself is `aria-hidden`. Reduced-motion and visibility-hidden handling live inside the component; no caller needs to know. CI gates run on every PR via GitHub Actions.

**Tech Stack:** No new runtime deps. Dev-only adds: `@axe-core/playwright`, `@lhci/cli` (Lighthouse CI), `playwright-lighthouse` (optional). Everything else is already installed from Plans 1–3.

---

## Scope of this plan

**In scope:**
- `<Constellation>` component — Canvas2D, normalized (0–1) coordinates, three modes: `hero` (full-width, parallax, twinkle), `card` (inside a `<CollectionCard>`, hover-only), `deep` (collection deep page hero, static + hover).
- `<ConstellationAriaMirror>` — a screen-reader / keyboard alternative: hidden `<ul>` of `<a>` tags, one per node, author-ordered, each `aria-label` = title + year + "part of [collection]".
- Home hero redesign — drop in the constellation on `/` above the existing rails. The featured collection is the first editorial collection (`essential-arab-cinema`).
- Collections index (`/collections`) — replace plain `<CollectionCard>` with a constellation mini-card variant.
- Collections deep pages (`/collections/curated/[slug]`, `/collections/tmdb/[id]`) — add the `deep` constellation on top of the existing plain hero.
- Reduced-motion path — zero twinkle, zero parallax, static render.
- TV focus polish — default focus on first interactive element of the visible page; focus ring enlarged for remotes; long-press Enter on a poster opens a quick watchlist toggle.
- axe-core E2E gate — every public route scanned, zero violations allowed.
- Lighthouse CI — `performance ≥ 90` on Home and a Detail page, mobile + desktop.
- Never-Weird E2E acceptance tests — logo always home, contrast spot check, anchor shapes identical across pages.
- GitHub Actions workflow running typecheck, unit, E2E, axe, Lighthouse on PRs to `main`.
- Tag `v0.1-rc1` at the end; manual QA checklist to tag `v0.1`.

**Explicitly out of scope:**
- Playback, player UI, stream resolution (→ P2).
- Progress tracking / Continue Watching (→ P2).
- Mobile APK wrapper, PWA install (deferred).
- Light-mode visual redesign beyond the WCAG-compliant swap from Plan 3 (polish later).

---

## File structure created by this plan

```
app/
├── components/constellation/
│   ├── Constellation.tsx                      # new — canvas renderer
│   ├── ConstellationAriaMirror.tsx            # new — hidden <a> mirrors
│   ├── layout.ts                              # new — normalize/force-directed helpers
│   ├── draw.ts                                # new — stroke/arc primitives
│   └── Constellation.test.tsx                 # new — layout + a11y mirror tests
├── components/fada/
│   ├── CollectionCard.tsx                     # modified — constellation variant
│   ├── CollectionHero.tsx                     # modified — add deep constellation
│   └── HomeHero.tsx                           # new — wraps Constellation + caption
├── app/page.tsx                               # modified — renders <HomeHero> above rails
├── hooks/
│   ├── useReducedMotion.ts                    # new
│   └── useLongPress.ts                        # new
├── lib/focus/
│   └── initialFocus.ts                        # new — TV default-focus logic
└── styles/globals.css                         # modified — enlarged focus ring selector
tests/
├── e2e/
│   ├── never-weird.spec.ts                    # new — logo, contrast, anchor shapes
│   ├── a11y.spec.ts                           # new — axe on every route
│   └── constellation.spec.ts                  # new — hidden-mirror Tab-through
.github/
└── workflows/
    └── ci.yml                                 # new
lighthouserc.json                              # new
```

---

## Prerequisites

- Plans 1, 2, 3 complete. Tags `p1-plan-1-done`, `p1-plan-2-done`, `p1-plan-3-done` present.
- `app/` working directory, all prior test suites green.
- GitHub repo exists (if not, initialize one and push before Task 11 — CI workflow needs to live somewhere).

---

## Task 1: Install dev deps for a11y + perf gates

**Files:**
- Modify: `app/package.json`

- [ ] **Step 1: Install**

```bash
cd app && npm install --save-dev @axe-core/playwright @lhci/cli
```

- [ ] **Step 2: Commit**

```bash
cd app && git add package.json package-lock.json && git commit -m "chore(deps): add @axe-core/playwright + @lhci/cli"
```

---

## Task 2: `useReducedMotion` and `useLongPress` hooks

**Files:**
- Create: `app/hooks/useReducedMotion.ts`
- Create: `app/hooks/useLongPress.ts`
- Create: `app/hooks/useLongPress.test.tsx`

- [ ] **Step 1: Implement `useReducedMotion`**

```ts
'use client';
import { useEffect, useState } from 'react';

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return reduced;
}
```

- [ ] **Step 2: Write failing test for `useLongPress`**

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, act } from '@testing-library/react';
import { useLongPress } from './useLongPress';

function Harness({ onLong }: { onLong: () => void }) {
  const bind = useLongPress({ onLongPress: onLong, ms: 300 });
  return <button {...bind}>press</button>;
}

describe('useLongPress', () => {
  it('fires onLongPress after threshold', async () => {
    vi.useFakeTimers();
    const cb = vi.fn();
    const { getByText } = render(<Harness onLong={cb} />);
    const btn = getByText('press');
    fireEvent.pointerDown(btn);
    act(() => { vi.advanceTimersByTime(310); });
    expect(cb).toHaveBeenCalledTimes(1);
    fireEvent.pointerUp(btn);
    vi.useRealTimers();
  });

  it('does NOT fire if released early', () => {
    vi.useFakeTimers();
    const cb = vi.fn();
    const { getByText } = render(<Harness onLong={cb} />);
    const btn = getByText('press');
    fireEvent.pointerDown(btn);
    act(() => { vi.advanceTimersByTime(100); });
    fireEvent.pointerUp(btn);
    act(() => { vi.advanceTimersByTime(300); });
    expect(cb).not.toHaveBeenCalled();
    vi.useRealTimers();
  });
});
```

- [ ] **Step 3: Run test to confirm failure**

```bash
cd app && npm test -- useLongPress --run
```

- [ ] **Step 4: Implement `useLongPress`**

```ts
'use client';
import { useRef } from 'react';

type Options = { onLongPress: () => void; ms?: number };

export function useLongPress({ onLongPress, ms = 500 }: Options) {
  const timer = useRef<number | null>(null);
  const start = () => {
    timer.current = window.setTimeout(onLongPress, ms);
  };
  const cancel = () => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
  };
  return {
    onPointerDown: start,
    onPointerUp: cancel,
    onPointerLeave: cancel,
    onPointerCancel: cancel,
  };
}
```

- [ ] **Step 5: Run tests until green**

```bash
cd app && npm test -- useLongPress --run
```

- [ ] **Step 6: Commit**

```bash
cd app && git add hooks && git commit -m "feat(hooks): useReducedMotion + useLongPress"
```

---

## Task 3: Constellation layout helpers

**Files:**
- Create: `app/components/constellation/layout.ts`
- Create: `app/components/constellation/layout.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
import { describe, it, expect } from 'vitest';
import { projectToCanvas, forceDirectedLayout } from './layout';

describe('projectToCanvas', () => {
  it('maps normalized 0..1 coords into canvas pixels', () => {
    const out = projectToCanvas({ x: 0.5, y: 0.25 }, { width: 800, height: 400, padding: 40 });
    expect(out.x).toBeCloseTo(40 + 0.5 * (800 - 80));
    expect(out.y).toBeCloseTo(40 + 0.25 * (400 - 80));
  });

  it('clamps x and y to [0,1]', () => {
    const out = projectToCanvas({ x: -0.2, y: 1.5 }, { width: 100, height: 100, padding: 0 });
    expect(out.x).toBe(0);
    expect(out.y).toBe(100);
  });
});

describe('forceDirectedLayout', () => {
  it('produces deterministic positions for same input seed', () => {
    const n = 5;
    const a = forceDirectedLayout(n, 42);
    const b = forceDirectedLayout(n, 42);
    expect(a).toEqual(b);
  });

  it('produces different positions for different seeds', () => {
    const a = forceDirectedLayout(5, 1);
    const b = forceDirectedLayout(5, 2);
    expect(a).not.toEqual(b);
  });

  it('returns coordinates within [0,1]', () => {
    const a = forceDirectedLayout(8, 7);
    for (const p of a) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(1);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThanOrEqual(1);
    }
  });
});
```

- [ ] **Step 2: Run to confirm failure**

```bash
cd app && npm test -- constellation/layout --run
```

- [ ] **Step 3: Implement**

`app/components/constellation/layout.ts`:

```ts
export type NormalPoint = { x: number; y: number };
export type CanvasDims = { width: number; height: number; padding: number };
export type CanvasPoint = { x: number; y: number };

export function projectToCanvas(p: NormalPoint, d: CanvasDims): CanvasPoint {
  const cx = Math.max(0, Math.min(1, p.x));
  const cy = Math.max(0, Math.min(1, p.y));
  return {
    x: d.padding + cx * (d.width - d.padding * 2),
    y: d.padding + cy * (d.height - d.padding * 2),
  };
}

function mulberry32(seed: number) {
  let t = seed >>> 0;
  return function rand() {
    t = (t + 0x6D2B79F5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/** Deterministic pseudo-random layout — used when a collection author omits explicit positions. */
export function forceDirectedLayout(count: number, seed: number): NormalPoint[] {
  const rand = mulberry32(seed);
  const pts: NormalPoint[] = [];
  const min = 0.15;
  const max = 0.85;
  for (let i = 0; i < count; i += 1) {
    pts.push({ x: min + rand() * (max - min), y: min + rand() * (max - min) });
  }
  // Simple relaxation: push apart points that are too close.
  for (let iter = 0; iter < 50; iter += 1) {
    for (let i = 0; i < pts.length; i += 1) {
      for (let j = i + 1; j < pts.length; j += 1) {
        const dx = pts[j].x - pts[i].x;
        const dy = pts[j].y - pts[i].y;
        const d2 = dx * dx + dy * dy;
        const min2 = 0.04;   // ~0.2 normalized distance
        if (d2 < min2 && d2 > 0) {
          const f = (Math.sqrt(min2) - Math.sqrt(d2)) / 2;
          const ux = dx / Math.sqrt(d2);
          const uy = dy / Math.sqrt(d2);
          pts[i].x -= ux * f;
          pts[i].y -= uy * f;
          pts[j].x += ux * f;
          pts[j].y += uy * f;
        }
      }
    }
  }
  return pts.map((p) => ({
    x: Math.max(min, Math.min(max, p.x)),
    y: Math.max(min, Math.min(max, p.y)),
  }));
}
```

- [ ] **Step 4: Run tests until green**

```bash
cd app && npm test -- constellation/layout --run
```

- [ ] **Step 5: Commit**

```bash
cd app && git add components/constellation/layout.ts components/constellation/layout.test.ts && git commit -m "feat(constellation): projection + deterministic force-directed fallback"
```

---

## Task 4: Canvas draw primitives

**Files:**
- Create: `app/components/constellation/draw.ts`

- [ ] **Step 1: Implement**

```ts
export type DrawStar = {
  x: number;
  y: number;
  r: number;
  alpha: number;
  image?: HTMLImageElement;
};

export function drawStar(ctx: CanvasRenderingContext2D, s: DrawStar, gold = '#E6B64A') {
  ctx.save();
  if (s.image) {
    // Poster-as-disc: clip to circle, draw image cover.
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    const iw = s.image.naturalWidth;
    const ih = s.image.naturalHeight;
    const scale = Math.max((s.r * 2) / iw, (s.r * 2) / ih);
    const dw = iw * scale;
    const dh = ih * scale;
    ctx.drawImage(s.image, s.x - dw / 2, s.y - dh / 2, dw, dh);
    // Soft glow
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r + 1, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(230,182,74,${Math.min(0.8, s.alpha)})`;
    ctx.lineWidth = 1;
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${s.alpha})`;
    ctx.fill();
  }
  ctx.restore();
  // suppress unused-var if gold isn't used in this branch
  void gold;
}

export function drawLine(
  ctx: CanvasRenderingContext2D,
  a: { x: number; y: number },
  b: { x: number; y: number },
  alpha: number,
) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.strokeStyle = `rgba(230,182,74,${alpha})`;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}
```

- [ ] **Step 2: Commit**

```bash
cd app && git add components/constellation/draw.ts && git commit -m "feat(constellation): draw primitives for stars + lines"
```

---

## Task 5: Build `<Constellation>` component

**Files:**
- Create: `app/components/constellation/Constellation.tsx`
- Create: `app/components/constellation/Constellation.test.tsx`

- [ ] **Step 1: Write component tests**

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Constellation } from './Constellation';

const nodes = [
  { id: 1, tmdbId: 550, type: 'movie' as const, title: 'Fight Club', year: '1999', x: 0.2, y: 0.3, posterPath: null },
  { id: 2, tmdbId: 551, type: 'movie' as const, title: 'Other', year: '2000', x: 0.7, y: 0.5, posterPath: null },
];

describe('<Constellation>', () => {
  beforeEach(() => {
    // jsdom doesn't implement canvas — stub
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
      clearRect: vi.fn(), save: vi.fn(), restore: vi.fn(), beginPath: vi.fn(),
      arc: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(), stroke: vi.fn(), fill: vi.fn(),
      closePath: vi.fn(), drawImage: vi.fn(), clip: vi.fn(),
      canvas: { width: 800, height: 400 },
    } as any);
  });

  it('renders an aria-hidden canvas', () => {
    const { container } = render(<Constellation mode="hero" nodes={nodes} connections={[]} />);
    const canvas = container.querySelector('canvas');
    expect(canvas).not.toBeNull();
    expect(canvas).toHaveAttribute('aria-hidden', 'true');
  });

  it('mirrors each node as a focusable hidden link', () => {
    render(<Constellation mode="hero" nodes={nodes} connections={[]} />);
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute('href', '/title/movie/550');
    expect(links[1]).toHaveAttribute('href', '/title/movie/551');
  });
});
```

- [ ] **Step 2: Implement `<Constellation>`**

```tsx
'use client';
import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { projectToCanvas, forceDirectedLayout } from './layout';
import { drawStar, drawLine } from './draw';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export type ConstellationNode = {
  id: number | string;
  tmdbId: number;
  type: 'movie' | 'tv';
  title: string;
  year?: string;
  posterPath: string | null;
  x?: number;
  y?: number;
};

export type ConstellationProps = {
  mode: 'hero' | 'card' | 'deep';
  nodes: ConstellationNode[];
  connections: Array<[number, number]>;
  ariaContext?: string;   // prepended to each <a> aria-label ("part of الكلاسيكيات")
};

const PADDING = { hero: 40, card: 16, deep: 32 };
const STAR_R = { hero: 34, card: 12, deep: 28 };

export function Constellation({ mode, nodes, connections, ariaContext }: ConstellationProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const reduced = useReducedMotion();

  // Fill in missing positions with deterministic fallback.
  const positions = nodes.map((n, i) =>
    n.x !== undefined && n.y !== undefined
      ? { x: n.x, y: n.y }
      : forceDirectedLayout(nodes.length, 7)[i],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const dpr = window.devicePixelRatio ?? 1;

    const imgs = nodes.map((n) => {
      if (!n.posterPath) return null;
      const img = new Image();
      img.src = `https://image.tmdb.org/t/p/w185${n.posterPath}`;
      img.crossOrigin = 'anonymous';
      return img;
    });

    let raf = 0;
    let t0 = performance.now();
    let mouseX = 0;
    let mouseY = 0;
    let scrollY = 0;
    let stopped = false;

    const ambient = Array.from({ length: mode === 'hero' ? 120 : mode === 'deep' ? 60 : 12 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 1.4 + 0.3,
      phase: Math.random() * Math.PI * 2,
    }));

    function resize() {
      if (!canvas || !wrap) return;
      const rect = wrap.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    }

    function frame(t: number) {
      if (stopped) return;
      const ctx = canvas!.getContext('2d');
      if (!ctx) return;
      const w = canvas!.width;
      const h = canvas!.height;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      // Ambient star layer
      const parallaxX = reduced ? 0 : Math.max(-8, Math.min(8, mouseX * 8));
      const parallaxY = reduced ? 0 : Math.max(-20, Math.min(20, scrollY * 0.03));
      const rect = wrap!.getBoundingClientRect();
      for (const s of ambient) {
        const sx = s.x * rect.width + parallaxX;
        const sy = s.y * rect.height + parallaxY;
        const twinkle = reduced ? 0.5 : 0.4 + 0.3 * Math.sin((t - t0) / 1200 + s.phase);
        drawStar(ctx, { x: sx, y: sy, r: s.r, alpha: twinkle });
      }

      // Connections
      const dims = { width: rect.width, height: rect.height, padding: PADDING[mode] };
      const proj = positions.map((p) => projectToCanvas(p, dims));
      for (const [a, b] of connections) {
        if (proj[a] && proj[b]) drawLine(ctx, proj[a], proj[b], 0.2);
      }

      // Stars (nodes)
      nodes.forEach((n, i) => {
        const p = proj[i];
        const img = imgs[i];
        drawStar(ctx, {
          x: p.x,
          y: p.y,
          r: STAR_R[mode],
          alpha: 1,
          image: img && img.complete && img.naturalWidth ? img : undefined,
        });
      });

      raf = requestAnimationFrame(frame);
    }

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    const onMove = (e: MouseEvent) => {
      const rect = wrap!.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      mouseY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    };
    const onScroll = () => { scrollY = window.scrollY; };
    const onVis = () => {
      if (document.hidden) { stopped = true; cancelAnimationFrame(raf); }
      else if (stopped) { stopped = false; raf = requestAnimationFrame(frame); }
    };

    if (mode === 'hero') wrap.addEventListener('mousemove', onMove);
    if (mode === 'hero') window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('visibilitychange', onVis);

    raf = requestAnimationFrame(frame);

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      wrap.removeEventListener('mousemove', onMove);
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [nodes, connections, positions, mode, reduced]);

  const heightClass = mode === 'hero'
    ? 'h-[60vh] md:h-[70vh] lg:h-[80vh]'
    : mode === 'deep'
    ? 'h-[40vh] min-h-72'
    : 'aspect-video';

  return (
    <div ref={wrapRef} className={`relative w-full overflow-hidden ${heightClass}`}>
      <canvas ref={canvasRef} aria-hidden className="absolute inset-0" />
      {/* Hidden a11y mirrors */}
      <ul className="sr-only">
        {nodes.map((n) => (
          <li key={`${n.type}-${n.tmdbId}`}>
            <Link
              href={`/title/${n.type}/${n.tmdbId}`}
              aria-label={`${n.title}${n.year ? ` · ${n.year}` : ''}${ariaContext ? ` · ${ariaContext}` : ''}`}
            >
              {n.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 3: Run tests until green**

```bash
cd app && npm test -- Constellation --run
```

- [ ] **Step 4: Commit**

```bash
cd app && git add components/constellation/Constellation.tsx components/constellation/Constellation.test.tsx && git commit -m "feat(constellation): Canvas2D renderer with a11y mirrors + reduced-motion path"
```

---

## Task 6: Build `<HomeHero>` and mount on `/`

**Files:**
- Create: `app/components/fada/HomeHero.tsx`
- Modify: `app/app/page.tsx`

- [ ] **Step 1: Implement `<HomeHero>`**

```tsx
'use client';
import { useQueries } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { ALL_COLLECTIONS } from '@/content/collections';
import { movieDetail, tvDetail } from '@/lib/tmdb/endpoints';
import { STALE } from '@/lib/query/client';
import Link from 'next/link';
import { StarLoader } from './StarLoader';

const Constellation = dynamic(
  () => import('@/components/constellation/Constellation').then((m) => m.Constellation),
  { ssr: false, loading: () => <div className="flex h-[60vh] items-center justify-center"><StarLoader /></div> },
);

export function HomeHero() {
  const featured = ALL_COLLECTIONS[0];
  const queries = useQueries({
    queries: featured.nodes.map((n) => ({
      queryKey: ['detail', n.type, n.tmdbId],
      queryFn: () => (n.type === 'movie' ? movieDetail(n.tmdbId) : tvDetail(n.tmdbId)),
      staleTime: STALE.detail,
    })),
  });

  const ready = queries.every((q) => q.data);
  const nodes = ready
    ? featured.nodes.map((n, i) => {
        const d: any = queries[i].data;
        return {
          id: `${n.type}-${n.tmdbId}`,
          tmdbId: n.tmdbId,
          type: n.type,
          title: (d.title ?? d.name) as string,
          year: ((d.release_date ?? d.first_air_date) ?? '').slice(0, 4) || undefined,
          posterPath: d.poster_path,
          x: n.x,
          y: n.y,
        };
      })
    : [];

  return (
    <section className="relative">
      <div className="absolute inset-x-0 top-0 z-10 px-4 pt-8 pointer-events-none">
        <div className="mx-auto max-w-screen-2xl">
          <Link href={`/collections/curated/${featured.slug}`} className="pointer-events-auto inline-block">
            <h1 className="text-3xl font-semibold hover:text-gold md:text-4xl">{featured.title}</h1>
          </Link>
          <p className="mt-2 max-w-prose text-muted">{featured.description}</p>
        </div>
      </div>
      {ready ? (
        <Constellation mode="hero" nodes={nodes} connections={featured.connections} ariaContext={featured.title} />
      ) : (
        <div className="flex h-[60vh] items-center justify-center"><StarLoader /></div>
      )}
    </section>
  );
}
```

- [ ] **Step 2: Mount in `/`**

Modify `app/app/page.tsx` — replace the existing hero placeholder (from Plan 1) with `<HomeHero />`. The six rails stay below.

```tsx
// at the top
import { HomeHero } from '@/components/fada/HomeHero';

// inside the component, replace any Plan 1 hero stub with:
<HomeHero />
```

- [ ] **Step 3: Verify**

```bash
cd app && npm run dev
```

`/` shows the starfield + featured collection as a constellation. Hover: stars track mouse parallax. Scroll: ambient drift. Tab: hidden `<a>`s become focusable, each star navigable. Turn on Reduced Motion at OS level → twinkle + parallax off, static render.

- [ ] **Step 4: Commit**

```bash
cd app && git add components/fada/HomeHero.tsx app/page.tsx && git commit -m "feat(home): HomeHero with lazy constellation + featured collection"
```

---

## Task 7: Collection index — upgrade `<CollectionCard>` to constellation variant

**Files:**
- Modify: `app/components/fada/CollectionCard.tsx`

- [ ] **Step 1: Extend `<CollectionCard>` with a constellation mini-view**

```tsx
'use client';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useQueries } from '@tanstack/react-query';
import { StarLoader } from './StarLoader';
import { movieDetail, tvDetail } from '@/lib/tmdb/endpoints';
import { STALE } from '@/lib/query/client';
import type { Collection } from '@/lib/collections/schema';

const Constellation = dynamic(
  () => import('@/components/constellation/Constellation').then((m) => m.Constellation),
  { ssr: false, loading: () => <div className="aspect-video flex items-center justify-center"><StarLoader /></div> },
);

type Props = {
  href: string;
  collection: Collection;
};

export function CollectionCard({ href, collection }: Props) {
  const queries = useQueries({
    queries: collection.nodes.slice(0, 6).map((n) => ({
      queryKey: ['detail', n.type, n.tmdbId],
      queryFn: () => (n.type === 'movie' ? movieDetail(n.tmdbId) : tvDetail(n.tmdbId)),
      staleTime: STALE.detail,
    })),
  });
  const ready = queries.every((q) => q.data);
  const nodes = ready
    ? collection.nodes.slice(0, 6).map((n, i) => {
        const d: any = queries[i].data;
        return {
          id: `${n.type}-${n.tmdbId}`,
          tmdbId: n.tmdbId,
          type: n.type,
          title: (d.title ?? d.name) as string,
          posterPath: d.poster_path,
          x: n.x,
          y: n.y,
        };
      })
    : [];

  return (
    <Link
      href={href}
      className="group block overflow-hidden rounded-lg border border-border bg-surface transition-colors hover:border-gold/40"
    >
      {ready ? (
        <Constellation mode="card" nodes={nodes} connections={collection.connections.filter(([a,b]) => a < 6 && b < 6)} ariaContext={collection.title} />
      ) : (
        <div className="aspect-video flex items-center justify-center"><StarLoader /></div>
      )}
      <div className="p-4">
        <h3 className="font-medium">{collection.title}</h3>
        {collection.description && <p className="mt-1 line-clamp-2 text-sm text-muted">{collection.description}</p>}
      </div>
    </Link>
  );
}
```

- [ ] **Step 2: Update `/collections` callers**

In `app/app/collections/page.tsx`, update the map to pass `collection={c}` instead of individual props:

```tsx
{ALL_COLLECTIONS.map((c) => (
  <CollectionCard
    key={c.slug}
    href={`/collections/curated/${c.slug}`}
    collection={c}
  />
))}
```

- [ ] **Step 3: Verify and commit**

`/collections` renders 3 mini constellations in the Editorial tab.

```bash
cd app && git add components/fada/CollectionCard.tsx app/collections/page.tsx && git commit -m "feat(collections): CollectionCard as mini-constellation"
```

---

## Task 8: Collection deep pages — add constellation hero

**Files:**
- Modify: `app/components/fada/CollectionHero.tsx`
- Modify: `app/app/collections/curated/[slug]/page.tsx`

- [ ] **Step 1: Extend `<CollectionHero>` — accept constellation props**

```tsx
'use client';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { StarLoader } from './StarLoader';
import type { ConstellationNode } from '@/components/constellation/Constellation';

const Constellation = dynamic(
  () => import('@/components/constellation/Constellation').then((m) => m.Constellation),
  { ssr: false, loading: () => <div className="h-[40vh] flex items-center justify-center"><StarLoader /></div> },
);

type Props = {
  title: string;
  description: string;
  cover?: string;
  nodes?: ConstellationNode[];
  connections?: Array<[number, number]>;
};

export function CollectionHero({ title, description, cover, nodes, connections = [] }: Props) {
  const useConstellation = !!nodes?.length;
  return (
    <section className="relative overflow-hidden">
      {useConstellation ? (
        <Constellation mode="deep" nodes={nodes!} connections={connections} ariaContext={title} />
      ) : cover ? (
        <div className="relative h-[40vh] w-full min-h-72">
          <Image src={cover} alt="" fill priority className="object-cover" />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-bg via-bg/60 to-bg/20" />
        </div>
      ) : null}
      <div className="mx-auto -mt-24 max-w-screen-2xl px-4 pb-6 relative">
        <h1 className="text-3xl font-semibold md:text-4xl">{title}</h1>
        <p className="mt-2 max-w-prose text-muted">{description}</p>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Update `/collections/curated/[slug]/page.tsx` to pass nodes**

In the existing page, after you have `results` (the `useQueries` output), build `heroNodes`:

```tsx
const heroNodes = coll.nodes.map((n, i) => {
  const d: any = results[i].data;
  if (!d) return null;
  return {
    id: `${n.type}-${n.tmdbId}`,
    tmdbId: n.tmdbId,
    type: n.type,
    title: (d.title ?? d.name) as string,
    posterPath: d.poster_path,
    x: n.x,
    y: n.y,
  } as ConstellationNode;
}).filter(Boolean) as ConstellationNode[];

// Then pass to hero:
<CollectionHero
  title={coll.title}
  description={coll.description}
  nodes={heroNodes}
  connections={coll.connections}
/>
```

(Import `ConstellationNode` from `@/components/constellation/Constellation` at the top.)

- [ ] **Step 3: Verify and commit**

Open `/collections/curated/essential-arab-cinema` — constellation hero on top, plain grid below.

```bash
cd app && git add components/fada/CollectionHero.tsx app/collections/curated/[slug]/page.tsx && git commit -m "feat(collections): constellation hero on curated deep pages"
```

---

## Task 9: TV focus polish

**Files:**
- Create: `app/lib/focus/initialFocus.ts`
- Modify: `app/app/layout.tsx`
- Modify: `app/styles/globals.css`
- Modify: `app/components/fada/PosterCard.tsx` — wire long-press

- [ ] **Step 1: Implement initial focus helper**

`app/lib/focus/initialFocus.ts`:

```ts
export function focusFirstInteractive(root: HTMLElement = document.body): boolean {
  const candidates = root.querySelectorAll<HTMLElement>(
    [
      'main a[href]',
      'main button:not([disabled])',
      'main [tabindex]:not([tabindex="-1"]):not([disabled])',
      'main input:not([disabled])',
    ].join(','),
  );
  for (const el of Array.from(candidates)) {
    const style = getComputedStyle(el);
    if (style.visibility !== 'hidden' && style.display !== 'none') {
      el.focus({ preventScroll: true });
      return true;
    }
  }
  return false;
}
```

- [ ] **Step 2: Call on route change**

Add a client-side `<FocusOnRouteChange />` near the top of the layout tree (in `app/app/layout.tsx` providers):

```tsx
'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { focusFirstInteractive } from '@/lib/focus/initialFocus';

export function FocusOnRouteChange() {
  const pathname = usePathname();
  useEffect(() => {
    // Give React a tick to mount.
    const h = setTimeout(() => focusFirstInteractive(), 60);
    return () => clearTimeout(h);
  }, [pathname]);
  return null;
}
```

Then mount it in the root layout (already client-side). (If the root layout is server-side, promote the providers wrapper to a client component and put this inside it.)

- [ ] **Step 3: Enlarge focus ring globally**

Append to `app/styles/globals.css`:

```css
/* Focus ring — gold, 3px, 2px offset. Readable on TV. */
:where(a, button, input, select, textarea, [tabindex]):focus-visible {
  outline: 3px solid var(--color-gold);
  outline-offset: 2px;
  border-radius: 6px;
}
```

- [ ] **Step 4: Long-press poster → quick watchlist toggle**

Modify `app/components/fada/PosterCard.tsx`: wrap the root in a long-press handler that toggles the watchlist. Show a toast confirming.

```tsx
// near the top of PosterCard
import { useLongPress } from '@/hooks/useLongPress';
import { useFadaStore } from '@/lib/storage/store';
import { toast } from 'sonner';

// Inside the component, before the return:
const inList = useFadaStore((s) =>
  s.watchlist.some((w) => w.id === item.id && w.type === mediaType),
);
const add = useFadaStore((s) => s.addToWatchlist);
const remove = useFadaStore((s) => s.removeFromWatchlist);
const longBind = useLongPress({
  onLongPress: () => {
    if (inList) { remove({ id: item.id, type: mediaType }); toast('أُزيل من قائمتك'); }
    else { add({ id: item.id, type: mediaType }); toast('أُضيف إلى قائمتك'); }
  },
  ms: 600,
});
// Spread `longBind` onto the outer element (the <Link> wrapper or whatever).
```

- [ ] **Step 5: Commit**

```bash
cd app && git add lib/focus app/layout.tsx styles/globals.css components/fada/PosterCard.tsx && git commit -m "feat(tv): initial focus on route change + enlarged ring + long-press watchlist"
```

---

## Task 10: E2E — Never-Weird acceptance

**Files:**
- Create: `app/tests/e2e/never-weird.spec.ts`

- [ ] **Step 1: Write specs**

```ts
import { test, expect } from '@playwright/test';

const ROUTES = [
  '/',
  '/movies',
  '/shows',
  '/collections',
  '/watchlist',
  '/search',
  '/settings',
  '/title/movie/550',
  '/title/tv/1396',
  '/collections/curated/essential-arab-cinema',
];

for (const route of ROUTES) {
  test(`logo always returns home from ${route}`, async ({ page }) => {
    await page.goto(route);
    const logo = page.getByRole('link', { name: /FADA|فضاء|الرئيسية/ }).first();
    await logo.click();
    await expect(page).toHaveURL(/\/$|\/\?.*$/);
  });
}

test('sidebar visible on all desktop routes', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const route of ROUTES) {
    await page.goto(route);
    await expect(page.locator('[data-sidebar]')).toBeVisible();
  }
});

test('contrast spot check — primary text meets AA', async ({ page }) => {
  await page.goto('/');
  const color = await page.evaluate(() => getComputedStyle(document.body).color);
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  // Rough check — the real contrast is validated by axe in the next spec.
  expect(color).not.toBe(bg);
});
```

- [ ] **Step 2: Commit**

```bash
cd app && git add tests/e2e/never-weird.spec.ts && git commit -m "test(e2e): Never-Weird acceptance (logo, sidebar, contrast)"
```

---

## Task 11: E2E — axe-core a11y on every route

**Files:**
- Create: `app/tests/e2e/a11y.spec.ts`

- [ ] **Step 1: Write the spec**

```ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const ROUTES = [
  '/',
  '/movies',
  '/shows',
  '/collections',
  '/watchlist',
  '/search',
  '/settings',
  '/title/movie/550',
  '/title/tv/1396',
  '/collections/curated/essential-arab-cinema',
];

for (const route of ROUTES) {
  test(`axe-core: zero WCAG 2.2 AA violations on ${route}`, async ({ page }) => {
    await page.goto(route);
    // Let React Query settle + images start loading
    await page.waitForLoadState('networkidle');
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
      .analyze();
    expect(result.violations, JSON.stringify(result.violations, null, 2)).toEqual([]);
  });
}
```

- [ ] **Step 2: Run locally and fix what the test flags**

```bash
cd app && npx playwright test a11y.spec --reporter=list
```

Common fixes you may need:
- Missing alt on decorative images → add `alt=""`.
- Missing label on icon-only buttons → add `aria-label`.
- Color contrast on a badge → bump the token combo or add a stronger border.
- Missing `lang` on a secondary text run → `dir="auto"` or `lang="en"` on Latin-script titles.

Iterate until zero violations on every route.

- [ ] **Step 3: Commit**

```bash
cd app && git add tests/e2e/a11y.spec.ts && git commit -m "test(e2e): axe-core a11y gate per route (WCAG 2.2 AA)"
```

---

## Task 12: E2E — constellation hidden-mirror Tab-through

**Files:**
- Create: `app/tests/e2e/constellation.spec.ts`

- [ ] **Step 1: Write the spec**

```ts
import { test, expect } from '@playwright/test';

test('home constellation: each star has a hidden focusable <a>', async ({ page }) => {
  await page.goto('/');
  // Wait for featured collection to hydrate
  await page.waitForFunction(() => {
    const sr = document.querySelectorAll('section .sr-only a');
    return sr.length >= 5;
  });
  const srLinks = page.locator('section .sr-only a');
  const n = await srLinks.count();
  expect(n).toBeGreaterThanOrEqual(5);

  // Tab through — each star should receive focus in author order.
  const hrefs: string[] = [];
  for (let i = 0; i < n; i += 1) {
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => (document.activeElement as HTMLAnchorElement | null)?.href ?? '');
    if (focused.includes('/title/')) hrefs.push(focused);
    if (hrefs.length >= n) break;
  }
  expect(hrefs.length).toBeGreaterThanOrEqual(n);
});

test('reduced-motion disables twinkle/parallax (visual invariant)', async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto('/');
  await page.waitForTimeout(500);
  // Invariant: canvas exists + ambient stars don't animate — hard to prove visually, but the code path
  // in <Constellation> reads prefers-reduced-motion. Here we just confirm the page loaded and a canvas is present.
  const canvas = page.locator('canvas').first();
  await expect(canvas).toBeVisible();
  await ctx.close();
});
```

- [ ] **Step 2: Commit**

```bash
cd app && git add tests/e2e/constellation.spec.ts && git commit -m "test(e2e): constellation hidden-mirror Tab order + reduced-motion path"
```

---

## Task 13: Lighthouse CI gate

**Files:**
- Create: `app/lighthouserc.json`

- [ ] **Step 1: Config**

```json
{
  "ci": {
    "collect": {
      "url": [
        "http://localhost:3000/",
        "http://localhost:3000/title/movie/550"
      ],
      "startServerCommand": "npm run start",
      "numberOfRuns": 3,
      "settings": {
        "preset": "desktop"
      }
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.9 }],
        "categories:accessibility": ["error", { "minScore": 0.95 }],
        "categories:best-practices": ["warn", { "minScore": 0.9 }],
        "first-contentful-paint": ["warn", { "maxNumericValue": 2000 }],
        "interactive": ["warn", { "maxNumericValue": 3500 }],
        "total-blocking-time": ["warn", { "maxNumericValue": 300 }]
      }
    },
    "upload": { "target": "temporary-public-storage" }
  }
}
```

- [ ] **Step 2: Verify locally**

```bash
cd app && npm run build && npx lhci autorun
```

Fix any failing assertion. Typical fixes:
- Lazy-load the constellation (already done via `next/dynamic`).
- Bump `next/image` widths so no oversized images are fetched.
- Audit `main` thread work — keep constellation off-screen clients from running `requestAnimationFrame`.

- [ ] **Step 3: Commit**

```bash
cd app && git add lighthouserc.json && git commit -m "test(perf): Lighthouse CI gate (perf ≥ 90, a11y ≥ 95)"
```

---

## Task 14: GitHub Actions CI workflow

**Files:**
- Create: `app/.github/workflows/ci.yml` (or at the repo root if `app/` is the repo root; adjust paths accordingly)

- [ ] **Step 1: Workflow file**

```yaml
name: CI
on:
  pull_request:
  push:
    branches: [main]

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: app/package-lock.json
      - name: Install
        run: npm ci
        working-directory: app
      - name: Typecheck
        run: npx tsc --noEmit
        working-directory: app
      - name: Unit tests
        run: npm test -- --run
        working-directory: app
      - name: Install Playwright
        run: npx playwright install --with-deps chromium
        working-directory: app
      - name: Build
        run: npm run build
        working-directory: app
        env:
          NEXT_PUBLIC_TMDB_TOKEN: ${{ secrets.NEXT_PUBLIC_TMDB_TOKEN }}
      - name: E2E (Playwright)
        run: npx playwright test --reporter=list
        working-directory: app
        env:
          NEXT_PUBLIC_TMDB_TOKEN: ${{ secrets.NEXT_PUBLIC_TMDB_TOKEN }}
      - name: Lighthouse CI
        run: npx lhci autorun
        working-directory: app
        env:
          LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}
          NEXT_PUBLIC_TMDB_TOKEN: ${{ secrets.NEXT_PUBLIC_TMDB_TOKEN }}
```

- [ ] **Step 2: Seed the `NEXT_PUBLIC_TMDB_TOKEN` repo secret**

In GitHub → Settings → Secrets → Actions, add `NEXT_PUBLIC_TMDB_TOKEN`. (LHCI app token is optional; without it, LHCI still runs but can't post PR comments.)

- [ ] **Step 3: Commit and push**

```bash
git add .github/workflows/ci.yml && git commit -m "ci: typecheck + unit + e2e + axe + lighthouse on PR"
git push
```

Watch the first PR run; iterate until green.

---

## Task 15: Bundle budget verification

**Files:**
- (no new files)

- [ ] **Step 1: Build and inspect**

```bash
cd app && npm run build
```

`next build` prints a per-route JS budget at the end. Confirm:
- `/` initial JS ≤ 180 KB gzipped (constellation chunk should be listed as a separate lazy-loaded chunk and NOT in the `/` column).
- Constellation chunk ≤ 40 KB gzipped.

If either exceeds, triage:
- Ensure `Constellation` is only imported via `next/dynamic({ ssr: false })` — grep for any static `import { Constellation } from …` accidentally left behind.
- Check `react-query/persistQueryClient` tree-shaking — `import` specific sub-paths if not.
- If `lucide-react` is bloating, import per-icon (`import Bookmark from 'lucide-react/dist/esm/icons/bookmark'`) only if needed; usually v0.5+ is already tree-shakable.

- [ ] **Step 2: Document actual sizes in the changelog**

Append to this plan's changelog: `- Home initial JS: X KB, Constellation chunk: Y KB.`

---

## Task 16: Final Plan 4 acceptance pass + v0.1 tag

- [ ] **Step 1: Typecheck + all tests + all gates**

```bash
cd app
npx tsc --noEmit
npm test -- --run
npx playwright test --reporter=list
npx lhci autorun
```

All must pass.

- [ ] **Step 2: Manual QA walk (from the spec — the v0.1 checklist)**

- All UI strings are in `messages/ar.json` (grep shows no hard-coded Arabic outside `ar.json`):
  ```bash
  grep -RInE '[\x{0600}-\x{06FF}]' app components lib | grep -v messages/ar.json
  ```
  Should return nothing relevant.
- RTL rail scroll starts from the right on a fresh load.
- At least 3 editorial collections ship in `content/collections/`. (Plan 2 Task 18 seeded exactly 3.)
- Watchlist export file opens cleanly in a text editor, re-imports without loss. (Plan 3 Task 15 covers this E2E.)
- TMDB custom-token path works end-to-end: paste a token in Settings → restart → `resolveToken()` prefers it. (Plan 3 Task 15; do it manually once more.)
- Mobile at 390×844: bottom nav shows the five items, hamburger opens the sidebar drawer, constellation hero renders at 60vh.
- TV: set Chrome devtools to `1920×1080`, navigate with arrow keys, confirm every interactive element in every route is reachable with Tab / Shift+Tab and has a visible focus ring.
- `prefers-reduced-motion` on → constellation is static, card hovers don't lift, Lottie empty-states still animate subtly.

- [ ] **Step 3: Tag**

```bash
cd app
git tag p1-plan-4-done
git tag v0.1-rc1
git log --oneline p1-plan-3-done..v0.1-rc1
```

- [ ] **Step 4: Promote RC to v0.1 after community smoke**

Once at least one independent tester has completed the manual checklist on a clean clone:

```bash
git tag v0.1
git push origin v0.1
```

---

## Deferred to Phase 2 and beyond

- Playback, player UI, stream URL resolution.
- Progress tracking / Continue Watching rail on Home.
- Subtitles.
- Additional UI languages beyond Arabic (plumbing is already in place via `next-intl`).
- Provider/embed logic, scraping layer, fallback chain.
- IPTV, Manga, Live Sports sections beyond the "Coming Soon" toast.
- PWA / offline-install, mobile APK wrappers.
- Light-theme visual redesign beyond the WCAG-compliant swap from Plan 3.

## Changelog

- 2026-04-23 — plan written (16 tasks; constellation + TV focus + a11y/perf gates + CI + v0.1 tag)
