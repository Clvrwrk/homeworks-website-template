// src/lib/slugify.ts

/**
 * Convert a title string to a URL slug.
 * "Crown Molding Installation" → "crown-molding-installation"
 */
export function toSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")  // strip non-alphanumeric except spaces/hyphens
    .replace(/[\s-]+/g, "-")        // collapse spaces and hyphens
    .replace(/^-+|-+$/g, "");       // trim leading/trailing hyphens
}

/**
 * Append a numeric suffix for collision resolution.
 * appendSuffix("my-slug", 2) → "my-slug-2"
 */
export function appendSuffix(base: string, n: number): string {
  return `${base}-${n}`;
}

/**
 * Generate a unique slug by checking existing slugs and appending -N if needed.
 * Pass a checkExists function that returns true if the slug is already taken.
 */
export async function uniqueSlug(
  title: string,
  checkExists: (slug: string) => Promise<boolean>
): Promise<string> {
  const base = toSlug(title);
  if (!(await checkExists(base))) return base;

  let n = 2;
  while (await checkExists(appendSuffix(base, n))) {
    n++;
  }
  return appendSuffix(base, n);
}
