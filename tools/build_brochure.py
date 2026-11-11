"""Build the A4 company brochure PDF from brochure-src/brochure.html.

Usage:  python3 tools/build_brochure.py

Writes assets/brochure/A-T-Elevator-Brochure.pdf, refreshes the three brochure page
thumbnails used on the website, and updates the "PDF · N pages · X MB" text in index.html.
Needs Playwright's Chromium and poppler (pdftoppm); fonts live in brochure-src/fonts/.
"""
import re
import subprocess
import tempfile
from pathlib import Path

from playwright.sync_api import sync_playwright
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "brochure-src"
PDF = ROOT / "assets/brochure/A-T-Elevator-Brochure.pdf"
THUMBS = {1: "brochure-cover.jpg", 3: "brochure-types.jpg", 5: "brochure-doors.jpg"}

index = (ROOT / "index.html").read_text(encoding="utf-8")
sprite = re.search(r'<svg width="0" height="0"[^>]*>(.*?)</svg>', index, re.S).group(1)
html = (SRC / "brochure.html").read_text(encoding="utf-8").replace("<!--SPRITE-->", sprite)
built = SRC / "_built.html"  # same folder so relative image/font paths resolve
built.write_text(html, encoding="utf-8")

try:
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto(built.as_uri(), wait_until="networkidle")
        page.evaluate("document.fonts.ready")
        broken = page.evaluate("[...document.images].filter(i => !i.naturalWidth).map(i => i.src)")
        assert not broken, f"missing images: {broken}"
        # every page must end above its footer / dark band (pages clip overflow, so check it here)
        clashes = page.evaluate("""() => [...document.querySelectorAll('.page:not(.cover)')].map((pg, i) => {
            const kids = [...pg.children], abs = kids.filter(k => getComputedStyle(k).position === 'absolute');
            const limit = Math.min(...abs.map(k => k.getBoundingClientRect().top));
            const bottom = Math.max(...kids.filter(k => !abs.includes(k)).map(k => k.getBoundingClientRect().bottom));
            return bottom > limit - 10 ? `page ${i + 2}: content ends ${Math.round(bottom - limit + 10)}px too low` : null;
        }).filter(Boolean)""")
        assert not clashes, clashes
        PDF.parent.mkdir(parents=True, exist_ok=True)
        page.pdf(path=str(PDF), prefer_css_page_size=True, print_background=True)
        browser.close()
finally:
    built.unlink(missing_ok=True)

pages = len(PdfReader(PDF).pages)
assert pages == 8, f"expected 8 A4 pages, got {pages} (something overflowed a page)"
mb = PDF.stat().st_size / 1e6
print(f"{PDF.name}: {pages} pages, {mb:.1f} MB")

with tempfile.TemporaryDirectory() as tmp:
    for n, name in THUMBS.items():
        out = Path(tmp) / f"p{n}"
        subprocess.run(["pdftoppm", "-f", str(n), "-l", str(n), "-singlefile", "-jpeg", "-jpegopt", "quality=86",
                        "-scale-to-x", "600", "-scale-to-y", "-1", str(PDF), str(out)], check=True)
        (ROOT / "assets/images" / name).write_bytes(out.with_suffix(".jpg").read_bytes())

meta = f"PDF · {pages} pages · {mb:.1f} MB"
index, n = re.subn(r"PDF · \d+ pages · [\d.]+ MB", meta, index)
assert n >= 1, "brochure meta text not found in index.html"
(ROOT / "index.html").write_text(index, encoding="utf-8")
print(f"thumbnails refreshed; '{meta}' updated in {n} places")
