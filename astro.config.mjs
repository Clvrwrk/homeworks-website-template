// @ts-check
import { defineConfig, fontProviders } from "astro/config";
import node      from "@astrojs/node";
import sitemap   from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import icon from "astro-icon";

export default defineConfig({
  // ── Site URL — populated by /build-website skill from client onboarding ──
  // TEMPLATE VAR: {{SITE_URL}} is replaced with actual client domain at deploy time
  site: "https://{{SITE_URL}}",

  output: "server",

  // ── Security — disable CSRF origin check so form POSTs work from both
  // www.domain.com and domain.com (Coolify handles the redirect)
  security: {
    checkOrigin: false,
  },

  adapter: node({
    mode: "standalone",
  }),

  // ── Integrations ──────────────────────────────────────────────────────────
  integrations: [
    icon({
      iconDir: "src/icons",
    }),
    sitemap({
      // Exclude utility/legal pages from sitemap
      filter: (page) =>
        !page.includes("/contact/success") &&
        !page.includes("/404"),
      changefreq: "weekly",
      priority: 0.7,
      lastmod: new Date(),
      // NOTE: /build-website skill populates customPages[] after generating
      // src/data/services.ts and src/data/locations.ts for each client.
      // Required because SSR dynamic routes are NOT auto-discovered.
      // Service pages → priority 0.9 | Location pages → 0.8 | Projects → 0.6
      customPages: [],
      serialize(item) {
        // Apply differentiated priority by URL pattern
        if (item.url.includes("/services/") && !item.url.endsWith("/services/")) {
          return { ...item, priority: 0.9, changefreq: "weekly" };
        }
        if (item.url.includes("/locations/") && !item.url.endsWith("/locations/")) {
          return { ...item, priority: 0.8, changefreq: "monthly" };
        }
        if (item.url.includes("/projects/") && !item.url.endsWith("/projects/")) {
          return { ...item, priority: 0.6, changefreq: "monthly" };
        }
        if (item.url.endsWith("/") && !item.url.replace(/\/$/, "").includes("/")) {
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
  // Fonts are downloaded at build time, self-hosted, and preloaded automatically.
  // DO NOT add Google Fonts <link> tags in Layout.astro — Astro handles it.
  experimental: {
    fonts: [
      {
        // Display font: Plus Jakarta Sans — legible at all weights, premium feel
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
    inlineStylesheets: "always",
  },

  // ── Compression headers via Vite ─────────────────────────────────────────
  compressHTML: true,
});
