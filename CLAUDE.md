# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project state

**Pre-implementation.** No `package.json`, no build, no tests exist yet. The repo currently holds the approved design spec, four sequenced implementation plans, and standalone HTML/JSX prototypes. Implementation starts by executing `vault/plans/2026-04-23-fada-p1-plan-1-foundation-and-home.md`, which scaffolds a Next.js 15 project at `./app/` (sibling of `vault/`).

Until `app/` exists, all "commands", paths, and file layouts referenced below are *targets* defined by the plans, not current reality.

## What FADA is

FADA | فضاء is a **streaming middleman** web app: Arabic-first (RTL), ad-free, open-source, distributed only via GitHub. It does not host or store media. Metadata comes from TMDB/IMDb; playback (P2+) resolves through embed providers (VidSrc, VidLink, 2Embed, etc. — catalogued in `vault/More/Embed Providers.md`) with a scraping fallback.

Phased roadmap (from `vault/index.md`):

- **P1 / v0.1 — Foundation & UI/UX** (current target): fully-designed content browser with no playback.
- **P2 / v0.2** — backend resolver, embed pipeline, progress tracking, subtitles.
- **P3 / v1.0** — cleanup, perf, stabilization.
- **P4 / v1.1** — IPTV & live sports.
- **P5 / v1.2** — manga/comics reader.

## Repository layout

```
vault/                              # Obsidian knowledge base — source of truth
  index.md                          # project charter, phases, distribution policy
  specs/
    2026-04-23-fada-p1-ui-ux-design.md   # approved P1 design spec (the contract)
  plans/
    2026-04-23-fada-p1-plan-1-foundation-and-home.md
    2026-04-23-fada-p1-plan-2-browse-detail-watchlist-collections.md
    2026-04-23-fada-p1-plan-3-search-discover-settings.md
    2026-04-23-fada-p1-plan-4-constellation-and-gates.md
  More/
    UI-UX.md
    Embed Providers.md              # provider catalogue for P2+
UI-UX.Concept/FADA _ فضاء/          # standalone visual prototypes (not the codebase)
  FADA.html                         # single-file HTML mock
  app.jsx / tweaks-panel.jsx        # React prototype (mock data, inline icons)
app/                                # (does not exist yet) — Next.js project created by Plan 1
```

## Executing the plans

Each `vault/plans/*.md` file is an ordered, checkbox-tracked implementation plan. Its header specifies:

> REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

Plans are sequential — Plan 2 builds on Plan 1, etc. Do not skip ahead or reshape the scope; each plan explicitly lists what is deferred to which later plan. The spec (`vault/specs/...`) is the contract the plans implement against. If a plan and the spec disagree, the spec wins and the plan should be corrected.

## Architectural decisions that pervade every file

These are invariants carried from the spec — changing them means revisiting §1.3 of the spec, not editing locally.

- **Next.js 15 App Router, static export (`output: 'export'`)**. No server runtime. Hostable on GitHub Pages / Cloudflare Pages / any static host.
- **RTL-first, Arabic-only UI copy.** `<html dir="rtl" lang="ar">`. All strings live in `messages/ar.json` (next-intl); hard-coded Arabic in components is a lint error. i18n plumbing is ready for additional languages; strings are not.
- **CSS logical properties only** (`margin-inline-*`, `inset-inline-*`, etc.). No `left`/`right`. Posters, backdrops, and the constellation canvas are *not* mirrored; the sidebar, rails, chevrons, and toasts are.
- **Design tokens are the single source of truth.** `tokens/design-tokens.json` → generator emits Tailwind theme + CSS variables. Tune the JSON, not the consumers. Palette is 60-30-10 with `accent.gold = #E6B64A` as the sole accent.
- **TMDB is the only data source in P1.** Single client at `lib/tmdb/client.ts`; custom token (localStorage) takes precedence over the shipped public v4 read-access token.
- **State boundaries:** server state → React Query (with `persistQueryClient` to localStorage); user data (watchlist / prefs / recent searches) → Zustand + Zod-validated persistence under root key `fada.v1`; filter/search state → URL params. Direct `localStorage.setItem` in components is a lint error.
- **No playback in P1.** Any episode/play action fires the "المشاهدة قادمة في الإصدار 0.2" toast. Do not add a stub player.
- **The constellation is contained.** Canvas rendering lives only in `components/constellation/` and is lazy-loaded (`next/dynamic`). Every star has a hidden focusable `<a>` mirror; the canvas itself is `aria-hidden`. Reduced-motion disables twinkle/parallax.
- **"Never-Weird" anchor tests are acceptance criteria**, not guidelines: logo always returns to `/`, sidebar/logo/poster-card shape identical across every route, body text ≥ 4.5:1 contrast. Codified as E2E tests in Plan 4.

## Commands (after `app/` is scaffolded by Plan 1)

All commands run from `app/`. Prereqs: Node.js ≥ 20, npm ≥ 10.

```bash
npm run dev                         # Next dev server
npm run build                       # static export to out/
npm run lint
npm run typecheck
npm test                            # Vitest unit + component
npm test -- <path-or-pattern>       # run a single test file / pattern
npm run test:e2e                    # Playwright E2E
npm run test:e2e -- --grep "<title>"  # single E2E test
npm run tokens                      # regenerate CSS vars + Tailwind theme from tokens/design-tokens.json
```

CI gates that must pass before tagging v0.1 (Plan 4): axe-core zero violations on every route, Lighthouse Performance ≥ 90 on Home + a Detail page (desktop & mobile), Never-Weird E2E suite green, initial JS ≤ 180KB gzipped on Home, constellation chunk ≤ 40KB gzipped.

## Contribution surfaces (intentional, don't bypass)

- `content/collections/<slug>/` — drop `collection.json` + `cover.jpg` to add a curated editorial collection. Schema in spec §5.3. Optional `nodes[].x/y` enable hand-placed constellations; omitting them triggers the force-directed fallback.
- `messages/<locale>.json` — future language files.
- `tokens/design-tokens.json` — palette / type / motion tuning cascades through the generator.

## Working with the Obsidian vault

`vault/` is an Obsidian vault (note the `.obsidian/` config). Cross-references use `[[wikilinks]]`. When editing notes, preserve frontmatter and the existing navigation footer pattern (`[Prev] | N | [Next]`). The spec at `vault/specs/2026-04-23-fada-p1-ui-ux-design.md` is marked `status: approved` — treat changes to it as a design revision, not a tweak.
