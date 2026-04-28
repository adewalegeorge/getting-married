#!/usr/bin/env python3
"""Edit an existing image via Gemini 2.5 Flash Image (image-in/image-out).

Usage: GEMINI_API_KEY=... python3 scripts/edit-image.py <input> <prompt-file> <output>
"""
import base64
import json
import os
import sys
import urllib.request
import urllib.error
from pathlib import Path

if len(sys.argv) < 4:
    sys.exit("usage: edit-image.py <input> <prompt-file> <output>")

src_path = Path(sys.argv[1])
prompt_file = Path(sys.argv[2])
out_path = Path(sys.argv[3])

key = os.environ.get("GEMINI_API_KEY")
if not key:
    sys.exit("GEMINI_API_KEY not set")

src_bytes = src_path.read_bytes()
mime = "image/jpeg" if src_path.suffix.lower() in (".jpg", ".jpeg") else "image/png"
prompt = prompt_file.read_text().strip()

url = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    f"gemini-2.5-flash-image:generateContent?key={key}"
)
body = json.dumps({
    "contents": [{
        "parts": [
            {"inlineData": {"mimeType": mime, "data": base64.b64encode(src_bytes).decode()}},
            {"text": prompt},
        ]
    }],
    "generationConfig": {"responseModalities": ["IMAGE"]},
}).encode()

req = urllib.request.Request(url, data=body, headers={"Content-Type": "application/json"})
try:
    with urllib.request.urlopen(req, timeout=180) as resp:
        data = json.loads(resp.read())
except urllib.error.HTTPError as e:
    sys.exit(f"HTTP {e.code}: {e.read().decode()[:800]}")

candidates = data.get("candidates") or []
if not candidates:
    sys.exit("No candidates: " + json.dumps(data)[:800])

parts = candidates[0].get("content", {}).get("parts", [])
img_part = next((p for p in parts if "inlineData" in p), None)
if not img_part:
    text_part = next((p.get("text", "") for p in parts if "text" in p), "")
    sys.exit("No image returned. Text response: " + (text_part or json.dumps(data)[:600]))

inline = img_part["inlineData"]
img_bytes = base64.b64decode(inline["data"])
out_mime = inline.get("mimeType", "image/png")
out_path.parent.mkdir(parents=True, exist_ok=True)
out_path.write_bytes(img_bytes)
print(f"saved {len(img_bytes):,} bytes -> {out_path} (mime: {out_mime})")
