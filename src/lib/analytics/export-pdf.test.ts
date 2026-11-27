import { describe, expect, it } from "vitest";
import { computeSmartPageCuts } from "@/lib/analytics/export-pdf";

describe("computeSmartPageCuts", () => {
  it("moves a straddling card cleanly to the next page instead of slicing it", () => {
    const cuts = computeSmartPageCuts(
      3250,
      1500,
      [
        { top: 100, bottom: 500 },
        { top: 1200, bottom: 1650 },
        { top: 1700, bottom: 2900 },
      ],
      2,
    );

    expect(cuts[0]).toEqual({ start: 0, end: 1192 });
    expect(cuts[1]?.start).toBe(1192);
    expect(cuts.at(-1)?.end).toBe(3250);
  });

  it("keeps short trailing rows instead of dropping the end of the report", () => {
    const cuts = computeSmartPageCuts(1620, 1500, [{ top: 1480, bottom: 1580 }], 2);
    expect(cuts.at(-1)?.end).toBe(1620);
  });
});
