#!/usr/bin/env python3
"""Generate docs/comparisons/images/rails-hono-php-loc.png.

Design and numbers must stay aligned with ../rails-hono-php.md.
Recovered from the PR #4 worker (bc-d7944fd6) one-shot Pillow script; kept
in-tree so agents can regenerate without reverse-engineering pixels.

Deps: Python 3 + Pillow (`pip install pillow`).
Fonts: Inter (preferred) or Liberation/DejaVu Sans; Liberation Mono for paths.
"""

from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent
OUT = HERE / "rails-hono-php-loc.png"

W = 1400
MARGIN = 56
COL_GAP = 28

# Flat palette (slate paper + teal / amber / navy) — keep in sync with README.md
BG = (244, 246, 248)  # #f4f6f8
INK = (28, 35, 43)  # #1c232b
MUTED = (90, 100, 112)  # #5a6470
RULE = (210, 216, 222)  # #d2d8de
CARD = (255, 255, 255)
RAILS = (15, 118, 110)  # #0f766e
PHP = (180, 83, 9)  # #b45309
HONO = (30, 58, 95)  # #1e3a5f
ACCENT = (55, 65, 81)  # #374151
SOFT_RAILS = (204, 233, 230)
SOFT_PHP = (252, 231, 208)
SOFT_HONO = (214, 224, 236)

# ── Numbers from docs/comparisons/rails-hono-php.md ─────────────────────
# Update these when the comparison doc tables change, then re-run this script.
APP_TOTALS = [
    # name, loc, ratio label, color, soft, note
    ("Rails ERB", 1082, "1.0×", RAILS, SOFT_RAILS, "baseline"),
    ("PHP", 1733, "~1.6× Rails", PHP, SOFT_PHP, "middle"),
    ("React + Hono", 3028, "~2.8× Rails", HONO, SOFT_HONO, "largest"),
]
SERVER_UI = [
    # name, server, ui, color
    ("Rails", 475, 587, RAILS),
    ("PHP", 764, 969, PHP),
    ("Hono", 1492, 1536, HONO),
]
HONO_SERVER = 1492
PHP_SERVER = 764
SERVER_GAP = 728  # Hono − PHP
ARTICLES_SQL = ("327", "362")  # Hono, PHP
DOMAIN_CORE = ("611", "577")
GAP_DRIVERS = [
    # approx, title, hono_bit, php_bit, color
    (
        "~440",
        "RealWorld JSON API",
        "Zod schemas, route http.ts adapters, @conduit/contracts",
        "PHP: HTML page scripts under public/ + includes/ (UI row)",
        HONO,
    ),
    (
        "~201",
        "Seed + entry wiring",
        "seed.ts + app.ts + server.ts in the server bucket",
        "PHP: bin/seed + includes/bootstrap.php (outside src/)",
        ACCENT,
    ),
    (
        "~128",
        "Drizzle packages/db",
        "Schema modules + client + migrate",
        "PHP: Migrator + PdoFactory (~45) + SQL in repositories",
        PHP,
    ),
    (
        "~40+",
        "Permissions / present()",
        "JSON permissions helpers + present() mappers for the SPA",
        "PHP: inline session/ownership checks in page scripts",
        MUTED,
    ),
]
# Per-screen character counts (Rails, Hono, PHP) — “Same screens” table
SCREENS = [
    ("Article show", 1756, 10038, 6963),
    ("Editor", 1392, 5841, 5297),
    ("Login + register", 2508, 4923, 3596),
    ("Settings", 1810, 4124, 2966),
    ("Home / feed", 2690, 6377, 5907),
    ("Profile", 2029, 6076, 4669),
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
        "/usr/share/fonts/truetype/noto/NotoSansMono-Regular.ttf",
    ],
}


