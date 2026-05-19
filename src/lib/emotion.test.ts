import { describe, it, expect } from "vitest";
import {
  stressToBpm,
  stressToExpression,
  maraReply,
  EXPRESSIONS,
} from "./emotion";

describe("stressToBpm", () => {
  it("is deterministic and bounded 62..120", () => {
    expect(stressToBpm(0)).toBe(62);
    expect(stressToBpm(100)).toBe(120);
    expect(stressToBpm(50)).toBe(stressToBpm(50)); // no randomness
  });
  it("is monotonic non-decreasing in stress", () => {
    let prev = -1;
    for (let s = 0; s <= 100; s += 10) {
      const v = stressToBpm(s);
      expect(v).toBeGreaterThanOrEqual(prev);
      prev = v;
    }
  });
  it("clamps out-of-range input", () => {
    expect(stressToBpm(-50)).toBe(62);
    expect(stressToBpm(999)).toBe(120);
  });
});

describe("stressToExpression", () => {
  it("maps the documented thresholds deterministically", () => {
    expect(stressToExpression(5).key).toBe("calm");
    expect(stressToExpression(25).key).toBe("happy");
    expect(stressToExpression(45).key).toBe("neutral");
    expect(stressToExpression(70).key).toBe("tense");
    expect(stressToExpression(95).key).toBe("sad");
  });
  it("returns a value from the EXPRESSIONS table", () => {
    const e = stressToExpression(60);
    expect(EXPRESSIONS[e.key]).toBe(e);
  });
});

describe("maraReply", () => {
  const pools: (keyof typeof EXPRESSIONS)[] = [
    "happy",
    "calm",
    "neutral",
    "tense",
    "sad",
  ];
  it("returns a non-empty string for every expression key", () => {
    for (const k of pools) {
      const r = maraReply(k);
      expect(typeof r).toBe("string");
      expect(r.length).toBeGreaterThan(0);
    }
  });
  it("falls back to a generic reply with no key", () => {
    expect(maraReply().length).toBeGreaterThan(0);
  });
});
