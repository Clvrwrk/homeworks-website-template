import { describe, it, expect } from "vitest";
import { toSlug, appendSuffix } from "../slugify";

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
