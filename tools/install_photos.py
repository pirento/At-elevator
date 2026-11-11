"""Install new photos into assets/images.

Usage:  python3 tools/install_photos.py <folder-with-new-photos>

Each new photo must be named after the file it replaces (see tools/photo_prompts.json),
in any common format (png/jpg/webp). Photos are resized to a web size, saved as
progressive JPEG under the same name, and the hero <img> width/height are updated.
The replaced originals are kept in assets/images/_previous/.
"""
import re
import shutil
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
IMAGES = ROOT / "assets/images"
MAX_SIDE = {"hero-elevator.jpg": 1400}  # everything else uses DEFAULT_MAX
DEFAULT_MAX = 1200

src_dir = Path(sys.argv[1])
backup = IMAGES / "_previous"
backup.mkdir(exist_ok=True)
installed = []

for src in sorted(src_dir.iterdir()):
    target = IMAGES / (src.stem + ".jpg")
    if not target.exists():
        print("skip (no matching site image):", src.name)
        continue
    im = Image.open(src).convert("RGB")
    im.thumbnail((MAX_SIDE.get(target.name, DEFAULT_MAX),) * 2, Image.LANCZOS)
    if not (backup / target.name).exists():
        shutil.copy2(target, backup / target.name)
    im.save(target, "JPEG", quality=82, optimize=True, progressive=True)
    installed.append(target.name)
    print(f"{target.name}: {im.width}x{im.height}, {target.stat().st_size // 1024} KB")
    if target.name == "hero-elevator.jpg":
        html_path = ROOT / "index.html"
        html = html_path.read_text(encoding="utf-8")
        html, n = re.subn(r'(src="assets/images/hero-elevator\.jpg"[^>]*?) width="\d+" height="\d+"',
                          rf'\1 width="{im.width}" height="{im.height}"', html)
        assert n == 1, "hero <img> not found"
        html_path.write_text(html, encoding="utf-8")

assert installed, "no photos installed - check the file names"
print(len(installed), "photos installed; originals kept in assets/images/_previous/")