def _first_font(paths: list[str]) -> str:
    for path in paths:
        if Path(path).is_file():
            return path
    raise FileNotFoundError(
        "No usable font found. Install Inter, Liberation Sans, or DejaVu Sans.\n"
        f"Tried: {paths}"
    )


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
    line_gap: int = 6,
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
    track: tuple[int, int, int] = (232, 236, 240),
) -> None:
    rounded_rect(draw, (x, y, x + max_w, y + height), height // 2, track)
    w = max(height, int(max_w * (value / vmax)))
    rounded_rect(draw, (x, y, x + w, y + height), height // 2, color)


def main() -> None:
    # First pass: draw on a tall canvas; crop trailing whitespace at end
    H = 3200
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)

    f_title = font(FONT_BOLD, 42)
    f_sub = font(FONT_REG, 18)
    f_h2 = font(FONT_BOLD, 24)
    f_h3 = font(FONT_SEMI, 16)
    f_body = font(FONT_REG, 15)
    f_small = font(FONT_REG, 13)
    f_tiny = font(FONT_REG, 12)
    f_num = font(FONT_BOLD, 36)
    f_num_sm = font(FONT_BOLD, 22)
    f_label = font(FONT_SEMI, 14)
    f_mono = font(FONT_MONO, 12)

    y = MARGIN

    # Header
    d.text((MARGIN, y), "Conduit LoC — three stacks", font=f_title, fill=INK)
    y += 52
    y = draw_wrapped(
        d,
        "Same RealWorld product surface in Rails ERB, PHP page scripts, and React + Hono. "
        "Application = product server + UI (no vendored Conduit CSS, no tests). Fresh cloc on the monorepo.",
        MARGIN,
        y,
        f_sub,
        MUTED,
        W - 2 * MARGIN,
        line_gap=4,
    )
    y += 18
    d.line((MARGIN, y, W - MARGIN, y), fill=RULE, width=2)
    y += 28

    # ── 1. App LoC totals ──────────────────────────────────────────────
    d.text((MARGIN, y), "1 · Application LoC totals", font=f_h2, fill=INK)
    y += 40

    apps = APP_TOTALS
    card_w = (W - 2 * MARGIN - 2 * COL_GAP) // 3
    card_h = 168
    for i, (name, loc, ratio, color, soft, note) in enumerate(apps):
        x = MARGIN + i * (card_w + COL_GAP)
        rounded_rect(d, (x, y, x + card_w, y + card_h), 12, CARD, RULE, 1)
        d.rectangle((x, y, x + 8, y + card_h), fill=color)
        d.text((x + 24, y + 18), name, font=f_h3, fill=color)
        d.text((x + 24, y + 48), f"{loc:,}", font=f_num, fill=INK)
        d.text((x + 24, y + 100), "application code lines", font=f_small, fill=MUTED)
        d.text((x + 24, y + 124), f"{ratio}  ·  {note}", font=f_label, fill=ACCENT)

    y += card_h + 22
    vmax = max(loc for _, loc, *_ in apps)
    bar_x = MARGIN + 160
    bar_w = W - MARGIN - bar_x - 120
    for name, loc, ratio, color, soft, note in apps:
        d.text((MARGIN, y + 2), name, font=f_label, fill=INK)
        hbar(d, bar_x, y, bar_w, 18, loc, vmax, color)
        d.text((bar_x + bar_w + 12, y), f"{loc:,}", font=f_label, fill=INK)
        y += 30

    y += 18
    d.line((MARGIN, y, W - MARGIN, y), fill=RULE, width=1)
    y += 28

    # ── 2. Server vs UI ────────────────────────────────────────────────
    d.text((MARGIN, y), "2 · Server vs product UI (path buckets)", font=f_h2, fill=INK)
    y += 34
    y = draw_wrapped(
        d,
        "Directory buckets, not a perfect backend/frontend abstraction. "
        "PHP page scripts fold auth/CSRF/redirects into the UI row — that logic would sit in Rails controllers or Hono API handlers.",
        MARGIN,
        y,
        f_body,
        MUTED,
        W - 2 * MARGIN,
    )
    y += 16

    stacks = SERVER_UI
    legend_y = y
    rounded_rect(d, (MARGIN, legend_y, MARGIN + 18, legend_y + 18), 3, ACCENT)
    d.text((MARGIN + 26, legend_y + 1), "Server / persistence", font=f_small, fill=INK)
    rounded_rect(d, (MARGIN + 220, legend_y, MARGIN + 238, legend_y + 18), 3, (156, 163, 175))
    d.text((MARGIN + 246, legend_y + 1), "Product UI / pages", font=f_small, fill=INK)
    y += 36

    total_max = max(server + ui for _, server, ui, _ in stacks)
    bar_h = 36
    label_w = 90
    for name, server, ui, color in stacks:
        d.text((MARGIN, y + 8), name, font=f_label, fill=INK)
        x0 = MARGIN + label_w
        usable = W - MARGIN - x0 - 200
        sw = int(usable * server / total_max)
        uw = int(usable * ui / total_max)
        d.rectangle((x0, y, x0 + sw, y + bar_h), fill=color)
        ui_color = (
            (color[0] + 180) // 2,
            (color[1] + 180) // 2,
            (color[2] + 180) // 2,
        )
        d.rectangle((x0 + sw, y, x0 + sw + uw, y + bar_h), fill=ui_color)
        d.text(
            (x0 + sw + uw + 12, y + 2),
            f"server {server:,}  ·  UI {ui:,}",
            font=f_small,
            fill=MUTED,
        )
        if sw > 70:
            d.text((x0 + 10, y + 8), str(server), font=f_label, fill=(255, 255, 255))
        if uw > 70:
            d.text((x0 + sw + 10, y + 8), str(ui), font=f_label, fill=INK)
        y += bar_h + 16

    y += 8
    callouts = [
        (
            "Hono vs Rails",
            "Larger on both sides (~3× server, ~2.6× UI). Clean API vs SPA split.",
            HONO,
        ),
        (
            "PHP vs Rails",
            "Server row is hand-SQL repos (~764). UI row thicker: page scripts own request logic.",
            PHP,
        ),
        (
            "Bucket caveat",
            "Do not treat PHP rows as Rails/Hono-style backend vs frontend.",
            ACCENT,
        ),
    ]
    cw = (W - 2 * MARGIN - 2 * COL_GAP) // 3
    ch = 110
    for i, (title, body, color) in enumerate(callouts):
        x = MARGIN + i * (cw + COL_GAP)
        rounded_rect(d, (x, y, x + cw, y + ch), 10, CARD, RULE, 1)
        d.text((x + 16, y + 14), title, font=f_h3, fill=color)
        draw_wrapped(d, body, x + 16, y + 42, f_small, MUTED, cw - 32, line_gap=3)
    y += ch + 28
    d.line((MARGIN, y, W - MARGIN, y), fill=RULE, width=1)
    y += 28

    # ── 3. Why Hono server ~2× PHP ─────────────────────────────────────
    d.text((MARGIN, y), "3 · Why Hono’s server row is ~2× PHP’s", font=f_h2, fill=INK)
    y += 36

    left_w = 420
    rounded_rect(d, (MARGIN, y, MARGIN + left_w, y + 200), 12, CARD, RULE, 1)
    d.text((MARGIN + 24, y + 20), "Server / persistence", font=f_h3, fill=MUTED)
    d.text((MARGIN + 24, y + 52), f"Hono  {HONO_SERVER:,}", font=f_num_sm, fill=HONO)
    d.text((MARGIN + 24, y + 88), f"PHP     {PHP_SERVER:,}", font=f_num_sm, fill=PHP)
    ratio = HONO_SERVER / PHP_SERVER
    d.text(
        (MARGIN + 24, y + 128),
        f"gap {SERVER_GAP}  ·  ~{ratio:.2f}×",
        font=f_label,
        fill=INK,
    )
    d.text(
        (MARGIN + 24, y + 158),
        "Article SQL ≈ similar (not the gap)",
        font=f_small,
        fill=MUTED,
    )

    right_x = MARGIN + left_w + COL_GAP
    right_w = W - MARGIN - right_x
    rounded_rect(d, (right_x, y, right_x + right_w, y + 200), 12, CARD, RULE, 1)
    d.text((right_x + 24, y + 18), "Persistence cores near parity", font=f_h3, fill=INK)
    rows = [
        ("Articles SQL (queries+service vs ArticleRepository)", *ARTICLES_SQL),
        ("Broader domain services / repos", *DOMAIN_CORE),
    ]
    ry = y + 56
    d.text((right_x + 24, ry), "Slice", font=f_tiny, fill=MUTED)
    d.text((right_x + right_w - 160, ry), "Hono", font=f_tiny, fill=MUTED)
    d.text((right_x + right_w - 80, ry), "PHP", font=f_tiny, fill=MUTED)
    ry += 22
    for slice_name, h, p in rows:
        draw_wrapped(d, slice_name, right_x + 24, ry, f_small, INK, right_w - 200, 2)
        d.text((right_x + right_w - 160, ry), h, font=f_label, fill=HONO)
        d.text((right_x + right_w - 80, ry), p, font=f_label, fill=PHP)
        ry += 36
    d.text(
        (right_x + 24, y + 168),
        "Do not read 2× as a persistence-complexity score.",
        font=f_small,
        fill=MUTED,
    )

    y += 220

    d.text((MARGIN, y), "Top drivers of the +728 gap (largest first)", font=f_h3, fill=INK)
    y += 28

    for approx, title, hono_bit, php_bit, color in GAP_DRIVERS:
        rounded_rect(d, (MARGIN, y, W - MARGIN, y + 88), 10, CARD, RULE, 1)
        badge_w = 90
        rounded_rect(d, (MARGIN + 16, y + 24, MARGIN + 16 + badge_w, y + 64), 8, color)
        tw = text_w(d, approx, f_label)
        d.text(
            (MARGIN + 16 + (badge_w - tw) // 2, y + 34),
            approx,
            font=f_label,
            fill=(255, 255, 255),
        )
        d.text((MARGIN + 128, y + 16), title, font=f_h3, fill=INK)
        d.text((MARGIN + 128, y + 42), f"Hono: {hono_bit}", font=f_small, fill=MUTED)
        d.text((MARGIN + 128, y + 62), f"PHP:  {php_bit}", font=f_small, fill=MUTED)
        y += 100

    y += 4
    y = draw_wrapped(
        d,
        "So the server-row ratio is mostly JSON API + shared contracts + in-bucket wiring — not “Hono writes twice as much SQL.” "
        "JWT vs PHP session is a small local difference.",
        MARGIN,
        y,
        f_body,
        MUTED,
        W - 2 * MARGIN,
    )
    y += 22
    d.line((MARGIN, y, W - MARGIN, y), fill=RULE, width=1)
    y += 28

    # ── 4. Architecture + per-screen ───────────────────────────────────
    d.text(
        (MARGIN, y),
        "4 · Architecture snapshot & per-screen character weight",
        font=f_h2,
        fill=INK,
    )
    y += 36

    arch = [
        ("Request story", "Controller → ERB / Turbo", "Hono JSON API → React SPA", "public/*.php page script"),
        ("Rendering", "Server HTML + Hotwire", "Client SPA (Router, Query)", "Server HTML via includes"),
        ("Authority", "CanCanCan Ability", "permissions in JSON", "Inline session / ownership"),
        ("Data access", "Active Record", "Drizzle + hand SQL modules", "PDO repositories, raw SQL"),
        ("Session", "Signed cookie → Session", "JWT in localStorage", "PHP session + CSRF"),
    ]
    col0 = 160
    coln = (W - 2 * MARGIN - col0) // 3
    headers = ["Concern", "Rails ERB", "React + Hono", "PHP"]
    colors_h = [MUTED, RAILS, HONO, PHP]
    for i, (h, c) in enumerate(zip(headers, colors_h)):
        xx = MARGIN if i == 0 else MARGIN + col0 + (i - 1) * coln
        d.text((xx, y), h, font=f_h3, fill=c)
    y += 30
    d.line((MARGIN, y, W - MARGIN, y), fill=RULE, width=1)
    y += 10
    for concern, rails, hono, php in arch:
        row_h = 34
        d.text((MARGIN, y + 6), concern, font=f_label, fill=INK)
        d.text((MARGIN + col0, y + 6), rails, font=f_small, fill=MUTED)
        d.text((MARGIN + col0 + coln, y + 6), hono, font=f_small, fill=MUTED)
        d.text((MARGIN + col0 + 2 * coln, y + 6), php, font=f_small, fill=MUTED)
        y += row_h
        d.line((MARGIN, y, W - MARGIN, y), fill=(230, 234, 238), width=1)

    y += 24
    d.text(
        (MARGIN, y),
        "Same screens — characters (closest product surface files)",
        font=f_h3,
        fill=INK,
    )
    y += 28

    screens = SCREENS
    char_max = max(max(r, h, p) for _, r, h, p in screens)
    row_label_w = 150
    for name, r, h, p in screens:
        d.text((MARGIN, y + 4), name, font=f_small, fill=INK)
        bx = MARGIN + row_label_w
        usable = W - MARGIN - bx - 280
        bh = 8
        for val, color, oy in (
            (r, RAILS, 0),
            (h, HONO, 10),
            (p, PHP, 20),
        ):
            ww = max(4, int(usable * val / char_max))
            d.rectangle((bx, y + oy, bx + ww, y + oy + bh), fill=color)
        d.text(
            (bx + usable + 16, y + 6),
            f"R {r:,}  ·  H {h:,}  ·  P {p:,}",
            font=f_tiny,
            fill=MUTED,
        )
        y += 40

    y += 8
    y = draw_wrapped(
        d,
        "Hono pages carry SPA lifecycle (fetch, loading/error unions, mutations). "
        "PHP is SSR like Rails but page scripts inline the request story — char counts land between Rails and Hono.",
        MARGIN,
        y,
        f_body,
        MUTED,
        W - 2 * MARGIN,
    )
    y += 28
    d.line((MARGIN, y, W - MARGIN, y), fill=RULE, width=2)
    y += 20

    d.text((MARGIN, y), "Source", font=f_h3, fill=INK)
    y += 26
    y = draw_wrapped(
        d,
        "Numbers and caveats from docs/comparisons/rails-hono-php.md (cloc on git-tracked sources in this monorepo). "
        "Hono≈2× PHP server drivers from the same path buckets and file-level counts.",
        MARGIN,
        y,
        f_small,
        MUTED,
        W - 2 * MARGIN,
    )
    y += 8
    d.text(
        (MARGIN, y),
        "docs/comparisons/rails-hono-php.md",
        font=f_mono,
        fill=ACCENT,
    )
    y += 28
    d.text(
        (MARGIN, y),
        "real-world-apps  ·  application LoC comparison  ·  not a benchmark of frameworks",
        font=f_tiny,
        fill=(140, 148, 158),
    )
    y += 40

    final = img.crop((0, 0, W, y + MARGIN // 2))
    OUT.parent.mkdir(parents=True, exist_ok=True)
    final.save(OUT, "PNG", optimize=True)
    print(f"Wrote {OUT} ({final.size[0]}×{final.size[1]})", file=sys.stderr)
    print(f"fonts: reg={FONT_REG} semi={FONT_SEMI} bold={FONT_BOLD} mono={FONT_MONO}", file=sys.stderr)


if __name__ == "__main__":
    main()
