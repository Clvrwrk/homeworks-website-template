---
name: handyman-website-uiux
description: Design system and UI/UX patterns for home-services / handyman lead-generation websites built with Astro 5 + Tailwind CSS v4. Use this skill when building or redesigning any page for McKinney Fix-It Pros or similar contractor/handyman sites. Covers WCAG 2.1 AA compliance, brand tokens, golden ratio type scale, Astro Font API setup, spacing system, component patterns, page layouts, photo positioning, scroll animations, and anti-patterns. Produces high-converting, ADA-compliant, production-grade designs — not generic AI slop. Based on analysis of Ace Handyman Services, Mr. Handyman, and ConPro premium theme.
---

# Handyman Website UI/UX — McKinney Fix-It Pros

## Design Philosophy

**Direction: "Trusted Craftsman" — Confident Editorial with Warmth**

The site must feel like a premium local business: authoritative but approachable, professional but not corporate. Every page has one job: convert a visitor into a lead. Real photography is the hero — never a plain gradient.

**Core Principles:**
1. Real photography dominates — truck/technician photos on every hero and major section
2. Ink Black (`#151d25`) anchors trust; Terracotta Clay (`#b05d45`) drives action
3. Every page ends with the Terracotta CTA banner — it's the highest-converting element
4. Phone number is always visible in header AND in hero trust strip
5. Motion is purposeful — CSS scroll reveals, not decorative noise
6. Section backgrounds MUST alternate: dark → white → light-gray → white → dark (never two same back-to-back)
7. **WCAG 2.1 AA compliance is non-negotiable** — every text/background pair must pass 4.5:1 (normal text) or 3:1 (large text ≥18pt/14pt bold)

---

## WCAG 2.1 AA — Brand Color Contrast Grid

The following pairs are **approved** (pass WCAG 2.1 AA). Only use these combinations:

| Text Color | Background | Ratio | Use |
|-----------|-----------|-------|-----|
| Ink Black `#151d25` | Bright Snow `#f8f9fa` | ~18:1 ✅ | Body text on white/light |
| Bright Snow `#f8f9fa` | Ink Black `#151d25` | ~18:1 ✅ | White text on dark sections |
| Bright Snow `#f8f9fa` | Charcoal Blue `#2c3e50` | ~9:1 ✅ | White text on navy |
| Honey Bronze `#e2a03f` | Ink Black `#151d25` | ~7:1 ✅ | Gold accent on dark bg |
| Honey Bronze `#e2a03f` | Charcoal Blue `#2c3e50` | ~5:1 ✅ | Gold on navy (large text only) |
| Ink Black `#151d25` | Honey Bronze `#e2a03f` | ~7:1 ✅ | Dark text on gold badge |
| Bright Snow `#f8f9fa` | Terracotta Clay `#b05d45` | ~4.7:1 ✅ | White on terracotta CTA |
| Ink Black `#151d25` | Terracotta Clay `#b05d45` | ~3.8:1 ✅ | Dark on terracotta (large text only) |

**FORBIDDEN combinations (fail WCAG):**
- ❌ Terracotta Clay `#b05d45` on Charcoal Blue `#2c3e50` — fails (~2.3:1)
- ❌ Honey Bronze `#e2a03f` on Bright Snow `#f8f9fa` — fails (~2.1:1)
- ❌ Terracotta Clay on Ink Black for small text — borderline, avoid
- ❌ Any light-on-light or dark-on-dark combination

**ADA Interactive Element Requirements:**
- Focus rings: `outline: 3px solid #e2a03f; outline-offset: 2px` on all interactive elements
- Minimum touch target: 44×44px on all buttons and links
- Form labels: always visible (never placeholder-only)
- Error states: never color-only — always include icon or text

---

## Brand Tokens (WCAG-Safe Palette)

