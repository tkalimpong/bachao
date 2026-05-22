"""Create hamro-gullak-mark.png from hamro-gullak-logo.png (read-only source).

Same pot + coins artwork, no app caption. Keeps the outer white canvas and
transparent inner area from the full logo crop.
"""

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "public" / "hamro-gullak-logo.png"
OUTPUT = ROOT / "public" / "hamro-gullak-mark.png"

# Crop box tuned for the pot icon (left portion of the full logo art)
CROP = (0, 0, 512, 512)

def main() -> None:
    img = Image.open(SOURCE).convert("RGBA")
    mark = img.crop(CROP)
    mark.save(OUTPUT)
    print(f"Wrote {OUTPUT}")

if __name__ == "__main__":
    main()
