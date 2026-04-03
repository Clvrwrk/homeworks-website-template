# AI Agent SOP: Client Site Onboarding & Automation

This Standard Operating Procedure (SOP) outlines the correct workflows for initializing a new client site using the Homeworks Website Template across various AI agent environments.

The primary deployment path uses the `/build-website` skill, which orchestrates GitHub fork, Supabase provisioning, SEO content generation, and WCAG validation in parallel. For manual or semi-automated setups, the template's `src/config/site.ts` file is the single source of truth for all client variables.

---

## 1. Codex

Codex environments typically operate within a sandboxed virtual machine with shell access, but interactive prompts can cause execution timeouts if not handled via a pseudo-terminal (PTY) or specific input-sending tools.

**Standard Operating Procedure:**
1. **Direct File Editing (Recommended):** Instruct Codex to bypass any interactive CLI. Provide the client data in your prompt and ask Codex to use its file editing tools to directly update `src/config/site.ts`, replacing all `{{TEMPLATE_VAR}}` placeholders.
2. **Interactive Shell Tool:** If the Codex environment provides a specific shell tool with a `send` action (to send stdin to a running process), the agent can execute the setup in a background execution mode, and sequentially send the answers to the prompts.
3. **Verification:** After editing, instruct Codex to run `npm run build` to verify that no syntax errors were introduced in the config file.

---

## 2. Claude Code

Claude Code operates directly within your local IDE or terminal. It excels at executing commands and reading file systems.

**Standard Operating Procedure:**
1. **Use `/build-website` skill (preferred):** Invoke the skill with the client's onboarding data. The skill handles all phases automatically — fork, provision, content, validation, handoff.
2. **Agent-Driven Edit (manual path):** Provide Claude Code with the new client's details (Business Name, Phone, Address, GHL IDs, etc.) and instruct it to read `src/config/site.ts` and update all placeholder values.
3. **Manual Fallback:** Open a separate terminal, make edits manually, then return to Claude Code for subsequent tasks (updating images, page copy, etc.).

---

## 3. Google AntiGravity

Google AntiGravity operates in a highly structured, tool-based sandbox. Running interactive CLI scripts via standard bash execution tools will typically result in a hanging process and a timeout error.

**Standard Operating Procedure:**
1. **Do not run interactive CLIs:** Never instruct AntiGravity to run interactive setup scripts directly.
2. **Provide Context:** Give the AntiGravity agent the full list of client data.
3. **Direct Modification:** Instruct the agent to use its specific file manipulation tools (e.g., `edit`, `write`, or `replace` actions) to update `src/config/site.ts`.
4. **Environment Variables:** Remind the agent to also create or update the `.env` file with `PUBLIC_GA4_ID`, `GHL_API_KEY`, and `GHL_LOCATION_ID` using file tools.

---

## 4. Local Terminal Running Claude Code

When you are running Claude Code directly in your local terminal (e.g., via the `claude` CLI), the agent shares your terminal's standard input/output.

**Standard Operating Procedure:**
1. **Human-in-the-Loop (Recommended):** 
   - Pause your interaction with Claude Code.
   - Edit `src/config/site.ts` manually or run any setup script in the terminal.
   - Once the config is correct, resume your prompt with Claude Code to handle the remaining tasks.
2. **Agent-Driven Edit:** Alternatively, provide the data to Claude Code and ask it to edit `src/config/site.ts` directly.

---

## Summary: The Golden Rule for AI Agents

The universal best practice for autonomous AI agents is to **directly edit `src/config/site.ts`** using their native file-manipulation tools. Any interactive wizard is designed specifically for human developers performing manual setups.

---

## 5. SEO Page Update Workflow

When the SEO team provides a copy brief to update an existing page (e.g., the homepage or a service page), AI agents must follow the **SEO Page Update Skill** located at `skills/seo-page-update/SKILL.md`.

**Standard Operating Procedure:**
1. **Read the Skill:** Instruct the agent to read `skills/seo-page-update/SKILL.md` before making any changes.
2. **Analyze the Copy:** The agent must map the raw SEO copy to the established UI/UX patterns (e.g., Marquee for trust bars, Definition Lists for services overview, Pill Chips for neighborhoods).
3. **Update Meta Tags:** Ensure the agent updates the `<Layout>` props (`title` and `description`) and the H1 tag with the exact target keyword.
4. **Preserve the Design System:** The agent must never invent fake statistics, break WCAG contrast rules, or use plain text walls. All new sections must use the existing Tailwind utility classes (`section-padding`, `site-container`, `section-heading`, etc.).
5. **Verify:** After updating the page, the agent should run `npm run build` to ensure no syntax errors were introduced.

---

## 6. Schema Structured Data Workflow

When adding or updating schema markup for a page, AI agents must follow the **Schema Structured Data Skill** located at `skills/schema-structured-data/SKILL.md`.

**Standard Operating Procedure:**
1. **Read the Skill:** Instruct the agent to read `skills/schema-structured-data/SKILL.md` to understand the required schema types for different pages.
2. **Global Schema:** The `LocalBusiness` schema is already injected globally via `Layout.astro`. Do not duplicate it on individual pages.
3. **Page-Specific Schema:** Construct the appropriate JSON-LD object (e.g., `Service`, `FAQPage`, `Article`, `WebPage`) in the page's frontmatter.
4. **Pass to Layout:** Pass the schema object (or array of objects) to the `<Layout>` component via the `schema` prop.
5. **Verify:** Run `npm run build` to ensure the schema objects are valid and the build succeeds.

---

## 7. PageSpeed 95+ Optimization Workflow

Before finalizing any site build or UI update, you MUST ensure the site maintains a 95+ Mobile PageSpeed score.

**Golden Rule:** Read `skills/pagespeed-optimization/SKILL.md` before modifying images, CSS, or colors.

1. **LCP Images:** Ensure all hero images use responsive `srcset` (640w, 1024w, 1456w) and have `loading="eager"` and `fetchpriority="high"`.
2. **Lazy Loading:** Ensure all below-the-fold images have `loading="lazy"` and `decoding="async"`.
3. **CSS Delivery:** Ensure `astro.config.mjs` has `inlineStylesheets: "always"` to prevent render-blocking CSS.
4. **Fonts:** Fonts MUST be loaded via the Astro Font API (`experimental.fonts` in `astro.config.mjs`). Never use Google Fonts CDN `<link>` tags — Astro self-hosts fonts at build time.
5. **Accessibility:** Verify all text colors meet WCAG 2.1 AA contrast ratios (4.5:1 minimum). Never use light gray text on white backgrounds.
6. **Verification:** Always run `npm run build` and inspect the output in `dist/client/` to confirm optimizations are applied.
