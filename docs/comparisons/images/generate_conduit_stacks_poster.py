#!/usr/bin/env python3
"""Generate docs/comparisons/images/conduit-stacks-loc.png.

Numbers must stay aligned with ../conduit-stacks.md.
Deps: Python 3 + Pillow. Fonts: Inter / Liberation / DejaVu.
"""

from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent
OUT = HERE / "conduit-stacks-loc.png"

W = 1480
MARGIN = 48
COL_GAP = 16

BG = (244, 246, 248)
INK = (28, 35, 43)
MUTED = (90, 100, 112)
RULE = (210, 216, 222)
CARD = (255, 255, 255)

RAILS = (15, 118, 110)
LARAVEL = (124, 58, 237)
PHP = (180, 83, 9)
GO = (8, 105, 140)
HONO = (30, 58, 95)
ACCENT = (55, 65, 81)

# From docs/comparisons/conduit-stacks.md — update then re-run
APPS = [
    # name, app_loc, ratio, color, short
    ("Rails ERB", 1082, "1.0×", RAILS, "baseline"),
    ("Laravel", 1820, "~1.7×", LARAVEL, "Inertia"),
    ("PHP", 1891, "~1.7×", PHP, "page scripts"),
    ("Go+HTMX", 2260, "~2.1×", GO, "hand (no sqlc gen)"),
    ("React+Hono", 3028, "~2.8×", HONO, "SPA+API"),
]
SERVER_UI = [
    ("Rails", 475, 587, RAILS),
    ("Laravel", 880, 940, LARAVEL),
    ("PHP", 764, 1127, PHP),
    ("Go", 1767, 493, GO),
    ("Hono", 1492, 1536, HONO),
]
CALLOUTS = [
    ("Laravel vs Rails server", "~880 vs ~475 (+405). Not ORM-vs-SQL — Inertia page props + denser models vs ERB (which does not serialize).", LARAVEL),
    ("Laravel vs Hono UI", "~940 vs ~1,536. Both serialize (Inertia props / JSON API). UI gap is SPA lib (~299) + fetch/mutate, not serialization alone.", LARAVEL),
    ("Go counting", "Headline excludes sqlc generated (~1,060). Templates smallest UI (~493); cost is handlers + hand SQL.", GO),
]

