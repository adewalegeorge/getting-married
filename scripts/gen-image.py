#!/usr/bin/env python3
"""Generate an image via Imagen 4 and save to disk.

Usage: GEMINI_API_KEY=... python3 scripts/gen-image.py <prompt-file> <out-path> [aspect-ratio]
Reads the prompt from a file to avoid shell escaping issues.
"""
import base64
import json
import os
import sys
import urllib.request
import urllib.error
from pathlib import Path

if len(sys.argv) < 3:
    sys.exit("usage: gen-image.py <prompt-file> <out-path> [aspect-ratio]")

prompt_file = Path(sys.argv[1])
out_path = Path(sys.argv[2])
aspect = sys.argv[3] if len(sys.argv) > 3 else "16:9"

key = os.environ.get("GEMINI_API_KEY")
if not key:
    sys.exit("GEMINI_API_KEY not set")

prompt = prompt_file.read_text().strip()
url = f"https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key={key}"
body = json.dumps({
    "instances": [{"prompt": prompt}],
    "parameters": {"sampleCount": 1, "aspectRatio": aspect},
}).encode()

req = urllib.request.Request(url, data=body, headers={"Content-Type": "application/json"})
try:
    with urllib.request.urlopen(req, timeout=120) as resp:
        data = json.loads(resp.read())
except urllib.error.HTTPError as e:
    sys.exit(f"HTTP {e.code}: {e.read().decode()[:600]}")

preds = data.get("predictions") or []
if not preds:
    sys.exit("No predictions returned: " + json.dumps(data)[:600])

img_bytes = base64.b64decode(preds[0]["bytesBase64Encoded"])
mime = preds[0].get("mimeType", "image/png")
out_path.parent.mkdir(parents=True, exist_ok=True)
tmp = out_path.with_suffix(".png" if "png" in mime else ".jpg")
tmp.write_bytes(img_bytes)
print(f"saved {len(img_bytes)} bytes -> {tmp} (mime: {mime})")
