import { describe, it, expect } from "vitest";
import { toSlug, appendSuffix, uniqueSlug } from "../slugify";

describe("toSlug", () => {
  it("lowercases and replaces spaces with hyphens", () => {
    expect(toSlug("Crown Molding Installation")).toBe("crown-molding-installation");
  });

  it("strips special characters except hyphens", () => {
    expect(toSlug("Allen, TX — Home Theater!")).toBe("allen-tx-home-theater");
  });

  it("collapses multiple hyphens", () => {
    expect(toSlug("  double   spaced  ")).toBe("double-spaced");
  });

  it("trims leading/trailing hyphens", () => {
    expect(toSlug("--leading--")).toBe("leading");
  });
});

describe("appendSuffix", () => {
  it("appends -2 when given base slug", () => {
    expect(appendSuffix("crown-molding", 2)).toBe("crown-molding-2");
  });

  it("appends -5 for fifth collision", () => {
    expect(appendSuffix("allen-tv-mounting", 5)).toBe("allen-tv-mounting-5");
  });
});

describe("uniqueSlug", () => {
  it("returns base slug when no collision exists", async () => {
    const checkExists = async (_slug: string) => false;
    const result = await uniqueSlug("Crown Molding Installation", checkExists);
    expect(result).toBe("crown-molding-installation");
  });

  it("appends -2 on first collision", async () => {
    const existing = new Set(["crown-molding-installation"]);
    const checkExists = async (slug: string) => existing.has(slug);
    const result = await uniqueSlug("Crown Molding Installation", checkExists);
    expect(result).toBe("crown-molding-installation-2");
  });

  it("increments suffix until a free slot is found", async () => {
    const existing = new Set([
      "crown-molding-installation",
      "crown-molding-installation-2",
      "crown-molding-installation-3",
    ]);
    const checkExists = async (slug: string) => existing.has(slug);
    const result = await uniqueSlug("Crown Molding Installation", checkExists);
    expect(result).toBe("crown-molding-installation-4");
  });
});
