// ============================================================
// HOMEWORKS WEBSITE TEMPLATE — SINGLE SOURCE OF TRUTH
// All {{TEMPLATE_VARS}} are substituted by /build-website skill.
// NEVER hardcode client data in this file.
// ============================================================

// ---- Types --------------------------------------------------

export interface ServiceDef {
  slug: string;
  name: string;
  description: string;
  image: string;
  cta: string;
}

export interface LocationDef {
  slug: string;
  city: string;
  state: string;
}

// ---- Business Identity --------------------------------------

export const BUSINESS_NAME        = "{{CLIENT_DBA}}";
export const BUSINESS_LEGAL_NAME  = "{{CLIENT_LEGAL_NAME}}";
export const BUSINESS_TAGLINE     = "{{ADDRESS_CITY}}'s Most Trusted {{PRIMARY_CATEGORY}}";
export const BUSINESS_SLOGAN      = "Quality Work. Honest Pricing.";
export const BUSINESS_EST         = "{{YEAR_FOUNDED}}";

// ---- NAP (Name · Address · Phone) ---------------------------

export const PHONE_RAW      = "{{PHONE_RAW}}";
export const PHONE_DISPLAY  = "{{PHONE_DISPLAY}}";
export const EMAIL          = "{{CLIENT_EMAIL}}";
export const ADDRESS_STREET = "{{ADDRESS_STREET}}";
export const ADDRESS_CITY   = "{{ADDRESS_CITY}}";
export const ADDRESS_STATE  = "{{ADDRESS_STATE}}";
export const ADDRESS_ZIP    = "{{ADDRESS_ZIP}}";
export const ADDRESS_FULL   = "{{ADDRESS_FULL}}";

// ---- Brand Colors -------------------------------------------
// Injected as CSS vars via Layout.astro define:vars.
// Primary   = CTA button fill
// Secondary = Nav / header / dark section backgrounds
// Accent    = Light section backgrounds
// Accent2   = Body text / ink on light backgrounds

export const COLOR_PRIMARY        = "{{PRIMARY_BRAND_COLOR}}";
export const COLOR_PRIMARY_DARK   = "{{PRIMARY_BRAND_COLOR_DARK}}";
export const COLOR_SECONDARY      = "{{SECONDARY_BRAND_COLOR}}";
export const COLOR_SECONDARY_DARK = "{{SECONDARY_BRAND_COLOR_DARK}}";
export const COLOR_ACCENT         = "{{ACCENT_COLOR}}";
export const COLOR_ACCENT_2       = "{{ACCENT_2_COLOR}}";

// ---- Social (empty string if not provided) ------------------

export const FACEBOOK_URL   = "{{FACEBOOK_URL}}";
export const INSTAGRAM_URL  = "{{INSTAGRAM_URL}}";
export const LINKEDIN_URL   = "{{LINKEDIN_URL}}";
export const YOUTUBE_URL    = "{{YOUTUBE_URL}}";
export const YELP_URL       = "{{YELP_URL}}";
export const NEXTDOOR_URL   = "{{NEXTDOOR_URL}}";
export const THUMBTACK_URL  = "{{THUMBTACK_URL}}";
export const ANGI_URL       = "{{ANGI_URL}}";
export const GOOGLE_LINK    = "{{GOOGLE_LINK}}";

// ---- Trust Signals ------------------------------------------

export const REVIEW_COUNT      = "{{NUMBER_OF_REVIEWS}}";
export const REVIEW_RATING     = "5.0";
export const HAPPY_CUSTOMERS   = "{{HAPPY_CUSTOMERS}}";
export const YEARS_IN_BUSINESS = "{{YEARS_IN_BUSINESS}}";
export const YEARS_EXPERIENCE  = "{{YEARS_IN_BUSINESS}}";
export const JOBS_COMPLETED    = "{{JOBS_COMPLETED}}";
export const RESPONSE_TIME     = "{{RESPONSE_TIME}}";
export const IS_LICENSED: boolean = false;
export const IS_INSURED: boolean  = false;
export const IS_BONDED: boolean   = false;
export const LICENSE_NUMBER    = "{{LICENSE_NUMBER}}";
export const MEMBERSHIPS: string[] = [];

// ---- Services & Categories ----------------------------------

export const PRIMARY_CATEGORY: string     = "{{PRIMARY_CATEGORY}}";
export const SERVICE_CATEGORIES: string[] = [];
export const SERVICES: ServiceDef[]       = [];

// ---- Locations ----------------------------------------------

export const PRIMARY_CITY   = "{{ADDRESS_CITY}}";
export const PRIMARY_STATE  = "{{ADDRESS_STATE}}";
export const SERVICE_RADIUS = "25";
export const LOCATIONS: LocationDef[] = [];

// ---- GHL CRM ------------------------------------------------

export const GHL_LOCATION_ID = "{{GHL_LOCATION_ID}}";
export const GHL_PIPELINE_ID = "{{GHL_PIPELINE_ID}}";
export const GHL_STAGE_ID    = "{{GHL_STAGE_ID}}";

// ---- Site & SEO ---------------------------------------------

export const SITE_SLUG          = "{{SITE_SLUG}}";
export const SITE_URL           = "https://{{SITE_URL}}";
export const SEO_DEFAULT_TITLE  =
  "{{CLIENT_DBA}} | {{PRIMARY_CATEGORY}} in {{ADDRESS_CITY}}, {{ADDRESS_STATE}}";
export const SEO_DEFAULT_DESC   =
  "{{CLIENT_DBA}} offers expert {{PRIMARY_CATEGORY}} services in {{ADDRESS_CITY}}, {{ADDRESS_STATE}}. " +
  "Call {{PHONE_DISPLAY}} for a free quote.";
export const OG_IMAGE_DEFAULT   = "/og-default.jpg";
export const SCHEMA_TYPE        = "HomeAndConstructionBusiness";
export const SCHEMA_PRICE_RANGE = "$$";
export const BUSINESS_HOURS     = "{{BUSINESS_HOURS}}";

// ---- Derived helpers ----------------------------------------

export const TEL_HREF    = `tel:{{PHONE_RAW}}`;
export const MAILTO_HREF = `mailto:{{CLIENT_EMAIL}}`;
export const SMS_HREF    = `sms:{{PHONE_RAW}}`;
