# Public Pages (Events, Media Kit, Brand Guidelines) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build three new public pages — Events hub, Event detail, enhanced Press/Media Hub — and replace the media-kit stub. Add a static Brand Guidelines page. All new pages query Supabase and follow established Astro SSR + site.ts patterns.

**Architecture:** Each page is a server-rendered Astro component using `createServerClient()` (anon key, respects RLS). Only published records are returned. The brand page is fully static — hardcoded in Astro per spec. The events hub and media kit read from the four tables added in Plan 1.

**Tech Stack:** Astro 5 SSR, Supabase, Tailwind CSS 4, GSAP scroll-reveal, site.ts config constants.

**Prerequisite:** Plan 1 must be complete (migration 002 applied, tables exist).

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| Create | `src/pages/events/index.astro` | Events hub: hero + month-grouped grid |
| Create | `src/pages/events/[slug].astro` | Event detail: photo → info → map → local links |
| Modify | `src/pages/media-kit.astro` | Full replacement: editorial-first press hub |
| Create | `src/pages/brand.astro` | Brand guidelines: 6 sections + sticky nav |

---

### Task 1: Events hub page

**Files:**
- Create: `src/pages/events/index.astro`

- [ ] **Step 1: Create the page**

```astro
---
// src/pages/events/index.astro
import Layout from "@/layouts/Layout.astro";
import Header from "@/components/Header.astro";
import Footer from "@/components/Footer.astro";
import { createServerClient } from "@/lib/supabase";
import type { EventRow } from "@/types/database";
import { BUSINESS_NAME, SITE_URL } from "@/config/site";

const supabase = createServerClient();
const { data, error } = await supabase
  .from("events")
  .select("*")
  .eq("status", "published")
  .order("event_date", { ascending: true });

if (error) console.error("[events/index] Supabase error:", error.message);

const events = (data ?? []) as EventRow[];
const now = new Date();

const upcomingEvents = events.filter(e => new Date(e.event_date) >= now);
const pastEvents     = events.filter(e => new Date(e.event_date) <  now).reverse();

// "Next event" = first upcoming
const nextEvent = upcomingEvents[0] ?? null;

// Group upcoming events by "MONTH YYYY"
function groupByMonth(events: EventRow[]): Map<string, EventRow[]> {
  const map = new Map<string, EventRow[]>();
  for (const e of events) {
    const label = new Date(e.event_date).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    }).toUpperCase();
    if (!map.has(label)) map.set(label, []);
    map.get(label)!.push(e);
  }
  return map;
}

const groupedUpcoming = groupByMonth(upcomingEvents);

function formatEventDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home",   item: `${SITE_URL}/` },
    { "@type": "ListItem", position: 2, name: "Events", item: `${SITE_URL}/events` },
  ],
};
---

<Layout
  title={`Events | ${BUSINESS_NAME}`}
  description={`Upcoming events and community appearances by ${BUSINESS_NAME} in McKinney and surrounding areas.`}
  schema={[breadcrumbSchema]}
>
  <Header />

  <!-- ── Hero: Next Event ────────────────────────────────────────────────── -->
  <section class="bg-[#151d25] section-padding">
    <div class="site-container">
      {nextEvent ? (
        <div class="grid lg:grid-cols-2 gap-12 items-center">
          <!-- Left: event info -->
          <div>
            <p class="section-label-light">Next Event</p>
            <span class="inline-flex items-center gap-2 bg-[#b05d45]/20 text-[#e89d88] text-[12px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-4">
              {nextEvent.event_type}
            </span>
            <h1 class="text-white font-black tracking-tight leading-[1.05] mb-4" style="font-size: clamp(1.9rem, 3.2vw, 2.8rem);">
              {nextEvent.title}
            </h1>
            <div class="flex flex-col gap-2 mb-6 text-white/70 text-[15px]">
              <div class="flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" stroke-width="2"/><line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" stroke-width="2"/></svg>
                {formatEventDate(nextEvent.event_date)}
              </div>
              <div class="flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="10" r="3" stroke="currentColor" stroke-width="2"/></svg>
                {nextEvent.location_name}
              </div>
            </div>
            <p class="text-white/80 text-[16px] leading-relaxed mb-8 max-w-[480px]">
              {nextEvent.description.slice(0, 200)}{nextEvent.description.length > 200 ? "…" : ""}
            </p>
            <div class="flex flex-wrap gap-3">
              <a href={`/events/${nextEvent.slug}`} class="btn-primary">Learn More</a>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(nextEvent.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                class="btn-secondary-dark"
              >
                Get Directions
              </a>
            </div>
          </div>
          <!-- Right: Google Maps embed -->
          <div class="rounded-2xl overflow-hidden shadow-xl aspect-[4/3]">
            <iframe
              title={`Map for ${nextEvent.location_name}`}
              width="100%"
              height="100%"
              style="border:0"
              loading="lazy"
              referrerpolicy="no-referrer-when-downgrade"
              src={`https://www.google.com/maps/embed/v1/place?key=${import.meta.env.PUBLIC_GOOGLE_MAPS_KEY ?? ""}&q=${encodeURIComponent(nextEvent.google_place_id ? `place_id:${nextEvent.google_place_id}` : nextEvent.address)}`}
            ></iframe>
          </div>
        </div>
      ) : (
        <!-- No upcoming events placeholder -->
        <div class="text-center py-20">
          <p class="section-label-light">Events</p>
          <h1 class="text-white font-black text-[2.5rem] tracking-tight mb-4">Community Events</h1>
          <p class="text-white/70 text-[17px] max-w-[480px] mx-auto">
            No upcoming events right now. Check back soon — we're always in the community.
          </p>
        </div>
      )}
    </div>
  </section>

  <!-- ── Upcoming Events Grid ───────────────────────────────────────────── -->
  {upcomingEvents.length > 0 && (
    <section class="bg-[#f0f2f4] section-padding">
      <div class="site-container">
        <div class="text-center section-header reveal-item">
          <p class="section-label">On the Calendar</p>
          <h2 class="section-heading">Upcoming Events</h2>
          <div class="accent-divider-center"></div>
        </div>

        {Array.from(groupedUpcoming.entries()).map(([monthLabel, monthEvents]) => (
          <div class="mb-14 reveal-item">
            <!-- Month divider -->
            <div class="flex items-center gap-4 mb-8">
              <span class="text-[#2c3e50] text-[13px] font-black uppercase tracking-widest shrink-0">
                {monthLabel}
              </span>
              <div class="flex-1 h-px bg-[#cdd8e3]"></div>
              <span class="text-[#567798] text-[12px] font-medium shrink-0">
                {monthEvents.length} {monthEvents.length === 1 ? "event" : "events"}
              </span>
            </div>

            <!-- Cards grid -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {monthEvents.map((event) => {
                const isNext = event.id === nextEvent?.id;
                return (
                  <a
                    href={`/events/${event.slug}`}
                    class={`card-base group${isNext ? " ring-2 ring-[#b05d45]" : ""}`}
                  >
                    <!-- Event photo -->
                    <div class="card-photo relative">
                      <img
                        src={event.image_url || "/og-default.jpg"}
                        alt={event.title}
                        loading="lazy"
                        decoding="async"
                        width="600"
                        height="375"
                      />
                      <span class="absolute top-4 left-4 pill-chip-dark text-[11px] uppercase tracking-wider shadow-lg">
                        {event.event_type}
                      </span>
                      {isNext && (
                        <span class="absolute top-4 right-4 bg-[#b05d45] text-white text-[11px] font-bold px-3 py-1.5 rounded-full shadow-lg">
                          Next Up
                        </span>
                      )}
                    </div>
                    <!-- Card body -->
                    <div class="card-body">
                      <div class="text-[12px] text-[#567798] font-medium mb-2">
                        {formatEventDate(event.event_date)}
                      </div>
                      <h3 class="text-[#151d25] text-[18px] font-black tracking-tight mb-2">{event.title}</h3>
                      <p class="text-[#567798] text-[14px] mb-4">{event.location_name}</p>
                      <span class="inline-flex items-center gap-2 text-[#b05d45] text-[13px] font-bold uppercase tracking-widest group-hover:gap-3 transition-all">
                        Learn More
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                      </span>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  )}

  <!-- ── Past Events (collapsed) ───────────────────────────────────────── -->
  {pastEvents.length > 0 && (
    <section class="bg-white section-padding-sm">
      <div class="site-container">
        <details class="group">
          <summary class="flex items-center gap-3 cursor-pointer text-[#567798] font-bold text-[15px] select-none list-none">
            <svg class="w-4 h-4 transition-transform group-open:rotate-90" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Past Events ({pastEvents.length})
          </summary>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {pastEvents.map((event) => (
              <a href={`/events/${event.slug}`} class="flex gap-4 items-start p-4 rounded-xl border border-[#cdd8e3] hover:border-[#b05d45] transition-colors group">
                <img
                  src={event.image_url || "/og-default.jpg"}
                  alt={event.title}
                  width="80"
                  height="60"
                  class="rounded-lg object-cover shrink-0 opacity-70"
                  loading="lazy"
                />
                <div>
                  <span class="text-[11px] text-[#567798] font-medium">{formatEventDate(event.event_date)}</span>
                  <p class="text-[#151d25] text-[14px] font-bold leading-snug mt-1 group-hover:text-[#b05d45] transition-colors">{event.title}</p>
                  <p class="text-[#567798] text-[12px] mt-0.5">{event.location_name}</p>
                </div>
              </a>
            ))}
          </div>
        </details>
      </div>
    </section>
  )}

  <Footer />
</Layout>

<script>
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("is-visible"); observer.unobserve(e.target); }
      });
    },
    { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
  );
  document.querySelectorAll(".reveal-item").forEach((el) => observer.observe(el));
</script>
```

- [ ] **Step 2: Add PUBLIC_GOOGLE_MAPS_KEY to .env.example**

Open `.env.example` and add:

```
PUBLIC_GOOGLE_MAPS_KEY=AIza...   # Google Maps Embed API key (safe to expose)
```

- [ ] **Step 3: Verify with dev server**

```bash
npm run dev
```

Open `http://localhost:4321/events` — the page should:
- Show the "No upcoming events" placeholder (no seed data yet — verified correct)
- Have no TypeScript errors in the terminal

- [ ] **Step 4: TypeScript check**

```bash
npx astro check
```

Expected: 0 errors

- [ ] **Step 5: Commit**

```bash
git add src/pages/events/index.astro .env.example
git commit -m "feat: add events hub page with month-grouped grid and next-event hero"
```

---

### Task 2: Event detail page

**Files:**
- Create: `src/pages/events/[slug].astro`

- [ ] **Step 1: Create the page**

```astro
---
// src/pages/events/[slug].astro
import Layout from "@/layouts/Layout.astro";
import Header from "@/components/Header.astro";
import Footer from "@/components/Footer.astro";
import { createServerClient } from "@/lib/supabase";
import type { EventRow } from "@/types/database";
import { BUSINESS_NAME, SITE_URL } from "@/config/site";

const { slug } = Astro.params;
const supabase = createServerClient();
const { data, error } = await supabase
  .from("events")
  .select("*")
  .eq("slug", slug)
  .eq("status", "published")
  .single();

if (error || !data) return Astro.redirect("/404");

const event = data as EventRow;

function formatEventDateFull(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

// Maps embed: prefer google_place_id for precision
const mapsQuery = event.google_place_id
  ? `place_id:${event.google_place_id}`
  : event.address;

const googleMapsDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(event.address)}`;

const eventSchema = {
  "@context": "https://schema.org",
  "@type": "Event",
  name: event.title,
  startDate: event.event_date,
  endDate: event.end_date ?? event.event_date,
  location: {
    "@type": "Place",
    name: event.location_name,
    address: event.address,
  },
  description: event.description,
  image: event.image_url || `${SITE_URL}/og-default.jpg`,
  organizer: {
    "@type": "Organization",
    name: BUSINESS_NAME,
    url: SITE_URL,
  },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home",   item: `${SITE_URL}/` },
    { "@type": "ListItem", position: 2, name: "Events", item: `${SITE_URL}/events` },
    { "@type": "ListItem", position: 3, name: event.title, item: `${SITE_URL}/events/${event.slug}` },
  ],
};
---

<Layout
  title={`${event.title} | ${BUSINESS_NAME}`}
  description={event.description.slice(0, 155)}
  ogImage={event.image_url || undefined}
  schema={[eventSchema, breadcrumbSchema]}
>
  <Header />

  <!-- ── Event Photo Hero ───────────────────────────────────────────────── -->
  <div class="relative w-full max-h-[480px] overflow-hidden">
    <img
      src={event.image_url || "/og-default.jpg"}
      alt={event.title}
      class="w-full h-full object-cover"
      loading="eager"
      fetchpriority="high"
      width="1456"
      height="480"
    />
    <div class="absolute inset-0 bg-gradient-to-t from-[#151d25]/60 to-transparent"></div>
  </div>

  <!-- ── Card Stack ─────────────────────────────────────────────────────── -->
  <div class="bg-[#f0f2f4] section-padding">
    <div class="site-container max-w-[760px] mx-auto flex flex-col gap-8">

      <!-- Breadcrumb -->
      <nav class="flex items-center gap-2 text-[13px] text-[#567798]">
        <a href="/" class="hover:text-[#151d25] transition-colors">Home</a>
        <span>/</span>
        <a href="/events" class="hover:text-[#151d25] transition-colors">Events</a>
        <span>/</span>
        <span class="text-[#151d25] font-medium">{event.title}</span>
      </nav>

      <!-- ── Event Info Card ──────────────────────────────────────────── -->
      <div class="bg-white rounded-2xl border border-[#cdd8e3] p-8 shadow-sm reveal-item">
        <span class="inline-flex items-center bg-[#b05d45]/10 text-[#b05d45] text-[12px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-4">
          {event.event_type}
        </span>
        <h1 class="text-[#151d25] font-black tracking-tight leading-tight mb-5"
          style="font-size: clamp(1.6rem, 3vw, 2.4rem);">
          {event.title}
        </h1>

        <!-- Date, time, location -->
        <div class="flex flex-col gap-3 mb-6 text-[15px] text-[#567798]">
          <div class="flex items-start gap-3">
            <svg class="w-4 h-4 mt-0.5 shrink-0 text-[#b05d45]" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" stroke-width="2"/><line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" stroke-width="2"/></svg>
            <span>
              {formatEventDateFull(event.event_date)} at {formatTime(event.event_date)}
              {event.end_date && ` – ${formatTime(event.end_date)}`}
            </span>
          </div>
          <div class="flex items-start gap-3">
            <svg class="w-4 h-4 mt-0.5 shrink-0 text-[#b05d45]" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="10" r="3" stroke="currentColor" stroke-width="2"/></svg>
            <span>{event.location_name}<br class="hidden sm:block"/><span class="text-[#2c3e50]/60 text-[13px]">{event.address}</span></span>
          </div>
        </div>

        <p class="text-[#567798] text-[16px] leading-relaxed mb-8">{event.description}</p>

        <!-- CTAs -->
        <div class="flex flex-wrap gap-3">
          <a
            href={googleMapsDirectionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            class="btn-primary"
          >Get Directions</a>
          {event.website_url && (
            <a
              href={event.website_url}
              target="_blank"
              rel="noopener noreferrer"
              class="btn-secondary"
            >Event Website</a>
          )}
        </div>
      </div>

      <!-- ── Google Maps Embed ────────────────────────────────────────── -->
      <div class="rounded-2xl overflow-hidden shadow-sm border border-[#cdd8e3] reveal-item" style="aspect-ratio: 16/7;">
        <iframe
          title={`Map: ${event.location_name}`}
          width="100%"
          height="100%"
          style="border:0"
          loading="lazy"
          referrerpolicy="no-referrer-when-downgrade"
          src={`https://www.google.com/maps/embed/v1/place?key=${import.meta.env.PUBLIC_GOOGLE_MAPS_KEY ?? ""}&q=${encodeURIComponent(mapsQuery)}`}
        ></iframe>
      </div>

      <!-- ── In the Neighborhood ──────────────────────────────────────── -->
      {event.local_links && (event.local_links as Array<{label: string; url: string}>).length > 0 && (
        <div class="bg-white rounded-2xl border border-[#cdd8e3] p-8 shadow-sm reveal-item">
          <h2 class="text-[#151d25] text-[20px] font-black tracking-tight mb-2">In the Neighborhood</h2>
          <p class="text-[#567798] text-[14px] mb-6">Explore local spots near this event.</p>
          <ul class="flex flex-col gap-3">
            {(event.local_links as Array<{label: string; url: string}>).map(({ label, url }) => (
              <li>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="flex items-center gap-3 text-[#b05d45] font-medium hover:underline text-[15px]"
                >
                  <svg class="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><polyline points="15 3 21 3 21 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><line x1="10" y1="14" x2="21" y2="3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

    </div>
  </div>

  <Footer />
</Layout>

<script>
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("is-visible"); observer.unobserve(e.target); }
      });
    },
    { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
  );
  document.querySelectorAll(".reveal-item").forEach((el) => observer.observe(el));
</script>
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx astro check
```

Expected: 0 errors

- [ ] **Step 3: Verify 404 redirect**

```bash
npm run dev
```

Open `http://localhost:4321/events/does-not-exist` — should redirect to `/404`.

- [ ] **Step 4: Commit**

```bash
git add src/pages/events/[slug].astro
git commit -m "feat: add event detail page with map embed and local links"
```

---

### Task 3: Enhanced Press/Media Hub

**Files:**
- Modify: `src/pages/media-kit.astro`

This completely replaces the existing stub. All 6 sections from the spec: Hero → Stats → Boilerplate + Contact → Videos & Podcasts → In the News → Download Assets.

- [ ] **Step 1: Replace src/pages/media-kit.astro**

```astro
---
// src/pages/media-kit.astro
import Layout from "@/layouts/Layout.astro";
import Header from "@/components/Header.astro";
import Footer from "@/components/Footer.astro";
import { createAdminClient } from "@/lib/supabase";
import type { MediaItemRow, PressMentionRow } from "@/types/database";
import {
  BUSINESS_NAME,
  EMAIL,
  PHONE_DISPLAY,
  PHONE_RAW,
  JOBS_COMPLETED,
  YEARS_IN_BUSINESS,
  REVIEW_RATING,
  IS_LICENSED,
  ADDRESS_STATE,
  SITE_URL,
} from "@/config/site";

const supabase = createAdminClient();

// Fetch media items (ordered by sort_order, then published_date desc)
const { data: mediaData } = await supabase
  .from("media_items")
  .select("*")
  .order("sort_order", { ascending: true })
  .order("published_date", { ascending: false });

// Fetch press mentions (ordered by published_date desc)
const { data: pressData } = await supabase
  .from("press_mentions")
  .select("*")
  .order("published_date", { ascending: false });

// Fetch press-kit bucket assets
let bucketAssets: Array<{ name: string; url: string; ext: string }> = [];
try {
  const { data: files } = await supabase.storage
    .from("press-kit")
    .list("", { limit: 100, sortBy: { column: "name", order: "asc" } });
  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL as string;
  bucketAssets = (files ?? []).map((f) => ({
    name: f.name,
    url:  `${supabaseUrl}/storage/v1/object/public/press-kit/${f.name}`,
    ext:  f.name.split(".").pop()?.toUpperCase() ?? "FILE",
  }));
} catch { /* silently degrade */ }

const mediaItems   = (mediaData   ?? []) as MediaItemRow[];
const pressMentions = (pressData  ?? []) as PressMentionRow[];

// Stats: driven by site.ts (not a DB table per spec)
const stats = [
  { label: "Projects Completed", value: JOBS_COMPLETED },
  { label: "Years in Business",  value: YEARS_IN_BUSINESS },
  { label: "Average Rating",     value: `${REVIEW_RATING} ★` },
  { label: "Licensed in",        value: IS_LICENSED ? ADDRESS_STATE : "TX" },
];

// YouTube embed thumbnail helper
function youtubeThumbnail(url: string): string {
  const match = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return match ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : "/og-default.jpg";
}

function youtubeEmbedUrl(url: string): string {
  const match = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : url;
}
---

<Layout
  title={`Press & Media | ${BUSINESS_NAME}`}
  description={`Press coverage, media kit, videos, and brand assets for ${BUSINESS_NAME}. For interview requests and media inquiries, contact us directly.`}
>
  <Header />

  <!-- ── 1. Hero ─────────────────────────────────────────────────────────── -->
  <section class="relative bg-gradient-to-br from-[#151d25] to-[#2c3e50] section-padding overflow-hidden">
    <div class="absolute inset-0 opacity-5">
      <div class="absolute inset-0" style="background-image: repeating-linear-gradient(0deg, transparent, transparent 40px, white 40px, white 41px), repeating-linear-gradient(90deg, transparent, transparent 40px, white 40px, white 41px);"></div>
    </div>
    <div class="relative z-10 site-container text-center">
      <p class="section-label-light mb-4">Press & Media</p>
      <h1 class="text-white font-black tracking-tight leading-[1.05] mb-6" style="font-size: clamp(2rem, 4vw, 3.5rem);">
        Media Kit & Press Resources
      </h1>
      <p class="text-white/70 text-[17px] max-w-[520px] mx-auto leading-relaxed mb-8">
        Coverage, assets, and contact information for journalists and content creators.
      </p>
      <a href={`mailto:${EMAIL}`} class="btn-primary">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><polyline points="22,6 12,13 2,6" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        Contact Press Team
      </a>
    </div>
  </section>

  <!-- ── 2. Stats Row ───────────────────────────────────────────────────── -->
  <section class="bg-[#b05d45] section-padding-sm">
    <div class="site-container">
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
        {stats.map(({ label, value }) => (
          <div>
            <div class="text-white font-black text-[2.2rem] tracking-tight leading-none mb-2">{value}</div>
            <div class="text-white/70 text-[13px] font-medium uppercase tracking-widest">{label}</div>
          </div>
        ))}
      </div>
    </div>
  </section>

  <!-- ── 3. Boilerplate + Press Contact ─────────────────────────────────── -->
  <section class="bg-white section-padding">
    <div class="site-container">
      <div class="grid lg:grid-cols-2 gap-12 items-start reveal-item">
        <!-- Left: company boilerplate -->
        <div>
          <p class="section-label">About the Company</p>
          <h2 class="section-heading mb-4">Company Overview</h2>
          <div class="accent-divider"></div>
          <p class="text-[#567798] text-[16px] leading-relaxed mt-4">
            {BUSINESS_NAME} is a locally owned home repair and renovation company serving McKinney,
            Allen, Frisco, Prosper, and surrounding communities in North Texas. We specialize in
            drywall, painting, plumbing, electrical, carpentry, and outdoor restoration — with a
            reputation for honest pricing, same-week availability, and finished work our customers
            are proud to show their neighbors.
          </p>
        </div>
        <!-- Right: press contact -->
        <div class="bg-[#f0f2f4] rounded-2xl border border-[#cdd8e3] p-8">
          <h3 class="text-[#151d25] text-[18px] font-black tracking-tight mb-6">Press Contact</h3>
          <div class="flex flex-col gap-4">
            <div>
              <div class="text-[12px] text-[#567798] font-bold uppercase tracking-widest mb-1">Email</div>
              <a href={`mailto:${EMAIL}`} class="text-[#b05d45] font-medium hover:underline">{EMAIL}</a>
            </div>
            <div>
              <div class="text-[12px] text-[#567798] font-bold uppercase tracking-widest mb-1">Phone</div>
              <a href={`tel:${PHONE_RAW}`} class="text-[#b05d45] font-medium hover:underline">{PHONE_DISPLAY}</a>
            </div>
            <div class="pt-4 border-t border-[#cdd8e3]">
              <a href={`mailto:${EMAIL}?subject=Interview Request — ${BUSINESS_NAME}`} class="btn-primary w-full">
                Request Interview
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ── 4. Videos & Podcasts ───────────────────────────────────────────── -->
  {mediaItems.length > 0 && (
    <section class="bg-[#f0f2f4] section-padding">
      <div class="site-container">
        <div class="text-center section-header reveal-item">
          <p class="section-label">Watch & Listen</p>
          <h2 class="section-heading">Videos & Podcasts</h2>
          <div class="accent-divider-center"></div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-10">
          {mediaItems.map((item) => (
            <div class="card-base reveal-item">
              {item.type === "youtube" ? (
                <!-- YouTube: embed thumbnail with play overlay -->
                <div class="relative card-photo group cursor-pointer" data-youtube-embed={youtubeEmbedUrl(item.url)}>
                  <img
                    src={item.thumbnail_url || youtubeThumbnail(item.url)}
                    alt={item.title}
                    loading="lazy"
                    width="600"
                    height="338"
                    class="w-full h-full object-cover"
                  />
                  <div class="absolute inset-0 bg-[#151d25]/40 flex items-center justify-center group-hover:bg-[#151d25]/20 transition-colors">
                    <div class="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <svg class="w-6 h-6 text-[#b05d45] ml-1" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                    </div>
                  </div>
                </div>
              ) : (
                <!-- Podcast: cover art + title -->
                <div class="card-photo">
                  <img
                    src={item.thumbnail_url || "/og-default.jpg"}
                    alt={item.title}
                    loading="lazy"
                    width="600"
                    height="338"
                    class="w-full h-full object-cover"
                  />
                  <span class="absolute top-4 left-4 pill-chip-dark text-[11px] uppercase tracking-wider shadow-lg">Podcast</span>
                </div>
              )}
              <div class="card-body">
                <h3 class="text-[#151d25] text-[17px] font-black tracking-tight mb-2">{item.title}</h3>
                {item.description && <p class="text-[#567798] text-[14px] leading-relaxed mb-4">{item.description}</p>}
                {item.type === "podcast" && (
                  <a href={item.url} target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 text-[#b05d45] text-[13px] font-bold uppercase tracking-widest hover:gap-3 transition-all">
                    Listen
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )}

  <!-- ── 5. In the News ─────────────────────────────────────────────────── -->
  {pressMentions.length > 0 && (
    <section class="bg-white section-padding">
      <div class="site-container">
        <div class="text-center section-header reveal-item">
          <p class="section-label">Coverage</p>
          <h2 class="section-heading">In the News</h2>
          <div class="accent-divider-center"></div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-10">
          {pressMentions.map((mention) => (
            <a
              href={mention.url}
              target="_blank"
              rel="noopener noreferrer"
              class="card-base group reveal-item"
            >
              <div class="card-photo">
                <img
                  src={mention.image_url || "/og-default.jpg"}
                  alt={mention.headline}
                  loading="lazy"
                  width="600"
                  height="338"
                  class="w-full h-full object-cover"
                />
              </div>
              <div class="card-body">
                <div class="text-[12px] font-bold text-[#b05d45] uppercase tracking-widest mb-2">
                  {mention.publication}
                  {mention.published_date && (
                    <span class="text-[#567798] font-normal ml-2">
                      · {new Date(mention.published_date).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                    </span>
                  )}
                </div>
                <h3 class="text-[#151d25] text-[17px] font-black tracking-tight leading-snug mb-3">
                  {mention.headline}
                </h3>
                <p class="text-[#567798] text-[14px] leading-relaxed mb-4 line-clamp-3">
                  {mention.summary}
                </p>
                <span class="inline-flex items-center gap-2 text-[#b05d45] text-[13px] font-bold uppercase tracking-widest group-hover:gap-3 transition-all">
                  Read
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  )}

  <!-- ── 6. Download Assets ─────────────────────────────────────────────── -->
  <section class="bg-[#f0f2f4] section-padding">
    <div class="site-container">
      <div class="text-center section-header reveal-item">
        <p class="section-label">Brand Assets</p>
        <h2 class="section-heading">Download Kit</h2>
        <div class="accent-divider-center"></div>
        <p class="text-[#567798] text-[16px] mt-3 max-w-[480px] mx-auto">
          Logos, photos, and brand assets for press and partner use.
          For usage questions, <a href={`mailto:${EMAIL}`} class="text-[#b05d45] hover:underline">contact us</a>.
        </p>
      </div>

      <!-- Fixed category tiles -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-10 mb-8 reveal-item">
        {[
          { label: "Logo Files (SVG)",  filter: (n: string) => /\.(svg|ai|eps)$/i.test(n) },
          { label: "Photography",       filter: (n: string) => /\.(jpg|jpeg|png|webp)$/i.test(n) },
          { label: "Brand Guide (PDF)", filter: (n: string) => /\.pdf$/i.test(n) },
        ].map(({ label, filter }) => {
          const assets = bucketAssets.filter(a => filter(a.name));
          return (
            <div class="bg-white rounded-2xl border border-[#cdd8e3] p-6">
              <h3 class="text-[#151d25] font-black text-[16px] mb-4">{label}</h3>
              {assets.length === 0 ? (
                <p class="text-[#567798] text-[13px]">Coming soon.</p>
              ) : (
                <ul class="flex flex-col gap-2">
                  {assets.map(a => (
                    <li>
                      <a
                        href={a.url}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        class="flex items-center gap-3 text-[#b05d45] text-[14px] font-medium hover:underline"
                      >
                        <span class="w-8 h-8 shrink-0 flex items-center justify-center rounded bg-[#b05d45]/10 text-[10px] font-black text-[#b05d45]">{a.ext}</span>
                        {a.name}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      <!-- Full brand guidelines link -->
      <div class="text-center reveal-item">
        <a href="/brand" class="btn-navy">
          View Full Brand Guidelines →
        </a>
      </div>
    </div>
  </section>

  <Footer />
</Layout>

<script>
  // Scroll reveal
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("is-visible"); observer.unobserve(e.target); }
      });
    },
    { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
  );
  document.querySelectorAll(".reveal-item").forEach((el) => observer.observe(el));

  // YouTube inline embed swap
  document.querySelectorAll<HTMLElement>("[data-youtube-embed]").forEach((el) => {
    el.addEventListener("click", () => {
      const src = el.dataset.youtubeEmbed;
      if (!src) return;
      const iframe = document.createElement("iframe");
      iframe.src = `${src}?autoplay=1`;
      iframe.width = "100%";
      iframe.height = "100%";
      iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
      iframe.allowFullscreen = true;
      iframe.className = "absolute inset-0 w-full h-full";
      el.replaceWith(iframe);
    });
  });
</script>
```

- [ ] **Step 2: Verify dev server**

```bash
npm run dev
```

Open `http://localhost:4321/media-kit`. Verify:
- All 6 sections render without errors
- Stats row shows site.ts values
- Empty states render gracefully when no DB records
- `npx astro check` returns 0 errors

- [ ] **Step 3: Commit**

```bash
git add src/pages/media-kit.astro
git commit -m "feat: replace media-kit stub with full press/media hub (6 sections)"
```

---

### Task 4: Brand guidelines page

**Files:**
- Create: `src/pages/brand.astro`

Per spec: static page, no DB. Content hardcoded in Astro. Sticky left side nav (desktop), horizontal anchor bar (mobile).

- [ ] **Step 1: Create src/pages/brand.astro**

```astro
---
// src/pages/brand.astro
// Static — content is hardcoded per spec. Not database-driven.
import Layout from "@/layouts/Layout.astro";
import Header from "@/components/Header.astro";
import Footer from "@/components/Footer.astro";
import { BUSINESS_NAME, SITE_URL } from "@/config/site";

const sections = [
  { id: "logo-usage",          label: "Logo Usage" },
  { id: "color-palette",       label: "Color Palette" },
  { id: "typography",          label: "Typography" },
  { id: "voice-tone",          label: "Voice & Tone" },
  { id: "photography",         label: "Photography" },
  { id: "downloads",           label: "Downloads" },
];

const colors = [
  { name: "Ink",       hex: "#151d25", textClass: "text-white" },
  { name: "Terracotta", hex: "#b05d45", textClass: "text-white" },
  { name: "Navy",      hex: "#2c3e50", textClass: "text-white" },
  { name: "Steel",     hex: "#567798", textClass: "text-white" },
  { name: "Snow",      hex: "#f0f2f4", textClass: "text-[#151d25]" },
];

const colorPairings = [
  { bg: "#151d25", fg: "#f0f2f4", label: "Ink bg, Snow text",       ratio: "18:1" },
  { bg: "#b05d45", fg: "#ffffff", label: "Terracotta bg, White text", ratio: "4.7:1" },
  { bg: "#2c3e50", fg: "#ffffff", label: "Navy bg, White text",       ratio: "9:1" },
  { bg: "#f0f2f4", fg: "#151d25", label: "Snow bg, Ink text",         ratio: "16:1" },
];
---

<Layout
  title={`Brand Guidelines | ${BUSINESS_NAME}`}
  description={`Official brand guidelines for ${BUSINESS_NAME} — logo usage, color palette, typography, voice, and photography style.`}
  noindex={false}
>
  <Header />

  <!-- ── Page Hero ──────────────────────────────────────────────────────── -->
  <section class="bg-[#151d25] py-20">
    <div class="site-container">
      <p class="section-label-light">Internal Resource</p>
      <h1 class="text-white font-black tracking-tight leading-tight mb-4" style="font-size: clamp(2rem, 4vw, 3rem);">
        Brand Guidelines
      </h1>
      <p class="text-white/70 text-[17px] max-w-[540px]">
        Everything you need to represent {BUSINESS_NAME} consistently — from logo usage to the words we use.
      </p>
    </div>
  </section>

  <!-- ── Mobile: horizontal anchor bar ─────────────────────────────────── -->
  <nav class="lg:hidden sticky top-0 z-40 bg-white border-b border-[#cdd8e3] overflow-x-auto" aria-label="Brand sections">
    <div class="flex gap-0">
      {sections.map(({ id, label }) => (
        <a
          href={`#${id}`}
          class="shrink-0 px-4 py-3 text-[13px] font-semibold text-[#567798] hover:text-[#151d25] hover:bg-[#f0f2f4] transition-colors whitespace-nowrap border-b-2 border-transparent data-[active]:border-[#b05d45] data-[active]:text-[#151d25]"
          data-section={id}
        >
          {label}
        </a>
      ))}
    </div>
  </nav>

  <!-- ── Two-column layout: sticky nav (desktop) + content ──────────────── -->
  <div class="site-container py-16 lg:py-24 flex gap-16 items-start">

    <!-- Sticky side nav (desktop only) -->
    <nav class="hidden lg:block w-52 shrink-0 sticky top-28" aria-label="Brand sections">
      <p class="text-[11px] font-black uppercase tracking-widest text-[#567798] mb-4">Sections</p>
      <ul class="flex flex-col gap-1">
        {sections.map(({ id, label }) => (
          <li>
            <a
              href={`#${id}`}
              class="block px-3 py-2 rounded-lg text-[14px] font-medium text-[#567798] hover:text-[#151d25] hover:bg-[#f0f2f4] transition-colors"
              data-section={id}
            >
              {label}
            </a>
          </li>
        ))}
      </ul>
    </nav>

    <!-- Content sections -->
    <div class="flex-1 min-w-0 flex flex-col gap-20">

      <!-- ── Logo Usage ──────────────────────────────────────────────── -->
      <section id="logo-usage">
        <h2 class="section-heading mb-2">Logo Usage</h2>
        <div class="accent-divider mb-8"></div>

        <!-- Light / Dark variants -->
        <div class="grid sm:grid-cols-2 gap-6 mb-10">
          <div class="rounded-2xl bg-white border border-[#cdd8e3] p-8 flex items-center justify-center min-h-[160px]">
            <img src="/logo-horizontal-dark.webp" alt={`${BUSINESS_NAME} logo — dark version`} class="max-h-16 w-auto" />
          </div>
          <div class="rounded-2xl bg-[#151d25] p-8 flex items-center justify-center min-h-[160px]">
            <img src="/logo-horizontal-light.webp" alt={`${BUSINESS_NAME} logo — light version`} class="max-h-16 w-auto" />
          </div>
        </div>
        <p class="text-[#567798] text-[14px] mb-2"><strong class="text-[#151d25]">Light version:</strong> Use on dark or colored backgrounds (navy, terracotta, photos with dark overlays).</p>
        <p class="text-[#567798] text-[14px] mb-8"><strong class="text-[#151d25]">Dark version:</strong> Use on white or snow backgrounds.</p>

        <!-- Clear space -->
        <div class="bg-[#f0f2f4] rounded-2xl p-8 mb-8">
          <h3 class="text-[#151d25] font-black text-[16px] mb-3">Clear Space Rule</h3>
          <p class="text-[#567798] text-[14px] leading-relaxed">
            Maintain clear space equal to the height of the "H" letterform on all four sides of the logo. Never crowd the logo with text, icons, or graphic elements.
          </p>
        </div>

        <!-- Don'ts grid -->
        <h3 class="text-[#151d25] font-black text-[16px] mb-4">Logo Don'ts</h3>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            "Stretch or distort",
            "Recolor the wordmark",
            "Add drop shadows or effects",
            "Rotate at any angle",
            "Place on busy backgrounds",
            "Use low-resolution versions",
          ].map((rule) => (
            <div class="flex items-center gap-3 bg-[#fef2f2] border border-[#fecaca] rounded-xl p-4 text-[13px] text-[#991b1b]">
              <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
              {rule}
            </div>
          ))}
        </div>
      </section>

      <!-- ── Color Palette ───────────────────────────────────────────── -->
      <section id="color-palette">
        <h2 class="section-heading mb-2">Color Palette</h2>
        <div class="accent-divider mb-8"></div>

        <!-- Swatches -->
        <div class="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-10">
          {colors.map(({ name, hex, textClass }) => (
            <div class="rounded-2xl overflow-hidden border border-[#cdd8e3]">
              <div class="h-24" style={`background: ${hex};`}></div>
              <div class="bg-white p-3">
                <p class="text-[#151d25] font-bold text-[13px]">{name}</p>
                <p class="text-[#567798] text-[12px] font-mono">{hex}</p>
              </div>
            </div>
          ))}
        </div>

        <!-- Accessible pairings -->
        <h3 class="text-[#151d25] font-black text-[16px] mb-4">Accessible Pairings</h3>
        <div class="flex flex-col gap-3">
          {colorPairings.map(({ bg, fg, label, ratio }) => (
            <div class="flex items-center gap-4 rounded-xl border border-[#cdd8e3] overflow-hidden">
              <div class="w-24 h-14 shrink-0 flex items-center justify-center font-bold text-[14px]" style={`background: ${bg}; color: ${fg};`}>Aa</div>
              <div class="flex-1 text-[14px] text-[#567798]">{label}</div>
              <div class="pr-4 text-[13px] font-mono text-[#22c55e] font-bold shrink-0">✓ {ratio}</div>
            </div>
          ))}
        </div>
      </section>

      <!-- ── Typography ──────────────────────────────────────────────── -->
      <section id="typography">
        <h2 class="section-heading mb-2">Typography</h2>
        <div class="accent-divider mb-8"></div>

        <div class="flex flex-col gap-8">
          <!-- Syne -->
          <div class="bg-[#f0f2f4] rounded-2xl p-8">
            <div class="flex items-start justify-between mb-4">
              <div>
                <p class="text-[#b05d45] text-[12px] font-bold uppercase tracking-widest mb-1">Display / Headings</p>
                <p class="text-[#151d25] font-black text-[32px] leading-none" style="font-family: var(--font-display, 'Syne', sans-serif);">Syne</p>
              </div>
              <span class="text-[#567798] text-[13px]">700, 900</span>
            </div>
            <p class="text-[#567798] text-[14px]">Used for: all headings (H1–H4), navigation, CTAs, badge labels, hero text.</p>
          </div>

          <!-- DM Mono -->
          <div class="bg-[#f0f2f4] rounded-2xl p-8">
            <div class="flex items-start justify-between mb-4">
              <div>
                <p class="text-[#b05d45] text-[12px] font-bold uppercase tracking-widest mb-1">Numbers / Data</p>
                <p class="text-[#151d25] font-medium text-[32px] leading-none font-mono">DM Mono</p>
              </div>
              <span class="text-[#567798] text-[13px]">400</span>
            </div>
            <p class="text-[#567798] text-[14px]">Used for: stat numbers, review counts, code snippets, pricing, telephone numbers displayed as data.</p>
          </div>

          <!-- DM Sans -->
          <div class="bg-[#f0f2f4] rounded-2xl p-8">
            <div class="flex items-start justify-between mb-4">
              <div>
                <p class="text-[#b05d45] text-[12px] font-bold uppercase tracking-widest mb-1">Body / UI</p>
                <p class="text-[#151d25] text-[32px] leading-none">DM Sans</p>
              </div>
              <span class="text-[#567798] text-[13px]">400, 600</span>
            </div>
            <p class="text-[#567798] text-[14px]">Used for: all body text, form labels, captions, meta descriptions, UI copy.</p>
          </div>
        </div>

        <!-- Type scale -->
        <div class="mt-8 bg-white border border-[#cdd8e3] rounded-2xl p-8">
          <h3 class="text-[#151d25] font-black text-[16px] mb-6">Type Scale</h3>
          <div class="flex flex-col gap-4">
            {[
              { tag: "H1", size: "clamp(2rem, 4vw, 3.5rem)", weight: "900" },
              { tag: "H2", size: "clamp(1.6rem, 3vw, 2.5rem)", weight: "900" },
              { tag: "H3", size: "clamp(1.25rem, 2vw, 1.75rem)", weight: "800" },
              { tag: "H4", size: "1.125rem", weight: "700" },
              { tag: "Body", size: "1.0625rem (17px)", weight: "400" },
              { tag: "Caption", size: "0.8125rem (13px)", weight: "400" },
            ].map(({ tag, size, weight }) => (
              <div class="flex items-baseline gap-4 py-2 border-b border-[#f0f2f4] last:border-0">
                <span class="w-16 shrink-0 text-[#567798] text-[12px] font-mono font-bold">{tag}</span>
                <span class="text-[#151d25] flex-1 truncate" style={`font-size: min(${size.split(" ")[0].replace("clamp(", "").split(",")[0]}, 2rem); font-weight: ${weight};`}>
                  The quick brown fox
                </span>
                <span class="text-[#567798] text-[12px] shrink-0">{size}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <!-- ── Voice & Tone ────────────────────────────────────────────── -->
      <section id="voice-tone">
        <h2 class="section-heading mb-2">Voice & Tone</h2>
        <div class="accent-divider mb-8"></div>

        <div class="grid sm:grid-cols-2 gap-8 mb-10">
          <!-- We Are -->
          <div class="bg-[#f0fdf4] border border-[#bbf7d0] rounded-2xl p-8">
            <h3 class="text-[#166534] font-black text-[16px] mb-4">We Are</h3>
            <ul class="flex flex-col gap-3">
              {["Direct — say what we mean, no filler", "Honest — prices upfront, no surprises", "Neighborly — we know this area and show it", "Specific — real numbers, real projects, real results", "Earned — confident without overpromising"].map((trait) => (
                <li class="flex items-start gap-2 text-[#166534] text-[14px]">
                  <svg class="w-4 h-4 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true"><polyline points="20 6 9 17 4 12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  {trait}
                </li>
              ))}
            </ul>
          </div>
          <!-- We're Not -->
          <div class="bg-[#fef2f2] border border-[#fecaca] rounded-2xl p-8">
            <h3 class="text-[#991b1b] font-black text-[16px] mb-4">We're Not</h3>
            <ul class="flex flex-col gap-3">
              {["Corporate — no jargon, no suits-speak", "Salesy — we don't push, we earn trust", "Vague — no 'quality craftsmanship' without proof", "Overpromising — we deliver what we say", "Jargon-heavy — homeowners shouldn't need a dictionary"].map((trait) => (
                <li class="flex items-start gap-2 text-[#991b1b] text-[14px]">
                  <svg class="w-4 h-4 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                  {trait}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <!-- Before/After copy examples -->
        <h3 class="text-[#151d25] font-black text-[16px] mb-4">Copy Examples</h3>
        <div class="flex flex-col gap-6">
          {[
            {
              scenario: "Project description",
              wrong: "Quality drywall services delivered with passion and excellence.",
              right: "Water-damaged drywall in the master bedroom — cut out, replaced, and textured to match. Done in one day.",
            },
            {
              scenario: "Estimate CTA",
              wrong: "Contact us today for a free, no-obligation consultation with our experienced team!",
              right: "Get a free estimate — we'll respond same day.",
            },
            {
              scenario: "Review response",
              wrong: "Thank you for your kind words! We truly appreciate your business and look forward to serving you again!",
              right: "Glad the drywall came out right. Thanks for the kind words — let us know when you need us.",
            },
          ].map(({ scenario, wrong, right }) => (
            <div class="border border-[#cdd8e3] rounded-2xl overflow-hidden">
              <div class="bg-[#f0f2f4] px-6 py-3 border-b border-[#cdd8e3]">
                <span class="text-[#151d25] text-[13px] font-black uppercase tracking-widest">{scenario}</span>
              </div>
              <div class="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-[#cdd8e3]">
                <div class="p-6 bg-[#fef2f2]">
                  <p class="text-[#991b1b] text-[11px] font-bold uppercase tracking-widest mb-2">❌ Don't</p>
                  <p class="text-[#7f1d1d] text-[14px] italic">"{wrong}"</p>
                </div>
                <div class="p-6 bg-[#f0fdf4]">
                  <p class="text-[#166534] text-[11px] font-bold uppercase tracking-widest mb-2">✓ Do</p>
                  <p class="text-[#14532d] text-[14px]">"{right}"</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <!-- ── Photography Style ───────────────────────────────────────── -->
      <section id="photography">
        <h2 class="section-heading mb-2">Photography Style</h2>
        <div class="accent-divider mb-8"></div>

        <div class="grid sm:grid-cols-2 gap-8 mb-8">
          <div class="bg-[#f0fdf4] border border-[#bbf7d0] rounded-2xl p-8">
            <h3 class="text-[#166534] font-black text-[16px] mb-4">Subject Guidelines</h3>
            <ul class="flex flex-col gap-3 text-[#166534] text-[14px]">
              {[
                "Real work, real homes — no stock photography",
                "Natural light preferred; supplement with fill when needed",
                "Consistent framing: same angle and distance for before/after",
                "Show the full scope — wide shots + detail shots",
                "Clean, uncluttered background where possible",
              ].map((rule) => (
                <li class="flex items-start gap-2">
                  <svg class="w-4 h-4 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true"><polyline points="20 6 9 17 4 12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  {rule}
                </li>
              ))}
            </ul>
          </div>

          <div class="bg-[#fef2f2] border border-[#fecaca] rounded-2xl p-8">
            <h3 class="text-[#991b1b] font-black text-[16px] mb-4">What to Avoid</h3>
            <ul class="flex flex-col gap-3 text-[#991b1b] text-[14px]">
              {[
                "Stock photos of tools, workers, or homes",
                "Heavy editing — no HDR, vignette, or oversaturation",
                "Inconsistent framing between before/after pairs",
                "Cluttered backgrounds that distract from the work",
                "Low-resolution or blurry images",
              ].map((rule) => (
                <li class="flex items-start gap-2">
                  <svg class="w-4 h-4 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                  {rule}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div class="bg-[#f0f2f4] rounded-2xl p-6 border border-[#cdd8e3]">
          <h3 class="text-[#151d25] font-black text-[15px] mb-2">Filter & Treatment Style</h3>
          <p class="text-[#567798] text-[14px] leading-relaxed">
            Apply natural tones with mild contrast enhancement only. Avoid heavy vignettes, color grading, or Instagram-style filters. The goal is accurate representation of the finished work.
          </p>
        </div>
      </section>

      <!-- ── Downloads ───────────────────────────────────────────────── -->
      <section id="downloads">
        <h2 class="section-heading mb-2">Downloads</h2>
        <div class="accent-divider mb-8"></div>
        <div class="flex flex-col gap-4">
          <a href="/media-kit" class="flex items-center gap-4 p-5 bg-white border border-[#cdd8e3] rounded-xl hover:border-[#b05d45] hover:shadow-md transition-all group">
            <div class="w-12 h-12 rounded-lg bg-[#b05d45]/10 flex items-center justify-center shrink-0 group-hover:bg-[#b05d45]/20 transition-colors">
              <svg class="w-5 h-5 text-[#b05d45]" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><polyline points="7 10 12 15 17 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
            </div>
            <div>
              <p class="text-[#151d25] font-bold text-[15px]">Full Media Kit & Asset Library</p>
              <p class="text-[#567798] text-[13px]">Logos, photography, and all downloadable brand assets</p>
            </div>
            <svg class="w-4 h-4 text-[#b05d45] ml-auto" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </a>
        </div>
      </section>

    </div>
  </div>

  <Footer />
</Layout>

<script>
  // ── Active section highlight in side/top nav ──────────────────────────
  const navLinks = document.querySelectorAll<HTMLAnchorElement>("[data-section]");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          navLinks.forEach((link) => {
            const active = link.dataset.section === entry.target.id;
            link.classList.toggle("text-[#151d25]", active);
            link.classList.toggle("bg-[#f0f2f4]", active);
            link.dataset.active = active ? "true" : undefined;
          });
        }
      });
    },
    { threshold: 0.3 }
  );

  document.querySelectorAll("section[id]").forEach((s) => observer.observe(s));
</script>
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx astro check
```

Expected: 0 errors

- [ ] **Step 3: Verify dev server**

```bash
npm run dev
```

Open `http://localhost:4321/brand`. Verify:
- All 6 sections render
- Desktop: sticky side nav visible, highlights change on scroll
- Mobile: horizontal anchor bar visible at top

- [ ] **Step 4: Commit**

```bash
git add src/pages/brand.astro
git commit -m "feat: add static brand guidelines page with 6 sections and sticky nav"
```

---

## Self-Review

**Spec coverage:**
- ✅ Events hub: split hero (next event + Google Maps), month-grouped 3-column grid, past events collapsed
- ✅ Events hub: next event card gets terracotta border highlight
- ✅ Events hub: "Check back soon" message when no upcoming events
- ✅ Event detail: card stack — photo → info card → Google Maps embed → local links
- ✅ Event detail: `google_place_id` takes precedence over address for Maps embed
- ✅ Event detail: `local_links` rendered with `target="_blank" rel="noopener noreferrer"`
- ✅ Event detail: Event schema markup included
- ✅ Media kit: all 6 sections in editorial-first order
- ✅ Media kit: stats row driven by site.ts (not DB)
- ✅ Media kit: YouTube inline embed swap on click
- ✅ Media kit: podcast items show cover art + listen link
- ✅ Media kit: press mention cards with OG image or placeholder fallback
- ✅ Media kit: download section with three category tiles
- ✅ Brand: Logo usage with light/dark variants, clear space rule, don'ts grid
- ✅ Brand: Color palette with 5 swatches + accessible pairing examples with contrast ratios
- ✅ Brand: Typography with 3 typefaces + type scale
- ✅ Brand: Voice & Tone with we-are/we're-not lists + 3 before/after copy examples
- ✅ Brand: Photography guidelines + filter style
- ✅ Brand: Downloads section linking to media-kit
- ✅ Brand: Sticky left nav (desktop), horizontal anchor bar (mobile)
- ✅ Brand: Page is static (no DB queries)

**Not in this plan:**
- Admin interface for adding events/press/media → Plan 3
- `PUBLIC_GOOGLE_MAPS_KEY` env var must be added to actual `.env` for maps to work
