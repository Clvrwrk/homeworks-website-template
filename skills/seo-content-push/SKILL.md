---
name: seo-content-push
description: Workflow for applying SEO team content updates to the McKinney Fix-It Pros Astro website. Use this skill when the SEO team provides new content (HTML/Word) for a service or location page and requests it to be published with proper schema and UI/UX adherence.
license: Complete terms in LICENSE.txt
---

# SEO Content Push Workflow

This skill defines the exact, repeatable workflow for applying SEO content updates to the McKinney Fix-It Pros website (`Mckinney-Fixit-Pros` repository). It ensures that all new content is properly integrated into the Astro architecture, maintains UI/UX consistency, and emits the correct GEO/SEO schema signals. It covers both **Service Pages** and **Location Pages**.

## Prerequisites

1. Access to the `Mckinney-Fixit-Pros` repository.
2. The SEO content provided by the team (usually an HTML or Word document containing Keyword, Page Title, H1, Meta Description, Article Body, and FAQs).

## Step-by-Step Workflow

### Step 1: Extract Content from SEO Source

Read the provided SEO document and extract the following components:
- **Page Title** (Exact string)
- **H1** (Usually matches the Page Title)
- **Meta Description**
- **Intro Paragraph** (The first paragraph of the article)
- **Brief Overview & Key Highlights** (Bullet points)
- **Contractor Section** (Heading, body, and table data)
- **Comprehensive Services Section** (Heading and body)
- **Transparency Section** (Heading, body, and table data)
- **Expertise Section** (Heading and body)
- **FAQs** (Questions and Answers)

### Step 2: Update the Data Object (Service or Location)

The site uses shared templates for both service and location pages:
- **Service Pages:** `src/pages/services/[slug].astro` (driven by `allServices` array)
- **Location Pages:** `src/pages/locations/[slug].astro` (driven by `locations` array)

Locate the specific entry in the corresponding array (e.g., `slug: "tv-mounting"` or `slug: "mckinney-tx"`) and update it:

1. **Update Metadata & Hero:**
   - `title`: Set to the exact SEO Page Title.
   - `metaDesc`: Set to the SEO Meta Description.
   - `hero` (Services) or `description` (Locations): Set to the SEO H1 or intro paragraph as appropriate.
   - `intro` (Services) or `cityContext` (Locations): Set to the extracted intro paragraph.

2. **Update FAQs:**
   - Replace or add the `faqs` array with the new SEO-provided FAQs.
   - Format: `{ q: "Question?", a: "Answer text." }`

3. **Inject the `seoContent` Block:**
   - Add the `seoContent` object to the entry. This triggers the shared template to render the rich article sections and emit the `Article` schema.
   - Follow this exact structure:
     ```javascript
     seoContent: {
       overview: "Extracted overview paragraph...",
       highlights: [
         "Highlight bullet 1",
         "Highlight bullet 2",
         // ... 5 bullets total
       ],
       contractorSection: {
         heading: "Extracted Heading",
         body: "Extracted body text...",
         tableRows: [
           { criteria: "Row 1 Col 1", description: "Row 1 Col 2", benefit: "Row 1 Col 3", outcome: "Row 1 Col 4" },
           // ... 3-4 rows
         ],
       },
       comprehensiveSection: {
         heading: "Extracted Heading",
         body: "Extracted body text...",
       },
       transparencySection: {
         heading: "Extracted Heading",
         body: "Extracted body text...",
         tableRows: [
           { service: "Row 1 Col 1", features: "Row 1 Col 2", assurance: "Row 1 Col 3", commitment: "Row 1 Col 4" },
           // ... 3-4 rows
         ],
       },
       expertiseSection: {
         heading: "Extracted Heading",
         body: "Extracted body text...",
       },
     }
     ```

### Step 3: Update the Title Rendering Condition (If Applicable)

If updating a **Service Page**, scroll down to the `<Layout>` component invocation in `src/pages/services/[slug].astro`.
Update the `title` prop condition to ensure the newly updated service uses the exact SEO title without appending the default city/state suffix.

**Example:**
Change:
```javascript
title={service.slug === 'drywall-repair' ? service.title : `${service.title} in ${PRIMARY_CITY}, ${PRIMARY_STATE} | ${BUSINESS_NAME}`}
```
To:
```javascript
title={(service.slug === 'drywall-repair' || service.slug === 'tv-mounting') ? service.title : `${service.title} in ${PRIMARY_CITY}, ${PRIMARY_STATE} | ${BUSINESS_NAME}`}
```

*(Note: Location pages typically use `loc.title ? loc.title : ...` directly in the template, so this step may not be needed for locations if the template is already updated.)*

### Step 4: Build and Verify Schema Output

Run a full build to ensure the project compiles cleanly and all schemas are correctly generated.

```bash
cd /home/ubuntu/Mckinney-Fixit-Pros
npx astro build
```

Verify the compiled server bundle (`dist/server/pages/services/_slug_.astro.mjs` or `dist/server/pages/locations/_slug_.astro.mjs`) contains the following schema types for the updated page:
- `Article` (Triggered by `seoContent`)
- `FAQPage` (Triggered by `faqs`)
- `BreadcrumbList`
- `Service`
- `SpeakableSpecification` (Targeting `.hero-speakable` and `.overview-speakable`)
- `HowTo` (Service pages only, Process section)

### Step 5: Commit and Push

Once verified, commit the changes with a clear, descriptive message detailing the SEO updates applied, and push to the `main` branch. Coolify will automatically redeploy the site.

```bash
git add -A
git commit -m "seo: [slug] full SEO content push"
git push origin main
```
