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
