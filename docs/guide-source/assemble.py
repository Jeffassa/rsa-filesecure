"""Assemble la couverture et le corps, puis produit une planche d'aperçu des pages."""
import sys
from pathlib import Path

import pypdfium2 as pdfium
from PIL import Image
from pypdf import PdfReader, PdfWriter

src = Path(sys.argv[1])
out = Path(sys.argv[2])
out.parent.mkdir(parents=True, exist_ok=True)

writer = PdfWriter()
for name in ("cover.pdf", "body.pdf"):
    writer.append(str(src / name))
writer.add_metadata({
    "/Title": "RSA FileSecure, guide d'utilisation",
    "/Subject": "TP de cryptographie : chiffrement de fichiers RSA-OAEP et AES-256-GCM",
    "/Keywords": "RSA, AES, chiffrement hybride, guide",
    "/Creator": "RSA FileSecure",
})
writer.page_mode = "/UseOutlines"
with open(out, "wb") as f:
    writer.write(f)

pdf = pdfium.PdfDocument(str(out))
n = len(pdf)
thumbs = [pdf[i].render(scale=0.42).to_pil() for i in range(n)]
w, h = thumbs[0].size
cols = 6
rows = (n + cols - 1) // cols
sheet = Image.new("RGB", (cols * (w + 12) + 12, rows * (h + 12) + 12), "#9aa0b4")
for i, t in enumerate(thumbs):
    sheet.paste(t, (12 + (i % cols) * (w + 12), 12 + (i // cols) * (h + 12)))
sheet.save(src / "planche.png")
print(f"{n} pages, {out.stat().st_size / 1024 / 1024:.1f} Mo")
