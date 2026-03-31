# UI/UX Research Findings — Premium Handyman Website Design
## Sources: Ace Handyman Services, Mr. Handyman, ConPro Theme, Industry Best Practices

---

## 1. HERO SECTION PATTERNS

### What the best sites do:
- **Full-width photo hero** — image bleeds edge-to-edge, NO boxed container on the image itself
- **Photo is RIGHT-side dominant** — technician/truck photo occupies 55–60% of the hero width on desktop
- **Text is LEFT-aligned** — headline, subtext, and CTA stack left with generous left padding (min 80px from edge)
- **Headline is LARGE** — 52–72px on desktop, never smaller than 40px. Uses clamp() for fluid scaling
- **Overlay gradient** — dark-to-transparent gradient over photo (left side dark, right side shows photo clearly)
- **CTA button is PILL-shaped** — rounded-full, min 48px tall, high-contrast color (orange/red on dark bg)
- **Trust badges BELOW headline** — star rating, "Licensed & Insured", review count in a horizontal strip
- **Phone number in HEADER** — large, clickable, minimum 18px font, always visible
- **Hero min-height** — 560px desktop, 480px mobile. Never shorter.

### Ace Handyman specifically:
- White header with logo left, nav center, phone number right (clickable, prominent)
- Hero is full-bleed photo with dark overlay on left third
- "It's your home. Not just any handyman will do." — short, punchy headline
- Zip code search widget embedded in hero for lead capture
- Below hero: icon-based service grid (5 icons, centered, generous padding)

### Mr. Handyman specifically:
- Dark navy header, sticky
- Hero: full-bleed photo, text overlay left side
- Services listed as large clickable cards with photo + title + short description
- "Neighborly Done Right Promise" trust badge prominently above fold

### ConPro Theme specifically:
- Bold diagonal/angled design elements for visual interest
- Stats bar (numbers + labels) between hero and services section
- Split layout for "About" section: photo left, text + stats right
- Service cards: icon top, title, short description, "Read More" link
- Project gallery: masonry/grid with hover overlay

---

## 2. SPACING SYSTEM (8pt Grid)

### Section padding (vertical):
- Hero: py-24 to py-32 (96px–128px top/bottom)
- Major sections: py-20 to py-28 (80px–112px)
- Minor sections / CTAs: py-16 (64px)
- Section header to content gap: mb-12 to mb-16 (48px–64px)

### Container:
- Max-width: 1280px (never wider)
- Horizontal padding: 24px mobile → 48px tablet → 64px desktop
- Text content max-width: 680px (for readability, 65–75 chars/line)

### Card internal padding:
- Large cards (photo cards): p-8 (32px)
- Medium cards (service cards): p-6 (24px)
- Small cards (icon cards): p-5 (20px)
- Card gap in grid: gap-6 to gap-8 (24px–32px)

### Typography spacing:
- Section label (eyebrow): mb-3, 12–13px, uppercase, letter-spacing 0.1em
- Section heading (H2): mb-4 to mb-6, 32–48px
- Accent divider: 3px × 48px bar, brand color, mb-6
- Body text: max-w-[600px], 17–18px, line-height 1.6–1.7
- Paragraph gap: mb-4 (16px between paragraphs)

---

## 3. SERVICE CARD DESIGN

### Photo-first card (BEST PRACTICE):
- Aspect ratio: 16:9 or 4:3 for card photo
- Photo fills top of card, object-cover
- Card body below photo: p-6 to p-8
- Service name: 18–20px, font-bold
- Short description: 14–15px, text-muted, 2–3 lines max
- CTA link at bottom: "Learn More →" or arrow icon
- Hover: subtle shadow lift + border color change
- Border-radius: 12–16px (rounded-xl to rounded-2xl)

### Icon card (secondary use only):
- Icon: 48–56px, brand color or white on dark bg
- Title below icon: 16–18px, font-semibold
- Short desc: 13–14px, 2 lines max
- Min card height: 180px to prevent squishing

### Grid layout:
- Desktop: 3 or 4 columns
- Tablet: 2 columns
- Mobile: 1 column (or 2 for small cards)
- Cards MUST be equal height (use CSS grid, not flexbox)

---

## 4. PHOTO POSITIONING RULES

### Hero photos:
- Subject (person/truck) should face INTO the page (toward the text)
- Subject positioned in right 50–60% of frame
- Never crop faces or important elements at card edges
- Use object-position: center top for portrait-oriented photos
- Use object-position: center center for landscape photos

