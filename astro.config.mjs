// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import node from "@astrojs/node";
import tailwindcss from "@tailwindcss/vite";
import icon from "astro-icon";

export default defineConfig({
  site: "https://{{SITE_URL}}",
  output: "server",

  security: {
    checkOrigin: false,
  },

  adapter: node({
    mode: "standalone",
  }),

  integrations: [
    icon({
      iconDir: "src/icons",
    }),
    sitemap({
      filter: (page) =>
        !page.includes("/contact/success") && !page.includes("/404"),
      changefreq: "weekly",
      priority: 0.7,
    }),
  ],

  experimental: {
    fonts: [
      {
        name: "Plus Jakarta Sans",
        cssVariable: "--font-display",
        provider: "local",
        variants: [
          { weight: "400", style: "normal", src: [{ path: "public/fonts/plus-jakarta-sans-400.woff2" }] },
          { weight: "500", style: "normal", src: [{ path: "public/fonts/plus-jakarta-sans-500.woff2" }] },
          { weight: "600", style: "normal", src: [{ path: "public/fonts/plus-jakarta-sans-600.woff2" }] },
          { weight: "700", style: "normal", src: [{ path: "public/fonts/plus-jakarta-sans-700.woff2" }] },
          { weight: "800", style: "normal", src: [{ path: "public/fonts/plus-jakarta-sans-800.woff2" }] },
        ],
      },
      {
        name: "DM Sans",
        cssVariable: "--font-body",
        provider: "local",
        variants: [
          { weight: "400", style: "normal", src: [{ path: "public/fonts/dm-sans-400.woff2" }] },
          { weight: "500", style: "normal", src: [{ path: "public/fonts/dm-sans-500.woff2" }] },
          { weight: "600", style: "normal", src: [{ path: "public/fonts/dm-sans-600.woff2" }] },
          { weight: "700", style: "normal", src: [{ path: "public/fonts/dm-sans-700.woff2" }] },
        ],
      },
    ],
  },

  vite: {
    plugins: [tailwindcss()],
    build: {
      assetsInlineLimit: 4096,
      cssCodeSplit: true,
    },
  },

  build: {
    inlineStylesheets: "always",
  },

  compressHTML: true,
});
