---
tags:
  - plan
  - p1
date: 2026-04-23
status: ready
phase: P1 (v0.1) — Plan 1 of 4
related:
  - "[[../specs/2026-04-23-fada-p1-ui-ux-design]]"
---

# FADA P1 — Plan 1: Foundation & Home Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a runnable Next.js 15 static-export web app with an RTL Arabic shell, design-token system, right-anchored sidebar, floating search pill, TMDB client, React Query, Zustand/localStorage user-data store, and a working Home page with six TMDB-powered rails. The hero constellation and the other top-level pages are deferred to later plans in this series.

**Architecture:** Next.js 15 App Router with static export. TMDB queries run client-side via React Query using a shipped public v4 read-access token (user override in Settings later). User data lives in Zustand with Zod-validated localStorage persistence. Design tokens are authored in JSON, compiled to CSS variables and Tailwind theme. CSS uses logical properties throughout so direction stays agnostic. All UI copy ships in `messages/ar.json` via next-intl (plumbing ready for later languages).

**Tech Stack:** Next.js 15, TypeScript strict, Tailwind CSS v4, shadcn/ui (Radix), @tanstack/react-query + persistQueryClient, Zustand, next-intl, Motion One, lottie-web, Lucide React, Zod, Vitest + @testing-library/react, Playwright.

**Spec reference:** `vault/specs/2026-04-23-fada-p1-ui-ux-design.md`

---

## Scope of this plan

**In:**

- Repository scaffolding: `package.json`, Next.js 15, TS strict, ESLint, Prettier (+ Tailwind plugin).
- Tailwind CSS v4 configured from `tokens/design-tokens.json` via a generator.
- Self-hosted IBM Plex Sans Arabic + IBM Plex Mono via `next/font`.
- RTL root layout (`dir="rtl"`, `lang="ar"`).
- next-intl with a single `messages/ar.json`.
- Zod-validated storage layer + Zustand store (watchlist, preferences, recentSearches, tmdb token) with version 1 migration plumbing.
- TMDB client: typed endpoints, token selection (custom > shipped), exponential backoff on 429, Zod-validated responses.
- React Query provider + `persistQueryClient` to `localStorage["fada.rq.v1"]` with stale times per endpoint.
- shadcn/ui primitives: Button, Input, Select, Dialog, Sheet, Tabs, Toast, Tooltip, DropdownMenu, ScrollArea, Separator, Skeleton, Switch, Slider, Popover.
- Custom components: `<PosterCard>`, `<Rail>`, `<Sidebar>` (with right-anchor + mobile drawer), `<FloatingSearchPill>`, `<StarLoader>`, `<StarEmptyState>`, `<BottomNav>`.
- Home page `/` with six rails: Trending Globally, Popular Arabic Movies, Trending Anime, Popular Turkish Dramas, Popular Korean Dramas (hero deferred).
- Empty but styled shells for `/movies`, `/shows`, `/collections`, `/watchlist`, `/search`, `/settings`.
- Static export configuration (`output: 'export'`).
- Vitest + @testing-library/react unit + component tests.
- Playwright smoke tests.

**Out (later plans):**

- Hero constellation canvas and collection constellation cards → Plan 4.
- Movies/Shows browse with filters, Detail pages, Watchlist grid, Collections pages → Plan 2.
- Search + Discover → Plan 3.
- Full Settings UI → Plan 3.
- TV/remote navigation polish, axe/Lighthouse CI gates, full E2E suite → Plan 4.

**Working directory:** All file paths below are relative to the project root (the directory containing `package.json`). The plan creates that root at `/home/ahmed/Projects/Fada | فضاء/app/` — the Next.js project will live alongside the existing `vault/` directory.

---

## File structure created by this plan

```
app/                                 # Next.js project root (sibling of vault/)
├── .env.example                     # NEXT_PUBLIC_TMDB_TOKEN documented
├── .eslintrc.cjs
├── .gitignore
├── .prettierrc
├── README.md
├── next.config.mjs                  # static export, image loader, i18n none (next-intl handles it)
├── package.json
├── playwright.config.ts
├── postcss.config.mjs
├── tsconfig.json
├── vitest.config.ts
├── app/
│   ├── layout.tsx                   # RTL, fonts, providers
│   ├── page.tsx                     # Home
│   ├── movies/page.tsx              # shell
│   ├── shows/page.tsx               # shell
│   ├── collections/page.tsx         # shell
│   ├── watchlist/page.tsx           # shell
│   ├── search/page.tsx              # shell
│   └── settings/page.tsx            # shell
├── components/
│   ├── ui/                          # shadcn primitives (vanilla)
│   ├── fada/
│   │   ├── PosterCard.tsx
│   │   ├── Rail.tsx
│   │   ├── Sidebar.tsx
│   │   ├── BottomNav.tsx
│   │   ├── FloatingSearchPill.tsx
│   │   ├── StarLoader.tsx
│   │   └── StarEmptyState.tsx
│   └── providers/
│       ├── QueryProvider.tsx
│       └── IntlProvider.tsx
├── lib/
│   ├── tmdb/
│   │   ├── client.ts
│   │   ├── endpoints.ts
│   │   ├── schemas.ts               # Zod schemas for TMDB responses
│   │   └── types.ts
│   ├── storage/
│   │   ├── schema.ts                # Zod for fada.v1 root
│   │   ├── store.ts                 # Zustand + persist
│   │   └── migrate.ts
│   ├── query/
│   │   └── client.ts                # React Query + persistence
│   └── utils/
│       ├── cn.ts                    # class merge
│       └── keyboard.ts              # shortcut helpers
├── messages/
│   └── ar.json
├── public/
│   ├── fonts/
│   │   ├── IBMPlexSansArabic-Regular.woff2
│   │   ├── IBMPlexSansArabic-Medium.woff2
│   │   ├── IBMPlexSansArabic-SemiBold.woff2
│   │   ├── IBMPlexSansArabic-Bold.woff2
│   │   └── IBMPlexMono-Regular.woff2
│   ├── lottie/
│   │   └── star-pulse.json          # placeholder; motion designer replaces later
│   └── logo/
│       └── fa.svg                   # simple 3-star constellation
├── styles/
│   └── globals.css                  # tokens → CSS variables, Tailwind directives
├── tokens/
│   ├── design-tokens.json           # single source of truth
│   └── generate.mjs                 # node script: JSON → CSS + TW extend
└── tests/
    ├── unit/
    │   ├── storage.test.ts
    │   ├── tmdb-client.test.ts
    │   └── rail-keyboard.test.ts
    ├── component/
    │   ├── PosterCard.test.tsx
    │   ├── FloatingSearchPill.test.tsx
    │   └── Rail.test.tsx
    └── e2e/
        └── smoke.spec.ts
```

---

## Prerequisites

Node.js ≥ 20, npm ≥ 10. Run all commands from `/home/ahmed/Projects/Fada | فضاء/app/` unless stated otherwise.

---

## Task 1: Initialize Next.js 15 project

**Files:**
- Create: `app/package.json`, `app/tsconfig.json`, `app/next.config.mjs`, `app/.gitignore`, `app/README.md`

- [ ] **Step 1: Create the project folder and initialize**

```bash
cd "/home/ahmed/Projects/Fada | فضاء"
mkdir -p app && cd app
npm init -y
```

- [ ] **Step 2: Install Next.js 15, React 19, TypeScript**

```bash
npm install next@15 react@19 react-dom@19
npm install -D typescript@5 @types/node @types/react @types/react-dom
```

- [ ] **Step 3: Write tsconfig.json**

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./*"],
      "@/components/*": ["./components/*"],
      "@/lib/*": ["./lib/*"],
      "@/messages/*": ["./messages/*"],
      "@/tokens/*": ["./tokens/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 4: Write next.config.mjs**

Create `next.config.mjs`:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'image.tmdb.org' }
    ]
  },
  reactStrictMode: true,
  trailingSlash: true
};
export default nextConfig;
```

- [ ] **Step 5: Write .gitignore**

Create `.gitignore`:

```
node_modules/
.next/
out/
dist/
.env
.env.local
*.log
.DS_Store
coverage/
playwright-report/
test-results/
```

- [ ] **Step 6: Update package.json scripts**

Edit `package.json` so the `scripts` field reads:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint .",
  "typecheck": "tsc --noEmit",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:e2e": "playwright test",
  "tokens": "node tokens/generate.mjs"
}
```

- [ ] **Step 7: Write README stub**

Create `README.md`:

```markdown
# FADA | فضاء

Arabic-first, ad-free, open-source streaming middleman. P1: UI/UX foundation.

See `vault/specs/2026-04-23-fada-p1-ui-ux-design.md` for the full design spec.

## Dev

```bash
npm install
npm run dev
```

## Build (static export)

```bash
npm run build
```

Output in `out/`.
```

- [ ] **Step 8: Commit**

```bash
cd "/home/ahmed/Projects/Fada | فضاء"
git init  # if not already a repo
git add app/package.json app/package-lock.json app/tsconfig.json app/next.config.mjs app/.gitignore app/README.md
git commit -m "feat: initialize Next.js 15 project with TS strict and static export"
```

---

## Task 2: Install remaining runtime + dev dependencies

**Files:** `app/package.json` updated by npm.

- [ ] **Step 1: Install runtime deps**

```bash
cd "/home/ahmed/Projects/Fada | فضاء/app"
npm install @tanstack/react-query @tanstack/query-sync-storage-persister @tanstack/react-query-persist-client \
  zustand zod next-intl lucide-react motion lottie-web \
  class-variance-authority clsx tailwind-merge
```

- [ ] **Step 2: Install shadcn/Radix deps**

```bash
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-popover \
  @radix-ui/react-scroll-area @radix-ui/react-select @radix-ui/react-separator \
  @radix-ui/react-slider @radix-ui/react-slot @radix-ui/react-switch \
  @radix-ui/react-tabs @radix-ui/react-toast @radix-ui/react-tooltip
```

- [ ] **Step 3: Install Tailwind v4 + PostCSS**

```bash
npm install -D tailwindcss@4 @tailwindcss/postcss postcss autoprefixer
```

- [ ] **Step 4: Install test tooling**

```bash
npm install -D vitest @vitest/ui jsdom \
  @testing-library/react @testing-library/jest-dom @testing-library/user-event \
  @playwright/test
```

- [ ] **Step 5: Install lint/format tooling**

```bash
npm install -D eslint eslint-config-next prettier prettier-plugin-tailwindcss
```

- [ ] **Step 6: Commit**

```bash
git add app/package.json app/package-lock.json
git commit -m "chore: add runtime and dev dependencies"
```

---

## Task 3: Configure Tailwind v4 and PostCSS

**Files:**
- Create: `app/postcss.config.mjs`, `app/styles/globals.css`

- [ ] **Step 1: Write postcss.config.mjs**

Create `postcss.config.mjs`:

```js
export default {
  plugins: {
    '@tailwindcss/postcss': {}
  }
};
```

- [ ] **Step 2: Write the initial globals.css (tokens will be injected in Task 6)**

Create `styles/globals.css`:

```css
@import "tailwindcss";

@theme {
  /* Populated by tokens/generate.mjs in Task 6. This file is regenerated by `npm run tokens`. */
}

