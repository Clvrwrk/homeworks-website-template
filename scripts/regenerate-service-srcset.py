#!/usr/bin/env python3
"""
Regenerate all service card srcset variants.

Changes:
1. Center-crop source images to 3:2 aspect ratio before resizing
   — eliminates hidden vertical pixels (4:3 source → 3:2 display box)
2. Add 720w step between 600w and 800w
   — gives browser exact match for 412px × 1.75 DPR = 721px requirement

Output widths: 400, 600, 720, 800
Source + output directory: public/services/
"""

from PIL import Image
import os

SERVICES_DIR = "/home/ubuntu/Mckinney-Fixit-Pros/public/services"
WIDTHS = [400, 600, 720, 800]
TARGET_RATIO = 3 / 2  # width / height = 3:2

# Source filenames (originals without width suffix)
SOURCES = [
    "drywall.webp",
    "tv-mount.webp",
    "plumbing.webp",
    "door.webp",
    "painting.webp",
    "electrical.webp",
]

def center_crop_3x2(img: Image.Image) -> Image.Image:
    """Center-crop image to 3:2 aspect ratio."""
    w, h = img.size
    target_h = round(w / TARGET_RATIO)
    if target_h <= h:
        # Crop height (4:3 → 3:2)
        top = (h - target_h) // 2
        return img.crop((0, top, w, top + target_h))
    else:
        # Image is already wider than 3:2 — crop width
        target_w = round(h * TARGET_RATIO)
        left = (w - target_w) // 2
        return img.crop((left, 0, left + target_w, h))

for filename in SOURCES:
    src_path = os.path.join(SERVICES_DIR, filename)
    if not os.path.exists(src_path):
        print(f"  SKIP (not found): {src_path}")
        continue

    slug = filename.replace(".webp", "")

    with Image.open(src_path) as img:
        img = img.convert("RGB")
        original_size = img.size
        cropped = center_crop_3x2(img)
        cropped_size = cropped.size
        ratio = f"{cropped_size[0]/cropped_size[1]:.3f}"
        print(f"\n{slug}: {original_size} → cropped to {cropped_size} (ratio {ratio})")

        for w in WIDTHS:
            h = round(w / TARGET_RATIO)
            resized = cropped.resize((w, h), Image.LANCZOS)
            out_path = os.path.join(SERVICES_DIR, f"{slug}-{w}w.webp")
            resized.save(out_path, "WEBP", quality=82, method=6)
            size_kb = os.path.getsize(out_path) / 1024
            print(f"  {w}×{h} → {os.path.basename(out_path)} ({size_kb:.1f} KB)")

print("\nDone. All service images regenerated with 3:2 crop and 720w variant.")