FONT_CANDIDATES = {
    "regular": [
        "/usr/share/fonts/truetype/macos/Inter-Regular.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ],
    "semibold": [
        "/usr/share/fonts/truetype/macos/Inter-SemiBold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    ],
    "bold": [
        "/usr/share/fonts/truetype/macos/Inter-Bold.ttf",
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
    raise FileNotFoundError(f"No font found among {paths}")


FONT_REG = _first_font(FONT_CANDIDATES["regular"])
FONT_SEMI = _first_font(FONT_CANDIDATES["semibold"])
FONT_BOLD = _first_font(FONT_CANDIDATES["bold"])
FONT_MONO = _first_font(FONT_CANDIDATES["mono"])


def font(path: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(path, size)


def text_w(draw: ImageDraw.ImageDraw, text: str, f: ImageFont.FreeTypeFont) -> int:
    return int(draw.textlength(text, font=f))


def draw_wrapped(
    draw: ImageDraw.ImageDraw,
    text: str,
    x: int,
    y: int,
    f: ImageFont.FreeTypeFont,
    fill: tuple[int, int, int],
    max_width: int,
    line_gap: int = 5,
) -> int:
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


def rounded_rect(
    draw: ImageDraw.ImageDraw,
    box: tuple[int, int, int, int],
    radius: int,
    fill: tuple[int, int, int],
    outline: tuple[int, int, int] | None = None,
    width: int = 1,
) -> None:
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def hbar(
    draw: ImageDraw.ImageDraw,
    x: int,
    y: int,
    max_w: int,
    height: int,
    value: int,
    vmax: int,
    color: tuple[int, int, int],
) -> None:
    track = (232, 236, 240)
    rounded_rect(draw, (x, y, x + max_w, y + height), height // 2, track)
    w = max(height, int(max_w * (value / vmax)))
    rounded_rect(draw, (x, y, x + w, y + height), height // 2, color)


def main() -> None:
    H = 2400
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)

    f_title = font(FONT_BOLD, 38)
    f_sub = font(FONT_REG, 16)
    f_h2 = font(FONT_BOLD, 22)
    f_h3 = font(FONT_SEMI, 15)
    f_body = font(FONT_REG, 14)
    f_small = font(FONT_REG, 12)
    f_tiny = font(FONT_REG, 11)
    f_num = font(FONT_BOLD, 28)
    f_label = font(FONT_SEMI, 13)
    f_mono = font(FONT_MONO, 11)

    y = MARGIN

    d.text((MARGIN, y), "Conduit LoC — five stacks", font=f_title, fill=INK)
    y += 46
    y = draw_wrapped(
        d,
        "Same RealWorld product surface. Application = server + UI path buckets "
        "(no vendored Conduit CSS, no tests, no sqlc-generated Go). Fresh cloc on main.",
        MARGIN,
        y,
        f_sub,
        MUTED,
        W - 2 * MARGIN,
        line_gap=3,
    )
    y += 14
    d.line((MARGIN, y, W - MARGIN, y), fill=RULE, width=2)
    y += 22

    # 1. Totals
    d.text((MARGIN, y), "1 · Application LoC (hand-written)", font=f_h2, fill=INK)
    y += 32

    n = len(APPS)
    card_w = (W - 2 * MARGIN - (n - 1) * COL_GAP) // n
    card_h = 148
    for i, (name, loc, ratio, color, note) in enumerate(APPS):
        x = MARGIN + i * (card_w + COL_GAP)
        rounded_rect(d, (x, y, x + card_w, y + card_h), 10, CARD, RULE, 1)
        d.rectangle((x, y, x + 6, y + card_h), fill=color)
        d.text((x + 14, y + 14), name, font=f_h3, fill=color)
        d.text((x + 14, y + 42), f"{loc:,}", font=f_num, fill=INK)
        d.text((x + 14, y + 84), "application lines", font=f_tiny, fill=MUTED)
        d.text((x + 14, y + 106), f"{ratio}  ·  {note}", font=f_small, fill=ACCENT)

    y += card_h + 18
    vmax = max(loc for _, loc, *_ in APPS)
    bar_x = MARGIN + 120
    bar_w = W - MARGIN - bar_x - 100
    for name, loc, ratio, color, note in APPS:
        d.text((MARGIN, y + 1), name, font=f_label, fill=INK)
        hbar(d, bar_x, y, bar_w, 16, loc, vmax, color)
        d.text((bar_x + bar_w + 10, y), f"{loc:,}", font=f_label, fill=INK)
        y += 26

    y += 12
    d.line((MARGIN, y, W - MARGIN, y), fill=RULE, width=1)
    y += 22

    # 2. Server vs UI
    d.text((MARGIN, y), "2 · Server vs product UI (path buckets)", font=f_h2, fill=INK)
    y += 28
    y = draw_wrapped(
        d,
        "Directory buckets, not perfect backend/frontend. PHP pages fold request logic into the UI row. "
        "Go UI is templates only; Go server includes handlers + sql/queries (not generated Go).",
        MARGIN,
        y,
        f_body,
        MUTED,
        W - 2 * MARGIN,
    )
    y += 12

    rounded_rect(d, (MARGIN, y, MARGIN + 16, y + 16), 3, ACCENT)
    d.text((MARGIN + 22, y), "Server / persistence", font=f_small, fill=INK)
    rounded_rect(d, (MARGIN + 200, y, MARGIN + 216, y + 16), 3, (156, 163, 175))
    d.text((MARGIN + 222, y), "Product UI / pages", font=f_small, fill=INK)
    y += 28

    total_max = max(s + u for _, s, u, _ in SERVER_UI)
    label_w = 80
    bar_h = 30
    for name, server, ui, color in SERVER_UI:
        d.text((MARGIN, y + 6), name, font=f_label, fill=INK)
        x0 = MARGIN + label_w
        usable = W - MARGIN - x0 - 220
        sw = int(usable * server / total_max)
        uw = int(usable * ui / total_max)
        d.rectangle((x0, y, x0 + sw, y + bar_h), fill=color)
        ui_c = ((color[0] + 180) // 2, (color[1] + 180) // 2, (color[2] + 180) // 2)
        d.rectangle((x0 + sw, y, x0 + sw + uw, y + bar_h), fill=ui_c)
        d.text(
            (x0 + sw + uw + 10, y + 6),
            f"S {server:,}  ·  UI {ui:,}",
            font=f_small,
            fill=MUTED,
        )
        if sw > 56:
            d.text((x0 + 8, y + 6), str(server), font=f_label, fill=(255, 255, 255))
        if uw > 56:
            d.text((x0 + sw + 8, y + 6), str(ui), font=f_label, fill=INK)
        y += bar_h + 12

    y += 10
    d.line((MARGIN, y, W - MARGIN, y), fill=RULE, width=1)
    y += 22

    # 3. Callouts
    d.text((MARGIN, y), "3 · Read these carefully", font=f_h2, fill=INK)
    y += 30
    cw = (W - 2 * MARGIN - 2 * COL_GAP) // 3
    ch = 150
    for i, (title, body, color) in enumerate(CALLOUTS):
        x = MARGIN + i * (cw + COL_GAP)
        rounded_rect(d, (x, y, x + cw, y + ch), 10, CARD, RULE, 1)
        d.rectangle((x, y, x + 6, y + ch), fill=color)
        d.text((x + 16, y + 14), title, font=f_h3, fill=color)
        draw_wrapped(d, body, x + 16, y + 42, f_small, MUTED, cw - 28, line_gap=3)
    y += ch + 24

    d.line((MARGIN, y, W - MARGIN, y), fill=RULE, width=1)
    y += 20

    # Architecture strip
    d.text((MARGIN, y), "4 · Architecture (one line each)", font=f_h2, fill=INK)
    y += 28
    rows = [
        ("Rails", "Controller → ERB / Turbo · Active Record · cookie + reset", RAILS),
        ("Laravel", "Controller → Inertia props → React · Eloquent · Policies · lean auth", LARAVEL),
        ("PHP", "public/*.php page scripts · PDO repos · session + CSRF", PHP),
        ("Go", "chi → template / HTMX · sqlc from hand SQL · session + CSRF", GO),
        ("Hono", "JSON /api + JWT · Drizzle + hand queries · React SPA", HONO),
    ]
    for name, blurb, color in rows:
        rounded_rect(d, (MARGIN, y, W - MARGIN, y + 36), 8, CARD, RULE, 1)
        d.rectangle((MARGIN, y, MARGIN + 6, y + 36), fill=color)
        d.text((MARGIN + 18, y + 9), name, font=f_label, fill=color)
        d.text((MARGIN + 110, y + 10), blurb, font=f_small, fill=MUTED)
        y += 44

    y += 8
    d.line((MARGIN, y, W - MARGIN, y), fill=RULE, width=2)
    y += 16
    d.text((MARGIN, y), "Source", font=f_h3, fill=INK)
    y += 22
    d.text(
        (MARGIN, y),
        "docs/comparisons/conduit-stacks.md  ·  regenerate: images/generate_conduit_stacks_poster.py",
        font=f_mono,
        fill=ACCENT,
    )
    y += 22
    d.text(
        (MARGIN, y),
        "real-world-apps  ·  application LoC comparison  ·  not a framework benchmark",
        font=f_tiny,
        fill=(140, 148, 158),
    )
    y += 36

    final = img.crop((0, 0, W, y + MARGIN // 2))
    OUT.parent.mkdir(parents=True, exist_ok=True)
    final.save(OUT, "PNG", optimize=True)
    print(f"Wrote {OUT} ({final.size[0]}×{final.size[1]})", file=sys.stderr)


if __name__ == "__main__":
    main()
