# DESIGN.md — FADA | فضاء · UI/UX Concept (Final)

> **What this is.** A critical reconciliation of the approved spec (`vault/specs/2026-04-23-fada-p1-ui-ux-design.md`) with the live prototype (`UI-UX.Concept/FADA _ فضاء/`). Written to settle the tension between "80% familiar / 20% strange" as a *stated* principle vs. what the prototype actually ships on first paint. Treat this as the source of truth for P1 implementation. Where this document disagrees with the spec, this document wins (and the spec should be amended).
>
> **Scope.** P1 visual and interaction concept only. Backend/embed pipeline (P2+) is out of scope.

---

## 1. Reading the evidence

- **Spec** — approved, comprehensive, 676 lines. Locks the stack, tokens, IA, and "Never-Weird" anchors. No open questions.
- **Prototype** — `FADA.html` (hand-written CSS) + `app.jsx` (React via Babel standalone, 1000+ lines, mock data). Demonstrates: constellation hero with auto-advance, right-anchored 64px icon sidebar, floating search pill with `/` shortcut, 6-column browse grid, detail hero with tabs, mini-constellation collection cards, empty-watchlist SVG constellation, settings sections.
- **Plans** — four sequential implementation plans; the concept delta below does not contradict them, but Plans 1–4 must absorb the changes in §5.

## 2. Verdict

The metaphor is sound — فضاء → night sky → constellation — and the palette/typography choices are correct for an Arabic-first, ad-free, long-dwell browser. **But the prototype over-serves the "strange" 20%: the constellation hero dominates first paint, auto-advances, and out-shouts the editorial caption it is supposed to decorate.** Tighten the signature to contexts where it *earns* the screen real estate (deep collection pages), shrink its footprint on Home, and rebuild two to three decisions (hero height, auto-advance, episode-row toasts, mobile filter-bar, tooltip type size) that quietly fail the spec's own "Can my dad read it?" test.

Below, §3 is what to keep, §4 is what to change (with fixes), §5 is the consolidated final concept.

## 3. What the concept gets right — keep

1. **Metaphor containment** is the right instinct (spec §5). Constellation lives only on Home hero + Collections; everywhere else is a streaming app. Do not leak stars into `<PosterCard>`, `<EpisodeRow>`, or `<FilterBar>`.
2. **60-30-10 palette with a single gold accent (`#E6B64A`)**. The gold is warm enough to survive on the near-black `#0B0D14` base without feeling cheap; it maps to both a "star" and an "Arabic-manuscript gold-leaf" read, which doubles its cultural register.
3. **Right-anchored sidebar + floating search pill in the top-left negative space**. The asymmetry solves RTL elegantly: the search pill claims the "weak corner" that a Latin-first app would never give up, and it scales to an icon on scroll (prototype does this cleanly).
4. **Monospace-numerics discipline** (IBM Plex Mono for runtimes, years, ratings) is a quiet differentiator and genuinely supports the "star catalog" register without shouting.
5. **Editorial collections as a JSON + cover PR surface** is the correct community contract for a no-backend, no-account project. Don't water it down into an admin UI.
6. **Logical-properties-only CSS rule**. Codify it as a lint error, not a convention.
7. **Versioned localStorage (`fada.v1`) with Zod guards at the boundary**. Future migrations will thank you.

## 4. Critique — what to change

### 4.1 The hero is too loud for first paint