```css
/* In src/styles/global.css — @theme inline block */
--mfp-snow:         #f8f9fa;   /* Bright Snow — light bg, white text on dark */
--mfp-clay:         #b05d45;   /* Terracotta Clay — CTA buttons, accents */
--mfp-clay-dark:    #8d4a37;   /* Terracotta dark — hover state */
--mfp-navy:         #2c3e50;   /* Charcoal Blue — header, dark sections */
--mfp-navy-dark:    #1a252f;   /* Charcoal deep — footer, darkest bg */
--mfp-gold:         #e2a03f;   /* Honey Bronze — stars, badges, accents on dark */
--mfp-ink:          #151d25;   /* Ink Black — body text, darkest text */
--mfp-muted:        #567798;   /* Charcoal Blue 700 — secondary text */
--mfp-border:       #cdd8e3;   /* Charcoal Blue 900 — card borders, dividers */
--mfp-offwhite:     #f8f9fa;   /* Bright Snow — alternating section bg */
```

**Mapping from old → new colors:**
| Old | New | Token |
|-----|-----|-------|
| `#1b2a46` (navy) | `#2c3e50` | `--mfp-navy` |
| `#0f1e35` (deep navy) | `#1a252f` | `--mfp-navy-dark` |
| `#c8622a` (orange) | `#b05d45` | `--mfp-clay` |
| `#d4a843` (gold) | `#e2a03f` | `--mfp-gold` |
| `#0f172a` (text) | `#151d25` | `--mfp-ink` |
| `#64748b` (muted) | `#567798` | `--mfp-muted` |
| `#e2e8f0` (border) | `#cdd8e3` | `--mfp-border` |
| `#f6f7f8` (offwhite) | `#f8f9fa` | `--mfp-offwhite` |

---

## Typography — Golden Ratio Scale (1.618)

**Display font:** Plus Jakarta Sans (replaces Syne — legible at all weights, premium feel)
**Body font:** DM Sans (clean, highly readable at 16–18px)

**Golden Ratio Type Scale (base 17px × 1.618):**

| Level | Size | Tailwind / CSS | Use |
|-------|------|----------------|-----|
| H1 | `clamp(2.5rem, 5vw, 4rem)` | `style="font-size: clamp(2.5rem, 5vw, 4rem)"` | Page hero titles |
| H2 | `clamp(1.875rem, 3.5vw, 2.75rem)` | `.section-heading` class | Section headings |
| H3 | `clamp(1.25rem, 2vw, 1.5rem)` | `text-[24px]` | Card titles, sub-headings |
| H4 | `1.0625rem` | `text-[17px] font-bold` | Small headings, labels |
| Body | `1.0625rem` | `text-[17px]` | Paragraphs (NEVER below 16px) |
| Small | `0.9375rem` | `text-[15px]` | Secondary info, captions |
| XSmall | `0.8125rem` | `text-[13px]` | Labels, badges, legal |

**Line heights:**
- H1/H2: `leading-[1.05]` (tight for display)
- H3/H4: `leading-[1.2]`
- Body: `leading-relaxed` (1.625)
- Small: `leading-normal` (1.5)

**Font weights:**
- H1/H2: `font-black` (900) — Plus Jakarta Sans
- H3: `font-bold` (700) — Plus Jakarta Sans
- Body: `font-normal` (400) — DM Sans
- Labels/CTAs: `font-semibold` (600) or `font-bold` (700) — DM Sans

**NEVER use Syne** — it renders as illegible condensed strokes at 900 weight in browser.

---

## Astro Font API Setup (Astro 5.x)

**In `astro.config.mjs` — top-level `fonts` array (NOT `experimental.fonts`):**

```js
import { defineConfig, fontProviders } from "astro/config";

export default defineConfig({
  experimental: {
    fonts: [
    {
      provider: fontProviders.google(),
      name: "Plus Jakarta Sans",
      cssVariable: "--font-display",
      weights: [400, 500, 600, 700, 800, 900],
      styles: ["normal"],
      subsets: ["latin"],
      fallbacks: ["ui-sans-serif", "system-ui", "sans-serif"],
    },
    {
      provider: fontProviders.google(),
      name: "DM Sans",
      cssVariable: "--font-body",
      weights: [400, 500, 600, 700],
      styles: ["normal"],
      subsets: ["latin"],
      fallbacks: ["ui-sans-serif", "system-ui", "sans-serif"],
    },
  ],
  // ... rest of config
});
```

