---
tags:
  - conventions
  - meta-plan
date: 2026-04-24
status: active
applies_to: all phases
---

# 00 — Conventions

> **Shared conventions referenced by every plan file in this folder.** When a plan says "follow conventions", this is the document it means. When this document disagrees with a plan, this wins for cross-cutting concerns; the plan wins for task-specific technical calls.

---

## 1. Plan file anatomy

Every plan file in this folder follows this shape:

```markdown
---
tags: [plan, pX]
date: YYYY-MM-DD
status: ready | in-progress | done
phase: PX (vX.Y.Z) — Plan N of M
depends_on: [previous plan files]
unlocks: [following plan files]
related:
  - "[[../specs/...]]"
  - "[[../../DESIGN]]"
---

# FADA PX — Plan N: <title>

**Goal.** One paragraph: what ships when every task is checked.
**Architecture.** One paragraph: the shape of the code, the hot paths, the new dependencies.
**Tech stack.** Additions beyond what earlier plans installed.
**Spec reference.** Exact file + section.

## Scope of this plan
### In scope
- bullet list
### Out of scope (deferred)
- bullet list with the plan file or phase that will pick it up

## Prerequisites
Bullet list of prior tasks / system state required.

## File structure created by this plan
Fenced tree diff — only new and modified paths.

## Task N: <short title>
Numbered, self-contained steps, each a `- [ ]` checkbox. Each task block includes:
- what you're building (1–2 sentences)
- acceptance criterion for the task (how you'll know it's done)
- test expectations (what unit/component/E2E tests to add)

## Acceptance gate
Checklist for the plan as a whole. No plan is "done" until every line here is green.

## Handoff to next plan
What state the code is in. What assumptions the next plan can make.
```

## 2. Task checkbox contract

- Each task is a single `## Task N: <title>` heading.
- The first bullet under the heading is a `- [ ]` checkbox with a short name.
- Sub-steps are nested bullets (no checkboxes) — those are substance, not tracking.
- When the task is done, flip `- [ ]` to `- [x]` **and** mirror the flip in `TODO.md §3–7`.
- If a task grows beyond ~8 sub-bullets, split it into `Task N.A`, `Task N.B`.

## 3. Required sub-skills

Every plan runs under one of these two sub-skills — declared in the plan's frontmatter note.

- **`superpowers:executing-plans`** — default for human-driven execution. One task at a time, review checkpoint at the end of each plan.
- **`superpowers:subagent-driven-development`** — for plans with ≥ 5 independent tasks that can parallelize. Mandatory for P4/P5 (provider adapters and manga source adapters are embarrassingly parallel).

When in doubt, use `executing-plans`. Parallelism is a performance hack, not a correctness feature.

## 4. Git workflow

### 4.1 Branches

- `main` — always releasable. Protected. Only PRs merge here.
- `phase/pN` — long-lived integration branch per phase (e.g., `phase/p2`).
- `plan/pN-M-slug` — per-plan integration branch (e.g., `plan/p2-1-resolver-architecture`).
- `task/pN-M-T-slug` — per-task feature branch (e.g., `task/p2-1-3-fallback-chain`).

Flow: `task/*` → PR into `plan/*` → PR into `phase/*` → PR into `main` at release time.

For small solo-dev passes, `plan/*` may merge directly into `main` with a squash. Phase integration is only mandatory when ≥ 3 concurrent plans share a branch.

### 4.2 Commit messages

Conventional-commits-ish. Arabic allowed in commit bodies; subject line in English for `git log --oneline` readability.

```
<type>(p<N>-<M>): <subject>

<body — optional, Arabic welcome>

Refs: TODO.md §3 P1-1 Task 7
Closes: #<issue>
```

Types: `feat`, `fix`, `refactor`, `perf`, `docs`, `test`, `chore`, `ci`, `style`, `revert`.

Examples:

```
feat(p1-1): add <Sidebar> with five responsive states
fix(p2-1): VidSrc adapter trims trailing slash in tmdbId param
test(p1-4): Never-Weird E2E — logo returns home from every route
```

### 4.3 Pull request template

A PR into `main` must include:

- [ ] Which plan(s) and task(s) this closes (`TODO.md §3–7` link)
- [ ] Acceptance gate items ticked
- [ ] Screenshots of any UI change (mobile + desktop)
- [ ] Whether DESIGN.md was consulted (yes / not-applicable)
- [ ] Whether conventions were consulted (this file)
- [ ] Whether any invariant in `TODO.md §9` was changed (if yes, how)

## 5. Lint rules

Enforced by ESLint; violations break CI. Rule authoring lives in `app/.eslintrc.cjs`, installed in Plan P1-1 Task 2.

### 5.1 Styling
- `no-restricted-syntax` — ban `left:` / `right:` in `*.css` / `*.tsx` inline styles. Use `inline-start` / `inline-end` logical properties.
- `no-restricted-syntax` — ban `margin-left` / `margin-right` / `padding-left` / `padding-right` in JSX `style={{}}` objects.
- `no-restricted-syntax` — ban `text-[N]px` Tailwind arbitrary values where N < 13 and the element's i18n key starts with `ar.`.

