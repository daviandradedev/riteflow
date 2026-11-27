import { describe, expect, it } from "vitest";
import { analyzeReport, rowsFromCsvObjects } from "@/lib/analytics/engine";

describe("analyzeReport", () => {
  it("throws empty when no titled items exist", () => {
    const emptySource = rowsFromCsvObjects([{ title: "-" }], "01-01-2026 - 14-01-2026.csv");
    expect(() => analyzeReport([emptySource])).toThrow("empty");
  });

  it("tracks aging across sprints, bottleneck detection, and alphabetical contributor mix", () => {
    const sprint1 = rowsFromCsvObjects(
      [
        {
          Título: "Build auth handoff",
          Responsável: "Zoe",
          Pontos: "5",
          Situação: "Aberta",
          "Coluna do board": "In Progress",
          Projeto: "Core",
        },
        {
          Título: "[QA] Validate login flow",
          Responsável: "Ana",
          Pontos: "2",
          Situação: "Finalizada",
          "Coluna do board": "Done",
          Projeto: "Core",
        },
      ],
      "01-02-2026 - 14-02-2026.csv",
    );

    const sprint2 = rowsFromCsvObjects(
      [
        {
          Título: "Build auth handoff",
          Responsável: "Zoe",
          Pontos: "5",
          Situação: "Aberta",
          "Coluna do board": "Em revisão",
          Projeto: "Core",
        },
        {
          Título: "Export PDF report",
          Responsável: "Bruno",
          Pontos: "3",
          Situação: "Finalizada",
          "Coluna do board": "Done",
          Projeto: "Reports",
        },
      ],
      "15-02-2026 - 28-02-2026.csv",
    );

    const report = analyzeReport([sprint2, sprint1]);

    expect(report.cards.unique).toBe(3);
    expect(report.cards.done).toBe(2);
    expect(report.cards.open).toBe(1);
    expect(report.cards.qa).toBe(1);
    expect(report.cards.agingOpen).toBe(1);
    expect(report.cards.bottleneck).toBe(1);

    const carried = report.latest.find((item) => item.title === "Build auth handoff");
    expect(carried?.agingSprints).toBe(2);
    expect(carried?.isBottleneck).toBe(true);
    expect(carried?.firstMilestone).toBe("01-02-2026 - 14-02-2026");
    expect(carried?.lastMilestone).toBe("15-02-2026 - 28-02-2026");

    expect(report.contributorMix.map((row) => row.person)).toEqual(["Ana", "Bruno", "Zoe"]);
    expect(report.scopeSummary[0]?.Carried).toBe(0);
    expect(report.scopeSummary[1]?.Carried).toBe(1);
  });
});
