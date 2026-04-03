import { describe, it, expect } from "vitest";
import {
  getProjectReadiness,
  getEventReadiness,
  getPressMentionReadiness,
  wordCount,
  type ReadinessResult,
} from "../admin";

describe("wordCount", () => {
  it("counts words in a string", () => {
    expect(wordCount("hello world")).toBe(2);
  });

  it("handles extra whitespace", () => {
    expect(wordCount("  hello   world  ")).toBe(2);
  });

  it("returns 0 for empty string", () => {
    expect(wordCount("")).toBe(0);
  });
});

describe("getProjectReadiness", () => {
  const baseProject = {
    title: "Test Project",
    category: "Drywall",
    neighborhood: "Test Area",
    location: "City, TX 75001",
    community: "Test Community",
    duration: "1 day",
    scope: "Repair work",
    summary: "A brief summary",
    before_label: "Before state",
    after_label: "After state",
    before_photo_url: "/photo/before.jpg",
    after_photo_url: "/photo/after.jpg",
    overview: "Overview text",
    challenge: "Challenge text",
    result: "Result text",
    scope_items: ["Item 1", "Item 2"],
  };

  it("returns 100% for a complete project", () => {
    const r = getProjectReadiness(baseProject);
    expect(r.percent).toBe(100);
    expect(r.missing).toHaveLength(0);
    expect(r.canPublish).toBe(true);
  });

  it("flags missing title", () => {
    const r = getProjectReadiness({ ...baseProject, title: "" });
    expect(r.canPublish).toBe(false);
    expect(r.missing).toContain("Title");
  });

  it("flags empty scope_items", () => {
    const r = getProjectReadiness({ ...baseProject, scope_items: [] });
    expect(r.canPublish).toBe(false);
    expect(r.missing).toContain("Scope Items (at least 1)");
  });

  it("calculates partial completion", () => {
    const r = getProjectReadiness({
      ...baseProject,
      before_photo_url: "",
      after_photo_url: "",
    });
    expect(r.percent).toBeLessThan(100);
    expect(r.filled).toBe(r.total - 2);
  });
});

describe("getPressMentionReadiness", () => {
  it("blocks publish when summary is too short", () => {
    const r = getPressMentionReadiness({
      url: "https://example.com",
      headline: "Test Headline",
      publication: "Test Pub",
      summary: "Too short",
    });
    expect(r.canPublish).toBe(false);
    expect(r.missing).toContain("Summary (20–200 words required)");
  });

  it("allows publish when summary has 20–200 words", () => {
    const summary = Array(25).fill("word").join(" ");
    const r = getPressMentionReadiness({
      url: "https://example.com",
      headline: "Test Headline",
      publication: "Test Pub",
      summary,
    });
    expect(r.canPublish).toBe(true);
  });
});
