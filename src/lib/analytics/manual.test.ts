import { describe, expect, it } from "vitest";
import { sourceFromManualItems } from "@/lib/analytics/manual";
import { analyzeReport } from "@/lib/analytics/engine";

describe("manual sprint source", () => {
  it("builds a dated source and analyzes filled rows", () => {
    const source = sourceFromManualItems(
      [
        {
          title: "task#1 - Landing",
          assignee: "Alex",
          estimate: "3",
          status: "Finalizada",
          board: "Done",
          project: "Web",
          sprints: "01/01/2026 ate 15/01/2026",
          link: "https://example.com/1",
          completedAt: "10/01/2026",
        },
        {
          title: "task#2 - [QA] Checks",
          assignee: "Sam",
          estimate: "2",
          status: "Aberta",
          board: "Em Revisão",
          project: "Web",
          sprints: "01/01/2026 ate 15/01/2026",
          link: "-",
          completedAt: "-",
        },
      ],
      "2026-01-01",
      "2026-01-15",
    );
    expect(source.fileName).toBe("sprint-01-01-2026 - 15-01-2026.csv");
    const report = analyzeReport([source]);
    expect(report.cards.unique).toBe(2);
    expect(report.cards.done).toBe(1);
    expect(report.cards.qa).toBe(1);
    expect(report.cards.bottleneck).toBe(1);
    expect(report.cards.agingOpen).toBe(1);
    expect(report.agingItems).toHaveLength(1);
    expect(report.agingItems[0]?.Title).toContain("task#2");
  });

  it("rejects an empty form", () => {
    expect(() =>
      sourceFromManualItems(
        [
          {
            title: "  ",
            assignee: "",
            estimate: "",
            status: "Aberta",
            board: "",
            project: "",
            sprints: "",
            link: "",
            completedAt: "",
          },
        ],
        "",
        "",
      ),
    ).toThrow("empty");
  });
});
