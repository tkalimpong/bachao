"""Create bachao-mark.png from bachao-logo.png (read-only source).

Same pot + coins artwork, no Bachao caption. Keeps the outer white canvas and
inner rounded-square white border; only the teal/green fill inside the frame
becomes a trust-blue diagonal gradient.
"""
from __future__ import annotations

from collections import deque
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "public" / "bachao-logo.png"
OUTPUT = ROOT / "public" / "bachao-mark.png"

GRAD_A = (30, 58, 138)
GRAD_B = (37, 99, 235)
GRAD_C = (59, 130, 246)

CAPTION_Y_RATIO = 0.78
BORDER_X_RATIO = 0.155


def lerp(a: tuple[int, int, int], b: tuple[int, int, int], t: float) -> tuple[int, int, int]:
    t = max(0.0, min(1.0, t))
    return (
        int(a[0] + (b[0] - a[0]) * t),
        int(a[1] + (b[1] - a[1]) * t),
        int(a[2] + (b[2] - a[2]) * t),
    )


def gradient_rgb(x: int, y: int, w: int, h: int) -> tuple[int, int, int]:
    tx = x / max(w - 1, 1)
    ty = y / max(h - 1, 1)
    t = max(0.0, min(1.0, tx * 0.45 + ty * 0.55))
    if t < 0.55:
        return lerp(GRAD_A, GRAD_B, t / 0.55)
    return lerp(GRAD_B, GRAD_C, (t - 0.55) / 0.45)


def gradient_rgba(x: int, y: int, w: int, h: int) -> tuple[int, int, int, int]:
    r, g, b = gradient_rgb(x, y, w, h)
    return (r, g, b, 255)


def is_gold(r: int, g: int, b: int) -> bool:
    return r > 175 and g > 110 and b < 160 and (r - b) > 80


def is_teal_green(r: int, g: int, b: int) -> bool:
    if is_gold(r, g, b):
        return False
    if r > 235 and g > 235 and b > 225:
        return False
    if g > 55 and b > 45 and r < 140:
        return True
    if g > 80 and b > 60 and r < 160 and (g - r) > 20:
        return True
    return False


def is_padding_white(r: int, g: int, b: int) -> bool:
    return r > 248 and g > 248 and b > 248


def is_white(r: int, g: int, b: int) -> bool:
    return r > 235 and g > 235 and b > 225


def is_caption_artifact(r: int, g: int, b: int) -> bool:
    """Letterforms and their anti-aliased edges on the green caption background."""
    if is_gold(r, g, b):
        return False
    if is_white(r, g, b):
        return True
    if is_teal_green(r, g, b):
        return True
    if g > 95 and b > 70 and r < 210 and (g - r) > -5:
        return True
    if r > 190 and g > 190 and b > 190:
        return True
    return False


def outer_white_mask(px, w: int, h: int) -> list[list[bool]]:
    mask = [[False] * w for _ in range(h)]
    seeds: list[tuple[int, int]] = []
    for x in range(w):
        if is_padding_white(*px[x, 0][:3]):
            seeds.append((x, 0))
        if is_padding_white(*px[x, h - 1][:3]):
            seeds.append((x, h - 1))
    for y in range(h):
        if is_padding_white(*px[0, y][:3]):
            seeds.append((0, y))
        if is_padding_white(*px[w - 1, y][:3]):
            seeds.append((w - 1, y))

    for sx, sy in seeds:
        if mask[sy][sx]:
            continue
        q: deque[tuple[int, int]] = deque([(sx, sy)])
        mask[sy][sx] = True
        while q:
            x, y = q.popleft()
            for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                if 0 <= nx < w and 0 <= ny < h and not mask[ny][nx]:
                    if is_padding_white(*px[nx, ny][:3]):
                        mask[ny][nx] = True
                        q.append((nx, ny))
    return mask


def pot_point_set(px, outer: list[list[bool]], w: int, h: int) -> set[tuple[int, int]]:
    seen = [[False] * w for _ in range(h)]
    best: list[tuple[int, int]] = []
    for y in range(h):
        for x in range(w):
            if seen[y][x] or outer[y][x] or not is_white(*px[x, y][:3]):
                continue
            q: deque[tuple[int, int]] = deque([(x, y)])
            seen[y][x] = True
            pts: list[tuple[int, int]] = [(x, y)]
            while q:
                cx, cy = q.popleft()
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nx, ny = cx + dx, cy + dy
                    if (
                        0 <= nx < w
                        and 0 <= ny < h
                        and not seen[ny][nx]
                        and not outer[ny][nx]
                        and is_white(*px[nx, ny][:3])
                    ):
                        seen[ny][nx] = True
                        q.append((nx, ny))
                        pts.append((nx, ny))
            if len(pts) > len(best):
                best = pts
    return set(best)


