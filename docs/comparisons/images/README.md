# Comparison images

| File | What it is |
| --- | --- |
| [`conduit-stacks-loc.png`](./conduit-stacks-loc.png) | **Current** five-stack poster (Rails / PHP / Go / Laravel / Hono) |
| [`generate_conduit_stacks_poster.py`](./generate_conduit_stacks_poster.py) | Pillow regenerator for the five-stack poster |
| [`rails-hono-php-loc.png`](./rails-hono-php-loc.png) | Original three-stack poster |
| [`generate_loc_poster.py`](./generate_loc_poster.py) | Regenerator for the three-stack poster |

## Five-stack poster

Numbers must match [`../conduit-stacks.md`](../conduit-stacks.md).

```bash
pip install pillow
python3 docs/comparisons/images/generate_conduit_stacks_poster.py
```

| Token | Value |
| --- | --- |
| Background | `#f4f6f8` |
| Ink | `#1c232b` |
| Rails | `#0f766e` |
| PHP | `#b45309` |
| Go | `#0369a1` |
| Laravel | `#be123c` |
| Hono | `#1e3a5f` |

## Three-stack poster (historical)

Canonical numbers: [`../rails-hono-php.md`](./rails-hono-php.md). Regenerate with `generate_loc_poster.py` if you need the old three-column layout.

Design tokens and section order for the three-stack poster are documented in the Project store recipe `docs/infographic-regen.md` when present; prefer updating the **five-stack** doc going forward.
