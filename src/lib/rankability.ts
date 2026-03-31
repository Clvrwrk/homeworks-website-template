/**
 * Rankability Copywriter API client
 *
 * Base URL : https://2.rankability.com/api/agent/v1
 * Auth     : Bearer token — RANKABILITY_API_KEY (server-side only, never PUBLIC_)
 * Docs     : https://www.rankability.com/developers/
 *
 * Flow: createJob → pollJob (until completed/failed) → getArtifacts
 */

const RANKABILITY_BASE = "https://2.rankability.com/api/agent/v1";

// ---- Types --------------------------------------------------

export type RankabilityIntent = "educate" | "discover" | "compete" | "convert";
export type RankabilityTone   =
  | "clear_practical"
  | "expert_detailed"
  | "friendly_simple"
  | "technical_precise"
  | "persuasive_direct";

export type RankabilityStatus =
  | "queued"
  | "researching"
  | "brief_ready"
  | "generating_draft"
  | "completed"
  | "failed";

export interface RankabilityJobRequest {
  topic:                string;
  intent:               RankabilityIntent;
  mode?:                "auto" | "stepped";
  client_id?:           string;
  custom_instructions?: string;
  location?:            string;
  tone?:                RankabilityTone;
  word_count_target?:   number;
}

export interface RankabilityJob {
  id:         string;
  status:     RankabilityStatus;
  topic:      string;
  error?:     string;
  created_at: string;
}

export interface RankabilityArtifacts {
  draft: {
    format:     string;
    content:    string;
    word_count: number;
  };
  seo: {
    title_tag:        string;
    meta_description: string;
    h1:               string;
  };
  faqs:               Array<{ question: string; answer: string }>;
  faq_schema_json_ld: string;
  entities:           string[];
  score:              number;
}

// ---- Internal -----------------------------------------------

function rankabilityHeaders(apiKey: string): Record<string, string> {
  return {
    "Authorization": `Bearer ${apiKey}`,
    "Content-Type":  "application/json",
    "Accept":        "application/json",
  };
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// ---- Public API ---------------------------------------------

/**
 * Creates a new copywriter job and returns the job ID.
 */
export async function createJob(
  apiKey: string,
  params: RankabilityJobRequest,
): Promise<string> {
  const res = await fetch(`${RANKABILITY_BASE}/copywriter/jobs`, {
    method:  "POST",
    headers: rankabilityHeaders(apiKey),
    body:    JSON.stringify(params),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`[Rankability] createJob failed ${res.status}: ${body}`);
  }

  const data = (await res.json()) as { id: string };
  return data.id;
}

/**
 * Polls a job every 10 seconds until status is "completed" or "failed".
 * Throws if the job fails or exceeds maxWaitMs (default 10 minutes).
 */
export async function pollJob(
  apiKey: string,
  jobId: string,
  maxWaitMs = 600_000,
): Promise<RankabilityJob> {
  const start = Date.now();

  while (Date.now() - start < maxWaitMs) {
    await sleep(10_000);

    const res = await fetch(`${RANKABILITY_BASE}/copywriter/jobs/${jobId}`, {
      headers: rankabilityHeaders(apiKey),
    });

    if (!res.ok) {
      throw new Error(`[Rankability] pollJob ${jobId} failed ${res.status}`);
    }

    const job = (await res.json()) as RankabilityJob;

    if (job.status === "completed" || job.status === "failed") {
      return job;
    }

    console.log(`[Rankability] job ${jobId} status: ${job.status}`);
  }

  throw new Error(
    `[Rankability] job ${jobId} timed out after ${maxWaitMs / 1000}s`,
  );
}

/**
 * Fetches completed job artifacts (draft HTML, SEO fields, FAQs).
 * Only call after pollJob returns status="completed".
 */
export async function getArtifacts(
  apiKey: string,
  jobId: string,
): Promise<RankabilityArtifacts> {
  const res = await fetch(
    `${RANKABILITY_BASE}/copywriter/jobs/${jobId}/artifacts`,
    { headers: rankabilityHeaders(apiKey) },
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`[Rankability] getArtifacts ${jobId} failed ${res.status}: ${body}`);
  }

  return res.json() as Promise<RankabilityArtifacts>;
}

/**
 * Convenience: creates a job, waits for completion, returns artifacts.
 * Returns null if job fails — caller should write CONTENT_PLACEHOLDER.
 */
export async function generateContent(
  apiKey: string,
  params: RankabilityJobRequest,
): Promise<RankabilityArtifacts | null> {
  const jobId = await createJob(apiKey, params);
  console.log(`[Rankability] created job ${jobId} for topic: "${params.topic}"`);

  const job = await pollJob(apiKey, jobId);

  if (job.status === "failed") {
    console.error(`[Rankability] job ${jobId} failed: ${job.error ?? "unknown error"}`);
    return null;
  }

  return getArtifacts(apiKey, jobId);
}

/**
 * Returns the Rankability API key from environment variables.
 * Required: RANKABILITY_API_KEY (server-side only — never PUBLIC_)
 */
export function getRankabilityKey(): string {
  const key =
    (import.meta.env?.RANKABILITY_API_KEY as string | undefined) ??
    (typeof process !== "undefined" ? process.env.RANKABILITY_API_KEY : undefined);

  if (!key) {
    throw new Error(
      "[Rankability] RANKABILITY_API_KEY env var is not set. " +
      "Add it to .env — never prefix with PUBLIC_.",
    );
  }

  return key;
}
