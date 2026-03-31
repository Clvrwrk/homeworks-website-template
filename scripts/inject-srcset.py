#!/usr/bin/env python3
"""
Inject srcset + sizes attributes into hero <img> tags across all Astro pages.
Only touches <img> tags that have loading="eager" (the LCP hero image).
"""
import re, os

SRC_DIR = "/home/ubuntu/Mckinney-Fixit-Pros/src/pages"

# Maps each static src value to its responsive srcset string
SRCSET_MAP = {
    "/truck-image.webp": (
        "/truck-image-640w.webp 640w, "
        "/truck-image-1024w.webp 1024w, "
        "/truck-image-1456w.webp 1456w, "
        "/truck-image.webp 2048w"
    ),
    "/shop-door.webp": (
        "/shop-door-640w.webp 640w, "
        "/shop-door-1024w.webp 1024w, "
        "/shop-door-1456w.webp 1456w, "
        "/shop-door.webp 2048w"
    ),
    "/hero-truck.webp": (
        "/hero-truck-640w.webp 640w, "
        "/hero-truck-1024w.webp 1024w, "
        "/hero-truck-1456w.webp 1456w, "
        "/hero-truck.webp 2048w"
    ),
    "/about-us.webp": (
        "/about-us-640w.webp 640w, "
        "/about-us-1024w.webp 1024w, "
        "/about-us-1456w.webp 1456w, "
        "/about-us.webp 2048w"
    ),
    "/about-caleb-truck.webp": (
        "/about-caleb-truck-640w.webp 640w, "
        "/about-caleb-truck-1024w.webp 1024w, "
        "/about-caleb-truck-1456w.webp 1456w, "
        "/about-caleb-truck.webp 2048w"
    ),
    "/caleb-shop-door.webp": (
        "/caleb-shop-door-640w.webp 640w, "
        "/caleb-shop-door-1024w.webp 1024w, "
        "/caleb-shop-door-1456w.webp 1456w, "
        "/caleb-shop-door.webp 2048w"
    ),
}

SIZES = '(max-width: 640px) 640px, (max-width: 1024px) 1024px, (max-width: 1456px) 1456px, 2048px'

def process_file(path):
    with open(path, "r") as f:
        content = f.read()

    original = content
    changed = False

    for src_val, srcset_val in SRCSET_MAP.items():
        # Match <img blocks that contain this exact src and loading="eager"
        # We look for the src attribute and add srcset + sizes if not already present
        pattern = rf'(src="{re.escape(src_val)}"(?:[^>]*?))(loading="eager")'
        
        def add_srcset(m):
            before = m.group(1)
            loading = m.group(2)
            # Don't add if srcset already present
            if 'srcset=' in before:
                return m.group(0)
            return f'{before}srcset="{srcset_val}"\n        sizes="{SIZES}"\n        {loading}'
        
        new_content = re.sub(pattern, add_srcset, content, flags=re.DOTALL)
        if new_content != content:
            content = new_content
            changed = True
            print(f"  Added srcset for {src_val}")

    if changed:
        with open(path, "w") as f:
            f.write(content)
        print(f"  -> Updated: {path}")
    else:
        print(f"  -> No static src match (may use dynamic src): {path}")

    return changed

print("=== Injecting srcset into hero images ===\n")
total = 0
for root, dirs, files in os.walk(SRC_DIR):
    for fname in sorted(files):
        if fname.endswith(".astro"):
            fpath = os.path.join(root, fname)
            # Only process files that have loading="eager"
            with open(fpath) as f:
                raw = f.read()
            if 'loading="eager"' in raw:
                print(f"{fpath}:")
                if process_file(fpath):
                    total += 1

print(f"\nDone. {total} files updated.")
