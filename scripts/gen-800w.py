"""Generate 800w WebP variants for all hero images (fills DPR gap between 640w and 1024w)."""
from PIL import Image
import os

PUBLIC = "/home/ubuntu/Mckinney-Fixit-Pros/public"

heroes = [
    "truck-image",
    "about-us",
    "caleb-shop-door",
    "shop-door",
    "hero-truck",
    "about-caleb-truck",
]

for name in heroes:
    src = os.path.join(PUBLIC, f"{name}.webp")
    if not os.path.exists(src):
        print(f"  SKIP {name}.webp (not found)")
        continue
    img = Image.open(src)
    w, h = img.size
    target_w = 800
    target_h = round(h * target_w / w)
    resized = img.resize((target_w, target_h), Image.LANCZOS)
    out = os.path.join(PUBLIC, f"{name}-800w.webp")
    resized.save(out, "WEBP", quality=82, method=6)
    size_kb = os.path.getsize(out) / 1024
    print(f"  {name}-800w.webp  {target_w}×{target_h}  {size_kb:.1f}KB")

print("Done.")
