---
name: pagespeed-optimization
description: Workflow for achieving 95+ PageSpeed scores on Astro handyman sites, covering image delivery, LCP optimization, and forced reflow prevention.
license: Complete terms in LICENSE.txt
---

# PageSpeed Optimization for Astro Handyman Sites

This skill defines the complete workflow, technical requirements, and diagnostic procedures for achieving and maintaining a **95+ PageSpeed Performance score** on Astro-built handyman and local service websites. It is grounded in the full PageSpeed Insights v5 specification, Google's Core Web Vitals documentation, and real-world Lighthouse audit resolutions from the McKinney Fix-It Pros production site.

---

## Part 1 — Understanding PageSpeed Insights

### 1.1 How PSI Works: Lab Data vs. Field Data

PageSpeed Insights reports two fundamentally different types of data, and confusing them is the most common diagnostic mistake.

**Field Data (Chrome User Experience Report / CrUX)** is collected from real Chrome users over the trailing 28 days. It reflects actual user experiences across all devices, network conditions, and geographic locations. PSI reports field data at the **75th percentile** — meaning the score represents the experience of the user who had it worse than 75% of other users. Field data is updated daily. If a page has insufficient traffic, PSI falls back to origin-level data, then shows no field data at all.

**Lab Data (Lighthouse)** simulates a page load in a controlled environment. It is deterministic, reproducible, and useful for debugging — but it does not capture real-world bottlenecks like CDN performance, regional latency, or user device diversity. The Lighthouse simulation uses a **Moto G Power** (formerly Moto G4) device on a throttled 4G mobile network for mobile tests, and an emulated desktop with a wired connection for desktop tests.

> **Key rule:** Always fix CrUX field data first. If Lighthouse and CrUX disagree, CrUX is more accurate. Only use Lighthouse to diagnose *how* to fix what CrUX reveals.

### 1.2 Core Web Vitals — The Three Metrics That Matter Most

Core Web Vitals are the subset of metrics that Google uses to assess overall page experience quality. Passing all three at the 75th percentile is required for the "Core Web Vitals" badge in PSI.

| Metric | Abbreviation | What It Measures | Good | Needs Improvement | Poor |
|---|---|---|---|---|---|
| Largest Contentful Paint | LCP | When main content is visible | ≤ 2.5s | 2.5–4.0s | > 4.0s |
| Cumulative Layout Shift | CLS | Visual stability / unexpected shifts | ≤ 0.1 | 0.1–0.25 | > 0.25 |
| Interaction to Next Paint | INP | Responsiveness to user input | ≤ 200ms | 200–500ms | > 500ms |

### 1.3 All Six Lighthouse Performance Metrics and Their Weights

The Lighthouse Performance score is a **weighted average** of six metric scores. Each raw metric value is converted to a 0–100 score using a log-normal distribution curve derived from HTTP Archive data. The 25th percentile of HTTP Archive data maps to a score of 50; the 8th percentile maps to a score of 90.

| Metric | Weight (Lighthouse 10) | Good Threshold | Score Color |
|---|---|---|---|
| **Largest Contentful Paint (LCP)** | 25% | ≤ 2.5s | Green ≥ 90 |
| **Total Blocking Time (TBT)** | 30% | ≤ 200ms | Amber 50–89 |
| **Cumulative Layout Shift (CLS)** | 25% | ≤ 0.1 | Red < 50 |
| First Contentful Paint (FCP) | 10% | ≤ 1.8s | — |
| Speed Index (SI) | 10% | ≤ 3.4s | — |
| Time to Interactive (TTI) | 0% (deprecated weight) | — | — |

> **Critical insight:** LCP (25%) + TBT (30%) together account for **55% of the score**. Fixing these two metrics has more than twice the impact of fixing FCP or Speed Index. Always prioritize LCP and TBT.

### 1.4 Score Interpretation