### 5.2 Localization
- Custom rule `fada/no-hardcoded-arabic` — any string literal with Arabic Unicode range (U+0600–U+06FF, U+0750–U+077F, U+08A0–U+08FF, U+FB50–U+FDFF, U+FE70–U+FEFF) inside `components/` must resolve to an `t()` call from next-intl. Exception: `content/collections/*/collection.json` and `messages/ar.json`.

### 5.3 Storage
- Custom rule `fada/no-direct-localstorage` — `localStorage.setItem` / `localStorage.getItem` calls outside `lib/storage/*` are errors. Use the Zustand store.

### 5.4 React / Next
- `@typescript-eslint/strict-boolean-expressions` (strict) — no truthy-coerce on unknown.
- `react-hooks/exhaustive-deps` (error).
- Ban default exports for components (named only) — makes refactor grep tractable.
- `no-restricted-imports` — ban deep imports from `@tanstack/react-query` internals; only the public surface.

### 5.5 Accessibility
- `jsx-a11y/click-events-have-key-events` (error).
- `jsx-a11y/anchor-is-valid` (error).
- Custom rule `fada/logo-is-anchor` — the `<LogoMark>` component must appear inside an `<a>` or `<Link>`. Blocks DESIGN.md §4.4 regression.

## 6. Test discipline

### 6.1 Unit tests

Live beside the module: `lib/foo/bar.ts` → `lib/foo/bar.test.ts`.

- Vitest + `@testing-library/react` for components; `@testing-library/jest-dom` for DOM matchers.
- Fast feedback loop: run with `npm test -- <path>`.
- Mock boundaries at HTTP (use `msw`), not at module level — a mocked module mocks away the bug.
- Snapshot tests are banned except for:
  - Zod schema serializations
  - Tailwind-class-emission sanity (one per component)

### 6.2 Component tests

Live in `tests/component/`. Headless Vitest+jsdom.

- Test the component API, not its internals. Props in, ARIA/text out.
- RTL-integrity assertion on every component with a direction-dependent layout: `expect(container).toHaveAttribute('dir', 'rtl')` or a child-order test.

### 6.3 E2E tests

Live in `tests/e2e/`. Playwright, Chromium + WebKit.

- Run against the static export (`npm run build && npm run preview`), not `npm run dev`, so tests hit the real build.
- Tag tests with phase: `test.describe.configure({ tag: '@p1' })`.
- Every public route has:
  - A happy-path test
  - An offline-cached test (where applicable)
  - An axe-core violation scan (zero violations)
- Arabic visible-copy assertions use Unicode literals, never ASCII transliterations.

### 6.4 Definition of "test passing"

`npm test` + `npm run test:e2e` both exit 0. CI must agree. Local pass without CI pass does not count.

## 7. CI pipeline

Single GitHub Actions workflow at `.github/workflows/ci.yml`, authored in Plan P1-4 Task 16.

Stages, in order:

1. **Install** — `npm ci --prefer-offline`.
2. **Typecheck** — `npm run typecheck`.
3. **Lint** — `npm run lint`.
4. **Unit + component** — `npm test -- --run`.
5. **Build** — `npm run build`.
6. **E2E** — `npm run test:e2e` against the built bundle.
7. **axe-core** — `@axe-core/playwright` scan of every route, fail on any violation.
8. **Lighthouse** — `@lhci/cli` assert perf ≥ 90 on Home + Detail, desktop + mobile.
9. **Bundle budgets** — custom script in `scripts/check-bundle-budgets.mjs`: initial JS ≤ 180KB gz on Home, constellation chunk ≤ 40KB gz.
10. **Collection lint** — `scripts/lint-collections.mjs`: every `content/collections/*/collection.json` has all required fields and hand-placed node positions.

CI is never green-with-warnings. Warnings are errors. If you disagree with a lint rule, fix the rule (and reference the change in `TODO.md §10 Decision log`), don't suppress it locally.

## 8. Definition of Done — template per task

Every task in every plan must satisfy this list before checked off. Tasks may add to it; they may not subtract.

- [ ] Code compiles (`npm run typecheck`) with 0 errors.
- [ ] Lints (`npm run lint`) with 0 errors.
- [ ] Unit + component tests for the new behavior exist and pass.
- [ ] If the task touches a UI surface: screenshot attached in the PR, mobile + desktop.
- [ ] If the task touches a route: E2E test present and green.
- [ ] If the task touches storage: round-trip test (write → reload → read).
- [ ] If the task adds user-facing copy: string lives in `messages/ar.json` (plus any other active locale).
- [ ] If the task adds a new dependency: it's in `package.json` exact-version, license is MIT/BSD/ISC/Apache-2.0, and size is noted in PR description.
- [ ] If the task changes an invariant in `TODO.md §9`: amended and logged.
- [ ] TODO.md entry ticked.

## 9. Dependency policy

