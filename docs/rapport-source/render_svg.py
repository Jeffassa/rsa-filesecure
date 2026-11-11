"""Convertit chaque SVG du dossier en PNG net (échelle 2) avec Chrome sans interface."""
import re
import subprocess
import sys
from pathlib import Path

CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
folder = Path(sys.argv[1])
for svg in sorted(folder.glob("*.svg")):
    head = svg.read_text(encoding="utf-8")[:400]
    w, h = map(int, re.search(r'width="(\d+)" height="(\d+)"', head).groups())
    png = svg.with_suffix(".png")
    subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=2",
                    f"--window-size={w},{h}", f"--screenshot={png}", svg.as_uri()],
                   check=True, capture_output=True, timeout=60)
    print(png.name, w, h)