- **90–100 (Green):** Good. A score of 100 is extremely difficult and not required.
- **50–89 (Orange):** Needs Improvement.
- **0–49 (Red):** Poor.

The scoring curve is near-linear between 50 and 92. Above 96, the curve flattens significantly — the "last 5%" requires disproportionately more effort than the first 90 points.

---

## Part 2 — Metric Deep Dives and Fixes

### 2.1 Largest Contentful Paint (LCP)

LCP measures the render time of the largest image, text block, or video visible in the viewport from the moment the user initiates navigation. It is the most impactful metric on the Lighthouse score (25% weight) and the most common failure on local service sites with hero images.

**LCP Sub-Parts (the four phases that sum to total LCP):**

| Sub-Part | Description | Target |
|---|---|---|
| Time to First Byte (TTFB) | Server response time | < 800ms |
| Resource Load Delay | Time between TTFB and when the LCP resource starts loading | < 200ms |
| Resource Load Duration | Time to download the LCP resource | < 500ms |
| Element Render Delay | Time between resource load complete and actual render | < 200ms |

**Root causes and fixes for each sub-part:**

**TTFB > 800ms:** Use a CDN (Cloudflare, Fastly), enable server-side caching, reduce redirects, and ensure the server is geographically close to users. Lighthouse runs from Google datacenters in North America, Europe, or Asia — the test location is shown in the Lighthouse environment block.

**Resource Load Delay:** The LCP image is not discoverable in the initial HTML. Fix: ensure the `<img>` tag is in the server-rendered HTML (not injected by JavaScript), and add a `<link rel="preload">` in the `<head>`.

**Resource Load Duration:** The image file is too large. Fix: use WebP or AVIF format, generate correct `srcset` variants, and ensure the `sizes` attribute is accurate so the browser downloads the right variant.

**Element Render Delay:** JavaScript or CSS is blocking rendering. Fix: eliminate render-blocking scripts, defer non-critical JS, inline critical CSS.

**The Preload + fetchpriority Pattern (Required for Hero Images):**

```html
<!-- In <head> — BOTH attributes are required -->
<link
  rel="preload"
  as="image"
  href="/hero-800w.webp"
  imagesrcset="/hero-400w.webp 400w, /hero-640w.webp 640w, /hero-800w.webp 800w, /hero-1024w.webp 1024w"
  imagesizes="(min-width: 1280px) 1280px, 100vw"
  fetchpriority="high"
/>

<!-- On the <img> tag -->
<img
  src="/hero-800w.webp"
  srcset="/hero-400w.webp 400w, /hero-640w.webp 640w, /hero-800w.webp 800w, /hero-1024w.webp 1024w"
  sizes="(min-width: 1280px) 1280px, 100vw"
  width="1456"
  height="816"
  loading="eager"
  fetchpriority="high"
  alt="..."
/>
```

> **The most common LCP mistake:** Adding `fetchpriority="high"` only to the `<img>` tag but not to the `<link rel="preload">`. The browser's preload scanner reads the `<head>` first. If the preload link lacks `fetchpriority="high"`, the initial request starts at low priority. By the time the `<img>` tag is parsed, the download is already underway at the wrong priority. Lighthouse flags this as "fetchpriority-high should be applied."

### 2.2 Total Blocking Time (TBT)

TBT measures the total time after FCP where the main thread was blocked by tasks longer than 50ms, preventing user input. It is the highest-weighted metric (30%) in Lighthouse 10.

A **Long Task** is any task that runs on the main thread for more than 50ms. The blocking time of a task is its duration minus 50ms. TBT is the sum of all blocking times between FCP and TTI.

**Common TBT causes on Astro sites:**

| Cause | Fix |
|---|---|
| Third-party analytics (GA4, GTM) reading layout properties on init | Load with `defer` or `type="module"` so they run after first paint |
| Large synchronous JavaScript bundles | Astro's island architecture already handles this; ensure no `client:load` on non-critical components |
| Forced reflow in custom JS | See Section 2.5 |
| Font loading blocking render | Use `font-display: swap` or `optional` |