### Section photos (split layouts):
- Photo should be 45–50% of section width
- Minimum photo height: 400px
- Use rounded corners (rounded-2xl) on section photos
- Add subtle drop shadow: shadow-2xl
- Never stretch photos — always object-cover with fixed aspect ratio

### Card photos:
- Consistent aspect ratio across ALL cards in a grid (16:9 or 4:3)
- object-fit: cover, object-position: center
- Never allow different heights in the same card row

---

## 5. COLOR & CONTRAST RULES

### Background alternation pattern:
1. Hero: dark (navy #1b2a46)
2. Section 1: white #ffffff
3. Section 2: light gray #f6f7f8
4. Section 3: white #ffffff
5. Section 4: dark (navy) — for CTA/trust bar
6. Section 5: light gray
- NEVER two dark sections back-to-back
- NEVER two white sections back-to-back (use subtle gray)

### Button contrast:
- Primary CTA: orange #c8622a on dark bg — GOOD contrast
- Primary CTA on white bg: orange #c8622a — needs min 3:1 contrast ratio
- Text on orange button: white — ALWAYS
- Secondary button: white bg + dark border, dark text

### Text contrast:
- Body on white: #374151 (gray-700) — minimum
- Body on dark: #cbd5e1 (slate-300) — minimum
- Headings on white: #0f172a (slate-900)
- Headings on dark: #ffffff

---

## 6. TRUST SIGNALS PLACEMENT

### Above the fold (hero section):
- Star rating (★★★★★ 4.9/5 · 100+ Reviews)
- "Licensed & Insured" badge
- Years in business or jobs completed

### Below hero (trust bar):
- 4 horizontal trust badges: Fully Insured | Background Checked | Free Estimates | Same-Week Service
- Use checkmark icons, not bullets

### Throughout the page:
- Review quotes in testimonials section
- Before/after photos in projects section
- Named customer testimonials with location

---

## 7. CTA PLACEMENT RULES

### Primary CTA locations:
1. Header (always visible, sticky)
2. Hero section (main CTA)
3. After services section
4. Mid-page CTA bar (dark bg section)
5. Footer

### CTA copy best practices:
- "Get a Free Estimate" (primary)
- "Call Now (972) 795-2770" (secondary — always show number)
- "Schedule Service" (alternative)
- AVOID: "Submit", "Click Here", "Learn More" as primary CTAs

### Button sizing:
- Min height: 48px (touch target)
- Min width: 160px
- Padding: px-8 py-4 (32px horizontal, 16px vertical)
- Font: 15–16px, font-bold
- Shape: rounded-full (pill) for primary, rounded-lg for secondary

---

## 8. NAVIGATION RULES

### Desktop header:
- Logo: left-aligned, max 180px wide
- Nav links: center or right, 5–6 max items
- CTA button: far right, pill-shaped, brand color
- Height: 72–80px
- Sticky: yes, with subtle shadow on scroll

### Mobile:
- Hamburger menu
- Full-width dropdown panel
- Phone number as large CTA button at bottom of menu
- Close on link click

---

## 9. SECTION HEADER STRUCTURE (CONSISTENT PATTERN)

Every section should follow this exact structure:
```
[Eyebrow label — small caps, brand color, 12px]
[Section heading — H2, 32–48px, dark, font-black]
[Accent divider — 3px × 48px bar, brand color]
[Subtext — 17–18px, muted gray, max-width 560px]
```
- Center-aligned for hero/feature sections
- Left-aligned for content-heavy sections

---

## 10. PAGE-SPECIFIC RULES

### Homepage:
- Hero: full-bleed, photo right, text left, min 560px tall
- Services: 3-col photo cards (not icon-only)
- About split: photo left, text+stats right
- Process: numbered steps with icons
- Testimonials: quote cards with star rating + name
- CTA bar: dark bg, centered headline + button
- FAQ: accordion

### Services Index:
- Hero: page title + breadcrumb
- Card grid: 3-col photo cards, consistent aspect ratio
- Each card: photo, service name, 2-line desc, CTA link

### Service Detail:
- Hero: full-bleed photo with overlay, service name large
- What's included: icon list or card grid
- Process: numbered steps
- FAQ: accordion
- CTA: sticky or inline

### Contact:
- Split layout: form left (60%), info right (40%)
- Info column: phone, email, address, hours, map
- Form: minimal fields (name, phone, service, message)
- Trust signals below form

### About:
- Hero: team photo or truck photo
- Mission statement: large pull quote
- Values: icon cards (3-col)
- Stats bar: dark bg, 4 numbers
- Team section (if applicable)

### Locations:
- City hero with breadcrumb
- Services grid
- Neighborhoods: pill tags
- Trust + CTA bar