**In `src/layouts/Layout.astro` — import Font component:**

```astro
---
import { Font } from "astro:assets";
---
<html>
  <head>
    <Font cssVariable="--font-display" preload />
    <Font cssVariable="--font-body" preload />
    <!-- NO Google Fonts <link> tags — Astro handles download + caching -->
  </head>
</html>
```

**In `src/styles/global.css` — wire CSS variables to Tailwind:**

```css
@import "tailwindcss";

@theme inline {
  /* Font families */
  --font-sans: var(--font-body);
  --font-display: var(--font-display);

  /* Brand colors */
  --mfp-snow:      #f8f9fa;
  --mfp-clay:      #b05d45;
  --mfp-clay-dark: #8d4a37;
  --mfp-navy:      #2c3e50;
  --mfp-navy-dark: #1a252f;
  --mfp-gold:      #e2a03f;
  --mfp-ink:       #151d25;
  --mfp-muted:     #567798;
  --mfp-border:    #cdd8e3;
  --mfp-offwhite:  #f8f9fa;
}

@layer base {
  html { scroll-behavior: smooth; }
  body {
    font-family: var(--font-body), 'DM Sans', system-ui, sans-serif;
    color: #151d25;
    background: #f8f9fa;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  h1, h2, h3, h4 {
    font-family: var(--font-display), 'Plus Jakarta Sans', system-ui, sans-serif;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: #151d25;
  }
  /* ADA: Focus rings on all interactive elements */
  :focus-visible {
    outline: 3px solid #e2a03f;
    outline-offset: 2px;
    border-radius: 4px;
  }
  /* ADA: Minimum touch targets */
  a, button, [role="button"] {
    min-height: 44px;
    min-width: 44px;
  }
}
```

---

## Asset Inventory

**Logos (all in `/public/`):**
| File | Use |
|------|-----|
| `HorizontalLogo1920x1080.svg` | Header (colored, `h-10 w-auto`) |
| `DRKHorizontalLogo1920x1080.svg` | Dark bg contexts |
| `VerticalLogo500x500.svg` | Footer, square contexts |
| `Favicon.svg` | Browser tab |

**Brand Photos (all in `/public/`):**
| File | Best Use | Positioning |
|------|----------|-------------|
| `truck-image.webp` | Hero background, contact hero | `object-center` (truck is centered) |
| `shop-door.webp` | About section, secondary hero | `object-center` |
| `about-us.webp` | About page, FAQ section sidebar | `object-top` (shows face — NEVER object-center) |

**Photo positioning rules — CRITICAL:**
- `about-us.webp` MUST use `object-top` — it's a portrait of a person; `object-center` cuts the head
- `truck-image.webp` uses `object-center` — landscape, subject is centered
- Any photo with a person's face: ALWAYS `object-top` or `object-[15%]`
- Hero overlay gradient: `from-[#151d25]/90 via-[#151d25]/70 to-[#151d25]/30` (left-heavy)

---

## Spacing System (8pt Grid — STRICT)

All spacing MUST be multiples of 8px. Use these Tailwind classes:

| Token | px | Tailwind | Use |
|-------|-----|---------|-----|
| XS | 8px | `p-2 / gap-2` | Icon padding, tight badges |
| S | 16px | `p-4 / gap-4` | Small card internal padding |
| M | 24px | `p-6 / gap-6` | Card padding, nav gaps |
| L | 32px | `p-8 / gap-8` | Large card padding, grid gaps |
| XL | 48px | `py-12` | Section header-to-content gap |
| 2XL | 64px | `py-16` | CTA bar padding |
| 3XL | 80px | `py-20` | Standard section padding |
| 4XL | 96px | `py-24` | Hero section padding |
| 5XL | 112px | `py-28` | Large hero on desktop |

**Section padding rule:** `py-20 lg:py-28` on all major sections. NEVER `py-10` or `py-12` for full sections.

**Container:** Always use `.site-container` CSS class.

---

## Global CSS — Complete Setup