**GA4 / Google Tag Manager Pattern (Required):**

```html
<!-- WRONG — blocks main thread during first paint -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXX"></script>

<!-- CORRECT — deferred until after first paint -->
<script defer src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXX');
</script>
```

The `dataLayer` queue pattern ensures no events are lost — GA4 processes them once the script loads.

### 2.3 Cumulative Layout Shift (CLS)

CLS measures unexpected visual shifts during the page lifecycle. The score is calculated as `impact fraction × distance fraction` for each shift, summed within session windows. A session window is a burst of shifts within 1 second of each other, with a 5-second maximum window.

**CLS score = 0 is achievable and expected on static handyman sites.**

**Common CLS causes and fixes:**

| Cause | Fix |
|---|---|
| Images without `width` and `height` attributes | Always set `width` and `height` on every `<img>` tag matching the intrinsic dimensions of the largest srcset variant |
| Web fonts causing FOUT (Flash of Unstyled Text) | Use `font-display: swap`; preload critical font files |
| Dynamically injected content above existing content | Reserve space with CSS `min-height` before content loads |
| Ads or embeds without reserved dimensions | Set explicit `width` and `height` on iframe/embed containers |
| Animations that change `top`, `left`, `width`, `height` | Use `transform: translate()` instead — transforms do not trigger layout |

**The `width` and `height` Rule:** Always set these to the intrinsic dimensions of the source image (or the largest srcset variant), not the displayed CSS dimensions. The browser uses the ratio to reserve the correct amount of space before the image loads, preventing a layout shift.

### 2.4 Interaction to Next Paint (INP)

INP replaced First Input Delay (FID) as a Core Web Vital in March 2024. It measures the latency of all click, tap, and keyboard interactions throughout the page lifecycle — not just the first one. The final INP value is the worst interaction observed (with outlier removal for pages with 50+ interactions).

**INP is primarily a field metric** — it cannot be accurately measured in Lighthouse because it requires real user interactions. Use CrUX data in PSI or the `web-vitals` JS library for field measurement.

**Common INP causes on Astro sites:**

| Cause | Fix |
|---|---|
| Heavy event handlers on click/tap | Break work into smaller tasks using `setTimeout(fn, 0)` or `scheduler.postTask()` |
| Synchronous DOM reads in event handlers | Cache layout properties; avoid reading `offsetWidth` etc. inside event callbacks |
| Large React/Vue component re-renders | Use Astro's partial hydration — `client:visible` instead of `client:load` |
| Long tasks blocking the main thread | Same as TBT fixes above |

### 2.5 Forced Reflow (Layout Thrashing)

A forced reflow occurs when JavaScript reads a geometric property (such as `offsetWidth`, `offsetHeight`, `scrollHeight`, `getBoundingClientRect()`, `clientHeight`, `scrollTop`) immediately after writing a style that invalidates the layout. The browser must synchronously recalculate layout to return the correct value, blocking the main thread.

Lighthouse reports this as `[unattributed]` when it originates inside a third-party script (like GA4), or with the source file name when it is in first-party code.

**Pattern to avoid (read-after-write):**
```javascript
// WRONG — forces reflow on every call
function showRow(el) {
  el.style.maxHeight = '0';          // WRITE — invalidates layout
  const h = el.scrollHeight;         // READ — forces synchronous reflow
  el.style.maxHeight = h + 'px';
}
```

**Correct pattern (cache before write):**
```javascript
// CORRECT — read once before any writes
const naturalHeights = new Map();
document.querySelectorAll('.expandable').forEach(el => {
  naturalHeights.set(el, el.scrollHeight); // READ at page load, layout is clean
});

function showRow(el) {
  el.style.maxHeight = naturalHeights.get(el) + 'px'; // WRITE only
}
```

### 2.6 First Contentful Paint (FCP)

FCP measures when the first text or image is painted. It is a diagnostic metric (10% weight) that helps identify render-blocking resources.

