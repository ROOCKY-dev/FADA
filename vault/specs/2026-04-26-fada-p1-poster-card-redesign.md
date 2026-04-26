---
tags: [spec, p1, poster-card]
date: 2026-04-26
status: review
related:
  - "[[2026-04-23-fada-p1-ui-ux-design]]"
  - "[[../../DESIGN]]"
  - "[[../plans/p1-plan-1-foundation-and-home]]"
---

# FADA P1 Poster Card Redesign

## Purpose

This note defines a **design delta** for the global `<PosterCard>` used across P1 surfaces.

It replaces the current plain poster-plus-caption card with a more distinctive, asymmetric card language inspired by the approved reference sketch, while preserving the constraints already locked by the P1 spec and `DESIGN.md`.

## Scope

### In

- The shared `<PosterCard>` anatomy used on Home rails, Watchlist, Search, and Browse grids when they land in Plan 2.
- Compact and expanded information states.
- Rating badge placement.
- Watchlist control placement.
- Fallback poster treatment.
- Interaction behavior for hover, focus, and touch-safe default state.

### Out

- Detail-page hero layout.
- Collection constellation cards.
- Long-press quick actions.
- Density preference implementation beyond the existing `sm` / `md` / `lg` size system.

## Design Rules That Remain Unchanged

- The fallback poster remains **monochrome** per `DESIGN.md §4.6`.
- The card remains part of the familiar streaming-app 80%, not a constellation surface.
- Hover/focus lift stays subtle and inside the existing FADA motion language.
- The watchlist state must not rely on color alone.
- The same card family is used everywhere; surfaces may change spacing and size, but not the core anatomy.

## Decision Summary

FADA will use a **production-safe asymmetric card** everywhere instead of a literal sculpted silhouette.

That means:

- The outer footprint stays stable and grid-safe.
- The visual character comes from attached sub-shapes, not from a fragile irregular layout box.
- The metadata dock may expand internally on hover and focus, but the card must not push surrounding cards or change rail rhythm.

## Card Anatomy

### 1. Outer footprint

- `<PosterCard>` keeps a predictable rectangular footprint in each size variant.
- The silhouette is created by internal layers and attached panels, not by changing the layout box itself.
- Existing sizes remain:
  - `sm` for dense layouts
  - `md` for default rails
  - `lg` for larger featured usage

### 2. Poster body

- The main poster remains the dominant visual mass.
- It is a large rounded rectangle with the current dark-surface treatment.
- The poster image or monochrome fallback fills this body edge to edge.

### 3. Rating pill

- If rating exists, it appears as a floating pill at **inline-end of the top edge**.
- In RTL this places it at the **top-left**, matching the approved sketch.
- The rating remains compact and mono-styled.

### 4. Watchlist tab

- The watchlist control becomes a distinct attached tab at **inline-start of the top edge**.
- In RTL this places it at the **top-right**.
- It remains a separate button, not part of the main card activation target.
- Its visual treatment may be more notched or tab-like than the current circular button, but it must remain obviously interactive and keyboard-focusable.

### 5. Metadata dock

- The title/meta block becomes an attached dock at **inline-start of the bottom edge**.
- In RTL this places it at the **bottom-right**.
- The dock visually overlaps the poster body as a secondary attached panel.
- It carries the asymmetry from the reference without breaking layout stability.

## Information Density

### Compact state

The default state should show the minimum needed for fast browsing:

- Title
- One short meta line

The default short meta line should be:

- `year` when year is available
- localized media type when year is missing

### Expanded state

On hover and focus, the metadata dock grows within the existing card footprint and reveals more information:

- Full two-line title when needed
- A richer metadata row, typically `year + type`

P1 does not add a third metadata line. Expanded state is limited to the richer title and metadata treatment above.

The expanded state is disclosure, not a second card layout mode.

## Interaction Model

### Hover and focus

- Hover and keyboard focus use the same expanded state.
- Expansion happens in the metadata dock, not by changing the full card height.
- The card may still use the current subtle lift (`y: -4px` class of movement), but must avoid theatrical motion.

### Touch

- On touch-first contexts without hover, the card remains compact by default.
- The design does **not** require a two-tap expand-then-open interaction.
- Keyboard focus still expands the dock for accessibility and TV-style navigation.

### Primary vs secondary actions

- The main card surface remains the primary navigation target.
- The watchlist tab remains independently clickable/tappable.
- Triggering the watchlist must not activate title navigation.

## Layout and Responsiveness

- Rails and grids must keep stable row alignment.
- Metadata expansion must occur **inside** the reserved card footprint.
- No neighboring card may shift when one card expands.
- `sm`, `md`, and `lg` variants may tune internal spacing, badge size, and dock depth, but must preserve one recognizable family.

## Accessibility

- Hover-only information must also appear on keyboard focus.
- Focus ring stays the FADA gold accent treatment.
- Watchlist uses `aria-pressed` and a non-color state change.
- The separate watchlist control must remain reachable without ambiguity.
- Any truncation strategy must still preserve a readable accessible name for the title.

## Fallback Treatment

- No per-title hue logic.
- No star/constellation motif inside the poster card.
- Fallback remains the approved monochrome panel:
  - `linear-gradient(160deg, #12151F, #0B0D14)`
  - `1px` stroke at `rgba(230,182,74,0.15)`
  - centered glyph treatment in muted ink

Only the surrounding card frame language changes.

## Implementation Notes

- This redesign should be implemented by evolving the existing shared `<PosterCard>` component, not by introducing a separate Home-only card.
- `PosterCard` should own:
  - compact vs expanded presentation
  - rating pill placement
  - watchlist tab placement
  - metadata dock behavior
- Rails and grids should consume the same component without branching visual logic by route.

## Test Expectations

At minimum, component coverage should lock:

- compact state content
- expanded state on hover
- expanded state on keyboard focus
- watchlist toggle isolation
- fallback rendering
- no regression to rail keyboard navigation caused by the new card anatomy

## Implementation Impact

This design delta requires follow-up updates to:

- `vault/plans/p1-plan-1-foundation-and-home.md` Task 18 acceptance details
- component tests for `<PosterCard>`
- any visual smoke coverage that assumes the old rectangular caption layout

## Final Decision

Approved direction:

- Use the new asymmetric visual language **everywhere**
- Keep it **production-safe** rather than literal
- Show **minimal content by default**
- Reveal **more metadata on hover and focus**
- Apply the same expansion behavior to keyboard focus, not hover alone