```css
@import "tailwindcss";

@theme inline {
  --font-sans: var(--font-body);
  --mfp-snow:      #f8f9fa;
  --mfp-clay:      #b05d45;
  --mfp-clay-dark: #8d4a37;
  --mfp-navy:      #2c3e50;
  --mfp-navy-dark: #1a252f;
  --mfp-gold:      #e2a03f;
  --mfp-ink:       #151d25;
  --mfp-muted:     #567798;
  --mfp-border:    #cdd8e3;
  --mfp-offwhite:  #f8f9fa;
}

@layer base {
  html { scroll-behavior: smooth; }
  body {
    font-family: var(--font-body), 'DM Sans', system-ui, sans-serif;
    color: #151d25;
    -webkit-font-smoothing: antialiased;
  }
  h1, h2, h3, h4 {
    font-family: var(--font-display), 'Plus Jakarta Sans', system-ui, sans-serif;
    font-weight: 800;
    letter-spacing: -0.02em;
  }
  :focus-visible {
    outline: 3px solid #e2a03f;
    outline-offset: 2px;
    border-radius: 4px;
  }
}

@layer components {
  /* Container */
  .site-container { @apply mx-auto max-w-[1280px] px-6 sm:px-8 lg:px-12; }

  /* Section padding */
  .section-padding { @apply py-20 lg:py-28; }

  /* Service card */
  .service-card { @apply rounded-2xl overflow-hidden border border-[#cdd8e3] bg-white transition-all duration-300; }
  .service-card:hover { @apply shadow-xl border-[#2c3e50] -translate-y-1; }

  /* Photo container */
  .card-photo { @apply aspect-[4/3] overflow-hidden; }
  .card-photo img { @apply w-full h-full object-cover transition-transform duration-500; }
  .service-card:hover .card-photo img { @apply scale-105; }

  /* Card body — generous padding */
  .card-body { @apply p-7 lg:p-8; }

  /* Buttons — all pill shape, min 44px height for ADA */
  .btn-primary {
    @apply inline-flex items-center gap-2.5 bg-[#b05d45] hover:bg-[#8d4a37]
           text-[#f8f9fa] font-bold text-[16px] px-8 py-3.5 rounded-full
           transition-all duration-200 shadow-md hover:shadow-lg
           hover:-translate-y-0.5 active:translate-y-0 min-h-[44px];
  }
  .btn-secondary {
    @apply inline-flex items-center gap-2 bg-white hover:bg-[#f8f9fa]
           text-[#2c3e50] border-2 border-[#2c3e50] font-semibold text-[15px]
           px-7 py-3.5 rounded-full transition-all duration-200 min-h-[44px];
  }
  .btn-navy {
    @apply inline-flex items-center gap-2 bg-[#2c3e50] hover:bg-[#1a252f]
           text-[#f8f9fa] font-bold text-[16px] px-8 py-3.5 rounded-full
           transition-all duration-200 shadow-md hover:shadow-lg
           hover:-translate-y-0.5 min-h-[44px];
  }
  /* Ghost button — for use on dark backgrounds only */
  .btn-ghost {
    @apply inline-flex items-center gap-2 bg-white/10 hover:bg-white/20
           text-white border border-white/30 hover:border-white/60
           font-semibold text-[15px] px-7 py-3.5 rounded-full
           transition-all duration-200 min-h-[44px];
  }

  /* Section header elements */
  .section-label { @apply text-[#b05d45] text-[13px] font-bold uppercase tracking-[0.12em] mb-3; }
  .section-heading {
    font-family: var(--font-display), 'Plus Jakarta Sans', system-ui, sans-serif;
    font-size: clamp(1.875rem, 3.5vw, 2.75rem);
    @apply font-black tracking-tight leading-[1.1] text-[#151d25];
  }
  .section-heading-white {
    font-family: var(--font-display), 'Plus Jakarta Sans', system-ui, sans-serif;
    font-size: clamp(1.875rem, 3.5vw, 2.75rem);
    @apply font-black tracking-tight leading-[1.1] text-white;
  }
  .accent-divider { @apply w-12 h-[3px] bg-[#b05d45] rounded-full mt-4 mb-6; }
  .accent-divider-center { @apply w-12 h-[3px] bg-[#b05d45] rounded-full mt-4 mb-6 mx-auto; }

  /* Trust badge pill */
  .trust-badge { @apply inline-flex items-center gap-1.5 bg-white/10 border border-white/25 text-white text-[13px] font-medium px-3 py-1.5 rounded-full; }

  /* Form elements — generous padding, clear labels */
  .form-label { @apply block text-[#151d25] text-[14px] font-semibold mb-1.5; }
  .form-input {
    @apply w-full border-2 border-[#cdd8e3] rounded-xl px-4 py-3.5 text-[16px]
           text-[#151d25] bg-white transition-all duration-200 outline-none
           focus:border-[#2c3e50] focus:ring-2 focus:ring-[#2c3e50]/10
           placeholder:text-[#567798];
  }
  .form-input:focus { outline: none; }

  /* Reveal animation */
  .reveal-item { @apply opacity-0 translate-y-6 transition-all duration-700 ease-out; }
  .reveal-item.is-visible { @apply opacity-100 translate-y-0; }
}
```