**Good:** ≤ 1.8s | **Needs Improvement:** 1.8–3.0s | **Poor:** > 3.0s

A large delta between TTFB and FCP indicates render-blocking resources (CSS, synchronous JS, or fonts) are delaying the first paint.

**Fixes:**
- Inline critical above-the-fold CSS in a `<style>` block in `<head>`
- Add `defer` or `async` to all non-critical `<script>` tags
- Add `dns-prefetch` for all third-party origins (`analytics.google.com`, `fonts.googleapis.com`, etc.)
- Add `preconnect` for origins that serve render-critical resources

---

## Part 3 — Image Delivery (The "Last 5%" Problem)

Image delivery is the most common cause of a score plateau between 70–85. The "Improve image delivery" audit flags images where the download size significantly exceeds what the device needs.

### 3.1 The Aspect Ratio Mismatch Problem

If a source image is 4:3 (600×400) but the display box is 3:2 (408×272), the browser downloads the full 4:3 file and CSS `object-fit: cover` silently crops the top and bottom. Lighthouse sees the wasted bytes.

**Rule:** Crop source images to the exact display aspect ratio **before** generating srcset variants. Do not rely on CSS to crop oversized source files.

### 3.2 The DPR Gap Problem (The 720w Step)

Lighthouse's mobile test device is a Moto G Power: **412px wide at 1.75 DPR = 721px required**. A srcset that jumps from `600w` to `800w` forces the browser to always download the `800w` file.

**Required srcset steps for service card images (3:2, displayed at ~400px on mobile):**

| Variant | Dimensions | Use Case |
|---|---|---|
| `400w` | 400×267 | Mobile 1x |
| `600w` | 600×400 | Desktop 1x / Mobile 1.5x |
| `720w` | 720×480 | **Lighthouse mobile (412px × 1.75 DPR = 721px)** |
| `800w` | 800×533 | Mobile 2x |

### 3.3 Accurate `sizes` Attributes

The `sizes` attribute tells the browser how wide the image will be **before CSS loads**. If it is inaccurate, the browser downloads the wrong variant.

| Image Type | Wrong | Correct |
|---|---|---|
| Hero with max-width container (1280px) | `100vw` | `(min-width: 1280px) 1280px, 100vw` |
| 3-column grid cards | `33vw` | `(max-width: 640px) calc(100vw - 1.5rem), (max-width: 1024px) calc(50vw - 1.5rem), calc(min(1280px, 100vw) / 3 - 2rem)` |
| Full-width service page hero | `100vw` | `(min-width: 1280px) 1280px, 100vw` |

### 3.4 Image Format Requirements

Always use **WebP** for photographic images. AVIF offers better compression but has slightly lower browser support. Never use JPEG or PNG for new images on Astro sites.

**Compression targets (Pillow/ImageMagick):**
- WebP quality: 82 (good balance of size vs. quality)
- AVIF quality: 60 (equivalent visual quality to WebP 82)

### 3.5 The Image Generation Script Pattern

For Astro sites, generate all srcset variants at build time using a Python script in `scripts/`:

```python
from PIL import Image
import os

SERVICES = ['drywall', 'tv-mount', 'plumbing', 'door', 'painting', 'electrical']
WIDTHS = [400, 600, 720, 800]
ASPECT = (3, 2)  # Always match the CSS display aspect ratio

for name in SERVICES:
    src = f'public/services/{name}.webp'
    img = Image.open(src)
    w, h = img.size
    # Center crop to target aspect ratio
    target_h = int(w * ASPECT[1] / ASPECT[0])
    if target_h < h:
        top = (h - target_h) // 2
        img = img.crop((0, top, w, top + target_h))
    for width in WIDTHS:
        height = int(width * ASPECT[1] / ASPECT[0])
        resized = img.resize((width, height), Image.LANCZOS)
        resized.save(f'public/services/{name}-{width}w.webp', 'WEBP', quality=82)
```

