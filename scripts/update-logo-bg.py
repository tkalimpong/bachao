"""Replace familygullak-logo.png teal/green background with trust blue (#2563eb)."""

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
LOGO = ROOT / "public" / "familygullak-logo.png"
TRUST_BLUE = (37, 99, 235)

def main() -> None:
    img = Image.open(LOGO).convert("RGBA")
    px = img.load()
    w, h = img.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            if g > r and g > b and g > 100:
                px[x, y] = (*TRUST_BLUE, a)
    img.save(LOGO)
    print(f"Updated {LOGO}")

if __name__ == "__main__":
    main()