---

## Hero Section Pattern (REQUIRED)

```astro
<section class="relative min-h-[600px] lg:min-h-[700px] flex items-center overflow-hidden">
  <div class="absolute inset-0">
    <img src="/truck-image.webp" alt="McKinney Fix-It Pros service truck"
         class="w-full h-full object-cover object-center"
         loading="eager" fetchpriority="high" width="1456" height="816" />
    <!-- Gradient: heavy left, fades right so photo shows on right -->
    <div class="absolute inset-0 bg-gradient-to-r from-[#151d25]/92 via-[#151d25]/75 to-[#151d25]/30"></div>
  </div>
  <div class="relative site-container py-24 lg:py-32 grid lg:grid-cols-[1fr_420px] gap-12 lg:gap-16 items-center w-full">
    <div class="flex flex-col gap-5 max-w-[620px]">
      <div class="flex flex-wrap gap-2">
        <span class="trust-badge">✓ Fully Insured</span>
        <span class="trust-badge">⭐ 150+ 5-Star Reviews</span>
        <span class="trust-badge">✓ Background Checked</span>
      </div>
      <h1 class="text-white font-black tracking-tight leading-[1.02]"
          style="font-size: clamp(2.5rem, 4.5vw, 3.75rem); font-family: var(--font-display), 'Plus Jakarta Sans', sans-serif;">
        Top-Rated Handyman<br/>Services in McKinney, TX
      </h1>
      <p class="text-white/75 text-[18px] leading-relaxed max-w-[500px]">
        Fast, reliable, and insured home repairs for busy homeowners.
      </p>
      <div class="flex flex-wrap gap-4">
        <a href="tel:9727952770" class="btn-primary text-[16px]">
          <svg width="18" height="18" .../>
          Call (972) 795-2770
        </a>
        <a href="/contact" class="btn-ghost">
          Get Free Estimate
        </a>
      </div>
    </div>
    <!-- RIGHT: Form card -->
    <div class="bg-white rounded-2xl shadow-2xl p-8 lg:p-10">
      <!-- form content -->
    </div>
  </div>
</section>
```

---

## Contact Form — UX Rules (CRITICAL)

The form is the primary conversion element. Every field must feel spacious and trustworthy:

```astro
<form class="flex flex-col gap-5">
  <!-- ALWAYS use visible labels — never placeholder-only -->
  <div class="grid sm:grid-cols-2 gap-5">
    <div>
      <label for="first" class="form-label">First Name</label>
      <input id="first" name="first" type="text" required
             placeholder="John" class="form-input" />
    </div>
    <div>
      <label for="last" class="form-label">Last Name</label>
      <input id="last" name="last" type="text" required
             placeholder="Smith" class="form-input" />
    </div>
  </div>
  <div>
    <label for="phone" class="form-label">Phone Number <span class="text-[#b05d45]">*</span></label>
    <input id="phone" name="phone" type="tel" required
           placeholder="(972) 555-0000" class="form-input" />
  </div>
  <!-- Submit button: full-width, prominent, with micro-animation -->
  <button type="submit"
          class="w-full flex items-center justify-center gap-3
                 bg-[#b05d45] hover:bg-[#8d4a37] active:scale-[0.98]
                 text-white font-black text-[17px] py-5 rounded-xl
                 transition-all duration-200 shadow-lg hover:shadow-xl
                 hover:-translate-y-0.5 mt-2 min-h-[56px]">
    <svg .../>
    Request Free Estimate
  </button>
  <p class="text-center text-[13px] text-[#567798]">No spam. No commitment. Just a quick quote.</p>
</form>
```

