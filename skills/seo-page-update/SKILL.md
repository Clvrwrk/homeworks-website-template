# SEO Page Update Workflow

**Description:** Guide for AI agents on how to translate raw SEO copy briefs into highly-converting, UI/UX-compliant Astro page sections without breaking the design system.

## The Core Technical Rules (Non-Negotiable)

When the SEO team provides a copy brief for a page, the target keyword MUST be placed in the following locations exactly as specified:

1. **Title Tag:** Passed to the `<Layout title="...">` prop.
2. **Meta Description:** Passed to the `<Layout description="...">` prop.
3. **URL Structure:** The page filename/slug (e.g., `src/pages/handyman-services.astro`).
4. **H1 Tag:** The main hero heading. Must be exact match or highly relevant.
5. **First 100-150 Words:** Inject an intro paragraph directly below the H1 in the hero section.
6. **Header Tags (H2/H3):** Use keywords naturally in section headings.
7. **Image Alt Text:** Update the hero image `alt` attribute to include the keyword (e.g., `Handyman services in [City] TX — [Business Name] service truck`).

## UI/UX Mapping Strategy

SEO copy is often provided as raw text documents with named sections. **DO NOT just dump text into a generic container.** You must map the SEO copy to the established design system patterns:

### 1. Trust Bar (Many items)
- **Pattern:** CSS Marquee (Infinite horizontal scroll).
- **When to use:** When the SEO brief provides 6+ trust signals or bullet points that don't need long explanations.
- **Why:** A static grid of 8 items is cramped. A marquee is elegant, space-efficient, and signals enterprise scale.

### 2. Services Overview (Keyword-rich prose)
- **Pattern:** 2-Column Definition List with left-border accent.
- **When to use:** When the SEO brief provides a list of services with 1-2 sentences of descriptive prose each.
- **Why:** Rendering this as a standard card grid loses the copy density. A definition list preserves the keyword-rich prose while remaining scannable.

### 3. Why Choose Us / Differentiators
- **Pattern:** Icon + Heading + Prose Grid (e.g., 3x2 grid on a dark navy background).
- **When to use:** For core value propositions (e.g., "Transparent Pricing", "Fully Insured").
- **Why:** Breaks up the page visually. Use the `section-padding` and `site-container` classes. Ensure WCAG compliance (e.g., white text on `#2c3e50` navy).

### 4. Results & Social Proof
- **Pattern:** Icon-Check List (often paired with a sidebar CTA).
- **When to use:** When the brief provides operational facts or trust signals.
- **Why:** Avoid inventing fake review scores or stats. A clean checklist of honest operational facts is credible and visually structured.

### 5. Neighborhoods / Service Areas
- **Pattern:** Pill Chips (`rounded-full` inline elements).
- **When to use:** When the brief lists specific neighborhoods, subdivisions, or nearby towns.
- **Why:** Neighborhood names render beautifully as pills. They add local SEO signals without creating a wall of text.

### 6. FAQ
- **Pattern:** Accordion component.
- **When to use:** For Q&A sections.
- **Why:** Keeps the page clean while allowing Google to crawl the answers. Always update the `faqSchema` JSON-LD block in the Astro frontmatter to match the new questions.

## Anti-Patterns (NEVER DO THESE)

- **NEVER invent fake statistics:** If the SEO brief doesn't provide a number, don't make one up. Use checklists instead of stat cards.
- **NEVER break WCAG contrast:** Always check text/background color pairs against the UI/UX skill rules.
- **NEVER use plain text walls:** Always break up long SEO prose into grids, lists, or split-columns.
- **NEVER hardcode client data:** Always use imports from `@/config/site` for `BUSINESS_NAME`, `PRIMARY_CITY`, `PHONE_DISPLAY`, etc., even if the SEO brief uses hardcoded examples.