:root {
  color-scheme: dark;
}

html {
  background-color: var(--color-bg-base, #0B0D14);
  color: var(--color-fg-primary, #E8ECF5);
}

html[dir="rtl"] body {
  font-family: var(--font-arabic), ui-sans-serif, system-ui, sans-serif;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add app/postcss.config.mjs app/styles/globals.css
git commit -m "chore: configure Tailwind v4 and PostCSS"
```

---

## Task 4: Configure ESLint and Prettier

**Files:**
- Create: `app/.eslintrc.cjs`, `app/.prettierrc`, `app/.prettierignore`

- [ ] **Step 1: Write .eslintrc.cjs**

Create `.eslintrc.cjs`:

```js
module.exports = {
  root: true,
  extends: ['next/core-web-vitals', 'next/typescript'],
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-restricted-syntax': [
      'error',
      {
        selector: "CallExpression[callee.object.name='localStorage']",
        message: "Do not access localStorage directly. Use lib/storage/store.ts."
      }
    ]
  }
};
```

- [ ] **Step 2: Write .prettierrc**

Create `.prettierrc`:

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "es5",
  "printWidth": 100,
  "tabWidth": 2,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

- [ ] **Step 3: Write .prettierignore**

Create `.prettierignore`:

```
.next/
out/
node_modules/
coverage/
public/
```

- [ ] **Step 4: Run lint to confirm it works**

```bash
npm run lint
```

Expected: "No ESLint warnings or errors" (there's no code yet).

- [ ] **Step 5: Commit**

```bash
git add app/.eslintrc.cjs app/.prettierrc app/.prettierignore
git commit -m "chore: configure ESLint and Prettier"
```

---

## Task 5: Create the design-tokens JSON (single source of truth)

**Files:**
- Create: `app/tokens/design-tokens.json`

- [ ] **Step 1: Write design-tokens.json**

Create `tokens/design-tokens.json`:

```json
{
  "color": {
    "bg.base": "#0B0D14",
    "bg.surface": "#12151F",
    "bg.elevated": "#1A1E2B",
    "fg.primary": "#E8ECF5",
    "fg.muted": "#8A93AB",
    "fg.subtle": "#5A6378",
    "accent.gold": "#E6B64A",
    "accent.goldDim": "#8C6F2E",
    "danger": "#E5484D",
    "success": "#2E844A",
    "border": "#232837"
  },
  "space": {
    "1": "4px",
    "2": "8px",
    "3": "12px",
    "4": "16px",
    "6": "24px",
    "8": "32px",
    "12": "48px",
    "16": "64px"
  },
  "radius": {
    "sm": "4px",
    "md": "8px",
    "lg": "12px",
    "xl": "24px"
  },
  "fontSize": {
    "xs": "12px",
    "sm": "14px",
    "base": "16px",
    "md": "18px",
    "lg": "22px",
    "xl": "28px",
    "2xl": "36px",
    "3xl": "48px"
  },
  "fontWeight": {
    "regular": "400",
    "medium": "500",
    "semibold": "600",
    "bold": "700"
  },
  "motion": {
    "duration.fast": "120ms",
    "duration.normal": "220ms",
    "duration.slow": "400ms",
    "ease.out": "cubic-bezier(0.2, 0.8, 0.2, 1)"
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/tokens/design-tokens.json
git commit -m "feat(tokens): add design-tokens.json as single source of truth"
```

---

## Task 6: Write the tokens generator and wire it into globals.css

**Files:**
- Create: `app/tokens/generate.mjs`

- [ ] **Step 1: Write tokens/generate.mjs**

Create `tokens/generate.mjs`:

```js
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const tokensPath = resolve(__dirname, 'design-tokens.json');
const cssPath = resolve(__dirname, '..', 'styles', 'globals.css');

const tokens = JSON.parse(readFileSync(tokensPath, 'utf8'));

function flatten(prefix, obj, lines) {
  for (const [k, v] of Object.entries(obj)) {
    const varName = `--${prefix}-${k.replace(/\./g, '-')}`;
    lines.push(`  ${varName}: ${v};`);
  }
}

const cssVars = [];
flatten('color', tokens.color, cssVars);
flatten('space', tokens.space, cssVars);
flatten('radius', tokens.radius, cssVars);
flatten('fs', tokens.fontSize, cssVars);
flatten('fw', tokens.fontWeight, cssVars);
flatten('motion', tokens.motion, cssVars);

const themeBlock = cssVars.join('\n');

const current = readFileSync(cssPath, 'utf8');
const updated = current.replace(
  /@theme \{[\s\S]*?\}/,
  `@theme {\n${themeBlock}\n}`
);

writeFileSync(cssPath, updated);
console.log(`Wrote ${cssVars.length} tokens to ${cssPath}`);
```

- [ ] **Step 2: Run the generator**

```bash
npm run tokens
```

Expected output: `Wrote NN tokens to .../styles/globals.css`.

- [ ] **Step 3: Verify globals.css now contains the variables**

Open `styles/globals.css` and confirm the `@theme { ... }` block now contains lines like `--color-bg-base: #0B0D14;`.

- [ ] **Step 4: Commit**

```bash
git add app/tokens/generate.mjs app/styles/globals.css
git commit -m "feat(tokens): add generator and compile tokens to Tailwind @theme"
```

---

## Task 7: Self-host Plex fonts via next/font

**Files:**
- Create: `app/public/fonts/` contents (download commands below)
- Create: `app/lib/fonts.ts`

- [ ] **Step 1: Download IBM Plex Sans Arabic woff2 files**

```bash
cd "/home/ahmed/Projects/Fada | فضاء/app/public/fonts"
curl -LO "https://cdn.jsdelivr.net/fontsource/fonts/ibm-plex-sans-arabic@latest/arabic-400-normal.woff2"
mv arabic-400-normal.woff2 IBMPlexSansArabic-Regular.woff2
curl -LO "https://cdn.jsdelivr.net/fontsource/fonts/ibm-plex-sans-arabic@latest/arabic-500-normal.woff2"
mv arabic-500-normal.woff2 IBMPlexSansArabic-Medium.woff2
curl -LO "https://cdn.jsdelivr.net/fontsource/fonts/ibm-plex-sans-arabic@latest/arabic-600-normal.woff2"
mv arabic-600-normal.woff2 IBMPlexSansArabic-SemiBold.woff2
curl -LO "https://cdn.jsdelivr.net/fontsource/fonts/ibm-plex-sans-arabic@latest/arabic-700-normal.woff2"
mv arabic-700-normal.woff2 IBMPlexSansArabic-Bold.woff2
curl -LO "https://cdn.jsdelivr.net/fontsource/fonts/ibm-plex-mono@latest/latin-400-normal.woff2"
mv latin-400-normal.woff2 IBMPlexMono-Regular.woff2
```

- [ ] **Step 2: Write lib/fonts.ts**

Create `lib/fonts.ts`:

```ts
import localFont from 'next/font/local';

export const plexArabic = localFont({
  src: [
    { path: '../public/fonts/IBMPlexSansArabic-Regular.woff2', weight: '400', style: 'normal' },
    { path: '../public/fonts/IBMPlexSansArabic-Medium.woff2', weight: '500', style: 'normal' },
    { path: '../public/fonts/IBMPlexSansArabic-SemiBold.woff2', weight: '600', style: 'normal' },
    { path: '../public/fonts/IBMPlexSansArabic-Bold.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-arabic',
  display: 'swap',
});

export const plexMono = localFont({
  src: [{ path: '../public/fonts/IBMPlexMono-Regular.woff2', weight: '400', style: 'normal' }],
  variable: '--font-mono',
  display: 'swap',
});
```

- [ ] **Step 3: Commit**

```bash
cd "/home/ahmed/Projects/Fada | فضاء"
git add app/public/fonts/*.woff2 app/lib/fonts.ts
git commit -m "feat(fonts): self-host IBM Plex Sans Arabic + Plex Mono via next/font"
```

---

## Task 8: Set up next-intl with messages/ar.json

**Files:**
- Create: `app/messages/ar.json`, `app/lib/i18n/config.ts`, `app/components/providers/IntlProvider.tsx`

- [ ] **Step 1: Write messages/ar.json**

Create `messages/ar.json`:

```json
{
  "nav": {
    "home": "الرئيسية",
    "movies": "الأفلام",
    "shows": "المسلسلات",
    "collections": "المجموعات",
    "watchlist": "قائمتي",
    "search": "البحث",
    "settings": "الإعدادات",
    "more": "المزيد",
    "iptv": "IPTV",
    "manga": "المانجا",
    "sports": "الرياضة المباشرة",
    "soon": "قريبًا"
  },
  "home": {
    "rail.trendingGlobal": "الرائج عالميًا",
    "rail.arabicMovies": "أفلام عربية شائعة",
    "rail.anime": "أنمي رائج",
    "rail.turkish": "دراما تركية شائعة",
    "rail.korean": "دراما كورية شائعة",
    "viewAll": "عرض الكل"
  },
  "common": {
    "loading": "جارٍ التحميل...",
    "emptyNoResults": "لا توجد نتائج",
    "poster": "ملصق",
    "comingInV02": "المشاهدة قادمة في الإصدار 0.2",
    "comingSoon": "قريبًا في الإصدارات القادمة"
  },
  "a11y": {
    "skipToContent": "تخطَّ إلى المحتوى",
    "closeDialog": "إغلاق",
    "openSearch": "فتح البحث"
  }
}
```

- [ ] **Step 2: Write lib/i18n/config.ts**

Create `lib/i18n/config.ts`:

```ts
import messages from '@/messages/ar.json';

export const locale = 'ar' as const;
export const direction = 'rtl' as const;
export { messages };
```

- [ ] **Step 3: Write components/providers/IntlProvider.tsx**

Create `components/providers/IntlProvider.tsx`:

```tsx
'use client';

import { NextIntlClientProvider } from 'next-intl';
import { locale, messages } from '@/lib/i18n/config';

export function IntlProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages} timeZone="UTC">
      {children}
    </NextIntlClientProvider>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add app/messages/ar.json app/lib/i18n/config.ts app/components/providers/IntlProvider.tsx
git commit -m "feat(i18n): set up next-intl with Arabic messages"
```

---

## Task 9: Write the storage Zod schema

**Files:**
- Create: `app/lib/storage/schema.ts`
- Create: `app/tests/unit/storage.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/storage.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { FadaStateSchema, defaultState } from '@/lib/storage/schema';

describe('FadaStateSchema', () => {
  it('parses the default state successfully', () => {
    const result = FadaStateSchema.safeParse(defaultState);
    expect(result.success).toBe(true);
  });

  it('rejects a state missing version', () => {
    const invalid = { ...defaultState } as Record<string, unknown>;
    delete invalid.version;
    const result = FadaStateSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects a watchlist entry with a wrong type', () => {
    const invalid = {
      ...defaultState,
      watchlist: [{ id: 1, type: 'anime', addedAt: '2026-04-23T00:00:00Z' }],
    };
    const result = FadaStateSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('caps recentSearches length', () => {
    const withTooMany = { ...defaultState, recentSearches: Array(20).fill('a') };
    const result = FadaStateSchema.safeParse(withTooMany);
    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test — it will fail to import**

```bash
npm run test -- tests/unit/storage.test.ts
```

Expected: failure with "Cannot find module '@/lib/storage/schema'".

- [ ] **Step 3: Write the schema**

Create `lib/storage/schema.ts`:

```ts
import { z } from 'zod';

export const WatchlistEntrySchema = z.object({
  id: z.number().int().positive(),
  type: z.enum(['movie', 'tv']),
  addedAt: z.string().datetime(),
});

export const PreferencesSchema = z.object({
  region: z.enum(['MENA', 'global']).default('MENA'),
  theme: z.enum(['dark', 'light', 'system']).default('dark'),
  posterDensity: z.enum(['comfortable', 'compact']).default('comfortable'),
});

export const FadaStateSchema = z.object({
  version: z.literal(1),
  watchlist: z.array(WatchlistEntrySchema).default([]),
  preferences: PreferencesSchema.default({ region: 'MENA', theme: 'dark', posterDensity: 'comfortable' }),
  recentSearches: z.array(z.string()).max(10).default([]),
  tmdb: z.object({ customToken: z.string().nullable() }).default({ customToken: null }),
});

export type FadaState = z.infer<typeof FadaStateSchema>;
export type WatchlistEntry = z.infer<typeof WatchlistEntrySchema>;
export type Preferences = z.infer<typeof PreferencesSchema>;

export const defaultState: FadaState = {
  version: 1,
  watchlist: [],
  preferences: { region: 'MENA', theme: 'dark', posterDensity: 'comfortable' },
  recentSearches: [],
  tmdb: { customToken: null },
};
```

- [ ] **Step 4: Run the test — now passes**

```bash
npm run test -- tests/unit/storage.test.ts
```

Expected: all four tests pass.

- [ ] **Step 5: Commit**

```bash
git add app/lib/storage/schema.ts app/tests/unit/storage.test.ts
git commit -m "feat(storage): add Zod-validated fada.v1 state schema"
```

---

## Task 10: Write the storage migration scaffold

**Files:**
- Create: `app/lib/storage/migrate.ts`

- [ ] **Step 1: Write the failing test**

Append to `tests/unit/storage.test.ts`:

```ts
import { migrate } from '@/lib/storage/migrate';

describe('migrate', () => {
  it('returns defaultState when input is null', () => {
    expect(migrate(null)).toEqual(defaultState);
  });

  it('returns defaultState when input is malformed JSON object', () => {
    expect(migrate({ random: 'garbage' })).toEqual(defaultState);
  });

  it('returns the same state when already at current version', () => {
    const validWithData = {
      ...defaultState,
      watchlist: [{ id: 550, type: 'movie' as const, addedAt: '2026-04-23T00:00:00Z' }],
    };
    expect(migrate(validWithData)).toEqual(validWithData);
  });
});
```

- [ ] **Step 2: Run — expected failure on import**

```bash
npm run test -- tests/unit/storage.test.ts
```

Expected: failure with missing `@/lib/storage/migrate`.

- [ ] **Step 3: Write lib/storage/migrate.ts**

Create `lib/storage/migrate.ts`:

```ts
import { FadaStateSchema, defaultState, type FadaState } from './schema';

const CURRENT_VERSION = 1;

export function migrate(input: unknown): FadaState {
  if (input === null || typeof input !== 'object') return defaultState;
  const version = (input as { version?: unknown }).version;

  // Future-proofing: when version < CURRENT_VERSION, run sequential migrators here.
  // For v1 there is nothing to migrate; we only validate.
  void version;
  void CURRENT_VERSION;

  const parsed = FadaStateSchema.safeParse(input);
  if (!parsed.success) return defaultState;
  return parsed.data;
}
```

- [ ] **Step 4: Run — all pass**

```bash
npm run test -- tests/unit/storage.test.ts
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add app/lib/storage/migrate.ts app/tests/unit/storage.test.ts
git commit -m "feat(storage): add migration scaffold and tests"
```

---

## Task 11: Write the Zustand store with persistence

**Files:**
- Create: `app/lib/storage/store.ts`

- [ ] **Step 1: Append tests to tests/unit/storage.test.ts**

```ts
import { useFadaStore } from '@/lib/storage/store';

describe('useFadaStore — watchlist', () => {
  beforeEach(() => {
    // Reset to defaults between tests
    useFadaStore.setState(defaultState);
  });

  it('adds an entry', () => {
    useFadaStore.getState().addToWatchlist({ id: 550, type: 'movie' });
    expect(useFadaStore.getState().watchlist).toHaveLength(1);
    expect(useFadaStore.getState().watchlist[0].id).toBe(550);
  });

  it('dedupes on id + type', () => {
    useFadaStore.getState().addToWatchlist({ id: 550, type: 'movie' });
    useFadaStore.getState().addToWatchlist({ id: 550, type: 'movie' });
    expect(useFadaStore.getState().watchlist).toHaveLength(1);
  });

  it('allows same id different type', () => {
    useFadaStore.getState().addToWatchlist({ id: 550, type: 'movie' });
    useFadaStore.getState().addToWatchlist({ id: 550, type: 'tv' });
    expect(useFadaStore.getState().watchlist).toHaveLength(2);
  });

  it('removes an entry', () => {
    useFadaStore.getState().addToWatchlist({ id: 550, type: 'movie' });
    useFadaStore.getState().removeFromWatchlist({ id: 550, type: 'movie' });
    expect(useFadaStore.getState().watchlist).toHaveLength(0);
  });
});

describe('useFadaStore — recentSearches', () => {
  beforeEach(() => {
    useFadaStore.setState(defaultState);
  });

  it('prepends unique queries', () => {
    useFadaStore.getState().pushRecentSearch('matrix');
    useFadaStore.getState().pushRecentSearch('inception');
    expect(useFadaStore.getState().recentSearches).toEqual(['inception', 'matrix']);
  });

  it('dedupes queries moving them to the front', () => {
    useFadaStore.getState().pushRecentSearch('matrix');
    useFadaStore.getState().pushRecentSearch('inception');
    useFadaStore.getState().pushRecentSearch('matrix');
    expect(useFadaStore.getState().recentSearches).toEqual(['matrix', 'inception']);
  });

  it('caps at 10 entries', () => {
    for (let i = 0; i < 15; i += 1) useFadaStore.getState().pushRecentSearch(`q${i}`);
    expect(useFadaStore.getState().recentSearches).toHaveLength(10);
  });
});
```

Add the `beforeEach` import at the top: `import { describe, it, expect, beforeEach } from 'vitest';`.

- [ ] **Step 2: Run — expected import failure**

```bash
npm run test -- tests/unit/storage.test.ts
```

Expected: failure on missing `@/lib/storage/store`.

- [ ] **Step 3: Write lib/storage/store.ts**

Create `lib/storage/store.ts`:

```ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  FadaStateSchema,
  defaultState,
  type FadaState,
  type WatchlistEntry,
} from './schema';
import { migrate } from './migrate';

type WatchlistInput = Pick<WatchlistEntry, 'id' | 'type'>;

interface Actions {
  addToWatchlist: (entry: WatchlistInput) => void;
  removeFromWatchlist: (entry: WatchlistInput) => void;
  isInWatchlist: (entry: WatchlistInput) => boolean;
  pushRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
  setCustomTmdbToken: (token: string | null) => void;
  setPreference: <K extends keyof FadaState['preferences']>(
    key: K,
    value: FadaState['preferences'][K]
  ) => void;
  importState: (incoming: unknown) => { imported: number } | { error: string };
  reset: () => void;
}

type Store = FadaState & Actions;

const sameEntry = (a: WatchlistInput, b: WatchlistInput) => a.id === b.id && a.type === b.type;

export const useFadaStore = create<Store>()(
  persist(
    (set, get) => ({
      ...defaultState,

      addToWatchlist: (entry) =>
        set((s) =>
          s.watchlist.some((w) => sameEntry(w, entry))
            ? s
            : {
                watchlist: [
                  ...s.watchlist,
                  { id: entry.id, type: entry.type, addedAt: new Date().toISOString() },
                ],
              }
        ),

      removeFromWatchlist: (entry) =>
        set((s) => ({ watchlist: s.watchlist.filter((w) => !sameEntry(w, entry)) })),

      isInWatchlist: (entry) => get().watchlist.some((w) => sameEntry(w, entry)),

      pushRecentSearch: (query) =>
        set((s) => {
          const cleaned = query.trim();
          if (!cleaned) return s;
          const without = s.recentSearches.filter((q) => q !== cleaned);
          return { recentSearches: [cleaned, ...without].slice(0, 10) };
        }),

      clearRecentSearches: () => set({ recentSearches: [] }),

      setCustomTmdbToken: (token) => set({ tmdb: { customToken: token } }),

      setPreference: (key, value) =>
        set((s) => ({ preferences: { ...s.preferences, [key]: value } })),

      importState: (incoming) => {
        const migrated = migrate(incoming);
        if (migrated === defaultState && incoming !== null) {
          return { error: 'invalid' };
        }
        const current = get();
        const merged: WatchlistEntry[] = [...current.watchlist];
        let imported = 0;
        for (const entry of migrated.watchlist) {
          if (!merged.some((w) => sameEntry(w, entry))) {
            merged.push(entry);
            imported += 1;
          }
        }
        set({ watchlist: merged });
        return { imported };
      },

      reset: () => set(defaultState),
    }),
    {
      name: 'fada.v1',
      version: 1,
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? localStorage : dummyStorage)),
      partialize: (state): FadaState => ({
        version: state.version,
        watchlist: state.watchlist,
        preferences: state.preferences,
        recentSearches: state.recentSearches,
        tmdb: state.tmdb,
      }),
      merge: (persisted, current) => {
        const migrated = migrate(persisted);
        const parsed = FadaStateSchema.safeParse(migrated);
        return { ...current, ...(parsed.success ? parsed.data : defaultState) };
      },
    }
  )
);

const dummyStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};
```

- [ ] **Step 4: Run all storage tests**

```bash
npm run test -- tests/unit/storage.test.ts
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add app/lib/storage/store.ts app/tests/unit/storage.test.ts
git commit -m "feat(storage): add Zustand store with persistence and watchlist/recent-search actions"
```

---

## Task 12: Write the TMDB client and typed endpoints

**Files:**
- Create: `app/lib/tmdb/client.ts`, `app/lib/tmdb/endpoints.ts`, `app/lib/tmdb/schemas.ts`, `app/lib/tmdb/types.ts`
- Create: `app/tests/unit/tmdb-client.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/tmdb-client.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { tmdbFetch, resolveToken, clearCustomTokenForTests } from '@/lib/tmdb/client';

describe('resolveToken', () => {
  beforeEach(() => {
    clearCustomTokenForTests();
    vi.stubEnv('NEXT_PUBLIC_TMDB_TOKEN', 'shipped-token');
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns the shipped token when no custom token is set', () => {
    expect(resolveToken(null)).toBe('shipped-token');
  });

  it('prefers the custom token when provided', () => {
    expect(resolveToken('custom-token')).toBe('custom-token');
  });
});

describe('tmdbFetch', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_TMDB_TOKEN', 'shipped-token');
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('sends Authorization: Bearer and parses JSON', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), { status: 200 })
    );
    const res = await tmdbFetch('/trending/movie/day', {});
    expect(res).toEqual({ ok: true });
    const call = fetchSpy.mock.calls[0];
    const init = call[1] as RequestInit;
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer shipped-token');
  });

  it('retries on 429 up to 3 times then throws', async () => {
    const fetchSpy = vi
      .spyOn(global, 'fetch')
      .mockResolvedValue(new Response('busy', { status: 429 }));
    await expect(tmdbFetch('/x', {}, { retryBaseMs: 1 })).rejects.toThrow(/rate.?limited/i);
    expect(fetchSpy).toHaveBeenCalledTimes(4); // 1 + 3 retries
  });

  it('returns on first 200 even if earlier attempts 429', async () => {
    vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce(new Response('busy', { status: 429 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    const res = await tmdbFetch('/x', {}, { retryBaseMs: 1 });
    expect(res).toEqual({ ok: true });
  });
});
```

- [ ] **Step 2: Run — expected failure on import**

```bash
npm run test -- tests/unit/tmdb-client.test.ts
```

Expected: missing module errors.

- [ ] **Step 3: Write lib/tmdb/client.ts**

Create `lib/tmdb/client.ts`:

```ts
const API_ROOT = 'https://api.themoviedb.org/3';

let cachedCustomToken: string | null = null;

export function setCustomToken(token: string | null) {
  cachedCustomToken = token;
}

export function clearCustomTokenForTests() {
  cachedCustomToken = null;
}

export function resolveToken(override: string | null): string {
  const custom = override ?? cachedCustomToken;
  const shipped = process.env.NEXT_PUBLIC_TMDB_TOKEN ?? '';
  return custom && custom.trim() ? custom.trim() : shipped;
}

interface FetchOptions {
  retryBaseMs?: number;
  overrideToken?: string | null;
  signal?: AbortSignal;
  params?: Record<string, string | number | undefined>;
}

const MAX_RETRIES = 3;

function buildUrl(path: string, params?: FetchOptions['params']): string {
  const url = new URL(`${API_ROOT}${path}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
    }
  }
  url.searchParams.set('language', 'ar-SA');
  return url.toString();
}

export async function tmdbFetch<T>(path: string, _init: RequestInit, opts: FetchOptions = {}): Promise<T> {
  const token = resolveToken(opts.overrideToken ?? null);
  if (!token) throw new Error('TMDB token missing');

  const url = buildUrl(path, opts.params);
  const init: RequestInit = {
    headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    signal: opts.signal,
  };

  const baseBackoff = opts.retryBaseMs ?? 400;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    const res = await fetch(url, init);
    if (res.status === 429) {
      if (attempt === MAX_RETRIES) throw new Error(`tmdb rate-limited: ${path}`);
      const delay = baseBackoff * 2 ** attempt;
      await new Promise((r) => setTimeout(r, delay));
      continue;
    }
    if (!res.ok) throw new Error(`tmdb ${res.status} on ${path}`);
    return (await res.json()) as T;
  }
  throw new Error(`tmdb unreachable: ${path}`);
}
```

- [ ] **Step 4: Write lib/tmdb/types.ts**

Create `lib/tmdb/types.ts`:

```ts
export interface TmdbListItem {
  id: number;
  media_type?: 'movie' | 'tv';
  title?: string;
  name?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  original_language: string;
}

export interface TmdbPaged<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}
```

- [ ] **Step 5: Write lib/tmdb/schemas.ts**

Create `lib/tmdb/schemas.ts`:

```ts
import { z } from 'zod';

export const TmdbListItemSchema = z.object({
  id: z.number(),
  media_type: z.enum(['movie', 'tv']).optional(),
  title: z.string().optional(),
  name: z.string().optional(),
  poster_path: z.string().nullable(),
  backdrop_path: z.string().nullable(),
  release_date: z.string().optional(),
  first_air_date: z.string().optional(),
  vote_average: z.number(),
  original_language: z.string(),
});

export const TmdbPagedSchema = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    page: z.number(),
    results: z.array(item),
    total_pages: z.number(),
    total_results: z.number(),
  });
```

- [ ] **Step 6: Write lib/tmdb/endpoints.ts**

Create `lib/tmdb/endpoints.ts`:

```ts
import { tmdbFetch } from './client';
import type { TmdbListItem, TmdbPaged } from './types';

export async function trending(mediaType: 'all' | 'movie' | 'tv', window: 'day' | 'week' = 'day') {
  return tmdbFetch<TmdbPaged<TmdbListItem>>(`/trending/${mediaType}/${window}`, {});
}

// Arabic movies (original_language=ar, sorted by popularity).
export async function popularArabicMovies() {
  return tmdbFetch<TmdbPaged<TmdbListItem>>('/discover/movie', {}, {
    params: { with_original_language: 'ar', sort_by: 'popularity.desc' },
  });
}

// Korean dramas (TV, original_language=ko).
export async function popularKoreanDramas() {
  return tmdbFetch<TmdbPaged<TmdbListItem>>('/discover/tv', {}, {
    params: { with_original_language: 'ko', sort_by: 'popularity.desc' },
  });
}

// Turkish dramas (TV, original_language=tr).
export async function popularTurkishDramas() {
  return tmdbFetch<TmdbPaged<TmdbListItem>>('/discover/tv', {}, {
    params: { with_original_language: 'tr', sort_by: 'popularity.desc' },
  });
}

// Anime (TV, animation genre 16, original_language=ja).
export async function trendingAnime() {
  return tmdbFetch<TmdbPaged<TmdbListItem>>('/discover/tv', {}, {
    params: {
      with_genres: '16',
      with_original_language: 'ja',
      sort_by: 'popularity.desc',
    },
  });
}
```

- [ ] **Step 7: Run all TMDB tests**

```bash
npm run test -- tests/unit/tmdb-client.test.ts
```

Expected: all pass.

- [ ] **Step 8: Commit**

```bash
git add app/lib/tmdb/ app/tests/unit/tmdb-client.test.ts
git commit -m "feat(tmdb): add client with retry/backoff, typed endpoints, and Zod schemas"
```

---

## Task 13: Configure Vitest and @testing-library

**Files:**
- Create: `app/vitest.config.ts`, `app/tests/setup.ts`

- [ ] **Step 1: Write vitest.config.ts**

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    globals: true,
    css: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
```

- [ ] **Step 2: Install @vitejs/plugin-react**

```bash
npm install -D @vitejs/plugin-react
```

- [ ] **Step 3: Write tests/setup.ts**

Create `tests/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 4: Re-run the storage + tmdb suites to confirm still green under jsdom**

```bash
npm run test
```

Expected: all existing tests pass in the jsdom environment.

- [ ] **Step 5: Commit**

```bash
git add app/vitest.config.ts app/tests/setup.ts app/package.json app/package-lock.json
git commit -m "chore(test): configure Vitest with jsdom + @testing-library setup"
```

---

## Task 14: Build the React Query provider with localStorage persistence

**Files:**
- Create: `app/lib/query/client.ts`, `app/components/providers/QueryProvider.tsx`

- [ ] **Step 1: Write lib/query/client.ts**

Create `lib/query/client.ts`:

```ts
import { QueryClient } from '@tanstack/react-query';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

export const STALE = {
  trending: 1000 * 60 * 60,       // 1h
  detail: 1000 * 60 * 60 * 24,    // 24h
  collections: 1000 * 60 * 60 * 24,
  search: 1000 * 60 * 5,          // 5m
  discover: 1000 * 60 * 15,       // 15m
} as const;

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: STALE.trending,
        gcTime: 1000 * 60 * 60 * 24,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          if (/rate.?limited/i.test(String(error))) return false;
          return failureCount < 2;
        },
      },
    },
  });
}

export function makePersister() {
  if (typeof window === 'undefined') return null;
  return createSyncStoragePersister({
    storage: window.localStorage,
    key: 'fada.rq.v1',
  });
}
```

- [ ] **Step 2: Write components/providers/QueryProvider.tsx**

Create `components/providers/QueryProvider.tsx`:

```tsx
'use client';

import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { useMemo } from 'react';
import { makeQueryClient, makePersister } from '@/lib/query/client';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const client = useMemo(makeQueryClient, []);
  const persister = useMemo(makePersister, []);

  if (!persister) {
    return <>{children}</>;
  }

  return (
    <PersistQueryClientProvider
      client={client}
      persistOptions={{ persister, maxAge: 1000 * 60 * 60 * 24 * 7 }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add app/lib/query/client.ts app/components/providers/QueryProvider.tsx
git commit -m "feat(query): add React Query client + localStorage persistence provider"
```

---

## Task 15: Install shadcn primitives

**Files:**
- Create: `app/components/ui/*` and `app/lib/utils/cn.ts`

- [ ] **Step 1: Write lib/utils/cn.ts**

Create `lib/utils/cn.ts`:

```ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 2: Initialize shadcn with RTL-friendly defaults**

```bash
npx shadcn@latest init --yes --base-color neutral --style new-york
```

Accept the defaults; this creates `components.json` and a minimal `components/ui/` scaffold.

- [ ] **Step 3: Add the primitives we need**

```bash
npx shadcn@latest add button input select dialog sheet tabs toast tooltip dropdown-menu scroll-area separator skeleton switch slider popover
```

- [ ] **Step 4: Verify typecheck**

```bash
npm run typecheck
```

Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add app/components.json app/components/ui app/lib/utils/cn.ts
git commit -m "feat(ui): add shadcn primitives (button, input, dialog, sheet, tabs, toast, tooltip, etc.)"
```

---

## Task 16: Build `<PosterCard>` with a failing-image fallback

**Files:**
- Create: `app/components/fada/PosterCard.tsx`
- Create: `app/tests/component/PosterCard.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `tests/component/PosterCard.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PosterCard } from '@/components/fada/PosterCard';

describe('<PosterCard>', () => {
  it('renders the title as accessible text', () => {
    render(<PosterCard id={1} type="movie" title="فيلم تجريبي" posterPath="/p.jpg" year="2024" />);
    expect(screen.getByText('فيلم تجريبي')).toBeInTheDocument();
  });

  it('renders a star-disc fallback when the image fails', () => {
    render(<PosterCard id={1} type="movie" title="No Poster" posterPath={null} />);
    expect(screen.getByTestId('poster-fallback')).toBeInTheDocument();
  });

  it('renders the star-disc fallback after an onError event', () => {
    render(<PosterCard id={1} type="movie" title="Broken" posterPath="/broken.jpg" />);
    const img = screen.getByRole('img');
    fireEvent.error(img);
    expect(screen.getByTestId('poster-fallback')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run — expected failure**

```bash
npm run test -- tests/component/PosterCard.test.tsx
```

Expected: missing module.

- [ ] **Step 3: Write components/fada/PosterCard.tsx**

Create `components/fada/PosterCard.tsx`:

```tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils/cn';

export interface PosterCardProps {
  id: number;
  type: 'movie' | 'tv';
  title: string;
  posterPath: string | null;
  year?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const TMDB_IMG = 'https://image.tmdb.org/t/p/w342';

const sizeClasses = {
  sm: 'w-28',
  md: 'w-40',
  lg: 'w-56',
} as const;

export function PosterCard({
  id,
  type,
  title,
  posterPath,
  year,
  size = 'md',
  className,
}: PosterCardProps) {
  const [errored, setErrored] = useState(false);
  const showFallback = !posterPath || errored;

  return (
    <Link
      href={`/title/${type}/${id}`}
      className={cn('group flex flex-col gap-2', sizeClasses[size], className)}
      aria-label={`${title}${year ? ` (${year})` : ''}`}
    >
      <div
        className={cn(
          'relative overflow-hidden rounded-[var(--radius-lg)]',
          'aspect-[2/3] bg-[color:var(--color-bg-surface)]',
          'transition-transform duration-[var(--motion-duration-normal)]',
          'ease-[var(--motion-ease-out)]',
          'group-hover:-translate-y-1'
        )}
      >
        {showFallback ? (
          <div
            data-testid="poster-fallback"
            className="flex h-full w-full items-center justify-center bg-[color:var(--color-bg-elevated)] text-[color:var(--color-fg-muted)]"
            aria-hidden="true"
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l2.9 6.9L22 10l-5.5 4.6L18 22l-6-3.3L6 22l1.5-7.4L2 10l7.1-1.1z" />
            </svg>
          </div>
        ) : (
          <Image
            src={`${TMDB_IMG}${posterPath}`}
            alt={`${title} ملصق`}
            fill
            sizes="(max-width: 768px) 50vw, 240px"
            onError={() => setErrored(true)}
            unoptimized
          />
        )}
      </div>
      <div className="flex flex-col px-1 text-right">
        <span className="line-clamp-2 text-[var(--fs-sm)] font-medium text-[color:var(--color-fg-primary)]">
          {title}
        </span>
        {year && (
          <span className="font-mono text-[var(--fs-xs)] text-[color:var(--color-fg-muted)]">
            {year}
          </span>
        )}
      </div>
    </Link>
  );
}
```

- [ ] **Step 4: Run tests**

```bash
npm run test -- tests/component/PosterCard.test.tsx
```

Expected: all three tests pass.

- [ ] **Step 5: Commit**

```bash
git add app/components/fada/PosterCard.tsx app/tests/component/PosterCard.test.tsx
git commit -m "feat(ui): add <PosterCard> with image fallback"
```

---

## Task 17: Build `<Rail>` with RTL scroll start + keyboard arrows

**Files:**
- Create: `app/components/fada/Rail.tsx`
- Create: `app/tests/component/Rail.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `tests/component/Rail.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Rail } from '@/components/fada/Rail';

describe('<Rail>', () => {
  it('renders the title and children', () => {
    render(
      <Rail title="الرائج">
        <div>item 1</div>
        <div>item 2</div>
      </Rail>
    );
    expect(screen.getByText('الرائج')).toBeInTheDocument();
    expect(screen.getByText('item 1')).toBeInTheDocument();
  });

  it('responds to ArrowLeft and ArrowRight by scrolling the track', () => {
    render(
      <Rail title="T">
        <div>a</div>
        <div>b</div>
      </Rail>
    );
    const track = screen.getByTestId('rail-track');
    track.scrollBy = vi.fn();
    fireEvent.keyDown(track, { key: 'ArrowLeft' });
    expect(track.scrollBy).toHaveBeenCalledWith({ left: -300, behavior: 'smooth' });
    fireEvent.keyDown(track, { key: 'ArrowRight' });
    expect(track.scrollBy).toHaveBeenCalledWith({ left: 300, behavior: 'smooth' });
  });

  it('renders the "view all" link when href is provided', () => {
    render(
      <Rail title="T" href="/movies">
        <div>a</div>
      </Rail>
    );
    expect(screen.getByRole('link', { name: /عرض الكل/ })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run — expected failure**

```bash
npm run test -- tests/component/Rail.test.tsx
```

Expected: missing module.

- [ ] **Step 3: Write components/fada/Rail.tsx**

Create `components/fada/Rail.tsx`:

```tsx
'use client';

import Link from 'next/link';
import { useRef, useCallback, KeyboardEvent } from 'react';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface RailProps {
  title: string;
  href?: string;
  viewAllLabel?: string;
  children: React.ReactNode;
  className?: string;
}

const STEP = 300;

export function Rail({ title, href, viewAllLabel = 'عرض الكل', children, className }: RailProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  const onKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
    const track = trackRef.current;
    if (!track) return;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      track.scrollBy({ left: -STEP, behavior: 'smooth' });
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      track.scrollBy({ left: STEP, behavior: 'smooth' });
    }
  }, []);

  return (
    <section className={cn('flex flex-col gap-3', className)} aria-label={title}>
      <header className="flex items-center justify-between px-4">
        <h2 className="text-[var(--fs-lg)] font-semibold text-[color:var(--color-fg-primary)]">
          {title}
        </h2>
        {href && (
          <Link
            href={href}
            className="flex items-center gap-1 text-[var(--fs-sm)] text-[color:var(--color-fg-muted)] hover:text-[color:var(--color-accent-gold)]"
          >
            <span>{viewAllLabel}</span>
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </Link>
        )}
      </header>
      <div
        ref={trackRef}
        data-testid="rail-track"
        tabIndex={0}
        onKeyDown={onKeyDown}
        className={cn(
          'flex gap-3 overflow-x-auto px-4 pb-2',
          'scroll-smooth snap-x snap-mandatory',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent-gold)]'
        )}
        style={{ scrollbarWidth: 'thin' }}
      >
        {children}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Run tests**

```bash
npm run test -- tests/component/Rail.test.tsx
```

Expected: all three tests pass.

- [ ] **Step 5: Commit**

```bash
git add app/components/fada/Rail.tsx app/tests/component/Rail.test.tsx
git commit -m "feat(ui): add <Rail> with keyboard navigation and RTL-aware scroll"
```

---

## Task 18: Build `<StarLoader>` and `<StarEmptyState>`

**Files:**
- Create: `app/public/lottie/star-pulse.json`, `app/components/fada/StarLoader.tsx`, `app/components/fada/StarEmptyState.tsx`

- [ ] **Step 1: Write a minimal placeholder Lottie**

Create `public/lottie/star-pulse.json` with a tiny valid Lottie (this is a placeholder; the motion designer replaces it later):

```json
{
  "v": "5.7.0",
  "fr": 30,
  "ip": 0,
  "op": 60,
  "w": 120,
  "h": 120,
  "nm": "star-pulse",
  "ddd": 0,
  "assets": [],
  "layers": [
    {
      "ddd": 0,
      "ind": 1,
      "ty": 4,
      "nm": "star",
      "sr": 1,
      "ks": {
        "o": { "a": 1, "k": [
          { "t": 0, "s": [30] },
          { "t": 30, "s": [100] },
          { "t": 60, "s": [30] }
        ] },
        "r": { "a": 0, "k": 0 },
        "p": { "a": 0, "k": [60, 60, 0] },
        "a": { "a": 0, "k": [0, 0, 0] },
        "s": { "a": 0, "k": [100, 100, 100] }
      },
      "shapes": [
        {
          "ty": "sr",
          "sy": 1,
          "p": { "a": 0, "k": [0, 0] },
          "r": { "a": 0, "k": 0 },
          "pt": { "a": 0, "k": 5 },
          "or": { "a": 0, "k": 40 },
          "ir": { "a": 0, "k": 16 },
          "os": { "a": 0, "k": 0 },
          "is": { "a": 0, "k": 0 }
        },
        {
          "ty": "fl",
          "c": { "a": 0, "k": [0.902, 0.714, 0.290, 1] },
          "o": { "a": 0, "k": 100 }
        }
      ],
      "ip": 0,
      "op": 60,
      "st": 0
    }
  ]
}
```

- [ ] **Step 2: Write components/fada/StarLoader.tsx**

Create `components/fada/StarLoader.tsx`:

```tsx
'use client';

import { useEffect, useRef } from 'react';
import lottie, { type AnimationItem } from 'lottie-web';
import starPulse from '../../public/lottie/star-pulse.json';

export function StarLoader({ size = 48 }: { size?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const animRef = useRef<AnimationItem | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    animRef.current = lottie.loadAnimation({
      container: ref.current,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      animationData: starPulse,
    });
    return () => animRef.current?.destroy();
  }, []);

  return <div ref={ref} style={{ width: size, height: size }} role="status" aria-label="جارٍ التحميل" />;
}
```

- [ ] **Step 3: Write components/fada/StarEmptyState.tsx**

Create `components/fada/StarEmptyState.tsx`:

```tsx
import { StarLoader } from './StarLoader';

interface Props {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function StarEmptyState({ title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <StarLoader size={64} />
      <div className="flex flex-col gap-1">
        <p className="text-[var(--fs-md)] font-medium text-[color:var(--color-fg-primary)]">{title}</p>
        {description && (
          <p className="text-[var(--fs-sm)] text-[color:var(--color-fg-muted)]">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
```

- [ ] **Step 4: Add a type declaration for the JSON import**

Create `lib/lottie.d.ts`:

```ts
declare module '*.json' {
  const value: unknown;
  export default value;
}
```

If TypeScript complains about the `animationData: starPulse` type, cast to `object` at the callsite.

- [ ] **Step 5: Commit**

```bash
git add app/public/lottie/star-pulse.json app/components/fada/StarLoader.tsx app/components/fada/StarEmptyState.tsx app/lib/lottie.d.ts
git commit -m "feat(ui): add <StarLoader> and <StarEmptyState> with Lottie placeholder"
```

---

## Task 19: Build `<FloatingSearchPill>` with `/` shortcut + scroll shrink

**Files:**
- Create: `app/components/fada/FloatingSearchPill.tsx`
- Create: `app/tests/component/FloatingSearchPill.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `tests/component/FloatingSearchPill.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { FloatingSearchPill } from '@/components/fada/FloatingSearchPill';

describe('<FloatingSearchPill>', () => {
  it('starts collapsed (icon only) and expands on click', () => {
    render(<FloatingSearchPill />);
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /البحث/ }));
    expect(screen.getByRole('searchbox')).toBeInTheDocument();
  });

  it('expands when the / key is pressed globally', () => {
    render(<FloatingSearchPill />);
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: '/' }));
    });
    expect(screen.getByRole('searchbox')).toBeInTheDocument();
  });

  it('collapses when Escape is pressed', () => {
    render(<FloatingSearchPill />);
    fireEvent.click(screen.getByRole('button', { name: /البحث/ }));
    expect(screen.getByRole('searchbox')).toBeInTheDocument();
    fireEvent.keyDown(screen.getByRole('searchbox'), { key: 'Escape' });
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
  });

  it('ignores / when typing inside another input', () => {
    render(
      <>
        <input data-testid="other" />
        <FloatingSearchPill />
      </>
    );
    const other = screen.getByTestId('other') as HTMLInputElement;
    other.focus();
    act(() => {
      other.dispatchEvent(new KeyboardEvent('keydown', { key: '/', bubbles: true }));
    });
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run — expected failure**

```bash
npm run test -- tests/component/FloatingSearchPill.test.tsx
```

Expected: missing module.

- [ ] **Step 3: Write components/fada/FloatingSearchPill.tsx**

Create `components/fada/FloatingSearchPill.tsx`:

```tsx
'use client';

import { useEffect, useRef, useState, KeyboardEvent } from 'react';
import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils/cn';

export function FloatingSearchPill() {
  const [expanded, setExpanded] = useState(false);
  const [shrunk, setShrunk] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    function onKeyDown(e: globalThis.KeyboardEvent) {
      if (e.key !== '/') return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      e.preventDefault();
      setExpanded(true);
      queueMicrotask(() => inputRef.current?.focus());
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    function onScroll() {
      setShrunk(window.scrollY > 120);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      setExpanded(false);
      setQuery('');
    } else if (e.key === 'Enter' && query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setExpanded(false);
    }
  }

  return (
    <div
      className={cn(
        'fixed top-4 left-4 z-40',
        'transition-all duration-[var(--motion-duration-normal)]',
        'ease-[var(--motion-ease-out)]'
      )}
    >
      {expanded ? (
        <div className="flex items-center gap-2 rounded-full bg-[color:var(--color-bg-elevated)] px-4 py-2 shadow-lg">
          <Search className="h-4 w-4 text-[color:var(--color-fg-muted)]" aria-hidden />
          <input
            ref={inputRef}
            role="searchbox"
            aria-label="البحث"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-64 bg-transparent text-[var(--fs-sm)] text-[color:var(--color-fg-primary)] outline-none placeholder:text-[color:var(--color-fg-subtle)]"
            placeholder="ابحث عن فيلم أو مسلسل..."
            autoFocus
          />
        </div>
      ) : (
        <button
          type="button"
          aria-label="البحث"
          onClick={() => setExpanded(true)}
          className={cn(
            'rounded-full bg-[color:var(--color-bg-elevated)] p-2 shadow-lg transition-transform',
            shrunk ? 'scale-90' : 'scale-100'
          )}
        >
          <Search className="h-5 w-5 text-[color:var(--color-fg-primary)]" />
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run tests**

```bash
npm run test -- tests/component/FloatingSearchPill.test.tsx
```

Expected: all four tests pass.

- [ ] **Step 5: Commit**

```bash
git add app/components/fada/FloatingSearchPill.tsx app/tests/component/FloatingSearchPill.test.tsx
git commit -m "feat(ui): add <FloatingSearchPill> with / shortcut, scroll shrink, and Escape"
```

---

## Task 20: Build `<Sidebar>` (right-anchored, collapsible, drawer on mobile)

**Files:**
- Create: `app/components/fada/Sidebar.tsx`

- [ ] **Step 1: Write components/fada/Sidebar.tsx**

Create `components/fada/Sidebar.tsx`:

```tsx
'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Home,
  Film,
  Tv,
  LayoutGrid,
  Bookmark,
  Search,
  Settings,
  ChevronDown,
  Radio,
  BookOpen,
  Trophy,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useToast } from '@/components/ui/use-toast';

type Destination = { href: string; labelKey: string; Icon: typeof Home };

const main: Destination[] = [
  { href: '/', labelKey: 'nav.home', Icon: Home },
  { href: '/movies', labelKey: 'nav.movies', Icon: Film },
  { href: '/shows', labelKey: 'nav.shows', Icon: Tv },
  { href: '/collections', labelKey: 'nav.collections', Icon: LayoutGrid },
  { href: '/watchlist', labelKey: 'nav.watchlist', Icon: Bookmark },
  { href: '/search', labelKey: 'nav.search', Icon: Search },
];

const more: { labelKey: string; Icon: typeof Home }[] = [
  { labelKey: 'nav.iptv', Icon: Radio },
  { labelKey: 'nav.manga', Icon: BookOpen },
  { labelKey: 'nav.sports', Icon: Trophy },
];

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const t = useTranslations();
  const [moreOpen, setMoreOpen] = useState(false);
  const { toast } = useToast();

  return (
    <aside
      aria-label="القائمة الجانبية"
      className={cn(
        'hidden md:flex flex-col',
        'bg-[color:var(--color-bg-surface)]',
        'border-l border-[color:var(--color-border)]',
        'px-2 py-4 gap-1',
        'w-[72px] xl:w-60',
        className
      )}
    >
      <Link href="/" className="mb-2 flex items-center justify-center py-2" aria-label="FADA">
        <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden>
          <circle cx="6" cy="8" r="2" fill="var(--color-accent-gold)" />
          <circle cx="22" cy="10" r="2" fill="var(--color-accent-gold)" />
          <circle cx="14" cy="22" r="2" fill="var(--color-accent-gold)" />
          <line x1="6" y1="8" x2="22" y2="10" stroke="var(--color-accent-gold)" strokeWidth="0.5" opacity="0.5" />
          <line x1="22" y1="10" x2="14" y2="22" stroke="var(--color-accent-gold)" strokeWidth="0.5" opacity="0.5" />
        </svg>
      </Link>

      {main.map(({ href, labelKey, Icon }) => (
        <Link
          key={href}
          href={href}
          aria-current={pathname === href ? 'page' : undefined}
          className={cn(
            'flex items-center gap-3 rounded-md px-3 py-2 text-[var(--fs-sm)]',
            'text-[color:var(--color-fg-muted)] hover:text-[color:var(--color-fg-primary)]',
            'hover:bg-[color:var(--color-bg-elevated)]',
            pathname === href &&
              'text-[color:var(--color-accent-gold)] bg-[color:var(--color-bg-elevated)]'
          )}
        >
          <Icon className="h-5 w-5 shrink-0" aria-hidden />
          <span className="hidden xl:inline">{t(labelKey)}</span>
        </Link>
      ))}

      <hr className="my-2 border-[color:var(--color-border)]" />

      <button
        type="button"
        onClick={() => setMoreOpen((v) => !v)}
        aria-expanded={moreOpen}
        className="flex items-center gap-3 rounded-md px-3 py-2 text-[var(--fs-sm)] text-[color:var(--color-fg-muted)] hover:text-[color:var(--color-fg-primary)]"
      >
        <ChevronDown
          className={cn('h-4 w-4 shrink-0 transition-transform', moreOpen && 'rotate-180')}
          aria-hidden
        />
        <span className="hidden xl:inline">{t('nav.more')}</span>
      </button>

      {moreOpen &&
        more.map(({ labelKey, Icon }) => (
          <button
            key={labelKey}
            type="button"
            onClick={() =>
              toast({
                title: t('common.comingSoon'),
                description: t(labelKey),
              })
            }
            className="flex items-center gap-3 rounded-md px-3 py-2 text-[var(--fs-sm)] text-[color:var(--color-fg-subtle)]"
          >
            <Icon className="h-5 w-5 shrink-0" aria-hidden />
            <span className="hidden xl:inline">
              [{t('nav.soon')}] {t(labelKey)}
            </span>
          </button>
        ))}

      <div className="mt-auto">
        <Link
          href="/settings"
          className={cn(
            'flex items-center gap-3 rounded-md px-3 py-2 text-[var(--fs-sm)]',
            'text-[color:var(--color-fg-muted)] hover:text-[color:var(--color-fg-primary)]',
            pathname === '/settings' &&
              'text-[color:var(--color-accent-gold)] bg-[color:var(--color-bg-elevated)]'
          )}
        >
          <Settings className="h-5 w-5 shrink-0" aria-hidden />
          <span className="hidden xl:inline">{t('nav.settings')}</span>
        </Link>
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```

Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add app/components/fada/Sidebar.tsx
git commit -m "feat(ui): add right-anchored <Sidebar> with More group and soon-toast placeholders"
```

---

## Task 21: Build `<BottomNav>` for mobile

**Files:**
- Create: `app/components/fada/BottomNav.tsx`

- [ ] **Step 1: Write components/fada/BottomNav.tsx**

Create `components/fada/BottomNav.tsx`:

```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Home, Film, Tv, Bookmark, Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Sidebar } from './Sidebar';
import { cn } from '@/lib/utils/cn';

const items = [
  { href: '/', labelKey: 'nav.home', Icon: Home },
  { href: '/movies', labelKey: 'nav.movies', Icon: Film },
  { href: '/shows', labelKey: 'nav.shows', Icon: Tv },
  { href: '/watchlist', labelKey: 'nav.watchlist', Icon: Bookmark },
];

export function BottomNav() {
  const pathname = usePathname();
  const t = useTranslations();

  return (
    <nav
      aria-label="القائمة السفلية"
      className="fixed inset-x-0 bottom-0 z-30 flex items-stretch border-t border-[color:var(--color-border)] bg-[color:var(--color-bg-surface)] md:hidden"
    >
      {items.map(({ href, labelKey, Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            'flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[var(--fs-xs)]',
            pathname === href
              ? 'text-[color:var(--color-accent-gold)]'
              : 'text-[color:var(--color-fg-muted)]'
          )}
          aria-current={pathname === href ? 'page' : undefined}
        >
          <Icon className="h-5 w-5" aria-hidden />
          <span>{t(labelKey)}</span>
        </Link>
      ))}
      <Sheet>
        <SheetTrigger asChild>
          <button
            type="button"
            className="flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[var(--fs-xs)] text-[color:var(--color-fg-muted)]"
            aria-label={t('nav.more')}
          >
            <Menu className="h-5 w-5" aria-hidden />
            <span>{t('nav.more')}</span>
          </button>
        </SheetTrigger>
        <SheetContent side="right" className="p-0 w-64">
          <Sidebar className="!flex h-full w-full" />
        </SheetContent>
      </Sheet>
    </nav>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```

Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add app/components/fada/BottomNav.tsx
git commit -m "feat(ui): add <BottomNav> with Sheet drawer to full sidebar on mobile"
```

---

## Task 22: Wire the root layout

**Files:**
- Create: `app/app/layout.tsx`

- [ ] **Step 1: Write app/layout.tsx**

Create `app/layout.tsx`:

```tsx
import type { Metadata } from 'next';
import '../styles/globals.css';
import { plexArabic, plexMono } from '@/lib/fonts';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { IntlProvider } from '@/components/providers/IntlProvider';
import { Sidebar } from '@/components/fada/Sidebar';
import { BottomNav } from '@/components/fada/BottomNav';
import { FloatingSearchPill } from '@/components/fada/FloatingSearchPill';
import { Toaster } from '@/components/ui/toaster';

export const metadata: Metadata = {
  title: 'FADA | فضاء',
  description: 'Arabic-first streaming browser. Free. Open source. Ad-free.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${plexArabic.variable} ${plexMono.variable}`}>
      <body className="min-h-dvh bg-[color:var(--color-bg-base)] text-[color:var(--color-fg-primary)]">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:right-2 focus:z-50 focus:rounded focus:bg-[color:var(--color-bg-elevated)] focus:px-3 focus:py-2 focus:text-[color:var(--color-fg-primary)]"
        >
          تخطَّ إلى المحتوى
        </a>
        <IntlProvider>
          <QueryProvider>
            <div className="flex min-h-dvh flex-row-reverse">
              <Sidebar />
              <main id="main" className="flex-1 pb-16 md:pb-0">
                {children}
              </main>
            </div>
            <FloatingSearchPill />
            <BottomNav />
            <Toaster />
          </QueryProvider>
        </IntlProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/app/layout.tsx
git commit -m "feat(app): wire root layout with RTL, providers, sidebar, bottom nav, search pill"
```

---

## Task 23: Build the Home page with six TMDB rails

**Files:**
- Create: `app/app/page.tsx`

- [ ] **Step 1: Write app/page.tsx**

Create `app/page.tsx`:

```tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import {
  trending,
  popularArabicMovies,
  trendingAnime,
  popularTurkishDramas,
  popularKoreanDramas,
} from '@/lib/tmdb/endpoints';
import { STALE } from '@/lib/query/client';
import { Rail } from '@/components/fada/Rail';
import { PosterCard } from '@/components/fada/PosterCard';
import { StarLoader } from '@/components/fada/StarLoader';
import type { TmdbListItem } from '@/lib/tmdb/types';

function yearFrom(item: TmdbListItem): string | undefined {
  const d = item.release_date ?? item.first_air_date;
  return d ? d.slice(0, 4) : undefined;
}

function titleOf(item: TmdbListItem): string {
  return item.title ?? item.name ?? '';
}

function typeOf(item: TmdbListItem, fallback: 'movie' | 'tv'): 'movie' | 'tv' {
  return (item.media_type as 'movie' | 'tv') ?? fallback;
}

function RailSection({
  title,
  href,
  queryKey,
  fetcher,
  fallbackType,
  staleTime,
}: {
  title: string;
  href?: string;
  queryKey: string[];
  fetcher: () => Promise<{ results: TmdbListItem[] }>;
  fallbackType: 'movie' | 'tv';
  staleTime: number;
}) {
  const { data, isLoading } = useQuery({ queryKey, queryFn: fetcher, staleTime });
  return (
    <Rail title={title} href={href}>
      {isLoading && (
        <div className="flex w-full items-center justify-center py-8">
          <StarLoader />
        </div>
      )}
      {data?.results?.slice(0, 20).map((item) => (
        <div key={`${typeOf(item, fallbackType)}-${item.id}`} className="snap-start shrink-0">
          <PosterCard
            id={item.id}
            type={typeOf(item, fallbackType)}
            title={titleOf(item)}
            posterPath={item.poster_path}
            year={yearFrom(item)}
          />
        </div>
      ))}
    </Rail>
  );
}

export default function HomePage() {
  const t = useTranslations('home');

  return (
    <div className="flex flex-col gap-8 py-6">
      <RailSection
        title={t('rail.trendingGlobal')}
        href="/movies"
        queryKey={['trending', 'all', 'day']}
        fetcher={() => trending('all', 'day')}
        fallbackType="movie"
        staleTime={STALE.trending}
      />
      <RailSection
        title={t('rail.arabicMovies')}
        href="/movies"
        queryKey={['discover', 'movie', 'ar']}
        fetcher={popularArabicMovies}
        fallbackType="movie"
        staleTime={STALE.trending}
      />
      <RailSection
        title={t('rail.anime')}
        href="/shows"
        queryKey={['discover', 'tv', 'anime']}
        fetcher={trendingAnime}
        fallbackType="tv"
        staleTime={STALE.trending}
      />
      <RailSection
        title={t('rail.turkish')}
        href="/shows"
        queryKey={['discover', 'tv', 'tr']}
        fetcher={popularTurkishDramas}
        fallbackType="tv"
        staleTime={STALE.trending}
      />
      <RailSection
        title={t('rail.korean')}
        href="/shows"
        queryKey={['discover', 'tv', 'ko']}
        fetcher={popularKoreanDramas}
        fallbackType="tv"
        staleTime={STALE.trending}
      />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/app/page.tsx
git commit -m "feat(home): add Home page with six TMDB-powered rails"
```

---

## Task 24: Stub the remaining top-level routes

**Files:**
- Create: `app/app/movies/page.tsx`, `app/app/shows/page.tsx`, `app/app/collections/page.tsx`, `app/app/watchlist/page.tsx`, `app/app/search/page.tsx`, `app/app/settings/page.tsx`

- [ ] **Step 1: Create the shared shell file**

Create `components/fada/RouteShell.tsx`:

```tsx
import { StarEmptyState } from './StarEmptyState';

export function RouteShell({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col gap-4 p-6">
      <h1 className="text-[var(--fs-xl)] font-bold">{title}</h1>
      <StarEmptyState title="قيد التطوير" description={description} />
    </div>
  );
}
```

- [ ] **Step 2: Create each route page**

Create `app/movies/page.tsx`:

```tsx
import { RouteShell } from '@/components/fada/RouteShell';
export default function Page() {
  return <RouteShell title="الأفلام" description="صفحة التصفح قادمة في خطة العمل التالية." />;
}
```

Create `app/shows/page.tsx`:

```tsx
import { RouteShell } from '@/components/fada/RouteShell';
export default function Page() {
  return <RouteShell title="المسلسلات" description="صفحة التصفح قادمة في خطة العمل التالية." />;
}
```

Create `app/collections/page.tsx`:

```tsx
import { RouteShell } from '@/components/fada/RouteShell';
export default function Page() {
  return <RouteShell title="المجموعات" description="المجموعات قادمة في خطة العمل التالية." />;
}
```

Create `app/watchlist/page.tsx`:

```tsx
import { RouteShell } from '@/components/fada/RouteShell';
export default function Page() {
  return <RouteShell title="قائمتي" description="قائمة المشاهدة الكاملة قادمة في خطة العمل التالية." />;
}
```

Create `app/search/page.tsx`:

```tsx
import { RouteShell } from '@/components/fada/RouteShell';
export default function Page() {
  return <RouteShell title="البحث" description="البحث والاستكشاف قادمان في خطة العمل التالية." />;
}
```

Create `app/settings/page.tsx`:

```tsx
import { RouteShell } from '@/components/fada/RouteShell';
export default function Page() {
  return <RouteShell title="الإعدادات" description="الإعدادات الكاملة قادمة في خطة العمل التالية." />;
}
```

- [ ] **Step 3: Commit**

```bash
git add app/components/fada/RouteShell.tsx app/app/movies app/app/shows app/app/collections app/app/watchlist app/app/search app/app/settings
git commit -m "feat(app): scaffold shell routes for movies/shows/collections/watchlist/search/settings"
```

---

## Task 25: Create the .env.example and wire the dev token flow

**Files:**
- Create: `app/.env.example`

- [ ] **Step 1: Write .env.example**

Create `.env.example`:

```
# TMDB v4 read-access token (public-by-design in this repo; falls back if user
# supplies their own in Settings after Plan 3).
NEXT_PUBLIC_TMDB_TOKEN=
```

- [ ] **Step 2: Document locally**

Append to `README.md` after the Dev section:

```markdown
## TMDB token

Copy `.env.example` to `.env.local` and paste a TMDB v4 read-access token you generate at
https://www.themoviedb.org/settings/api. Until Plan 3 ships, there is no in-app override.
```

- [ ] **Step 3: Commit**

```bash
git add app/.env.example app/README.md
git commit -m "docs: add .env.example with TMDB token placeholder"
```

---

## Task 26: Playwright smoke test

**Files:**
- Create: `app/playwright.config.ts`, `app/tests/e2e/smoke.spec.ts`

- [ ] **Step 1: Write playwright.config.ts**

Create `playwright.config.ts`:

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
```

- [ ] **Step 2: Install the browser**

```bash
npx playwright install chromium
```

- [ ] **Step 3: Write the smoke test**

Create `tests/e2e/smoke.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

test('home loads with RTL, sidebar, search pill, and at least one rail header', async ({ page }) => {
  await page.goto('/');

  // RTL direction
  const dir = await page.evaluate(() => document.documentElement.dir);
  expect(dir).toBe('rtl');

  // Sidebar present (desktop)
  await page.setViewportSize({ width: 1400, height: 900 });
  await expect(page.getByRole('complementary', { name: /القائمة الجانبية/ })).toBeVisible();

  // Search pill button
  await expect(page.getByRole('button', { name: /البحث/ })).toBeVisible();

  // At least one rail header rendered
  await expect(page.getByRole('heading', { name: /الرائج عالميًا/ })).toBeVisible();
});

test('logo link returns to home from every route', async ({ page }) => {
  for (const route of ['/movies', '/shows', '/collections', '/watchlist', '/search', '/settings']) {
    await page.goto(route);
    await page.getByLabel('FADA').click();
    await expect(page).toHaveURL('/');
  }
});
```

- [ ] **Step 4: Run Playwright**

```bash
NEXT_PUBLIC_TMDB_TOKEN=placeholder npm run test:e2e
```

(The placeholder token is fine — the smoke tests don't assert on TMDB content; they check the shell renders.)

Expected: both tests pass.

- [ ] **Step 5: Commit**

```bash
git add app/playwright.config.ts app/tests/e2e/smoke.spec.ts
git commit -m "test(e2e): add Playwright smoke test for RTL, sidebar, search pill, logo link"
```

---

## Task 27: Verify static export builds cleanly

- [ ] **Step 1: Build**

```bash
NEXT_PUBLIC_TMDB_TOKEN=placeholder npm run build
```

Expected: clean build. An `out/` directory is produced.

- [ ] **Step 2: Verify the output**

```bash
ls out/
```

Expected: `index.html`, `movies/`, `shows/`, `collections/`, `watchlist/`, `search/`, `settings/`, `_next/`.

- [ ] **Step 3: Serve it and spot-check**

```bash
npx serve out -l 4000
```

Visit `http://localhost:4000` in a browser. The home page should load with the sidebar (right), the floating search pill (top-left), and six rail headings. TMDB calls will 401 with the placeholder token — that is expected; the layout still renders.

Stop the serve process when done.

- [ ] **Step 4: Commit anything that changed**

Typically nothing new to commit here, but if the build generated any unignored files, add them and commit:

```bash
git status
# If needed:
# git add <files>
# git commit -m "chore: update build artifacts"
```

---

## Task 28: Final plan-1 acceptance pass

- [ ] **Step 1: Run the full test suite**

```bash
npm run test && npm run typecheck && npm run lint
```

Expected: all green.

- [ ] **Step 2: Acceptance checklist (manual, tick as verified)**

- [ ] `dir="rtl"` on `<html>`
- [ ] Sidebar anchored on the right at ≥ 1024px
- [ ] Bottom nav visible at < 768px; sidebar hidden; sheet opens the full sidebar on "More"
- [ ] Floating search pill visible at top-left from every route; expands on click; `/` key expands from anywhere except other inputs
- [ ] At least one curated home rail visibly populated when `NEXT_PUBLIC_TMDB_TOKEN` is a valid token
- [ ] Logo returns to `/` from every route (Playwright smoke test passes)
- [ ] `More` items open a toast, never navigate to a broken page
- [ ] `npm run build` produces `out/` successfully

- [ ] **Step 3: Tag the milestone**

```bash
cd "/home/ahmed/Projects/Fada | فضاء"
git tag -a p1-plan-1 -m "P1 Plan 1 complete: foundation, tokens, shell, Home with six TMDB rails"
```

---

## Deferred to later plans

| Plan | Scope |
|---|---|
| Plan 2 | Browse (`/movies`, `/shows`) with filters, Detail pages (Movie + Show), Cast drawer, Watchlist grid + export/import, Collections index + deep (non-constellation) |
| Plan 3 | Search + Discover, full Settings (general, my-data, TMDB token override, about) |
| Plan 4 | Hero constellation canvas, collection constellation cards + deep, TV focus model polish, axe CI gates, Lighthouse perf gates, full E2E suite |

---

## Changelog

- **2026-04-23** — Plan 1 written. Covers foundation through Home with six rails.
