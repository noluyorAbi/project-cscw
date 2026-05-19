import { describe, it, expect } from "vitest";
import { PpgEstimator } from "./ppg";

describe("PpgEstimator", () => {
  it("returns null before enough samples", () => {
    const p = new PpgEstimator();
    expect(p.estimate()).toBeNull();
    for (let i = 0; i < 30; i++) p.push(128, i * 33);
    expect(p.estimate()).toBeNull(); // < MIN_SAMPLES (64)
  });

  it("returns null for a flat (no-pulse) signal even with many samples", () => {
    const p = new PpgEstimator();
    // 12 s of constant green at ~30 fps — no variance, no heartbeat
    for (let i = 0; i < 360; i++) p.push(128, i * 33);
    expect(p.estimate()).toBeNull();
  });

  it("reset clears the buffer", () => {
    const p = new PpgEstimator();
    for (let i = 0; i < 360; i++) p.push(100 + Math.sin(i), i * 33);
    p.reset();
    expect(p.estimate()).toBeNull();
  });
});