- **Evidence.** `FADA.html:195` sets `.hero { height: 80vh; min-height: 600px; }`. `app.jsx:285` sets `CYCLE = 7000` (auto-advancing carousel). The hero ships with five featured collections rotating every 7s, 80vh of canvas, with a `CONSTELLATION · N NODES · M LINES` techy meta-strip on top of it.
- **Why it fails.** "80% familiar" is measured by *screen time and cognitive load*, not route count. On first paint of Home, the user sees 80vh of constellation before a single poster. The signature is paying for itself once; after that, it taxes every visit. Auto-advance also breaks the stated "quiet, purposeful" voice (spec §2.3 motion tokens are 120/220/400ms — not 7000ms carousels).
- **Fix.**
  - Home hero: **60vh desktop / 50vh tablet / 44vh mobile**. Min-height 480 desktop, 360 mobile. (80vh is reserved for `/collections/curated/[slug]` and `/collections/tmdb/[id]` deep pages — one featured collection, no rotation, *that* page earns the size.)
  - **No auto-advance on Home.** A single featured editorial collection per week (`content/collections/featured.json` pointer). Manual prev/next pips remain for power users; no timer.
  - Remove the `CONSTELLATION · N NODES · M LINES` meta-strip. Tech-flexing the mechanism undermines the warmth. If you want a diegetic label, use `"مجموعة مختارة · ٧ عناوين"` (curated · 7 titles) in Arabic prose type, not mono caps.

### 4.2 Poster-masked vs. colored-hue stars — pick one

- **Evidence.** Spec §5.1 says foreground nodes are "poster masked into a soft disc (80px) with a faint gold glow". Prototype (`app.jsx:424-452`) draws the nodes as colored radial gradients keyed to `n.hue`, with a gold outline and a gold center dot — no poster at all.
- **Why it fails.** Both approaches are fine individually; together they compete. The per-hue color (`oklch(0.7 0.15 ${n.hue})`) carries semantic weight (hue = what?), but it's authored per-collection with no meaning the user can decode. A hue without a legend is decoration masquerading as information.
- **Fix.**
  - **Default mode: poster-masked discs.** Poster rendered into a circle mask, soft gold glow, 80px desktop / 56px mobile. This is the spec's intent; honor it.
  - **Reduced-motion mode / no-image-loaded fallback:** monochrome gold disc with the title's first Arabic glyph centered (Plex Sans Arabic Bold). No hue variance.
  - **Retire `nodes[].hue`** from the collection JSON schema. It was never legible; deleting it simplifies the authoring contract.

### 4.3 Episode rows → toast spam

