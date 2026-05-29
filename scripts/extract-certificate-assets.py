#!/usr/bin/env python3
"""Re-export header/terms/footer PNGs from public/certificate-of-partnership.pdf."""

from pathlib import Path

import fitz

ROOT = Path(__file__).resolve().parents[1]
PDF = ROOT / "public" / "certificate-of-partnership.pdf"
OUT = ROOT / "src" / "assets" / "certificate"

# y from top of page — aligned to text blocks in the reference PDF
REGIONS = {
    "header": (0, 0, None, 212),
    "terms": (0, 283, None, 547),
    "footer": (0, 575, None, None),
}


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    doc = fitz.open(PDF)
    page = doc[0]
    w, h = page.rect.width, page.rect.height

    for name, (x0, y0, x1, y1) in REGIONS.items():
        rect = fitz.Rect(x0, y0, x1 or w, y1 or h)
        pix = page.get_pixmap(matrix=fitz.Matrix(2, 2), clip=rect, alpha=False)
        path = OUT / f"{name}.png"
        pix.save(path)
        print(f"wrote {path} ({pix.width}x{pix.height})")


if __name__ == "__main__":
    main()