- Every new runtime dependency must be justified in the PR body. "I like this library" is not justification.
- **License allow-list:** MIT, BSD-2-Clause, BSD-3-Clause, ISC, Apache-2.0. Copyleft (GPL, LGPL, AGPL) is banned by default — requires explicit sign-off in the decision log.
- **Size budget:** a new runtime dep > 30KB gzipped requires a teardown note: what it does for us, what we'd write instead.
- Pin exact versions in `package.json`. No `^` / `~` caret. Renovate/Dependabot handles updates in separate PRs.
- **No telemetry-phoning deps.** Before merge, `grep -r 'fetch\|XMLHttpRequest' node_modules/<new-dep>` and document any outbound calls.

## 10. Security & secrets

- There are no server-side secrets (static export). The public TMDB v4 read-access token is shipped in the bundle by design — it's not secret, it's a public read key per TMDB's docs.
- **Never commit** a user-supplied TMDB token, test fixtures with real user data, or any `.env.local`.
- `.env.example` is the only committed env template. All variables are `NEXT_PUBLIC_*` since we build statically.
- Hooks in `.git/hooks/pre-commit` run `git-secrets` + `trufflehog` against the diff.

## 11. Accessibility discipline

Applies to every component, every task, every phase.

- **Minimum Arabic body text: 14px.** Codified as a lint rule (§5.1). No exceptions.
- **Keyboard reachability:** every interactive element has a focus ring. 3px gold, 2px offset.
- **ARIA:** Radix primitives handle it for shadcn/ui. Custom components must declare role/aria explicitly.
- **Reduced motion:** every animation respects `prefers-reduced-motion`. Test with `page.emulateMedia({ reducedMotion: 'reduce' })` in Playwright.
- **Zoom:** 200% browser zoom → layouts intact. Rem units for sizing.
- **Screen-reader diff:** P3 Task 8 runs a VoiceOver walk of every route.

## 12. Performance budgets

| Surface | Budget | Measured where |
|---|---|---|
| Initial JS (Home) | ≤ 180KB gz | `scripts/check-bundle-budgets.mjs` |
| Constellation chunk | ≤ 40KB gz | same |
| LCP (Home, mobile emul.) | ≤ 2.5s | Lighthouse CI |
| CLS | ≤ 0.05 | Lighthouse CI |
| TBT | ≤ 200ms | Lighthouse CI |
| Canvas frame time | ≤ 16.7ms avg | Plan P1-4 Task 2 dev harness |
| TMDB request P95 | ≤ 600ms | React Query devtools, anecdotal |

When a budget is exceeded, the build fails. Fix the regression or re-negotiate the budget in `TODO.md §10 Decision log` with a second human review.

## 13. Versioning & release

- SemVer strict for user-facing.
- Pre-release candidates: `v0.1.0-rc.1`, then `v0.1.0`. QA checklist in the plan's `## Manual QA before tagging` block.
- Changelog auto-drafted from commit messages (Conventional Commits) at release time. Hand-edited for the user-facing `/settings/about` entry.
- GitHub Release artifact = the static export tarball (`dist-vX.Y.Z.tar.gz`) + the `source-vX.Y.Z.zip` for source preservation.

## 14. Handling errors and incidents

- **User-facing errors speak Arabic** and degrade gracefully: a banner, then a retry, then a safe-default.
- Internal error throws include a stable `code:` prefix (e.g., `TMDB_RATE_LIMIT`, `RESOLVER_ALL_FAILED`, `STORAGE_MIGRATION_FAILED`) so error taxonomies in P3 Task 7 can unify.
- `console.error` in production is allowed only for developer-targeted diagnostics; `console.warn`/`log` banned at build time (ESLint).
- No crash analytics, no phoning home. If a user wants to report a bug, they copy a diagnostic bundle (P3) and paste into a GitHub Issue.

## 15. Documentation

Lives under `docs/` in the Next.js project. These are the canonical docs:

| File | Purpose | Authored in |
|---|---|---|
| `docs/architecture.md` | System overview, data flow | P3 Task 10 |
| `docs/contributing.md` | How to add a collection / provider / adapter / locale | P3 Task 10 |
| `docs/collections.md` | Collection authoring, position tool | P3 Task 11 |
| `docs/provider-ethics.md` | Legal/ethical stance on embeds | P2-1 Task 22 |
| `docs/cors-strategy.md` | How resolver handles CORS per provider | P2-1 Task 5 |
| `docs/keyboard.md` | Every shortcut in the app | P1-3 Task 14 |
| `docs/release-process.md` | Cut a release | P3 Task 13 |

The vault's `specs/` and `plans/` (this folder) are kept in sync but are *not* published docs — they're the engineering record.

## 16. Cross-linking

- Every plan file cross-links `TODO.md` (as index) and any plan it depends on or unlocks.
- Every `## Task` block cross-links the DESIGN.md section it implements, when applicable.
- Obsidian `[[wikilinks]]` are fine inside the vault. Cross-repo links use relative paths so GitHub renders them.

## 17. When to update this file

Amend this file when:

- A lint rule is added, removed, or tightened.
- A CI stage is added, removed, or reordered.
- A budget changes.
- The branching/PR flow changes.
- A license rule changes.

Do not amend this file casually. Every change lands via a PR into `main` with a note in `TODO.md §11 Change log`.