**Form UX rules:**
- `gap-5` (20px) between all fields — never `gap-3`
- All inputs: `py-3.5` (14px vertical padding) minimum
- Submit button: `py-5` (20px), `text-[17px]`, `font-black`, full-width
- Submit button MUST have `hover:-translate-y-0.5` and `hover:shadow-xl` micro-animation
- Submit button MUST have `active:scale-[0.98]` press feedback
- Form card: `p-8 lg:p-10` — never `p-6`
- Remove Zip Code field from contact form — homeowners don't think in zip codes

---

## Service Cards — Clean, Problem-Focused

**REMOVE from service cards:**
- Zip codes — homeowners search by problem, not postal code
- Sub-headings that repeat the title
- Any metadata that doesn't help the user decide

**KEEP on service cards:**
- Photo (aspect-[4/3])
- Service name (H3, 20px, font-bold)
- One-sentence problem-focused description (15-16px, muted color)
- Clear CTA text ("Fix My [Problem] →")

```astro
<a href={s.href} class="service-card group">
  <div class="card-photo">
    <img src={s.image} alt={s.title} loading="lazy" />
  </div>
  <div class="card-body">
    <h3 class="text-[#151d25] text-[20px] font-bold mb-3 leading-snug">{s.title}</h3>
    <p class="text-[#567798] text-[15px] leading-relaxed mb-5">{s.desc}</p>
    <span class="inline-flex items-center gap-1.5 text-[#b05d45] text-[14px] font-bold uppercase tracking-wide group-hover:gap-2.5 transition-all">
      Fix This Problem
      <svg width="14" height="14" .../>
    </span>
  </div>
</a>
```

---

## Location Cards — City-First, No Zip Codes

**REMOVE from location cards:**
- Zip code chips/badges — they add visual clutter and zero decision value
- "SERVICE AREA" badge (redundant — the section heading already says that)

**KEEP on location cards:**
- City name (H3, large, bold)
- Neighborhood names (1–2 key neighborhoods only)
- Short proximity/speed message ("15 min from McKinney")
- "View Service Area →" CTA

```astro
<div class="bg-white rounded-2xl border border-[#cdd8e3] p-8 hover:border-[#2c3e50] hover:shadow-lg transition-all">
  <h3 class="text-[#151d25] text-[24px] font-black mb-2">{loc.city}, TX</h3>
  <p class="text-[#567798] text-[15px] leading-relaxed mb-5">{loc.desc}</p>
  <a href={`/locations/${loc.slug}`}
     class="inline-flex items-center gap-1.5 text-[#b05d45] text-[14px] font-bold uppercase tracking-wide hover:gap-3 transition-all">
    View Service Area →
  </a>
</div>
```

---

## CTA Banner (REQUIRED on Every Page)

```astro
<section class="bg-[#b05d45] py-14 lg:py-16">
  <div class="site-container flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
    <div>
      <h2 class="text-white font-black text-[28px] lg:text-[36px] tracking-tight leading-tight"
          style="font-family: var(--font-display), 'Plus Jakarta Sans', sans-serif;">
        Ready to cross it off your list?
      </h2>
      <p class="text-white/80 text-[16px] mt-2">Call or fill out a form — we respond within 24 hours.</p>
    </div>
    <a href="tel:9727952770"
       class="shrink-0 flex items-center gap-2.5 bg-[#151d25] text-white font-black text-[18px]
              px-8 py-4 rounded-full hover:bg-[#1a252f] transition-all shadow-lg
              hover:shadow-xl hover:-translate-y-0.5 whitespace-nowrap min-h-[56px]">
      (972) 795-2770
    </a>
  </div>
</section>
```

---

## Visual Compliance Grading Criteria

