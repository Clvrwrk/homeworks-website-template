#!/usr/bin/env node
/**
 * ============================================================
 *  setup-client.mjs — Interactive Client Onboarding Script
 *
 *  Usage:  npm run setup-client
 *
 *  This script walks you through every configurable field in
 *  src/config/site.ts and writes the new values in one shot.
 *  Run it once per new client deployment.
 * ============================================================
 */

import { createInterface } from "readline";
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = resolve(__dirname, "../src/config/site.ts");

// ── Helpers ───────────────────────────────────────────────────────────────────

const rl = createInterface({ input: process.stdin, output: process.stdout });

function ask(question, defaultValue = "") {
  return new Promise((res) => {
    const hint = defaultValue ? ` [${defaultValue}]` : "";
    rl.question(`  ${question}${hint}: `, (answer) => {
      res(answer.trim() || defaultValue);
    });
  });
}

function header(title) {
  const line = "─".repeat(60);
  console.log(`\n${line}`);
  console.log(`  ${title}`);
  console.log(line);
}

function info(msg) {
  console.log(`  ℹ  ${msg}`);
}

function success(msg) {
  console.log(`  ✅ ${msg}`);
}

function warning(msg) {
  console.log(`  ⚠️  ${msg}`);
}

// ── Main ──────────────────────────────────────────────────────────────────────

console.log("\n╔══════════════════════════════════════════════════════════╗");
console.log("║        Handyman Site — Client Setup Wizard               ║");
console.log("╚══════════════════════════════════════════════════════════╝");
console.log("\n  Answer each prompt. Press Enter to keep the default value.");
console.log("  You can re-run this script at any time to update values.\n");

// ── 1. Business Identity ──────────────────────────────────────────────────────
header("1 / 7  Business Identity");
const BUSINESS_NAME    = await ask("Business name",    "McKinney Fix-It Pros");
const BUSINESS_TAGLINE = await ask("Tagline (short)",  "McKinney's Most Trusted Handyman");
const BUSINESS_SLOGAN  = await ask("Hero slogan",      "Your To-Do List Won't Fix Itself");
const BUSINESS_EST     = await ask("Year established", "2008");

// ── 2. NAP ────────────────────────────────────────────────────────────────────
header("2 / 7  Contact Info (NAP)");
const PHONE_RAW     = await ask("Phone (digits only, e.g. 9727952770)", "9727952770");
const PHONE_DISPLAY = await ask("Phone (display, e.g. (972) 795-2770)", "(972) 795-2770");
const EMAIL         = await ask("Email address", "cmiller@McKinneyFixItPros.com");
const ADDRESS_STREET = await ask("Street address", "403 E Graham St");
const ADDRESS_CITY   = await ask("City",  "McKinney");
const ADDRESS_STATE  = await ask("State (2-letter)", "TX");
const ADDRESS_ZIP    = await ask("ZIP code", "75069");

// ── 3. URLs ───────────────────────────────────────────────────────────────────
header("3 / 7  URLs & Social");
const SITE_URL      = await ask("Production URL (no trailing slash)", "https://mckinneyfixitpros.com");
const FACEBOOK_URL  = await ask("Facebook URL (or leave blank)", "https://facebook.com/mckinneyfixitpros");
const INSTAGRAM_URL = await ask("Instagram URL (or leave blank)", "https://instagram.com/mckinneyfixitpros");
const NEXTDOOR_URL  = await ask("Nextdoor URL (or leave blank)", "");

// ── 4. GHL ────────────────────────────────────────────────────────────────────
header("4 / 7  GoHighLevel (GHL)");
info("Pipeline & Stage IDs are safe to store here. API key goes in .env only.");
const GHL_PIPELINE_ID = await ask("GHL Pipeline ID", "jR3dAD31rJdPAw7ln9Rm");
const GHL_STAGE_ID    = await ask("GHL Stage ID (New Lead)", "dbe44958-64fc-45ae-b6db-ce72cacfda80");

