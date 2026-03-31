// @ts-check
import { defineConfig, fontProviders } from "astro/config";
import node      from "@astrojs/node";
import sitemap   from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  // ── Site URL — required for canonical URLs, sitemap, and OG images ──────
  site: "https://mckinneyfixitpros.com",

  output: "server",

  // ── Security — disable CSRF origin check so form POSTs work from both
  // www.mckinneyfixitpros.com and mckinneyfixitpros.com (Coolify handles
  // the redirect, so the Origin header may differ from the site URL)
  security: {
    checkOrigin: false,
  },

  adapter: node({
    mode: "standalone",
  }),

  // ── Integrations ──────────────────────────────────────────────────────────
  integrations: [
    sitemap({
      // Exclude utility/legal pages from sitemap
      filter: (page) =>
        !page.includes("/contact/success") &&
        !page.includes("/404"),
      changefreq: "weekly",
      priority: 0.7,
      lastmod: new Date(),
      // SSR slug pages are not auto-discovered — must be listed explicitly.
      // Service pages get priority 0.9 (primary revenue pages).
      // Location pages get priority 0.8 (geo-targeting pages).
      // Project pages get priority 0.6 (supporting content).
      customPages: [
        // ── Service pages ────────────────────────────────────────────────
        "https://mckinneyfixitpros.com/services/drywall-repair",
        "https://mckinneyfixitpros.com/services/tv-mounting",
        "https://mckinneyfixitpros.com/services/plumbing",
        "https://mckinneyfixitpros.com/services/door-installation",
        "https://mckinneyfixitpros.com/services/interior-painting",
        "https://mckinneyfixitpros.com/services/electrical-fixtures",
        "https://mckinneyfixitpros.com/services/furniture-assembly",
        "https://mckinneyfixitpros.com/services/carpentry",
        "https://mckinneyfixitpros.com/services/pressure-washing",
        // ── Location pages ───────────────────────────────────────────────
        "https://mckinneyfixitpros.com/locations/mckinney-tx",
        "https://mckinneyfixitpros.com/locations/allen-tx",
        "https://mckinneyfixitpros.com/locations/frisco-tx",
        "https://mckinneyfixitpros.com/locations/prosper-tx",
        "https://mckinneyfixitpros.com/locations/celina-tx",
        "https://mckinneyfixitpros.com/locations/anna-tx",
        "https://mckinneyfixitpros.com/locations/plano-tx",
        "https://mckinneyfixitpros.com/locations/fairview-tx",
        "https://mckinneyfixitpros.com/locations/melissa-tx",
        // ── Project pages ────────────────────────────────────────────────
        "https://mckinneyfixitpros.com/projects/stonebridge-ranch-drywall",
        "https://mckinneyfixitpros.com/projects/craig-ranch-living-room",
        "https://mckinneyfixitpros.com/projects/eldorado-bathroom-fixtures",
        "https://mckinneyfixitpros.com/projects/allen-tv-mounting",
        "https://mckinneyfixitpros.com/projects/frisco-crown-molding",
        "https://mckinneyfixitpros.com/projects/prosper-deck-restoration",
      ],
      serialize(item) {
        // Apply differentiated priority by URL pattern
        if (item.url.includes("/services/") && item.url !== "https://mckinneyfixitpros.com/services/") {
          return { ...item, priority: 0.9, changefreq: "weekly" };
        }
        if (item.url.includes("/locations/") && item.url !== "https://mckinneyfixitpros.com/locations/") {
          return { ...item, priority: 0.8, changefreq: "monthly" };
        }
        if (item.url.includes("/projects/") && item.url !== "https://mckinneyfixitpros.com/projects/") {
          return { ...item, priority: 0.6, changefreq: "monthly" };
        }
        if (item.url === "https://mckinneyfixitpros.com/") {
          return { ...item, priority: 1.0, changefreq: "weekly" };
        }
        // Exclude legal/utility pages from sitemap entirely
        if (
          item.url.includes("/privacy-policy") ||
          item.url.includes("/terms-of-service") ||
          item.url.includes("/media-kit")
        ) {
          return undefined;
        }
        return { ...item, priority: 0.7, changefreq: "weekly" };
      },
    }),
  ],

  // ── Astro Native Font API ─────────────────────────────────────────────────
  // NOTE: In Astro 5.18.x the Font API still lives under `experimental.fonts`.
  // The top-level `fonts` key is documented but not yet stable in this version.
  // Fonts are downloaded at build time, self-hosted, and preloaded automatically.
  // DO NOT add Google Fonts <link> tags in Layout.astro — Astro handles it.
  experimental: {
    fonts: [
      {
        // Display font: Plus Jakarta Sans — legible at all weights, premium feel
        // WCAG-safe: renders cleanly at 900 weight unlike Syne
        provider: fontProviders.google(),
        name: "Plus Jakarta Sans",
        cssVariable: "--font-display",
        weights: [400, 500, 600, 700, 800, 900],
        styles: ["normal"],
        subsets: ["latin"],
        fallbacks: ["ui-sans-serif", "system-ui", "sans-serif"],
      },
      {
        // Body font: DM Sans — clean, highly readable at 16–18px
        provider: fontProviders.google(),
        name: "DM Sans",
        cssVariable: "--font-body",
        weights: [400, 500, 600, 700],
        styles: ["normal"],
        subsets: ["latin"],
        fallbacks: ["ui-sans-serif", "system-ui", "sans-serif"],
      },
    ],
  },

  vite: {
    plugins: [tailwindcss()],
    server: {
      allowedHosts: true,
    },
    build: {
      // Inline small assets for fewer HTTP requests
      assetsInlineLimit: 4096,
      // Enable CSS code splitting
      cssCodeSplit: true,
    },
  },

  // ── Build output ──────────────────────────────────────────────────────────
  build: {
    // Always inline stylesheets — eliminates render-blocking CSS requests.
    // Astro's font CSS (~10KB) was flagging as render-blocking in PageSpeed;
    // inlining removes the extra HTTP round-trip entirely.
    inlineStylesheets: "always",
  },

  // ── Compression headers via Vite ─────────────────────────────────────────
  compressHTML: true,
});