**A page is ONLY compliant if ALL of the following pass visual inspection:**

### Typography (Golden Ratio)
- [ ] H1 uses `clamp(2.5rem, 5vw, 4rem)` — visually large and commanding
- [ ] H2 uses `clamp(1.875rem, 3.5vw, 2.75rem)` — clearly subordinate to H1
- [ ] H3 uses `~1.5rem / 24px` — clearly subordinate to H2
- [ ] Body text is `17px` minimum — readable without squinting
- [ ] Line height on body is `1.625` (leading-relaxed) or greater
- [ ] Font is Plus Jakarta Sans (display) + DM Sans (body) — NOT Syne, NOT Inter
- [ ] No text is smaller than `13px` (only badges/legal)

### Color & Contrast
- [ ] All text/background pairs are from the approved WCAG contrast grid
- [ ] No Terracotta on Charcoal Blue (fails WCAG)
- [ ] No Honey Bronze on Bright Snow (fails WCAG)
- [ ] Focus rings are visible on all interactive elements (`outline: 3px solid #e2a03f`)
- [ ] Error states use text + icon, not color alone

### Spacing & Layout
- [ ] All sections use `section-padding` (`py-20 lg:py-28`)
- [ ] All containers use `site-container` class
- [ ] Card internal padding is `p-7 lg:p-8` minimum
- [ ] Form fields have `gap-5` between them
- [ ] No two consecutive sections share the same background color

### Photos & Images
- [ ] Every hero has a real photo (truck or about-us) — no plain gradient
- [ ] Person photos use `object-top` — heads are NEVER cropped
- [ ] Truck/landscape photos use `object-center`
- [ ] Hero overlay gradient is left-heavy (text readable, photo visible on right)

### CTAs & Buttons
- [ ] All buttons are pill-shaped (`rounded-full`)
- [ ] Primary CTA has `hover:-translate-y-0.5` and `hover:shadow-lg` micro-animation
- [ ] Primary CTA has `active:scale-[0.98]` press feedback
- [ ] Secondary/ghost buttons have visible border AND visible hover state
- [ ] Submit button is `py-5 text-[17px] font-black` — prominent, not timid
- [ ] All interactive elements are minimum 44×44px touch target

### Card Content
- [ ] Service cards: NO zip codes, NO redundant sub-headings
- [ ] Location cards: NO zip code chips, city-name-first
- [ ] Cards have photo OR icon — never plain text-only
- [ ] Card CTAs use problem-focused language ("Fix This →")

### Page Structure
- [ ] CTA banner appears before footer on every page
- [ ] Stats bar appears between hero and first content section
- [ ] Section label (orange eyebrow) appears above every H2
- [ ] Breadcrumbs appear on all inner pages

---

## Mobile-First Directives (80% of Traffic is Mobile)

This section codifies rules from external peer review. Home services traffic skews heavily mobile — a homeowner with a leaking pipe is on their phone, not their laptop. Every decision must be validated at 375px width first.

### The "Fat Finger" Rule (Touch Target Standard)
Every clickable element — phone number, icon, button, nav link — must result in a minimum **44×44px touch area**. This is enforced by the global CSS `a, button, [role="button"] { min-height: 44px; min-width: 44px; }`. Never shrink a button to save space — the user's thumb is the constraint.

### Active/Tap State (Mobile Tactile Feedback)
All buttons MUST have an `active:scale-[0.98]` state. Without it, a mobile user tapping "Request Quote" gets zero feedback and may tap repeatedly, causing duplicate form submissions or frustration. This is already in `.btn-primary`, `.btn-submit`, and all button classes — **never remove it**.

### Hero Above-the-Fold Requirement (iPhone 13 = 844px viewport)
The hero section on every page must show — without scrolling on an iPhone 13 — all three of:
1. **H1** stating what the service is AND where (e.g., "Top-Rated Handyman in McKinney, TX")
2. **Trust badge** (e.g., "Fully Insured · Background Checked")
3. **High-contrast CTA button** (primary phone CTA or estimate form)

If any of these three are below the fold on mobile, the hero has failed its job.

