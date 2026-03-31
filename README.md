# McKinney Fix-It Pros — Website

**Live site:** [mckinneyfixitpros.com](https://mckinneyfixitpros.com)

A production-grade, ADA/WCAG 2.1 AA-compliant lead-generation website for McKinney Fix-It Pros, a licensed and insured handyman service based in McKinney, TX. Built with Astro 5, Tailwind CSS v4, and deployed via Coolify.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Astro 5](https://astro.build) — SSR via `@astrojs/node` |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) via `@tailwindcss/vite` |
| Fonts | Astro Font API — Plus Jakarta Sans (display) + DM Sans (body) |
| Animations | [GSAP 3](https://gsap.com) + CSS scroll-reveal (`IntersectionObserver`) |
| Backend | Supabase (contact form submissions) |
| Sitemap | `@astrojs/sitemap` |
| Deployment | [Coolify](https://coolify.io) — auto-deploys on push to `main` |
| Node | ≥ 20.3.0 |

---

## Project Structure

```
/
├── public/                     # Static assets served at root
│   ├── truck-image.webp        # Primary hero photo (truck)
│   ├── shop-door.webp          # About page hero photo
│   ├── about-us.webp           # About section portrait
│   ├── HorizontalLogo1920x1080.svg
│   ├── logo-ghl.svg            # Light version
│   ├── logo-ghl-dark.svg       # Dark version (footer)
│   └── Favicon.svg
│
├── skills/
│   └── handyman-website-uiux/
│       └── SKILL.md            # Design system, WCAG rules, grading criteria
│
├── src/
│   ├── components/
│   │   ├── Header.astro        # Sticky nav — Charcoal Blue bg, Terracotta CTA pill
│   │   └── Footer.astro        # 4-col footer — city links (no zip codes)
│   │
│   ├── layouts/
│   │   └── Layout.astro        # Base HTML shell — Font API, SEO meta, schema
│   │
│   ├── pages/
│   │   ├── index.astro         # Homepage
│   │   ├── about.astro         # About Us
│   │   ├── process.astro       # Our Process
│   │   ├── media-kit.astro     # Brand assets & press
│   │   ├── privacy-policy.astro
│   │   ├── terms-of-service.astro
│   │   ├── 404.astro
│   │   ├── contact/
│   │   │   ├── index.astro     # Contact form (Supabase)
│   │   │   └── success.astro   # Post-submission confirmation
│   │   ├── services/
│   │   │   ├── index.astro     # Services overview — photo-first cards
│   │   │   └── [slug].astro    # Individual service detail pages
│   │   ├── locations/
│   │   │   ├── index.astro     # Cities we serve — city-name cards (no zips)
│   │   │   └── [slug].astro    # Individual city detail pages
│   │   └── projects/
│   │       ├── index.astro     # Project gallery
│   │       └── [slug].astro    # Individual project case study
│   │
│   └── styles/
│       └── global.css          # Design tokens, utility classes, 8pt grid
│
├── astro.config.mjs            # Astro config — Font API, sitemap, SSR adapter
├── package.json
├── tsconfig.json
├── nixpacks.toml               # Coolify build config
└── uiux-research-findings.md   # Research notes from reference sites
```

---

## Design System

The full design system is documented in [`skills/handyman-website-uiux/SKILL.md`](./skills/handyman-website-uiux/SKILL.md). Key rules:

### Brand Palette (WCAG 2.1 AA Compliant)

| Token | Hex | Use |
|-------|-----|-----|
| Ink Black | `#151d25` | Body text, darkest backgrounds |
| Charcoal Blue | `#2c3e50` | Header, dark sections |
| Terracotta Clay | `#b05d45` | Primary CTA buttons |
| Honey Bronze | `#e2a03f` | Stats, active nav, gold accents |
| Bright Snow | `#f8f9fa` | Light section backgrounds |
| White | `#ffffff` | Card backgrounds |

**Approved WCAG contrast pairs:**
- Bright Snow on Ink Black — 18:1 ✅
- Bright Snow on Charcoal Blue — 9:1 ✅
- Bright Snow on Terracotta Clay — 4.7:1 ✅
- Honey Bronze on Ink Black — 7:1 ✅

### Typography (Golden Ratio Scale — 1.618×)

| Level | Size | Font |
|-------|------|------|
| H1 | `clamp(2.5rem, 5vw, 4rem)` | Plus Jakarta Sans 900 |
| H2 | `clamp(1.875rem, 3.5vw, 2.75rem)` | Plus Jakarta Sans 800 |
| H3 | `~1.5rem / 24px` | Plus Jakarta Sans 700 |
| Body | `1.0625rem / 17px` | DM Sans 400 |

### Key CSS Utility Classes

| Class | Purpose |
|-------|---------|
| `.site-container` | Max-width container with responsive padding |
| `.section-padding` | `py-20 lg:py-28` vertical section spacing |
| `.section-label` | Orange eyebrow text above H2 |
| `.section-heading` | H2 golden-ratio size, dark color |
| `.section-heading-white` | H2 on dark backgrounds |
| `.btn-primary` | Terracotta pill CTA with micro-animation |
| `.btn-secondary` | Charcoal outline pill |
| `.btn-navy` | Charcoal fill pill |
| `.btn-ghost` | White-border pill for use on photo/dark backgrounds |
| `.btn-submit` | Full-width form submit button |
| `.card-base` | White card with border + hover lift |
| `.card-photo` | 4:3 aspect ratio photo container |
| `.card-body` | `p-7 lg:p-8` card content padding |
| `.form-label` | Visible form field label |
| `.form-input` | Styled input with focus ring |
| `.reveal-item` | Scroll-reveal animation target |

---

## Pages & Routes

| Route | Page | Description |
|-------|------|-------------|
| `/` | Homepage | Hero, stats, services preview, about split, process, reviews, FAQ, CTA |
| `/services` | Services Index | Photo-first service cards grid |
| `/services/[slug]` | Service Detail | Individual service with sub-services, process, FAQ |
| `/locations` | Locations Index | City cards (no zip codes) |
| `/locations/[slug]` | Location Detail | City-specific page with neighborhoods, services |
| `/projects` | Projects Index | Before/after project gallery |
| `/projects/[slug]` | Project Detail | Individual project case study |
| `/about` | About Us | Story, stats, values grid |
| `/process` | Our Process | How we work — icon timeline |
| `/contact` | Contact | Split layout form + contact info |
| `/contact/success` | Form Success | Post-submission confirmation |
| `/media-kit` | Media Kit | Brand assets, colors, typography, logos |
| `/privacy-policy` | Privacy Policy | Legal |
| `/terms-of-service` | Terms of Service | Legal |
| `/404` | 404 | Custom error page |

---

## Local Development

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:4321)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

**Environment variables** — copy `.env.example` to `.env` and fill in:

```
SUPABASE_URL=
SUPABASE_ANON_KEY=
PUBLIC_SUPABASE_URL=
PUBLIC_SUPABASE_ANON_KEY=
```

---

## Deployment

The site deploys automatically via **Coolify** on every push to `main`.

Build command: `npm run build`
Start command: `node ./dist/server/entry.mjs`
Node version: `>=20.3.0`

Coolify configuration is in `nixpacks.toml`.

---

## ADA / WCAG 2.1 AA Compliance

This site is built to WCAG 2.1 AA standards:

- All color combinations pass 4.5:1 contrast ratio (normal text) or 3:1 (large text)
- All interactive elements have minimum 44×44px touch targets
- All form fields have visible `<label>` elements (never placeholder-only)
- Focus rings: `3px solid #e2a03f` on all interactive elements
- Semantic HTML throughout (`<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`)
- `aria-label` on all icon-only buttons
- `aria-current="page"` on active nav links
- Images have descriptive `alt` attributes

---

## Skills

The [`skills/`](./skills/) folder contains the design system knowledge base used by AI agents working on this project:

| Skill | Description |
|-------|-------------|
| [`handyman-website-uiux`](./skills/handyman-website-uiux/SKILL.md) | Complete design system — WCAG palette, golden ratio type scale, Astro Font API setup, spacing system, component patterns, photo positioning rules, compliance grading criteria, and anti-patterns |

---

## Recent Changes

### March 2026
- Migrated to WCAG 2.1 AA-compliant brand palette (Ink Black, Charcoal Blue, Terracotta Clay, Honey Bronze)
- Implemented Astro Font API — Plus Jakarta Sans (display) + DM Sans (body) via `astro.config.mjs` `fonts` array
- Applied golden ratio type scale (1.618×) across all pages
- Fixed hero photo cropping — all person/portrait photos now use `object-top`
- Rebuilt contact form with visible labels, generous padding, and prominent submit button with micro-animation
- Removed all zip codes from location cards, location detail heroes, and footer — replaced with city name links
- Added `btn-ghost` secondary CTA style for use on photo/dark hero backgrounds
- Updated `handyman-website-uiux` skill with visual compliance grading criteria and ADA rules
- Published skill to `skills/` folder in repo
