# Comparison images

| File | What it is |
| --- | --- |
| [`rails-hono-php-loc.png`](./rails-hono-php-loc.png) | Tall poster: application LoC totals/ratios, server vs UI buckets, Hono≈2× PHP gap drivers, architecture + per-screen character weight |
| [`generate_loc_poster.py`](./generate_loc_poster.py) | Pillow generator that reproduces the poster from the numbers below |

## Purpose

A static, self-contained PNG summarizing the three-way Conduit LoC comparison so readers of [`../rails-hono-php.md`](../rails-hono-php.md) can see totals, buckets, and the Hono≈2× PHP story without scrolling every table. Embed lives near the top of that doc (and is linked from [`../README.md`](../README.md)).

## Source of numbers

**Canonical source:** [`../rails-hono-php.md`](../rails-hono-php.md) (`cloc` on git-tracked sources in this monorepo).

The generator hard-codes the same figures in module-level constants at the top of `generate_loc_poster.py` (`APP_TOTALS`, `SERVER_UI`, `GAP_DRIVERS`, `SCREENS`, …). When the markdown tables change, update those constants to match, then regenerate. Do not invent numbers in the script that are not in the doc.

Current three-stack figures (Application = product server + UI; no vendored Conduit CSS, no tests):

| Stack | Application | Server | UI |
| --- | ---: | ---: | ---: |
| Rails ERB | 1,082 | 475 | 587 |
| PHP | 1,733 | 764 | 969 |
| React + Hono | 3,028 | 1,492 | 1,536 |

Hono server vs PHP: gap **728** (~1.95×), driven mainly by JSON API (~440), seed/entry (~201), Drizzle (~128), permissions/present (~40+) — not article SQL size.

## Design tokens (keep stable)

Reproduce the **same design** when regenerating or extending. Do not restyle casually.

| Token | Value | Role |
| --- | --- | --- |
| Canvas width | `1400` px | Fixed; height crops to content (~2545 today) |
| Background | `#f4f6f8` `(244,246,248)` | Slate paper |
| Ink | `#1c232b` `(28,35,43)` | Titles / primary text |
| Muted | `#5a6470` `(90,100,112)` | Body / captions |
| Rule | `#d2d8de` `(210,216,222)` | Section dividers / card outlines |
| Card | `#ffffff` | White panels |
| Rails | `#0f766e` `(15,118,110)` | Teal accent |
| PHP | `#b45309` `(180,83,9)` | Amber accent |
| Hono | `#1e3a5f` `(30,58,95)` | Navy accent |
| Accent gray | `#374151` `(55,65,81)` | Secondary emphasis |
| Fonts | Inter Regular / SemiBold / Bold (fallback: Liberation Sans / DejaVu Sans); Liberation Mono for the source path | Prefer Inter for pixel parity with `main` |

### Section order (do not reorder)

1. Header — title + one-line method note  
2. **Application LoC totals** — three colored cards + horizontal ratio bars  
3. **Server vs product UI (path buckets)** — stacked bars + three caveat callouts  
4. **Why Hono’s server row is ~2× PHP’s** — gap card, parity table, four driver rows  
5. **Architecture snapshot & per-screen character weight** — concern grid + grouped character bars  
6. Footer — Source caption pointing at `docs/comparisons/rails-hono-php.md`

Layout details: left color rails on total cards, rounded white cards (`radius` 10–12), pill tracks for app totals, stacked solid/light segments for server/UI, numeric badges on gap drivers.

## How to regenerate

```bash
# from repo root (or any cwd — script writes next to itself)
pip install pillow          # once; Python 3.10+
python3 docs/comparisons/images/generate_loc_poster.py
```

Expected stderr: `Wrote …/rails-hono-php-loc.png (1400×2545)` (height may shift a few px if fonts differ).

Commit the updated PNG together with any constant/doc edits. Optionally refresh the Project copy at the agent-store path `media/comparison-infographic.png` if that mirror is still in use.

## Adding a new stack

1. Measure with the same `cloc` rules documented in `rails-hono-php.md` and extend that doc’s tables first.  
2. In `generate_loc_poster.py`, extend `APP_TOTALS` / `SERVER_UI` (and any new section data). Recolor: pick one flat accent that is not teal/amber/navy and is distinct on `#f4f6f8`.  
3. Widen or reflow section 1 cards (today: three equal columns). For four+ stacks, prefer a 2×2 card grid or a single labeled bar chart rather than squeezing four cards into one row.  
4. Keep section order; add a new numbered section only if the markdown introduces a new major comparison theme.  
5. Regenerate, spot-check numbers against the markdown, commit PNG + script + doc together.

## History

Original poster landed in [PR #4](https://github.com/naofumi/real-world-apps/pull/4) (`cursor/comparison-infographic-e8b6`) as PNG-only. The Pillow script lived only on the worker VM; this directory now keeps the regenerator checked in.