def expand_pot_edge(px, pot_pts: set[tuple[int, int]], w: int, h: int) -> set[tuple[int, int]]:
    """Include soft pot rim pixels so green anti-alias does not show as gray smudges."""
    expanded = set(pot_pts)
    for _ in range(4):
        added: set[tuple[int, int]] = set()
        for x, y in expanded:
            for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                if not (0 <= nx < w and 0 <= ny < h) or (nx, ny) in expanded:
                    continue
                r, g, b, _ = px[nx, ny]
                if is_gold(r, g, b) or is_teal_green(r, g, b):
                    continue
                if r > 175 and g > 170 and b > 165:
                    added.add((nx, ny))
        if not added:
            break
        expanded |= added
    return expanded


def touches_teal(px, x: int, y: int, w: int, h: int) -> bool:
    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        nx, ny = x + dx, y + dy
        if 0 <= nx < w and 0 <= ny < h and is_teal_green(*px[nx, ny][:3]):
            return True
    return False


def detect_text_bbox(
    px,
    pot_pts: set[tuple[int, int]],
    w: int,
    h: int,
) -> tuple[int, int, int, int] | None:
    pot_ymax = max(y for _, y in pot_pts) if pot_pts else int(h * CAPTION_Y_RATIO)
    y0 = max(int(h * CAPTION_Y_RATIO), pot_ymax - int(h * 0.01))
    y1 = int(h * 0.975)
    border_x = int(w * BORDER_X_RATIO)

    text_pts: list[tuple[int, int]] = []
    for y in range(y0, y1):
        for x in range(border_x, w - border_x):
            if (x, y) in pot_pts:
                continue
            r, g, b, _ = px[x, y]
            if is_white(r, g, b) and touches_teal(px, x, y, w, h):
                text_pts.append((x, y))
            elif is_caption_artifact(r, g, b) and y >= pot_ymax + 6:
                text_pts.append((x, y))

    if len(text_pts) < 40:
        return None

    xs = [p[0] for p in text_pts]
    ys = [p[1] for p in text_pts]
    pad_x = max(18, w // 70)
    pad_y = max(10, h // 90)
    return (
        max(border_x, min(xs) - pad_x),
        max(y0, min(ys) - pad_y),
        min(w - border_x, max(xs) + pad_x),
        min(y1, max(ys) + pad_y),
    )


def is_border_strip(x: int, w: int) -> bool:
    edge = int(w * BORDER_X_RATIO)
    return x < edge + 12 or x >= w - edge - 12


def mark_teal_background(px, bg: list[list[bool]], w: int, h: int) -> None:
    for y in range(h):
        for x in range(w):
            if is_teal_green(*px[x, y][:3]):
                bg[y][x] = True


def mark_caption_for_removal(
    px,
    bg: list[list[bool]],
    pot_pts: set[tuple[int, int]],
    w: int,
    h: int,
) -> None:
    text_box = detect_text_bbox(px, pot_pts, w, h)
    if text_box:
        x0, y0, x1, y1 = text_box
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                if (x, y) in pot_pts:
                    continue
                if is_border_strip(x, w) and is_white(*px[x, y][:3]):
                    continue
                if is_caption_artifact(*px[x, y][:3]):
                    bg[y][x] = True

    caption_y = int(h * CAPTION_Y_RATIO)
    for y in range(caption_y, h):
        for x in range(w):
            if (x, y) in pot_pts:
                continue
            if is_teal_green(*px[x, y][:3]):
                bg[y][x] = True


def apply_gradient_background(img: Image.Image) -> Image.Image:
    out = img.copy()
    px = out.load()
    w, h = out.size
    outer = outer_white_mask(px, w, h)
    pot_pts = expand_pot_edge(px, pot_point_set(px, outer, w, h), w, h)
    bg = [[False] * w for _ in range(h)]

    mark_teal_background(px, bg, w, h)
    mark_caption_for_removal(px, bg, pot_pts, w, h)

    white = (255, 255, 255, 255)
    for y in range(h):
        for x in range(w):
            if (x, y) in pot_pts:
                px[x, y] = white
            elif bg[y][x]:
                px[x, y] = gradient_rgba(x, y, w, h)

    return out


def main() -> None:
    if not SOURCE.is_file():
        raise SystemExit(f"Source logo not found: {SOURCE}")

    img = Image.open(SOURCE).convert("RGBA")
    result = apply_gradient_background(img)
    result.save(OUTPUT)
    print(f"Created {OUTPUT} ({result.size[0]}x{result.size[1]}) from {SOURCE.name}")


if __name__ == "__main__":
    main()
