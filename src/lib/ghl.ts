/**
 * GoHighLevel API v2 — Utility wrapper
 *
 * Base URL : https://services.leadconnectorhq.com
 * Auth     : Bearer token in Authorization header
 * Version  : "2021-07-28" header required on every request
 * Rate limit: 100 req / 10 s burst · 200 k req / day
 *             Headers: X-RateLimit-Remaining, X-RateLimit-Interval-Milliseconds
 */

// ─── Constants ────────────────────────────────────────────────────────────────

const GHL_BASE_URL = "https://services.leadconnectorhq.com";
const GHL_VERSION  = "2021-07-28";

/** Max retries on 429 / transient errors */
const MAX_RETRIES   = 4;
/** Base delay (ms) for exponential backoff — doubles each attempt */
const BASE_DELAY_MS = 250;

// ─── TypeScript Interfaces ────────────────────────────────────────────────────

export interface GHLErrorResponse {
  statusCode: number;
  message:    string | string[];
  error?:     string;
}

export interface GHLRateLimitHeaders {
  limitDaily:          number | null;
  dailyRemaining:      number | null;
  intervalMs:          number | null;
  max:                 number | null;
  remaining:           number | null;
}

// Location ────────────────────────────────────────────────────────────────────

export interface GHLLocationBusiness {
  name:       string;
  address:    string;
  city:       string;
  state:      string;
  country:    string;
  postalCode: string;
  website:    string;
  timezone:   string;
  logoUrl:    string;
}

export interface GHLLocationSocial {
  facebookUrl?:    string;
  googlePlus?:     string;
  linkedIn?:       string;
  foursquare?:     string;
  twitter?:        string;
  yelp?:           string;
  instagram?:      string;
  youtube?:        string;
  pinterest?:      string;
  blogRss?:        string;
  googlePlacesId?: string;
}

export interface GHLLocationSettings {
  allowDuplicateContact:     boolean;
  allowDuplicateOpportunity: boolean;
  allowFacebookNameMerge:    boolean;
  disableContactTimezone:    boolean;
}

export interface GHLLocation {
  id:          string;
  companyId:   string;
  name:        string;
  domain?:     string;
  address?:    string;
  city?:       string;
  state?:      string;
  logoUrl?:    string;
  country?:    string;
  postalCode?: string;
  website?:    string;
  timezone?:   string;
  firstName?:  string;
  lastName?:   string;
  email?:      string;
  phone?:      string;
  business?:   GHLLocationBusiness;
  social?:     GHLLocationSocial;
  settings?:   GHLLocationSettings;
}

export interface GHLGetLocationResponse {
  location: GHLLocation;
}

// Custom Values ───────────────────────────────────────────────────────────────

export interface GHLCustomValue {
  id:         string;
  name:       string;
  fieldKey:   string;
  value:      string;
  locationId: string;
}

export interface GHLGetCustomValuesResponse {
  customValues: GHLCustomValue[];
}

// Contacts ────────────────────────────────────────────────────────────────────

export interface GHLContactCustomField {
  id:    string;
  value: string;
}

export interface GHLContactAttribution {
  url:        string;
  campaign?:  string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmContent?: string | null;
  referrer?:  string | null;
  campaignId?: string | null;
  fbclid?:    string | null;
  gclid?:     string | null;
}

export interface GHLDndChannelSetting {
  status:  "active" | "inactive" | "permanent";
  message: string;
  code:    string;
}

export interface GHLContactDndSettings {
  Call?:     GHLDndChannelSetting;
  Email?:    GHLDndChannelSetting;
  SMS?:      GHLDndChannelSetting;
  WhatsApp?: GHLDndChannelSetting;
  GMB?:      GHLDndChannelSetting;
  FB?:       GHLDndChannelSetting;
}

export interface GHLContact {
  id:                  string;
  locationId:          string;
  email?:              string;
  phone?:              string;
  firstName?:          string;
  lastName?:           string;
  firstNameLowerCase?: string;
  lastNameLowerCase?:  string;
  companyName?:        string;
  businessName?:       string;
  address?:            string;
  city?:               string;
  state?:              string;
  country?:            string;
  postalCode?:         string;
  timezone?:           string;
  source?:             string;
  type?:               string;
  dateAdded?:          string;
  dateUpdated?:        string;
  dateOfBirth?:        string;
  dnd?:                boolean;
  dndSettings?:        GHLContactDndSettings;
  tags?:               string[];
  customFields?:       GHLContactCustomField[];
  additionalEmails?:   string[];
  additionalPhones?:   string[];
  assignedTo?:         string;
  followers?:          string[];
  validEmail?:         boolean;
  businessId?:         string;
  attributions?:       GHLContactAttribution[];
}

export interface GHLGetContactsParams {
  query?:        string;
  limit?:        number;
  startAfterId?: string;
  startAfter?:   number;
}

export interface GHLGetContactsResponse {
  contacts: GHLContact[];
  count:    number;
}

// Opportunities ───────────────────────────────────────────────────────────────

export interface GHLOpportunityContact {
  id:          string;
  name:        string;
  companyName: string;
  email:       string;
  phone:       string;
  tags:        string[];
}