### Asymmetric CTA Isolation (The "Thumb Magnet" Rule)
A standalone CTA button at the bottom of a section must be visually isolated — not touching the card above it or the section below it. Use `.section-cta-gap` (`mt-16 lg:mt-20`) above the button. On mobile, this creates a visual "pause" that draws the thumb naturally to the button. This is the same principle as the `mt-8 mb-4` asymmetric margin rule from the external review — we use larger values because our section padding is more generous.

### Form Input Minimum Height
All form inputs must be minimum **44px tall** (`h-11` in Tailwind = 44px). This prevents the browser from auto-zooming on iOS when a user taps a small input field — one of the most frustrating mobile experiences. Our `.form-input` class enforces this with `min-height: 44px`.

---

## Action Color Exclusivity Rule

The **Terracotta Clay (`#b05d45`)** color is reserved **exclusively for actionable items**:
- Primary CTA buttons
- Phone number links
- "View →" / "Learn More →" inline CTAs
- Submit buttons
- Active nav state

**DO NOT use Terracotta Clay for:**
- Decorative icons or borders
- Section divider lines
- Background fills on non-clickable elements
- Eyebrow labels (use `text-[#b05d45]` only if it's a clickable label)

**Why this matters:** Every time a user sees Terracotta Clay, their brain registers "I can click this." Diluting it with decorative use trains users to ignore it — directly reducing conversion rate.

Similarly, **Honey Bronze (`#e2a03f`)** is reserved for:
- Star ratings
- Accent numbers/stats on dark backgrounds
- Active/selected state indicators

Never use Honey Bronze as a button fill color — it fails WCAG on light backgrounds.

---

## The AI Typewriter Problem (Why Agents Create Cramped Layouts)

> *"Language models predict the next line of code linearly. They essentially type like a typewriter — left to right, top to bottom. They don't actually 'see' the claustrophobic layout they are creating unless you force them to mathematically map the negative space."*
> — External peer review, March 2026

This is the root cause of every spacing violation we've seen. To counteract it:

1. **Always specify spacing mathematically** — never write `p-4` when you mean "comfortable card padding." Write `p-8` (32px) and annotate it.
2. **Always check rendered output, not code** — a compliance audit that only reads `.astro` files will miss every visual spacing issue.
3. **Always use design system classes** — `.site-container`, `.section-padding`, `.section-header`, `.card-base`, `.trust-badge`, `.pill-chip` — these encode the correct spacing so the agent can't accidentally use a wrong value.
4. **The negative space test** — before shipping any section, verify that the whitespace around each element is at least as large as the element's internal padding. If a card has `p-8` (32px) internal padding, there should be at least `gap-8` (32px) between cards.

---

## Anti-Patterns (NEVER DO THESE)

- NEVER use Syne font — illegible at 900 weight in browser rendering
- NEVER use Inter — generic, no brand personality
- NEVER use `#c8622a` (old orange) — replaced by `#b05d45` (Terracotta Clay)
- NEVER use `#1b2a46` (old navy) — replaced by `#2c3e50` (Charcoal Blue)
- NEVER put Terracotta Clay text on Charcoal Blue background — fails WCAG
- NEVER put Honey Bronze text on Bright Snow background — fails WCAG
- NEVER use placeholder text as the only label — always add visible `<label>`
- NEVER use `gap-3` between form fields — minimum `gap-5`
- NEVER use a flat full-width button with no hover state — add lift + shadow
- NEVER show zip codes on location or service cards
- NEVER use `object-center` on a portrait photo of a person — use `object-top`
- NEVER use plain gradient hero — always use truck-image.webp or about-us.webp
- NEVER use text-only service cards — always include a photo
- NEVER skip the CTA banner before the footer
- NEVER center H1 text — hero copy is always left-aligned
- NEVER use `py-10` or `py-12` for full page sections — minimum `py-20`
- NEVER use `max-w-[1280px] px-6 lg:px-10` inline — always use `.site-container`
- NEVER use two consecutive sections with the same background color
- NEVER use `text-[14px]` for body paragraphs — minimum `text-[16px]`, prefer `text-[17px]`
- NEVER run a code-only compliance check — always visually inspect the rendered page
