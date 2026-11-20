# Comparison images

| File | What it is |
| --- | --- |
| [`conduit-stacks-loc.png`](./conduit-stacks-loc.png) | **Primary** five-stack poster (Rails, Laravel, PHP, Go, Hono) |
| [`generate_conduit_stacks_poster.py`](./generate_conduit_stacks_poster.py) | Pillow generator for the five-stack poster |
| [`rails-hono-php-loc.png`](./rails-hono-php-loc.png) | Legacy three-stack poster for [`../rails-hono-php.md`](../rails-hono-php.md) |
| [`generate_loc_poster.py`](./generate_loc_poster.py) | Pillow generator for the three-stack poster |

## Five-stack poster (canonical)

**Canonical numbers:** [`../conduit-stacks.md`](../conduit-stacks.md).

Hard-coded in `generate_conduit_stacks_poster.py` (`APPS`, `SERVER_UI`, `CALLOUTS`). When the markdown tables change, update those constants, then regenerate.

```bash
pip install pillow
python3 docs/comparisons/images/generate_conduit_stacks_poster.py
```

Expected stderr: `Wrote …/conduit-stacks-loc.png (1480×…)`.

Application totals (hand-written; no vendored CSS, no tests, no sqlc gen):

| Stack | Application | Server | UI |
| --- | ---: | ---: | ---: |
| Rails ERB | 1,082 | 475 | 587 |
| Laravel | 1,820 | 880 | 940 |
| PHP | 1,891 | 764 | 1,127 |
| Go + HTMX | 2,260 | 1,767 | 493 |
| React + Hono | 3,028 | 1,492 | 1,536 |

Design: same slate paper / ink / muted tokens as the three-stack poster; stack accents teal (Rails), violet (Laravel), amber (PHP), cyan (Go), navy (Hono).

## Three-stack poster (legacy)

Still used by [`../rails-hono-php.md`](../rails-hono-php.md). Regenerate with `generate_loc_poster.py` if that doc’s tables change. Prefer updating **conduit-stacks** first for any new stack.

## History

Three-stack poster: [PR #4](https://github.com/naofumi/real-world-apps/pull/4). Five-stack regenerator checked in with the five-app comparison doc.