export interface GHLOpportunityCustomField {
  id:         string;
  fieldValue: unknown;
}

export interface GHLOpportunity {
  id:                 string;
  name:               string;
  monetaryValue?:     number;
  pipelineId:         string;
  pipelineStageId:    string;
  assignedTo?:        string;
  status:             "open" | "won" | "lost" | "abandoned";
  source?:            string;
  lastStatusChangeAt?: string;
  lastStageChangeAt?:  string;
  lastActionDate?:     string;
  createdAt:          string;
  updatedAt:          string;
  contactId:          string;
  locationId:         string;
  contact?:           GHLOpportunityContact;
  notes?:             string[];
  tasks?:             string[];
  calendarEvents?:    string[];
  customFields?:      GHLOpportunityCustomField[];
  followers?:         unknown[][];
}

export interface GHLOpportunitiesMeta {
  total:        number;
  nextPageUrl?: string;
  startAfterId?: string;
  startAfter?:  number;
  currentPage:  number;
  nextPage?:    number;
  prevPage?:    number;
}

export interface GHLGetOpportunitiesParams {
  q?:                 string;
  pipeline_id?:       string;
  pipeline_stage_id?: string;
  contact_id?:        string;
  status?:            "open" | "won" | "lost" | "abandoned" | "all";
  assigned_to?:       string;
  order?:             string;
  startAfterId?:      string;
  startAfter?:        string;
  page?:              number;
  limit?:             number;
  getTasks?:          boolean;
  getNotes?:          boolean;
  getCalendarEvents?: boolean;
}

export interface GHLGetOpportunitiesResponse {
  opportunities: GHLOpportunity[];
  meta:          GHLOpportunitiesMeta;
  aggregations?: Record<string, unknown>;
}

// ─── GHL Error class ─────────────────────────────────────────────────────────

export class GHLApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly ghlMessage: string | string[],
    public readonly endpoint: string,
    public readonly rateLimitHeaders?: GHLRateLimitHeaders,
  ) {
    const msg = Array.isArray(ghlMessage) ? ghlMessage.join(", ") : ghlMessage;
    super(`GHL API ${statusCode} on ${endpoint}: ${msg}`);
    this.name = "GHLApiError";
  }
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function parseRateLimitHeaders(headers: Headers): GHLRateLimitHeaders {
  const get = (key: string) => {
    const val = headers.get(key);
    return val !== null ? Number(val) : null;
  };
  return {
    limitDaily:     get("X-RateLimit-Limit-Daily"),
    dailyRemaining: get("X-RateLimit-Daily-Remaining"),
    intervalMs:     get("X-RateLimit-Interval-Milliseconds"),
    max:            get("X-RateLimit-Max"),
    remaining:      get("X-RateLimit-Remaining"),
  };
}

/** Resolves after `ms` milliseconds. */
const sleep = (ms: number) => new Promise<void>((res) => setTimeout(res, ms));

/**
 * Calculates the next backoff delay using full-jitter exponential backoff.
 * Caps at 30 seconds.
 */
function backoffDelay(attempt: number): number {
  const cap     = 30_000;
  const base    = BASE_DELAY_MS * Math.pow(2, attempt);
  const capped  = Math.min(cap, base);
  return Math.random() * capped;           // full jitter
}

// ─── GHL Client factory ───────────────────────────────────────────────────────

export interface GHLClientOptions {
  /** GHL Private Integration Token or OAuth access token */
  apiKey:     string;
  /** Default location ID to use when none is passed per-call */
  locationId?: string;
}

export interface GHLClient {
  getLocation(locationId?: string):                                            Promise<GHLLocation>;
  getCustomValues(locationId?: string):                                        Promise<GHLCustomValue[]>;
  getContacts(params?: GHLGetContactsParams, locationId?: string):             Promise<GHLGetContactsResponse>;
  getOpportunities(params?: GHLGetOpportunitiesParams, locationId?: string):   Promise<GHLGetOpportunitiesResponse>;
}

