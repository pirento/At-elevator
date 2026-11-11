"""Build a single-file preview of the site.

Usage:  python3 tools/build_preview.py [artifact_out.html]

Writes preview.html next to index.html: CSS, JS, images and the brochure PDF are
all embedded, so the one file can be shared on WhatsApp/email and opened offline.
With an argument, also writes a variant for claude.ai shared links (no <html>/<head>
wrapper, map iframe swapped for a static card, since that viewer blocks iframes).
"""
import base64
import mimetypes
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def data_uri(rel):
    path = ROOT / rel
    mime = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
    return f"data:{mime};base64," + base64.b64encode(path.read_bytes()).decode()


html = (ROOT / "index.html").read_text(encoding="utf-8")
css = (ROOT / "css/style.css").read_text(encoding="utf-8")
js = (ROOT / "js/script.js").read_text(encoding="utf-8")
pdf_b64 = base64.b64encode((ROOT / "assets/brochure/A-T-Elevator-Brochure.pdf").read_bytes()).decode()

html = html.replace('<link rel="stylesheet" href="css/style.css" />', f"<style>\n{css}\n</style>")
html = html.replace(
    '<script src="js/script.js"></script>',
    f'<script>window.ATE_BROCHURE_B64="{pdf_b64}";</script>\n<script>\n{js}\n</script>',
)
html = re.sub(r'(src|href)="(assets/(?:images|icons)/[^"]+)"', lambda m: f'{m.group(1)}="{data_uri(m.group(2))}"', html)

assert "css/style.css" not in html and "js/script.js" not in html and 'src="assets/' not in html
(ROOT / "preview.html").write_text(html, encoding="utf-8")
print("preview.html", round(len(html) / 1e6, 2), "MB")

if len(sys.argv) > 1:
    art = html
    head_end = art.index("</head>")
    head = art[art.index("<head>") + 6:head_end]
    body = art[art.index("<body>") + 6:art.rindex("</body>")]
    head = re.sub(r"<title>.*?</title>", "", head, flags=re.S)
    head = re.sub(r'<meta (charset|name="viewport"|name="theme-color")[^>]*>\s*', "", head)
    head = re.sub(r'<link rel="icon"[^>]*>\s*', "", head)
    map_card = (
        '<div class="map-static"><svg class="i"><use href="#i-pin"/></svg>'
        "<strong>Omaxe LIG Tower No. 2</strong><span>Arjungang, Lucknow – 226002</span></div>"
    )
    body = re.sub(r"<iframe title=\"A T Elevator office location.*?</iframe>", map_card, body, flags=re.S)
    extra_css = (
        "<style>.map-static{position:absolute;inset:0;display:grid;place-content:center;justify-items:center;gap:2px;"
        "padding-bottom:40px;text-align:center;color:#172E52;background:linear-gradient(rgba(23,46,82,.06) 1px,transparent 1px) 0 0/28px 28px,"
        "linear-gradient(90deg,rgba(23,46,82,.06) 1px,transparent 1px) 0 0/28px 28px,#EAF3FC}"
        ".map-static .i{width:34px;height:34px;color:#2186F3;margin-bottom:6px}.map-static span{color:#64748B;font-size:14px}</style>"
    )
    art = "<title>A T Elevator</title>\n" + head.strip() + "\n" + extra_css + "\n" + body.strip() + "\n"
    Path(sys.argv[1]).write_text(art, encoding="utf-8")
    print(sys.argv[1], round(len(art) / 1e6, 2), "MB")
