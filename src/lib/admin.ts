// src/lib/admin.ts
// Admin UI helpers: publish readiness validation + scoring.

export interface ReadinessResult {
  filled:     number;
  total:      number;
  percent:    number;
  missing:    string[];
  canPublish: boolean;
}

export function wordCount(text: string): number {
  return text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
}

// ── Projects ──────────────────────────────────────────────────────────────────

type ProjectFields = {
  title?: string;
  category?: string;
  neighborhood?: string;
  location?: string;
  community?: string;
  duration?: string;
  scope?: string;
  summary?: string;
  before_label?: string;
  after_label?: string;
  before_photo_url?: string;
  after_photo_url?: string;
  overview?: string;
  challenge?: string;
  result?: string;
  scope_items?: string[];
};

const PROJECT_REQUIRED: Array<[keyof ProjectFields, string, (v: ProjectFields) => boolean]> = [
  ["title",           "Title",                    (v) => !!v.title?.trim()],
  ["category",        "Category",                 (v) => !!v.category?.trim()],
  ["neighborhood",    "Neighborhood",             (v) => !!v.neighborhood?.trim()],
  ["location",        "Location",                 (v) => !!v.location?.trim()],
  ["community",       "Community",                (v) => !!v.community?.trim()],
  ["duration",        "Duration",                 (v) => !!v.duration?.trim()],
  ["scope",           "Scope",                    (v) => !!v.scope?.trim()],
  ["summary",         "Summary",                  (v) => !!v.summary?.trim()],
  ["before_label",    "Before Label",             (v) => !!v.before_label?.trim()],
  ["after_label",     "After Label",              (v) => !!v.after_label?.trim()],
  ["before_photo_url","Before Photo",             (v) => !!v.before_photo_url?.trim()],
  ["after_photo_url", "After Photo",              (v) => !!v.after_photo_url?.trim()],
  ["overview",        "Overview",                 (v) => !!v.overview?.trim()],
  ["challenge",       "Challenge",                (v) => !!v.challenge?.trim()],
  ["result",          "Result",                   (v) => !!v.result?.trim()],
  ["scope_items",     "Scope Items (at least 1)", (v) => (v.scope_items?.length ?? 0) >= 1],
];

export function getProjectReadiness(values: ProjectFields): ReadinessResult {
  const missing: string[] = [];
  let filled = 0;
  for (const [, label, check] of PROJECT_REQUIRED) {
    if (check(values)) { filled++; } else { missing.push(label); }
  }
  const total = PROJECT_REQUIRED.length;
  return {
    filled,
    total,
    percent:    Math.round((filled / total) * 100),
    missing,
    canPublish: missing.length === 0,
  };
}

// ── Events ────────────────────────────────────────────────────────────────────

type EventFields = {
  title?: string;
  event_type?: string;
  event_date?: string;
  location_name?: string;
  address?: string;
  description?: string;
  image_url?: string;
};

const EVENT_REQUIRED: Array<[keyof EventFields, string, (v: EventFields) => boolean]> = [
  ["title",         "Title",         (v) => !!v.title?.trim()],
  ["event_type",    "Event Type",    (v) => !!v.event_type?.trim()],
  ["event_date",    "Event Date",    (v) => !!v.event_date?.trim()],
  ["location_name", "Location Name", (v) => !!v.location_name?.trim()],
  ["address",       "Address",       (v) => !!v.address?.trim()],
  ["description",   "Description",   (v) => !!v.description?.trim()],
  ["image_url",     "Event Photo",   (v) => !!v.image_url?.trim()],
];

export function getEventReadiness(values: EventFields): ReadinessResult {
  const missing: string[] = [];
  let filled = 0;
  for (const [, label, check] of EVENT_REQUIRED) {
    if (check(values)) { filled++; } else { missing.push(label); }
  }
  const total = EVENT_REQUIRED.length;
  return {
    filled,
    total,
    percent:    Math.round((filled / total) * 100),
    missing,
    canPublish: missing.length === 0,
  };
}

// ── Press Mentions ────────────────────────────────────────────────────────────

type PressMentionFields = {
  url?: string;
  headline?: string;
  publication?: string;
  summary?: string;
};

export function getPressMentionReadiness(values: PressMentionFields): ReadinessResult {
  const checks: Array<[string, boolean]> = [
    ["URL",                        !!values.url?.trim()],
    ["Headline",                   !!values.headline?.trim()],
    ["Publication",                !!values.publication?.trim()],
    ["Summary (20–200 words required)", (() => {
      const wc = wordCount(values.summary ?? "");
      return wc >= 20 && wc <= 200;
    })()],
  ];
  const missing = checks.filter(([, ok]) => !ok).map(([label]) => label);
  const filled  = checks.filter(([, ok]) => ok).length;
  const total   = checks.length;
  return {
    filled,
    total,
    percent:    Math.round((filled / total) * 100),
    missing,
    canPublish: missing.length === 0,
  };
}
