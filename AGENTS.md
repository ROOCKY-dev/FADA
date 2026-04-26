# Repository Guidelines

## Project Structure & Module Organization
`vault/` is the project’s planning and documentation hub. Keep high-level product intent in `index.md`, approved specs in `specs/`, and executable implementation plans in `plans/`. Supporting research belongs in `More/`. Obsidian settings live in `.obsidian/`; do not reorganize or rename these files casually because note links depend on stable paths.

## Build, Test, and Development Commands
This vault is documentation-first, so there is no local build or test runner here. The main contributor workflow is file editing plus consistency checks:

- `rg "TODO|TBD|FIXME" vault/` — find unfinished placeholders before committing.
- `rg "\[\[.*\]\]" vault/` — inspect wiki links when moving or renaming notes.
- `sed -n '1,80p' vault/plans/TODO.md` — verify tracker status before and after plan updates.

When a plan references app commands such as `cd app && npm run lint`, run them from the future `app/` project root, not from `vault/`.

## Coding Style & Naming Conventions
Write concise Markdown with clear headings and short task bullets. Preserve frontmatter blocks, wiki links like `[[UI-UX]]`, and the navigation footer pattern already used in core notes. Plan files should keep the established structure from `plans/00-conventions.md`: frontmatter, scope, numbered tasks, acceptance gate, and handoff section.

Use date-prefixed filenames for new specs when relevant, for example `specs/2026-04-23-fada-p1-ui-ux-design.md`. Keep plan names phase-scoped, such as `p1-plan-3-search-discover-settings.md`.

## Testing Guidelines
Quality here means document integrity. Before submitting changes, confirm:

- internal links still point to valid notes
- any status change in a plan is mirrored in `plans/TODO.md`
- spec, plan, and `DESIGN.md` do not contradict each other

If you change implementation conventions, update `plans/00-conventions.md` and note the decision in the tracker or related plan.

## Commit & Pull Request Guidelines
Follow the documented commit format from `plans/00-conventions.md`, for example `docs(p1-1): refine plan acceptance gate`. Keep the subject in English for log readability; Arabic is acceptable in the body. PRs should state which spec or plan changed, whether `plans/TODO.md` was updated, and include screenshots only when editing visual design docs or prototype references.