- **Evidence.** Spec §4.5 and prototype (`app.jsx:731`) fire the `"المشاهدة قادمة في الإصدار v0.2"` toast on every episode-row click. A show with 179 episodes (spec's own Ertuğrul example) can produce 179 identical toasts.
- **Why it fails.** Toasts are for transient confirmations, not stable state. Repeated-identical toasts train users to ignore all toasts — the "الخدمة مشغولة" 429 message and the successful-import confirmation lose their signal.
- **Fix.** One **persistent banner** at the top of the Episodes tab: `"🌙 المشاهدة قادمة في v0.2 — تصفّح التفاصيل الآن"`. Episode rows become `cursor: default`, focusable but non-activating (role = presentation article, not button). Click on an episode scrolls+focuses the overview panel with that episode's summary, never a toast. This also fixes screen-reader spam.

### 4.4 Sidebar doesn't deliver the responsive promise

- **Evidence.** Spec §7.2 prescribes: mobile drawer / tablet 64px / desktop 72px / wide 240px / tv 280px. Prototype locks the sidebar at 64px on all viewports ≥ 1024px (`FADA.html:41`) and simply `display: none` below (line 481). No drawer, no wide-mode labels, no TV mode.
- **Why it fails.** TV-friendly is a stated P1 goal (Q14) — a 64px icon rail with tooltip-only labels fails at 3m. "Wide 240px full" is a big UX lift that the prototype never demonstrated.
- **Fix.** Build all five states in Plan 1 (no deferrals to Plan 4):
  - `< 768`: hamburger → full-height `<Sheet>` drawer with labeled items + mobile bottom nav persistent.
  - `768–1023`: 64px icon rail, labels on hover tooltip.
  - `1024–1439`: 72px icon rail, labels on hover tooltip.
  - `1440–1919`: **240px labeled rail** — labels always visible, gold active-indicator bar on the inline-end.
  - `≥ 1920`: 280px labeled rail + 3px gold focus ring at 2px offset, remote-key bindings wired.
- **Logo is a real `<a href="/">`, not a div.** Prototype (`app.jsx:220`) wraps the SVG in a `.brand` with no anchor. The first Never-Weird acceptance test is "logo always returns home"; make it unskippable by making it a link from day one.

### 4.5 Tooltip and small-label typography fails the Dad test

- **Evidence.** `FADA.html:283` sets `.star-tooltip .t` at `font-size: 13px` and `.star-tooltip .m` at **`font-size: 11px`**. Sidebar footer at 9px. Episode meta at 12px mono. Section kicker at 11px mono.
- **Why it fails.** Arabic script optical size needs **+1–2px over Latin** for equivalent x-height legibility. 11px Arabic body copy is sub-WCAG in practice on sub-pixel-rendered Wayland + HiDPI laptops. The spec itself requires AA for body and the "Dad test" for collection descriptions — but code is already shipping 11px tooltips.
- **Fix.**
  - **Minimum Arabic body size: 14px.** No Arabic string below 13px anywhere, ever. Lint rule on `components/fada/*.tsx` for `text-[1{0,1,2}px]` on elements containing Arabic.
  - Monospace numerics can go to 11px (Plex Mono is dense and Latin-compatible); Arabic prose cannot. Any mixed Arabic + mono cell uses 14px as the floor and mono for the numerals only.
  - Retire the 9px vertical sidebar-footer watermark — it's unreadable *and* carries no information the user needs.

### 4.6 Per-title `hue` creates a noisy fallback palette

- **Evidence.** `TITLES[]` (`app.jsx:31-48`) assigns each title an arbitrary hue (10, 45, 120, 180, 220, 300, 340…). `PosterGraphic` then renders a full-hue gradient fallback when no image loads.
- **Why it fails.** Across a 6-column grid, the fallback produces a rainbow that clashes with the 60-30-10 gold palette. More importantly, it drifts from reality: TMDB rarely returns "no image" — and when it does, the fallback should read as *absence of data*, not as *color-coded metadata*.
- **Fix.** Fallback `<PosterCard>` poster is a **palette-aligned monochrome** panel: `linear-gradient(160deg, #12151F, #0B0D14)` base with a 1px stroke at `rgba(230,182,74,0.15)` and the title's first two Arabic glyphs centered in Plex Sans Arabic Bold 28px at `#8A93AB`. Identical across every missing poster. This is both quieter and a clearer error signal.

### 4.7 Search keyboard shortcut is Latin-biased

- **Evidence.** `app.jsx:259` listens for `e.key === "/"`. The `/` key in Arabic keyboard layouts (Mac ISO-Arabic, Windows Arabic-101) is in the same physical position but may require Shift on some layouts; on iPad's Arabic software keyboard it's two taps away.
- **Fix.** Register **both** `/` and `Ctrl+K` (or `Cmd+K` on Mac) as search shortcuts. Display the active binding on the pill's `<kbd>` based on the current platform — prototype shows a generic `/` always. Spec §3.4 should be updated.

### 4.8 Poster-density toggle is vaporware

- **Evidence.** Settings offers comfortable / compact (`app.jsx:909`). Nothing in the prototype changes when you toggle it. Spec §4.8 mentions the toggle but never specifies card dimensions for each mode.
- **Fix.** Either specify *and* build it, or drop it. Recommended spec:
  - **Comfortable** (default): grid 2/4/6/7/8 columns at breakpoints, 14px gap, poster cards 160px wide at rail-baseline with title + year + genre visible.
  - **Compact**: grid 3/5/7/8/10, 8px gap, poster cards 120px, title only (year/genre on hover/focus tooltip).
  - If you can't build both in P1, drop the setting entirely. A toggle without teeth erodes trust in every other toggle.

### 4.9 Watchlist import has no merge/replace affordance

- **Evidence.** Spec §9.4 and plans: import merges non-destructively (dedupe by `id+type`), toasts count. No replace option.
- **Why it fails.** The common case for importing is *moving from one device to another* — the user almost always wants replace, not merge. Silent merge can double-count after a fresh install that already added a few items.
- **Fix.** Import flow opens a `<Dialog>` (not a toast): "Found N titles in the file. Current list has M. [Merge] [Replace] [Cancel]". Replace requires a second explicit confirm. Toast fires only on completion.

### 4.10 Custom TMDB token is not masked

- **Evidence.** Settings shows `placeholder="Bearer ···"` but no masking on commit (`app.jsx:941`).
- **Fix.** Input is `type="password"` by default with a show/hide eye toggle, and once saved it displays as `Bearer ··········${last4}`. Screen-shares and pair-debug sessions are common in open-source collaboration; a visible token leaks.

### 4.11 Force-directed fallback is a landmine

- **Evidence.** Spec §5.3: "`nodes[].x/y` optional — a force-directed fallback lays out arbitrarily-authored collections."
- **Why it fails.** Force-directed graphs reliably produce ugly, generic, "2012 d3.js demo" shapes. The whole point of the constellation is hand-composed beauty; an auto-laid collection won't pass a brand check and will publish anyway because the PR passed schema validation.
- **Fix.** No force-directed fallback. If a contributor PR omits `nodes[].x/y`, CI **rejects** the PR with: `"collection '<slug>' needs hand-placed node positions. See docs/collections.md for the grid-assist tool."` Ship a tiny Node script (`scripts/position-constellation.mjs`) that opens a local HTML page to drag-place nodes and write the coords back to JSON — authoring aid, not runtime fallback.

### 4.12 Rail-level empty states for regional rails

- **Evidence.** Home rails include "Popular Arabic Movies" and "Popular Turkish Dramas". Spec §9.6 handles page-level errors; rails have no sub-level empty state.
- **Why it fails.** TMDB returns sparse-to-empty results for some MENA/regional queries. A silently blank rail looks like a broken layout.
- **Fix.** Rail shows an empty state when `< 3` results: `<Rail>` renders `<StarEmptyState variant="rail">` in-place: 3-node mini-constellation + `"لا توجد عناوين عربية شائعة هذا الأسبوع"` + "اقترح إضافة" link to GitHub discussions. Preserves the vertical rhythm of the page.

### 4.13 Middleman ethics need to live in the UI, not just the README

- **Evidence.** The project is a "streaming middleman" (`vault/index.md`). In P1, no playback ships, but every detail page has a "شاهد الآن" primary CTA (`app.jsx:684`). The user sees the affordance and hits the toast.
- **Why it fails.** P1 is specifically a *no-playback* design. Shipping a "Watch" primary button with a "coming in v0.2" toast is dishonest UX — you're selling a button that doesn't work. The button also trains the user that the gold-primary CTA is toast-bait.
- **Fix.** **In P1, the primary CTA on a detail page is `"أضف إلى قائمتي"` (Add to my list) in gold.** A small secondary button `"شاهد في v0.2"` with a star-badge ("قريبًا") sits next to it in the ghost style — affordance for the roadmap, not the hero CTA. When P2 ships, the two swap: Watch becomes primary gold, "add" becomes secondary.

---

## 5. Final UI/UX Concept (consolidated)

This section re-states the concept with the deltas from §4 merged in. Where a decision matches the original spec unchanged, it is cited with `spec §X.Y` and not re-explained.

### 5.1 Identity

- **Metaphor.** Night sky. Quiet, contained, 20% of screen time. Gold = starlight = Arabic manuscript gilt. Dark background is not "edgy cinema" — it's *night for reading*.
- **Voice.** Warm-formal Arabic. Mono-numerals for times and counts. No technical flexing in labels (no `CONSTELLATION · N NODES`). No emoji in UI copy.
- **Logo.** 3–5 star points forming the Arabic letter ف. Wrapped in `<a href="/">` at every size. Hover: pulse at 3s; `prefers-reduced-motion`: static.

### 5.2 Palette

Unchanged from spec §2.1. Monochrome fallback replaces per-hue poster fallbacks (§4.6). All accent uses of gold stay within `#E6B64A ± 10% lightness` for hover/active states.

### 5.3 Typography

- IBM Plex Sans Arabic (400/500/600/700); IBM Plex Mono (400/500/600).
- **Arabic minimum body size: 14px** (§4.5). Scale: 14 / 16 / 18 / 22 / 28 / 36 / 48. Mono numerals may go to 12px; Arabic prose may not.
- `unicode-bidi: isolate; direction: ltr` wraps Latin titles embedded in Arabic prose.

### 5.4 Motion

- Tokens: 120 / 220 / 400ms. Easing `cubic-bezier(0.2, 0.8, 0.2, 1)`.
- **No auto-advancing anything.** Hero pagination is manual. Rails scroll-snap on user input only.
- `prefers-reduced-motion`: twinkle, parallax, and constellation morph disabled; lines render static at authored positions; fades preserved for legibility.

### 5.5 Information architecture

Unchanged from spec §3 with these tightens:

- Sidebar: five responsive states (§4.4), all built in Plan 1.
- Bottom nav on mobile: `الرئيسية · الأفلام · المسلسلات · قائمتي · المزيد`.
- Floating search pill: inline in hero on Home until scroll-past-hero, then anchors to top-left and shrinks to icon on scroll > 120px (§4.1). `/` and `Ctrl/Cmd+K` both work (§4.7). Display mirrors the active platform binding on the `<kbd>`.
- "More" section: disabled items show a persistent disabled visual state + tooltip on hover, not a toast on click. Click is inert.

### 5.6 Pages

#### Home (`/`)

- **Hero: 60/50/44vh (desk/tab/mob).** One featured editorial collection, manual prev/next, no timer. Caption (Arabic prose, 16px body) lives *above* the canvas — always legible, always the anchor.
- **Rails below**, in this order: Trending Globally · Popular Arabic Movies · Trending Anime · Popular Turkish Dramas · Popular Korean Dramas. Rail-level empty states per §4.12.

#### Movies / Shows

- Sticky filter bar with a mobile `<Sheet>` collapse. URL-synced state. Infinite scroll. Poster grid 2/4/6/7/8 columns; comfortable density only in P1 unless §4.8 is built.

#### Detail

- **Primary CTA in P1: "أضف إلى قائمتي" (gold).** Secondary ghost: `"شاهد · v0.2"` with "قريبًا" badge (§4.13).
- Tabs: Overview · Episodes (shows only) · Cast & Crew · Reviews · More Info.
- Episodes tab: one persistent banner at top, episode rows are non-activating articles (§4.3).
- "Part of [Collection]" card links to the deep collection page when applicable.

#### Collections

- `/collections`: two tabs (Editorial default · TMDB). Cards use the mini-constellation (poster-free) — this is the one place hue-keyed gradients are okay, because it's the decorative context, not the data context.
- `/collections/curated/[slug]` and `/collections/tmdb/[id]`: **80vh hero constellation** with poster-masked stars (§4.2). Plain poster grid below for the anchor.

#### Watchlist

- Grid, filter chips (All / Movies / Shows), sort (Added / Alpha / Rating). Empty state is the animated SVG constellation from the prototype (`app.jsx:800-815`) — that part is charming and stays.
- Import opens a merge/replace Dialog (§4.9).

#### Search + Discover

- Unified page; Search mode when query present, Discover mode otherwise. Recent searches 10-deep, deduped, clearable.
- Keyboard: `/`, `Ctrl/Cmd+K` focus; `Esc` collapses; Enter navigates to first result.

#### Settings

- General · My Data · TMDB · About.
- Custom TMDB token input is masked (`type=password` with show/hide + last-4 display) (§4.10).
- Drop the poster-density toggle unless §4.8 is delivered.

### 5.7 Constellation component

- Canvas2D, three modes: `hero` (full), `card` (mini), `deep` (collection deep hero).
- Nodes: poster-masked gold-glow discs; monochrome glyph fallback (§4.2, §4.6).
- Lines: 1px gold at 20% opacity, stagger-in on mount (spec §5.1).
- `<ConstellationAriaMirror>` provides DOM-real `<a>` per node, author-ordered, for screen readers and TV remotes. Canvas `aria-hidden`.
- **No force-directed fallback** (§4.11). CI rejects collection PRs without node positions.

### 5.8 Component discipline

- shadcn/ui primitives: vanilla. No per-component motion overrides; all motion comes from tokens.
- `components/fada/*` and `components/constellation/*` are the only places where gold is defined in component CSS. Everywhere else reads `var(--accent-gold)` via Tailwind theme.
- Lint rules (codified, not conventions):
  - No `left`/`right` — logical properties only.
  - No hard-coded Arabic strings in components — must come from `messages/ar.json`.
  - No direct `localStorage.*` in components — must go through `lib/storage/*`.
  - No Arabic text element at `font-size < 13px`.
  - No `<a>` or `<button>` wrapping a constellation star without `aria-label`.

### 5.9 Accessibility

- WCAG 2.2 AA baseline, AAA where cheap (body text).
- Every canvas star has a focusable DOM mirror.
- Focus ring: 3px gold, 2px offset. Same treatment on desktop and TV.
- `prefers-reduced-motion`: hero static, canvas frozen, no twinkle, no parallax.
- No color-only signals (watchlist saved = gold fill + `aria-pressed="true"` + text "في قائمتي" on focus).

### 5.10 Performance

- Initial JS ≤ 180KB gzipped on Home.
- Constellation chunk ≤ 40KB gzipped, `next/dynamic` imported, rendered only when in viewport.
- Canvas render loop pauses on `document.visibilitychange === 'hidden'`.
- 60fps target on mid-tier laptop; degrade to static render if measured `<30fps` over a 2s window.

---

## 6. Priority of changes against the existing plans

| # | Change | Where it lands | Blocks shipping? |
|---|---|---|---|
| 1 | Hero 60vh on Home, no auto-advance | Plan 4 (hero redesign) | Yes |
| 2 | Logo becomes `<a href="/">` at every size | Plan 1 (sidebar) | Yes |
| 3 | Detail page: "Add to list" is primary CTA | Plan 2 (DetailHero) | Yes |
| 4 | Episode rows: persistent banner, no toast | Plan 2 (EpisodeRow) | Yes |
| 5 | Sidebar: all five responsive states | Plan 1 (Sidebar) | Yes |
| 6 | Arabic min body size 14px (lint rule) | Plan 1 (ESLint config) | Yes |
| 7 | Monochrome fallback posters | Plan 1 (PosterCard) | Yes |
| 8 | Retire `nodes[].hue`, retire force-directed fallback | Plan 4 (Constellation) | Yes |
| 9 | Watchlist import merge/replace Dialog | Plan 3 (Settings/MyData) | No (can follow v0.1) |
| 10 | TMDB token input masked | Plan 3 (Settings/TMDB) | No (can follow v0.1) |
| 11 | Keyboard: `/` + `Ctrl/Cmd+K` both | Plan 1 (FloatingSearchPill) | No |
| 12 | Rail-level empty states | Plan 1 (Rail) + Plan 2 reuse | No |
| 13 | Drop poster-density toggle unless built | Plan 3 (Settings/General) | No |

Items 1–8 are blocking because they change shapes other components depend on (hero height affects layout budgets; primary-CTA decision affects every detail page test). Items 9–13 are v0.1.x refinements.

---

## 7. Open questions deliberately left for later

- **Light mode.** Spec defers it past v0.1; keep deferred. When built, verify gold `#E6B64A` still hits AA on `#FAF7EE` (likely needs a darkened variant `#A07D2A`).
- **Arabic-Indic numeral toggle.** Settings-level preference; do not build until a second language lands.
- **Content-advisory badges** (age rating, sensitivity). Spec doesn't mention; TMDB provides. P2 concern.

---

## 8. One-line philosophy to hang on the wall

> **"فضاء is a library with stars on the ceiling, not a planetarium with a card catalog."**
>
> The app is a reading room. The night sky is above; you glance up, you come back down to the shelves.