// ── 5. Service Area ───────────────────────────────────────────────────────────
header("5 / 7  Primary Service Area");
const PRIMARY_CITY  = await ask("Primary city",  "McKinney");
const PRIMARY_STATE = await ask("Primary state", "TX");
const PRIMARY_ZIP   = await ask("Primary ZIP",   "75069");
const SERVICE_RADIUS = await ask("Service radius (miles)", "25");

// ── 6. Trust Signals ──────────────────────────────────────────────────────────
header("6 / 7  Trust Signals");
const REVIEW_COUNT     = await ask("Review count display (e.g. 100+)", "100+");
const REVIEW_PLATFORM  = await ask("Review platform", "Google");
const REVIEW_RATING    = await ask("Average rating (e.g. 4.9)", "4.9");
const YEARS_EXPERIENCE = await ask("Years experience display (e.g. 15+)", "15+");
const JOBS_COMPLETED   = await ask("Jobs completed display (e.g. 2,500+)", "2,500+");
const RESPONSE_TIME    = await ask("Response time (e.g. 60 minutes)", "60 minutes");
const BUSINESS_HOURS   = await ask("Business hours (e.g. Mon–Sat: 7am–7pm)", "Mon–Sat: 7am–7pm");

// ── 7. Analytics ─────────────────────────────────────────────────────────────
header("7 / 7  Analytics");
info("GA4 Measurement ID goes in .env as PUBLIC_GA4_ID. Enter it here to pre-fill .env.");
const GA4_ID = await ask("GA4 Measurement ID (e.g. G-XXXXXXXXXX, or leave blank)", "");

rl.close();

// ── Write site.ts ─────────────────────────────────────────────────────────────
console.log("\n  Writing src/config/site.ts …");

const ADDRESS_FULL = `${ADDRESS_STREET}, ${ADDRESS_CITY}, ${ADDRESS_STATE} ${ADDRESS_ZIP}`;

