#!/usr/bin/env python3
"""
Generate responsive WebP srcset variants for service card images.
Output: 400w, 600w (original), 800w variants for each service image.
Card display context: 4:3 aspect ratio, max ~800px wide at 2x DPR on desktop.
"""
from PIL import Image
import os

SERVICE_DIR = "public/services"
WIDTHS = [400, 600, 800]

images = [f for f in os.listdir(SERVICE_DIR) if f.endswith(".webp") and "-" not in f]

for filename in sorted(images):
    src_path = os.path.join(SERVICE_DIR, filename)
    stem = filename.replace(".webp", "")
    
    with Image.open(src_path) as img:
        orig_w, orig_h = img.size
        aspect = orig_h / orig_w
        print(f"\n{filename}: {orig_w}x{orig_h}")
        
        for w in WIDTHS:
            h = round(w * aspect)
            out_path = os.path.join(SERVICE_DIR, f"{stem}-{w}w.webp")
            
            # Skip if output already exists and is newer than source
            if os.path.exists(out_path):
                print(f"  {w}w → already exists, skipping")
                continue
            
            resized = img.resize((w, h), Image.LANCZOS)
            resized.save(out_path, "WEBP", quality=82, method=6)
            size_kb = os.path.getsize(out_path) // 1024
            print(f"  {w}w → {out_path} ({size_kb}KB)")

print("\n✅ Service image srcset variants generated.")
