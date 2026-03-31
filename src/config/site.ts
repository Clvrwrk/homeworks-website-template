/**
 * ============================================================
 *  SITE CONFIG — Single Source of Truth
 *  Edit this file to rebrand the entire site for a new client.
 *  Run `npm run setup-client` for an interactive guided setup.
 * ============================================================
 */

// ── Business Identity ─────────────────────────────────────────────────────────
export const BUSINESS_NAME    = "McKinney Fix-It Pros";
export const BUSINESS_TAGLINE = "McKinney's Most Trusted Handyman";
export const BUSINESS_SLOGAN  = "Your To-Do List Won't Fix Itself";
export const BUSINESS_EST     = "2008";

// ── NAP (Name · Address · Phone) ─────────────────────────────────────────────
export const PHONE_RAW        = "9727952770";           // digits only, no formatting
export const PHONE_DISPLAY    = "(972) 795-2770";       // human-readable
export const EMAIL             = "cmiller@McKinneyFixItPros.com";
export const ADDRESS_STREET   = "403 E Graham St";
export const ADDRESS_CITY     = "McKinney";
export const ADDRESS_STATE    = "TX";
export const ADDRESS_ZIP      = "75069";
export const ADDRESS_FULL     = "403 E Graham St, McKinney, TX 75069";

// ── URLs ──────────────────────────────────────────────────────────────────────
export const SITE_URL          = "https://mckinneyfixitpros.com";
export const FACEBOOK_URL      = "https://facebook.com/mckinneyfixitpros";
export const INSTAGRAM_URL     = "https://instagram.com/mckinneyfixitpros";
export const NEXTDOOR_URL      = "";   // optional

// ── GHL (GoHighLevel) ─────────────────────────────────────────────────────────
// API key and Location ID live in .env — never hardcode here.
// Pipeline and Stage IDs are safe to store here (not secrets).
export const GHL_PIPELINE_ID   = "jR3dAD31rJdPAw7ln9Rm";
export const GHL_STAGE_ID      = "dbe44958-64fc-45ae-b6db-ce72cacfda80"; // "New Lead"

// ── Primary Service Area ──────────────────────────────────────────────────────
export const PRIMARY_CITY      = "McKinney";
export const PRIMARY_STATE     = "TX";
export const PRIMARY_ZIP       = "75069";
export const SERVICE_RADIUS    = "25";  // miles

// ── Brand Colors ─────────────────────────────────────────────────────────────
// These are injected into global.css via CSS custom properties.
// To change brand colors, update these values AND run `npm run build`.
export const COLORS = {
  clay:       "#b05d45",   // Primary CTA — Terracotta
  clayDark:   "#8d4a37",   // Primary CTA hover
  navy:       "#2c3e50",   // Header / dark sections
  navyDark:   "#1a252f",   // Header hover
  gold:       "#e2a03f",   // Stars / accents on dark backgrounds only
  ink:        "#151d25",   // Body text
  muted:      "#567798",   // Secondary text
  border:     "#cdd8e3",   // Borders
  offwhite:   "#f0f2f4",   // Section backgrounds
  snow:       "#f8f9fa",   // Bright backgrounds
} as const;

// ── Typography ────────────────────────────────────────────────────────────────
export const FONT_DISPLAY      = "'Plus Jakarta Sans'";  // headings
export const FONT_BODY         = "'DM Sans'";            // body / UI
export const GOOGLE_FONTS_URL  =
  "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=DM+Sans:wght@300;400;500;600;700&display=swap";

// ── Trust Signals ─────────────────────────────────────────────────────────────
export const REVIEW_COUNT      = "100+";
export const REVIEW_PLATFORM   = "Google";
export const REVIEW_RATING     = "4.9";
export const YEARS_EXPERIENCE  = "15+";
export const JOBS_COMPLETED    = "2,500+";
export const RESPONSE_TIME     = "60 minutes";  // during business hours
export const BUSINESS_HOURS   = "Mon–Sat: 7am–7pm";

// ── SEO Defaults ─────────────────────────────────────────────────────────────
export const SEO_TITLE_SUFFIX  = `| ${BUSINESS_NAME}`;
export const SEO_DEFAULT_TITLE = `${BUSINESS_NAME} | Top-Rated Handyman Services in ${PRIMARY_CITY}, ${PRIMARY_STATE}`;
export const SEO_DEFAULT_DESC  =
  `${BUSINESS_NAME} offers reliable handyman services in ${PRIMARY_CITY}, TX. ` +
  `Drywall, painting, plumbing, electrical & more. Free estimates. Call ${PHONE_DISPLAY}.`;
export const OG_IMAGE_DEFAULT  = "/og-default.jpg";

// ── Schema.org / Local Business ───────────────────────────────────────────────
export const SCHEMA_TYPE       = "HomeAndConstructionBusiness";
export const SCHEMA_PRICE_RANGE = "$$";

// ── Derived helpers (do not edit) ─────────────────────────────────────────────
export const TEL_HREF          = `tel:${PHONE_RAW}`;
export const MAILTO_HREF       = `mailto:${EMAIL}`;
export const SMS_HREF          = `sms:${PHONE_RAW}`;
