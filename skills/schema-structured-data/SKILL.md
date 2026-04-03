# Schema.org Structured Data Workflow

**Description:** Guide for AI agents on how to audit, select, and implement the correct Schema.org JSON-LD structured data for local service business websites to maximize visibility in Google Rich Results and AI answer engines (LLMs).

## The Core Strategy

Local service businesses (like handymen, plumbers, contractors) rely heavily on local SEO and trust signals. Schema markup translates the visual content of a page into machine-readable data for search engines and AI crawlers.

Our Astro template uses a centralized approach:
1. **Global Schema:** `Layout.astro` automatically injects a comprehensive `LocalBusiness` (specifically `HomeAndConstructionBusiness`) schema on *every* page.
2. **Page-Specific Schema:** Individual pages pass an array of JSON-LD objects to the `Layout` component via the `schema` prop. `Layout.astro` merges these with the global schema.

## Page-Type to Schema Mapping

When creating or updating a page, you MUST include the appropriate schema types based on the page's content and purpose.

### 1. Homepage (`index.astro`)
- **WebPage:** Defines the page itself and links it to the WebSite entity.
- **FAQPage:** If the homepage has an FAQ section, mark up the questions and answers.
- **Review / AggregateRating:** If displaying testimonials, mark them up (only if they are first-party reviews hosted on the site, do not mark up third-party Google/Yelp reviews directly unless using AggregateRating for the overall business).

### 2. Service Pages (`services/[slug].astro`)
- **Service:** The most critical schema for these pages.
  - `@type`: `Service`
  - `name`: The specific service (e.g., "Drywall Repair")
  - `provider`: Link back to the LocalBusiness entity (`{"@id": "SITE_URL/#business"}`)
  - `areaServed`: The cities or regions where this service is offered.
  - `description`: A short summary of the service.
- **BreadcrumbList:** To show the hierarchy (Home > Services > [Service Name]).
- **FAQPage:** If the service page has specific FAQs.

### 3. Location Pages (`locations/[slug].astro`)
- **Service** or **LocalBusiness:** 
  - If the business has a physical office in that city, use a specific `LocalBusiness` schema for that branch.
  - If it's just a service area (no physical office), use `Service` schema with a highly specific `areaServed` property pointing to that city.
- **BreadcrumbList:** (Home > Locations > [City Name]).

### 4. About / Process / Projects Pages
- **BreadcrumbList:** Always include breadcrumbs for subpages.
- **AboutPage / ProfilePage:** Can be used on the About page to highlight the team or owner.

## Implementation Guide in Astro

### Passing Schema to Layout

In any `.astro` page, define your schema objects in the frontmatter and pass them to the `<Layout>` component.

```astro
---
import Layout from "@/layouts/Layout.astro";
import { SITE_URL } from "@/config/site";

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": `${SITE_URL}/` },
    { "@type": "ListItem", "position": 2, "name": "Services", "item": `${SITE_URL}/services` },
    { "@type": "ListItem", "position": 3, "name": "Drywall Repair", "item": `${SITE_URL}/services/drywall-repair` }
  ]
};

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  "name": "Drywall Repair",
  "provider": { "@id": `${SITE_URL}/#business` },
  "areaServed": { "@type": "City", "name": "McKinney", "addressRegion": "TX" },
  "description": "Professional drywall repair and patching services."
};

// Pass as an array to the schema prop
---
<Layout 
  title="Drywall Repair | McKinney Fix-It Pros"
  description="Expert drywall repair..."
  schema={[breadcrumbSchema, serviceSchema]}
>
  <!-- Page content -->
</Layout>
```

## Anti-Patterns (NEVER DO THESE)

- **NEVER mark up content that isn't visible on the page:** Schema must accurately reflect the human-readable content. If you add FAQ schema, those exact questions and answers must be visible on the page.
- **NEVER invent fake reviews:** Only use `Review` schema for actual testimonials displayed on the page.
- **NEVER break the JSON structure:** Ensure all JSON-LD is valid. Missing commas or unescaped quotes will break the entire script block.
- **NEVER duplicate the global LocalBusiness schema:** `Layout.astro` already handles the primary business NAP (Name, Address, Phone), hours, and social links. Only add page-specific entities.
