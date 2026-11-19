#!/usr/bin/env python3
"""Generate docs/comparisons/images/conduit-stacks-loc.png.

Numbers must stay aligned with ../conduit-stacks.md.
Design tokens follow the three-stack poster (slate paper + stack colors).

Deps: Python 3 + Pillow (`pip install pillow`).
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent
OUT = HERE / "conduit-stacks-loc.png"

W = 1400
MARGIN = 48
COL_GAP = 16

BG = (244, 246, 248)
INK = (28, 35, 43)
MUTED = (90, 100, 112)
RULE = (210, 216, 222)
CARD = (255, 255, 255)
ACCENT = (55, 65, 81)

RAILS = (15, 118, 110)
PHP = (180, 83, 9)
GO = (3, 105, 161)
LARAVEL = (190, 18, 60)
HONO = (30, 58, 95)

SOFT = {
    RAILS: (204, 233, 230),
    PHP: (252, 231, 208),
    GO: (186, 230, 253),
    LARAVEL: (254, 205, 211),
    HONO: (214, 224, 236),
}

# From docs/comparisons/conduit-stacks.md
APP_TOTALS = [
    ("Rails", 1076, "1.0×", RAILS, "baseline"),
    ("PHP", 1733, "~1.6×", PHP, "SSR pages"),
    ("Go+HTMX", 2336, "~2.2×", GO, "excl. sqlc gen"),
    ("Laravel", 2860, "~2.7×", LARAVEL, "Inertia"),
    ("Hono", 3036, "~2.8×", HONO, "API+SPA"),
]
SERVER_UI = [
    ("Rails", 475, 587, RAILS),
    ("PHP", 764, 969, PHP),
    ("Go", 1843, 493, GO),
    ("Laravel", 1185, 1675, LARAVEL),
    ("Hono", 1492, 1544, HONO),
]
# chars only for poster compactness (Rails, Go, PHP, Laravel, Hono)
SCREENS = [
    ("Article show", 2713, 5583, 6963, 8960, 10038),
    ("Editor", 1392, 1713, 5297, 3974, 5841),
    ("Login+register", 2508, 2462, 3596, 6841, 4923),
    ("Settings", 1810, 1835, 2966, 5480, 4124),
    ("Home/feed", 2338, 2513, 5907, 5737, 6377),
    ("Profile", 1957, 1614, 4669, 4633, 6076),
]

FONT_CANDIDATES = {
    "regular": [
        "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ],
    "semibold": [
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    ],
    "bold": [
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    ],
    "mono": [
        "/usr/share/fonts/truetype/liberation/LiberationMono-Regular.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf",
    ],
}


def _first_font(paths: list[str]) -> str:
    for path in paths:
        if Path(path).is_file():
            return path
    raise FileNotFoundError(paths)


FONT_REG = _first_font(FONT_CANDIDATES["regular"])
FONT_SEMI = _first_font(FONT_CANDIDATES["semibold"])
FONT_BOLD = _first_font(FONT_CANDIDATES["bold"])
FONT_MONO = _first_font(FONT_CANDIDATES["mono"])


def font(path: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(path, size)


def text_w(draw: ImageDraw.ImageDraw, text: str, f: ImageFont.FreeTypeFont) -> int:
    return int(draw.textlength(text, font=f))


def draw_wrapped(draw, text, x, y, f, fill, max_width, line_gap=5) -> int:
    words = text.split()
    lines: list[str] = []
    cur = ""
    for w in words:
        trial = f"{cur} {w}".strip()
        if text_w(draw, trial, f) <= max_width:
            cur = trial
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    yy = y
    for line in lines:
        draw.text((x, yy), line, font=f, fill=fill)
        yy += f.size + line_gap
    return yy


def rounded_rect(draw, box, radius, fill, outline=None, width=1) -> None:
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def hbar(draw, x, y, max_w, height, value, vmax, color) -> None:
    track = (232, 236, 240)
    rounded_rect(draw, (x, y, x + max_w, y + height), height // 2, track)
    w = max(height, int(max_w * (value / vmax)))
    rounded_rect(draw, (x, y, x + w, y + height), height // 2, color)


def main() -> None:
    H = 3600
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)

    f_title = font(FONT_BOLD, 36)
    f_sub = font(FONT_REG, 16)
    f_h2 = font(FONT_BOLD, 22)
    f_h3 = font(FONT_SEMI, 14)
    f_body = font(FONT_REG, 14)
    f_small = font(FONT_REG, 12)
    f_label = font(FONT_SEMI, 13)
    f_num = font(FONT_BOLD, 26)
    f_mono = font(FONT_MONO, 11)

    y = MARGIN
    d.text((MARGIN, y), "Conduit LoC — five stacks", font=f_title, fill=INK)
    y += 46
    y = draw_wrapped(
        d,
        "Same RealWorld product surface in Rails ERB, PHP page scripts, Go + HTMX, "
        "Laravel + Inertia, and React + Hono. Application = product server + UI "
        "(no vendored Conduit CSS, no tests; Go excludes sqlc-generated Go).",
        MARGIN,
        y,
        f_sub,
        MUTED,
        W - 2 * MARGIN,
    )
    y += 14
    d.line((MARGIN, y, W - MARGIN, y), fill=RULE, width=2)
    y += 22

    # 1 totals
    d.text((MARGIN, y), "1 · Application LoC totals", font=f_h2, fill=INK)
    y += 34
    n = len(APP_TOTALS)
    card_w = (W - 2 * MARGIN - (n - 1) * COL_GAP) // n
    card_h = 150
    for i, (name, loc, ratio, color, note) in enumerate(APP_TOTALS):
        x = MARGIN + i * (card_w + COL_GAP)
        rounded_rect(d, (x, y, x + card_w, y + card_h), 10, CARD, RULE, 1)
        d.rectangle((x, y, x + 6, y + card_h), fill=color)
        d.text((x + 14, y + 14), name, font=f_h3, fill=color)
        d.text((x + 14, y + 42), f"{loc:,}", font=f_num, fill=INK)
        d.text((x + 14, y + 84), "app lines", font=f_small, fill=MUTED)
        d.text((x + 14, y + 108), f"{ratio} · {note}", font=f_small, fill=ACCENT)

    y += card_h + 18
    vmax = max(loc for _, loc, *_ in APP_TOTALS)
    bar_x = MARGIN + 110
    bar_w = W - MARGIN - bar_x - 90
    for name, loc, ratio, color, note in APP_TOTALS:
        d.text((MARGIN, y + 1), name, font=f_label, fill=INK)
        hbar(d, bar_x, y, bar_w, 16, loc, vmax, color)
        d.text((bar_x + bar_w + 10, y), f"{loc:,}", font=f_label, fill=INK)
        y += 26

    y += 14
    d.line((MARGIN, y, W - MARGIN, y), fill=RULE, width=1)
    y += 22

    # 2 server vs UI
    d.text((MARGIN, y), "2 · Server vs product UI (path buckets)", font=f_h2, fill=INK)
    y += 30
    y = draw_wrapped(
        d,
        "Go keeps templates tiny (UI) and handlers in the server row. "
        "PHP folds request logic into page files (UI row). "
        "Laravel/Hono React UIs dominate the UI bucket.",
        MARGIN,
        y,
        f_body,
        MUTED,
        W - 2 * MARGIN,
    )
    y += 12

    col_w = (W - 2 * MARGIN - (n - 1) * COL_GAP) // n
    block_h = 120
    for i, (name, server, ui, color) in enumerate(SERVER_UI):
        x = MARGIN + i * (col_w + COL_GAP)
        rounded_rect(d, (x, y, x + col_w, y + block_h), 10, CARD, RULE, 1)
        d.text((x + 12, y + 10), name, font=f_h3, fill=color)
        d.text((x + 12, y + 40), f"srv {server:,}", font=f_label, fill=INK)
        d.text((x + 12, y + 62), f"ui  {ui:,}", font=f_label, fill=INK)
        total = server + ui
        # mini stacked bar
        bx, by, bw, bh = x + 12, y + 88, col_w - 24, 14
        rounded_rect(d, (bx, by, bx + bw, by + bh), 7, (232, 236, 240))
        sw = max(4, int(bw * server / total))
        rounded_rect(d, (bx, by, bx + sw, by + bh), 7, color)
        soft = SOFT[color]
        rounded_rect(d, (bx + sw, by, bx + bw, by + bh), 7, soft)

    y += block_h + 20
    d.line((MARGIN, y, W - MARGIN, y), fill=RULE, width=1)
    y += 22

    # 3 takeaways
    d.text((MARGIN, y), "3 · Ordering & drivers", font=f_h2, fill=INK)
    y += 30
    bullets = [
        "Size: Rails < PHP < Go (hand) < Laravel < Hono.",
        "ORM (Rails/Laravel) vs hand SQL (PHP/Go sqlc sources/Hono queries) still drives much of the server gap vs Rails.",
        "Go UI row smallest; Hono/Laravel React UIs largest. PHP UI inflated by inline request logic.",
        "Password reset: Rails + Laravel only. JSON RealWorld API: Hono only. Conduit CSS: all but PHP.",
    ]
    for b in bullets:
        y = draw_wrapped(d, "•  " + b, MARGIN, y, f_body, INK, W - 2 * MARGIN)
        y += 8

    y += 8
    d.line((MARGIN, y, W - MARGIN, y), fill=RULE, width=1)
    y += 22

    # 4 screens
    d.text((MARGIN, y), "4 · Per-screen character weight", font=f_h2, fill=INK)
    y += 28
    y = draw_wrapped(
        d,
        "Non-blank character counts for closest screen files (Rails · Go · PHP · Laravel · Hono).",
        MARGIN,
        y,
        f_body,
        MUTED,
        W - 2 * MARGIN,
    )
    y += 10

    label_w = 130
    bar_x = MARGIN + label_w
    bar_w = W - MARGIN - bar_x
    colors = [RAILS, GO, PHP, LARAVEL, HONO]
    names = ["R", "G", "P", "L", "H"]
    # legend
    lx = MARGIN
    for nm, c in zip(["Rails", "Go", "PHP", "Laravel", "Hono"], colors):
        rounded_rect(d, (lx, y, lx + 12, y + 12), 3, c)
        d.text((lx + 16, y - 1), nm, font=f_small, fill=INK)
        lx += 90
    y += 22

    vmax = max(max(row[1:]) for row in SCREENS)
    for row in SCREENS:
        title, *vals = row
        d.text((MARGIN, y), title, font=f_label, fill=INK)
        y += 18
        for val, color, short in zip(vals, colors, names):
            d.text((MARGIN + 8, y), short, font=f_mono, fill=color)
            hbar(d, bar_x, y + 1, bar_w - 70, 12, val, vmax, color)
            d.text((bar_x + bar_w - 64, y), f"{val:,}", font=f_small, fill=MUTED)
            y += 16
        y += 8

    y += 6
    d.line((MARGIN, y, W - MARGIN, y), fill=RULE, width=1)
    y += 16
    y = draw_wrapped(
        d,
        "Source: docs/comparisons/conduit-stacks.md · regenerate with "
        "docs/comparisons/images/generate_conduit_stacks_poster.py",
        MARGIN,
        y,
        f_mono,
        MUTED,
        W - 2 * MARGIN,
    )
    y += 20

    # crop
    bbox_bottom = min(H, y + MARGIN)
    img = img.crop((0, 0, W, bbox_bottom))
    img.save(OUT, "PNG", optimize=True)
    print(f"wrote {OUT} ({img.size[0]}x{img.size[1]})")


if __name__ == "__main__":
    main()
