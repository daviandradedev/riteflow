import { describe, expect, it } from "vitest";
import { deltaTone, formatMetricDelta, metricDelta } from "@/lib/snapshots/delta";

describe("metric deltas", () => {
  it("formats signed deltas", () => {
    expect(formatMetricDelta(metricDelta(10, 12))).toBe("+2");
    expect(formatMetricDelta(metricDelta(10, 8))).toBe("-2");
  });

  it("treats lower aging as better", () => {
    expect(deltaTone("agingOpen", -1)).toBe("better");
    expect(deltaTone("agingOpen", 1)).toBe("worse");
    expect(deltaTone("doneRate", 5)).toBe("better");
  });
});
