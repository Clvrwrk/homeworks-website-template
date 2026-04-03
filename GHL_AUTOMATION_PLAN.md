# GHL to Live Site Automation Plan (Option A)

This document outlines the architecture and setup requirements for fully automating the deployment of a new client website using GoHighLevel (GHL), a custom middleware server, GitHub, and Coolify.

## 1. Architecture Overview (Option A)

The "Option A" approach uses a lightweight middleware server to bridge GHL and the deployment infrastructure. This provides the most control, allows for data validation before cloning, and keeps the GitHub repository clean of failed automation attempts.

**The Pipeline:**
1. **GHL Workflow:** Triggered when a client completes the onboarding form and reaches a specific pipeline stage.
2. **GHL Webhook:** Sends a POST request with a JSON payload containing all Custom Values to the Middleware Server.
3. **Middleware Server (Node.js/Python on Coolify):**
   - Receives the payload and validates all required fields.
   - Authenticates with GitHub API.
   - Clones the `homeworks-website-template` repository.
   - Executes a script to overwrite `src/config/site.ts` with the client's data.
   - Commits the changes and pushes to a *new* private GitHub repository for the client.
   - Calls the Coolify API to trigger a new deployment from the newly created repository.
4. **Coolify:** Builds the Astro site and deploys it live.

## 2. GHL Setup Requirements

### Workflow Trigger
Create a GHL Workflow triggered by an Opportunity Stage change (e.g., Pipeline: "Onboarding", Stage: "Form Completed - Ready for Build").

### Webhook Action
Add a "Webhook" action to the workflow.
- **Method:** POST
- **URL:** `https://your-middleware-server.com/api/deploy-site`
- **Headers:** Add an `Authorization` header with a secret token to secure the endpoint.
- **Payload:** Send all relevant Custom Values.

### Required Custom Values (The Payload)
The GHL sub-account must have these Custom Values populated before the webhook fires:

**Tier 1 — Hard Blockers (Must not be empty):**
- `business.name` (e.g., "McKinney Fix-It Pros")
- `business.phone` (e.g., "9727952770")
- `business.email` (e.g., "hello@mckinneyfixitpros.com")
- `business.address_street`
- `business.city`
- `business.state`
- `business.zip`
- `business.site_url` (e.g., "https://mckinneyfixitpros.com")
- `ghl.pipeline_id`
- `ghl.stage_id`

**Tier 2 — Soft Defaults (Middleware can provide fallbacks):**
- `business.tagline` (Fallback: "Trusted Local Handyman")
- `business.slogan` (Fallback: "Your To-Do List Won't Fix Itself")
- `business.year_est` (Fallback: Current Year)
- `business.review_count` (Fallback: "50+")
- `business.review_rating` (Fallback: "5.0")
- `business.facebook_url`
- `business.instagram_url`
- `ga4_id`

## 3. Onboarding Form Recommendations

Based on a review of `https://onboarding.homeworksadvantage.com/`, the current form collects excellent foundational data (NAP, EIN, GBP link) but is missing critical inputs required to fully populate the `site.ts` config and generate a high-quality, personalized site.

### Recommended Additions to the Form:

**Step 2: Brand Identity (Needs Expansion)**
- **Tagline:** Short phrase describing the business (e.g., "McKinney's Most Trusted Handyman").
- **Slogan:** A catchy marketing phrase (e.g., "Your To-Do List Won't Fix Itself").
- **Year Established:** To build trust (e.g., "2008").
- **Brand Colors:** Primary and Secondary hex codes (optional, but good for white-labeling).

**Step 3: Trust & Authority (Needs Expansion)**
- **Review Count:** Approximate number of 5-star reviews across platforms.
- **Review Rating:** Current average rating (e.g., 4.9).
- **Social Links:** Facebook, Instagram, Nextdoor URLs.

**New Step: Media & Assets (CRITICAL)**
To achieve the 95+ PageSpeed and high-end UI/UX, specific image assets must be collected.
- **Logo Upload:**
  - *Requirement:* SVG format strongly preferred. If PNG, minimum 800x400px with a transparent background.
- **Hero Image Upload:**
  - *Requirement:* High-resolution photo of a branded truck, job site, or the owner. NO stock photos.
  - *Specs:* Minimum 2048x1152px (16:9 aspect ratio). Max 5MB.
- **Owner/Team Photo Upload:**
  - *Requirement:* Photo of the owner or team for the About page.
  - *Specs:* Minimum 1200x900px.

*Note on Images:* The middleware server will need to download these images from the GHL media URLs provided in the webhook payload, run the image optimization scripts (generating the 400w, 640w, 800w, 1024w, 1456w WebP variants), and place them in the `public/` directory before pushing to GitHub.

## 4. Next Steps for Implementation

1. **Update the Onboarding Form:** Add the missing fields and file upload inputs to the Homeworks Advantage form.
2. **Map Custom Values:** Ensure all form fields map correctly to GHL Custom Values.
3. **Build the Middleware:** Develop the Node.js/Python service to receive the webhook, process images, and execute the GitHub/Coolify automation.
4. **Test the Pipeline:** Run a test client through the form to verify end-to-end deployment.