---

## Part 4 — CSS Compositor Hints

Animations that trigger layout recalculations will cause TBT and forced reflow issues.

**Required CSS for animated elements:**

```css
/* Reveal animations — promote to compositor layer */
.reveal-item {
  will-change: transform, opacity;
}

/* Continuous animations (marquees, carousels) */
.marquee-track {
  will-change: transform;
  contain: layout style; /* Prevents marquee from triggering outer reflows */
}

/* Expanding/collapsing elements — use max-height, not height */
.expandable {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease;
  /* Never animate height directly — it triggers layout on every frame */
}
```

**Transforms vs. Layout Properties:**
- **Safe to animate (compositor only):** `transform`, `opacity`
- **Triggers layout (avoid animating):** `top`, `left`, `width`, `height`, `margin`, `padding`, `font-size`

---

## Part 5 — Server and Network Optimization

### 5.1 TTFB Targets

| Threshold | Value |
|---|---|
| Good | ≤ 800ms |
| Needs Improvement | 800ms–1.8s |
| Poor | > 1.8s |

A high TTFB makes achieving a 2.5s LCP mathematically impossible. Fix TTFB before optimizing images.

**For Coolify-deployed Astro SSR sites:**
- Enable Cloudflare proxy (orange cloud) for automatic CDN caching of static assets
- Set `Cache-Control: public, max-age=31536000, immutable` on all `/public/` assets (Astro does this automatically for hashed assets)
- Set `Cache-Control: public, max-age=3600, s-maxage=86400` on SSR HTML responses
- Use Cloudflare's "Cache Everything" page rule for static service pages

### 5.2 Compression

Ensure gzip or Brotli compression is enabled on the server. Brotli provides ~15–20% better compression than gzip for text assets (HTML, CSS, JS). Coolify/Node.js: enable with the `compression` npm package or at the Nginx/Caddy reverse proxy level.

### 5.3 DNS Prefetch and Preconnect

Add these to `<head>` for every third-party origin:

```html
<!-- Google Analytics -->
<link rel="preconnect" href="https://www.googletagmanager.com" />
<link rel="dns-prefetch" href="https://www.google-analytics.com" />

<!-- Google Fonts (if used) -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
```

---

## Part 6 — Astro-Specific Patterns

### 6.1 Partial Hydration Strategy

Astro's island architecture is the primary reason Astro sites score well out of the box. Use the correct hydration directive for every interactive component:

| Directive | When to Use | TBT Impact |
|---|---|---|
| `client:load` | Critical UI that must be interactive immediately (e.g., mobile nav) | High — loads on page load |
| `client:idle` | Non-critical interactive components | Medium — loads when browser is idle |
| `client:visible` | Components below the fold | Low — loads when scrolled into view |
| `client:media` | Components only needed at certain breakpoints | Low |

> **Rule:** Never use `client:load` on components that are not visible above the fold or not immediately interactive. Every `client:load` component adds to TBT.

### 6.2 Font Loading

Use the Astro Font API (`@astrojs/font`) for all font loading. It handles subsetting, preloading, and `font-display` automatically. Do not manually add Google Fonts `<link>` tags — they are render-blocking.

### 6.3 Image Component

Astro's built-in `<Image />` component (`astro:assets`) automatically generates WebP variants, sets correct `width`/`height` attributes, and adds `loading="lazy"` to below-fold images. Use it for all images except the hero LCP image (which requires manual `fetchpriority="high"` control).

---

## Part 7 — Execution Checklist

Run this checklist before every production deployment:

