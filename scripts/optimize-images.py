#!/usr/bin/env python3
"""
Generate responsive WebP variants for all hero/section images.
Produces: {name}-640w.webp, {name}-1024w.webp, {name}-1456w.webp
alongside the original (kept as the 2048w fallback).
"""
from PIL import Image
import os

PUBLIC = "/home/ubuntu/Mckinney-Fixit-Pros/public"

# (source_file, widths_to_generate)
IMAGES = [
    ("truck-image.webp",       [640, 1024, 1456]),
    ("hero-truck.webp",        [640, 1024, 1456]),
    ("about-us.webp",          [640, 1024, 1456]),
    ("about-caleb-truck.webp", [640, 1024, 1456]),
    ("shop-door.webp",         [640, 1024, 1456]),
    ("caleb-shop-door.webp",   [640, 1024, 1456]),
]

# Service images — used in card grids, max display ~600px
SERVICE_IMAGES = [
    "services/drywall.webp",
    "services/tv-mount.webp",
    "services/painting.webp",
    "services/plumbing.webp",
    "services/electrical.webp",
    "services/door.webp",
]

def resize(src_path, width, quality=82):
    img = Image.open(src_path)
    # Maintain aspect ratio
    aspect = img.height / img.width
    new_h = int(width * aspect)
    resized = img.resize((width, new_h), Image.LANCZOS)
    base, ext = os.path.splitext(src_path)
    out_path = f"{base}-{width}w{ext}"
    resized.save(out_path, "WEBP", quality=quality, method=6)
    orig_kb = os.path.getsize(src_path) // 1024
    new_kb  = os.path.getsize(out_path) // 1024
    print(f"  {os.path.basename(out_path)}: {new_kb}KB  (orig {orig_kb}KB @ {img.width}px)")
    return out_path

print("=== Hero images ===")
for fname, widths in IMAGES:
    src = os.path.join(PUBLIC, fname)
    print(f"\n{fname}:")
    for w in widths:
        resize(src, w)

print("\n=== Service card images (640w only) ===")
for fname in SERVICE_IMAGES:
    src = os.path.join(PUBLIC, fname)
    img = Image.open(src)
    if img.width > 640:
        print(f"\n{fname}:")
        resize(src, 640)
    else:
        print(f"  {fname}: already ≤640px, skipping")

print("\nDone.")
