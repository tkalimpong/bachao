"""Replace bachao-logo.png teal/green background with trust blue (#2563eb)."""
from __future__ import annotations

from collections import deque
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
LOGO = ROOT / "public" / "bachao-logo.png"
TRUST = (37, 99, 235, 255)
WHITE = (255, 255, 255, 255)


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


def whiten_caption_rows(px, w: int, h: int) -> None:
    """Turn Bachao caption (green-on-green) into white letterforms."""
    y0 = int(h * 0.78)
    for y in range(y0, h):
        xs = [x for x in range(w) if is_white(*px[x, y][:3])]
        if len(xs) < 8:
            continue
        left, right = min(xs), max(xs)
        if right - left < 120:
            continue
        for x in range(left, right + 1):
            r, g, b, _ = px[x, y]
            if is_white(r, g, b) or is_teal_green(r, g, b):
                px[x, y] = WHITE


def fill_edge_margins(px, w: int, h: int) -> None:
    """Replace outer white canvas margins (connected to image edges only)."""
    visited = [[False] * w for _ in range(h)]
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
        if visited[sy][sx]:
            continue
        q: deque[tuple[int, int]] = deque([(sx, sy)])
        visited[sy][sx] = True
        while q:
            x, y = q.popleft()
            px[x, y] = TRUST
            for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                if 0 <= nx < w and 0 <= ny < h and not visited[ny][nx]:
                    r, g, b, _ = px[nx, ny]
                    if is_padding_white(r, g, b):
                        visited[ny][nx] = True
                        q.append((nx, ny))


def main() -> None:
    img = Image.open(LOGO).convert("RGBA")
    px = img.load()
    w, h = img.size

    fill_edge_margins(px, w, h)
    whiten_caption_rows(px, w, h)

    for y in range(h):
        for x in range(w):
            r, g, b, _ = px[x, y]
            if is_teal_green(r, g, b):
                px[x, y] = TRUST

    img.save(LOGO)
    print(f"Updated {LOGO} ({w}x{h})")


if __name__ == "__main__":
    main()