const siteTs = `/**
 * ============================================================
 *  SITE CONFIG — Single Source of Truth
 *  Edit this file to rebrand the entire site for a new client.
 *  Run \`npm run setup-client\` for an interactive guided setup.
 * ============================================================
 */

// ── Business Identity ─────────────────────────────────────────────────────────
export const BUSINESS_NAME    = "${BUSINESS_NAME}";
export const BUSINESS_TAGLINE = "${BUSINESS_TAGLINE}";
export const BUSINESS_SLOGAN  = "${BUSINESS_SLOGAN}";
export const BUSINESS_EST     = "${BUSINESS_EST}";

// ── NAP (Name · Address · Phone) ─────────────────────────────────────────────
export const PHONE_RAW        = "${PHONE_RAW}";           // digits only, no formatting
export const PHONE_DISPLAY    = "${PHONE_DISPLAY}";       // human-readable
export const EMAIL             = "${EMAIL}";
export const ADDRESS_STREET   = "${ADDRESS_STREET}";
export const ADDRESS_CITY     = "${ADDRESS_CITY}";
export const ADDRESS_STATE    = "${ADDRESS_STATE}";
export const ADDRESS_ZIP      = "${ADDRESS_ZIP}";
export const ADDRESS_FULL     = "${ADDRESS_FULL}";

// ── URLs ──────────────────────────────────────────────────────────────────────
export const SITE_URL          = "${SITE_URL}";
export const FACEBOOK_URL      = "${FACEBOOK_URL}";
export const INSTAGRAM_URL     = "${INSTAGRAM_URL}";
export const NEXTDOOR_URL      = "${NEXTDOOR_URL}";   // optional

// ── GHL (GoHighLevel) ─────────────────────────────────────────────────────────
// API key and Location ID live in .env — never hardcode here.
// Pipeline and Stage IDs are safe to store here (not secrets).
export const GHL_PIPELINE_ID   = "${GHL_PIPELINE_ID}";
export const GHL_STAGE_ID      = "${GHL_STAGE_ID}"; // "New Lead"

// ── Primary Service Area ──────────────────────────────────────────────────────
export const PRIMARY_CITY      = "${PRIMARY_CITY}";
export const PRIMARY_STATE     = "${PRIMARY_STATE}";
export const PRIMARY_ZIP       = "${PRIMARY_ZIP}";
export const SERVICE_RADIUS    = "${SERVICE_RADIUS}";  // miles

// ── Brand Colors ─────────────────────────────────────────────────────────────
// These are injected into global.css via CSS custom properties.
// To change brand colors, update these values AND run \`npm run build\`.
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
export const REVIEW_COUNT      = "${REVIEW_COUNT}";
export const REVIEW_PLATFORM   = "${REVIEW_PLATFORM}";
export const REVIEW_RATING     = "${REVIEW_RATING}";
export const YEARS_EXPERIENCE  = "${YEARS_EXPERIENCE}";
export const JOBS_COMPLETED    = "${JOBS_COMPLETED}";
export const RESPONSE_TIME     = "${RESPONSE_TIME}";  // during business hours
export const BUSINESS_HOURS   = "${BUSINESS_HOURS}";

// ── SEO Defaults ─────────────────────────────────────────────────────────────
export const SEO_TITLE_SUFFIX  = \`| \${BUSINESS_NAME}\`;
export const SEO_DEFAULT_TITLE = \`\${BUSINESS_NAME} | Top-Rated Handyman Services in \${PRIMARY_CITY}, \${PRIMARY_STATE}\`;
export const SEO_DEFAULT_DESC  =
  \`\${BUSINESS_NAME} offers reliable handyman services in \${PRIMARY_CITY}, \${PRIMARY_STATE}. \` +
  \`Drywall, painting, plumbing, electrical & more. Free estimates. Call \${PHONE_DISPLAY}.\`;
export const OG_IMAGE_DEFAULT  = "/images/og-default.jpg";

// ── Schema.org / Local Business ───────────────────────────────────────────────
export const SCHEMA_TYPE       = "HomeAndConstructionBusiness";
export const SCHEMA_PRICE_RANGE = "$$";

// ── Derived helpers (do not edit) ─────────────────────────────────────────────
export const TEL_HREF          = \`tel:\${PHONE_RAW}\`;
export const MAILTO_HREF       = \`mailto:\${EMAIL}\`;
export const SMS_HREF          = \`sms:\${PHONE_RAW}\`;
`;

writeFileSync(CONFIG_PATH, siteTs, "utf8");
success("src/config/site.ts updated.");

// ── Update .env if GA4 ID was provided ───────────────────────────────────────
if (GA4_ID) {
  const envPath = resolve(__dirname, "../.env");
  let envContent = "";
  try {
    envContent = readFileSync(envPath, "utf8");
  } catch {
    // .env doesn't exist yet — that's fine
  }
  if (envContent.includes("PUBLIC_GA4_ID=")) {
    envContent = envContent.replace(/PUBLIC_GA4_ID=.*/, `PUBLIC_GA4_ID=${GA4_ID}`);
  } else {
    envContent += `\nPUBLIC_GA4_ID=${GA4_ID}\n`;
  }
  writeFileSync(envPath, envContent, "utf8");
  success(`.env updated with GA4 ID: ${GA4_ID}`);
}

// ── Final instructions ────────────────────────────────────────────────────────
console.log("\n╔══════════════════════════════════════════════════════════╗");
console.log("║  Setup complete! Next steps:                             ║");
console.log("╠══════════════════════════════════════════════════════════╣");
console.log("║  1. Review src/config/site.ts for any manual tweaks      ║");
console.log("║  2. Update .env with GHL_API_KEY and GHL_LOCATION_ID     ║");
console.log("║  3. Replace /public images with client photos            ║");
console.log("║  4. Update service list in src/data/services.ts          ║");
console.log("║  5. Update location slugs in src/data/locations.ts       ║");
console.log("║  6. Run: npm run dev  (to preview)                       ║");
console.log("║  7. Run: npm run build  (to verify production build)     ║");
console.log("╚══════════════════════════════════════════════════════════╝\n");