### Pre-Deployment
- [ ] All service/grid images are cropped to their exact display aspect ratio before generating variants
- [ ] `srcset` includes a `720w` step for Lighthouse mobile DPR matching
- [ ] `sizes` attributes account for max-width containers and exact CSS padding values
- [ ] Hero image `<img>` has `loading="eager"` and `fetchpriority="high"`
- [ ] Hero image `<link rel="preload">` has `fetchpriority="high"`, `imagesrcset`, and `imagesizes`
- [ ] Preload `href` points to the variant most likely selected on mobile (typically `800w`)
- [ ] GA4 and all analytics scripts use `defer` (not `async`)
- [ ] `dns-prefetch` added for all third-party analytics origins
- [ ] No read-after-write forced reflows in custom JavaScript
- [ ] `will-change: transform, opacity` on all reveal animation elements
- [ ] `contain: layout style` on all continuous animation elements (marquees)
- [ ] All `<img>` tags have `width` and `height` attributes set to intrinsic dimensions
- [ ] No `client:load` on below-fold or non-critical interactive components

### Post-Deployment Verification
- [ ] Run PageSpeed Insights at `https://pagespeed.web.dev/` on mobile
- [ ] Confirm Performance score ≥ 95
- [ ] Confirm LCP ≤ 2.5s
- [ ] Confirm TBT ≤ 200ms
- [ ] Confirm CLS = 0
- [ ] Confirm "Improve image delivery" audit shows no warnings or < 5KB estimated savings
- [ ] Confirm "Forced reflow" audit is absent from the Insights section
- [ ] Confirm "fetchpriority-high should be applied" is absent from the LCP audit

---

## Part 8 — Diagnostic Reference

### Reading a PageSpeed Report

When a score is below 95, work through the Insights section in this priority order:

1. **LCP request discovery** — Is the LCP image in the initial HTML? Does the preload have `fetchpriority="high"`?
2. **Improve image delivery** — Are images oversized for their displayed dimensions? Check aspect ratio and srcset steps.
3. **Forced reflow** — Is the source `[unattributed]` (third-party, usually GA4) or a specific file (first-party JS)?
4. **Render-blocking resources** — Are any scripts or stylesheets in `<head>` without `defer`/`async`?
5. **Avoid long main-thread tasks** — Are there tasks > 50ms? Check for synchronous third-party scripts.

### Score Fluctuation

Lighthouse scores can vary by ±5 points between runs due to network variability in Google's datacenter, CPU throttling variance, and A/B test content. Always run 3 tests and use the median score. A consistent score of 90+ is the target — chasing 100 is not worth the effort.

### Field Data vs. Lab Data Disagreement

If CrUX shows Good LCP but Lighthouse shows Poor LCP, the issue is likely the Lighthouse test environment (network throttling, datacenter location) rather than a real user problem. Focus on CrUX field data. If CrUX shows Poor LCP but Lighthouse shows Good LCP, the issue is likely device-specific (older Android phones with slower CPUs) or network-specific (users on 3G).

---

## References

- [PageSpeed Insights v5 About](https://developers.google.com/speed/docs/insights/v5/about)
- [Lighthouse Performance Scoring](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring/)
- [Largest Contentful Paint (LCP)](https://web.dev/articles/lcp)
- [Optimize LCP](https://web.dev/articles/optimize-lcp)
- [Total Blocking Time (TBT)](https://web.dev/articles/tbt)
- [Cumulative Layout Shift (CLS)](https://web.dev/articles/cls)
- [Interaction to Next Paint (INP)](https://web.dev/articles/inp)
- [Time to First Byte (TTFB)](https://web.dev/articles/ttfb)
- [Responsive Images — web.dev](https://web.dev/learn/design/responsive-images)
- [Improve Image Delivery — Chrome DevTools](https://developer.chrome.com/docs/performance/insights/image-delivery)
- [Eliminate Render-Blocking Resources](https://developer.chrome.com/docs/lighthouse/performance/render-blocking-resources/)
- [Remove Unused JavaScript](https://developer.chrome.com/docs/lighthouse/performance/unused-javascript/)
- [Fetch Priority](https://web.dev/articles/fetch-priority)
- [Lighthouse Scoring Calculator](https://googlechrome.github.io/lighthouse/scorecalc/)