export function createGHLClient(options: GHLClientOptions): GHLClient {
  const { apiKey } = options;

  // ── Core fetch wrapper ─────────────────────────────────────────────────────

  async function ghlFetch<T>(
    path: string,
    query?: Record<string, string | number | boolean | undefined>,
    attempt = 0,
  ): Promise<T> {
    // Build URL with query params (skip undefined values)
    const url = new URL(`${GHL_BASE_URL}${path}`);
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Version":       GHL_VERSION,
        "Content-Type":  "application/json",
        "Accept":        "application/json",
      },
    });

    const rl = parseRateLimitHeaders(response.headers);

    // ── Rate limited (429) ─────────────────────────────────────────────────
    if (response.status === 429) {
      if (attempt >= MAX_RETRIES) {
        throw new GHLApiError(429, "Rate limit exceeded — max retries reached", path, rl);
      }

      // Use the interval window from GHL headers when available, else exponential backoff
      const waitMs = rl.intervalMs ?? backoffDelay(attempt);
      console.warn(
        `[GHL] 429 rate limited on ${path}. ` +
        `Remaining: ${rl.remaining}. Retrying in ${Math.round(waitMs)}ms ` +
        `(attempt ${attempt + 1}/${MAX_RETRIES})`,
      );
      await sleep(waitMs);
      return ghlFetch<T>(path, query, attempt + 1);
    }

    // ── Server errors (5xx) — retry with backoff ───────────────────────────
    if (response.status >= 500 && response.status < 600) {
      if (attempt >= MAX_RETRIES) {
        throw new GHLApiError(response.status, `Server error — max retries reached`, path, rl);
      }
      const waitMs = backoffDelay(attempt);
      console.warn(`[GHL] ${response.status} server error on ${path}. Retrying in ${Math.round(waitMs)}ms`);
      await sleep(waitMs);
      return ghlFetch<T>(path, query, attempt + 1);
    }

    // ── Client errors (4xx) — fail immediately ────────────────────────────
    if (!response.ok) {
      let errBody: GHLErrorResponse;
      try {
        errBody = (await response.json()) as GHLErrorResponse;
      } catch {
        errBody = { statusCode: response.status, message: response.statusText };
      }
      throw new GHLApiError(
        response.status,
        errBody.message,
        path,
        rl,
      );
    }

    // ── Log remaining quota at trace level if running low ─────────────────
    if (rl.remaining !== null && rl.remaining < 10) {
      console.warn(`[GHL] Low burst quota — only ${rl.remaining} requests remaining in current window`);
    }

    return response.json() as Promise<T>;
  }

  // ── Resolve locationId with fallback to options ────────────────────────────

  function resolveLocationId(override?: string): string {
    const id = override ?? options.locationId;
    if (!id) {
      throw new Error(
        "[GHL] locationId is required. Pass it per-call or set it in createGHLClient options.",
      );
    }
    return id;
  }

  // ─── Public API ─────────────────────────────────────────────────────────────

  /**
   * Fetch full details for a GHL Location.
   * Scope: locations.readonly
   */
  async function getLocation(locationId?: string): Promise<GHLLocation> {
    const id  = resolveLocationId(locationId);
    const res = await ghlFetch<GHLGetLocationResponse>(`/locations/${id}`);
    return res.location;
  }

  /**
   * Fetch all Custom Values for a Location.
   * Scope: locations/customValues.readonly
   */
  async function getCustomValues(locationId?: string): Promise<GHLCustomValue[]> {
    const id  = resolveLocationId(locationId);
    const res = await ghlFetch<GHLGetCustomValuesResponse>(`/locations/${id}/customValues`);
    return res.customValues;
  }

  /**
   * Fetch a paginated list of Contacts for a Location.
   * Scope: contacts.readonly
   *
   * Note: list endpoint returns a subset of contact fields.
   * Use the individual contact endpoint for the full shape.
   */
  async function getContacts(
    params: GHLGetContactsParams = {},
    locationId?: string,
  ): Promise<GHLGetContactsResponse> {
    const id = resolveLocationId(locationId);
    return ghlFetch<GHLGetContactsResponse>("/contacts/", {
      locationId:   id,
      limit:        params.limit        ?? 20,
      query:        params.query,
      startAfterId: params.startAfterId,
      startAfter:   params.startAfter,
    });
  }

  /**
   * Search Opportunities for a Location.
   * Scope: opportunities.readonly
   */
  async function getOpportunities(
    params: GHLGetOpportunitiesParams = {},
    locationId?: string,
  ): Promise<GHLGetOpportunitiesResponse> {
    const id = resolveLocationId(locationId);
    return ghlFetch<GHLGetOpportunitiesResponse>("/opportunities/search", {
      location_id:        id,
      limit:              params.limit              ?? 20,
      page:               params.page,
      q:                  params.q,
      pipeline_id:        params.pipeline_id,
      pipeline_stage_id:  params.pipeline_stage_id,
      contact_id:         params.contact_id,
      status:             params.status,
      assigned_to:        params.assigned_to,
      order:              params.order,
      startAfterId:       params.startAfterId,
      startAfter:         params.startAfter,
      getTasks:           params.getTasks,
      getNotes:           params.getNotes,
      getCalendarEvents:  params.getCalendarEvents,
    });
  }

  return { getLocation, getCustomValues, getContacts, getOpportunities };
}

// ─── Default singleton (reads from env) ──────────────────────────────────────

/**
 * Pre-configured GHL client that reads credentials from environment variables.
 *
 * Required env vars:
 *   GHL_API_KEY     — Private Integration Token or OAuth access token
 *   GHL_LOCATION_ID — Default location ID (optional if passed per-call)
 */
export function getGHLClient(): GHLClient {
  const apiKey     = import.meta.env.GHL_API_KEY     ?? process.env.GHL_API_KEY;
  const locationId = import.meta.env.GHL_LOCATION_ID ?? process.env.GHL_LOCATION_ID;

  if (!apiKey) {
    throw new Error(
      "[GHL] GHL_API_KEY environment variable is not set. " +
      "Add it to your .env file and ensure it is loaded before calling getGHLClient().",
    );
  }

  return createGHLClient({ apiKey, locationId });
}
