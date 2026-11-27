"use client";

import type { ReportPayload } from "@/lib/analytics/engine";
import {
  displayBoard,
  displayProject,
} from "@/lib/analytics/display-labels";
import { useLanguage } from "@/lib/contexts/language-context";
import { DataTable, type ColumnDef, type RowTone } from "@/components/ui/data-table";

function projectRowTone(row: Record<string, string | number>): RowTone | undefined {
  const aging = Number(row.Aging ?? 0);
  const bottleneck = Number(row.Bottleneck ?? 0);
  if (aging >= 3 || bottleneck >= 3) return "risk";
  if (aging >= 1 || bottleneck >= 1) return "watch";
  if (Number(row.Open ?? 0) === 0) return "ok";
  return undefined;
}

function projectCellTone(
  row: Record<string, string | number>,
  key: string,
): RowTone | undefined {
  if (key === "Aging") {
    const aging = Number(row.Aging ?? 0);
    if (aging >= 3) return "risk";
    if (aging >= 1) return "watch";
    return "ok";
  }
  if (key === "Bottleneck") {
    const bottleneck = Number(row.Bottleneck ?? 0);
    if (bottleneck >= 2) return "risk";
    if (bottleneck >= 1) return "watch";
    return "ok";
  }
  if (key === "Open") {
    const open = Number(row.Open ?? 0);
    if (open >= 5) return "risk";
    if (open >= 1) return "watch";
    return "ok";
  }
  return undefined;
}

function agingRowTone(row: Record<string, string | number>): RowTone {
  const age = Number(row.Age ?? 0);
  if (age >= 3) return "age3";
  if (age === 2) return "age2";
  return "age1";
}

function agingCellTone(
  row: Record<string, string | number>,
  key: string,
): RowTone | undefined {
  if (key !== "Age") return undefined;
  const age = Number(row.Age ?? 0);
  if (age >= 3) return "risk";
  if (age === 2) return "watch";
  return "ok";
}

function milestoneRowTone(row: Record<string, string | number>): RowTone | undefined {
  const history = Number(row["History >1"] ?? 0);
  if (history >= 5) return "risk";
  if (history >= 2) return "watch";
  return undefined;
}

export function ReportTables({ report }: { report: ReportPayload }) {
  const { t, language } = useLanguage();
  const lang = language === "en" ? "en" : "pt";

  const projectRows = report.projectSummary.map((row) => ({
    ...row,
    Project: displayProject(String(row.Project ?? ""), lang),
  }));
  const agingRows = report.agingItems.map((row) => ({
    ...row,
    Project: displayProject(String(row.Project ?? ""), lang),
    Board: displayBoard(String(row.Board ?? ""), lang),
  }));

  const projectCols: ColumnDef[] = [
    { key: "Project", label: t("columns.project"), width: "wide" },
    { key: "Items", label: t("columns.items"), align: "right", width: "xs" },
    { key: "Tasks", label: t("columns.tasks"), align: "right", width: "xs" },
    { key: "QA", label: t("columns.qa"), align: "right", width: "xs" },
    { key: "QA / Task", label: t("columns.qaPerTask"), align: "right", width: "sm" },
    { key: "Done", label: t("columns.done"), align: "right", width: "xs" },
    { key: "Open", label: t("columns.open"), align: "right", width: "xs" },
    { key: "Aging", label: t("columns.aging"), align: "right", width: "xs" },
    { key: "Bottleneck", label: t("columns.bottleneck"), align: "right", width: "sm" },
  ];

  const milestoneCols: ColumnDef[] = [
    { key: "Sprint", label: t("columns.sprint"), width: "wide" },
    { key: "Items", label: t("columns.items"), align: "right", width: "xs" },
    { key: "Carried", label: t("columns.carried"), align: "right", width: "sm" },
    { key: "Tasks", label: t("columns.tasks"), align: "right", width: "xs" },
    { key: "QA", label: t("columns.qa"), align: "right", width: "xs" },
    { key: "Done", label: t("columns.done"), align: "right", width: "xs" },
    { key: "Open", label: t("columns.open"), align: "right", width: "xs" },
    { key: "History >1", label: t("columns.history"), align: "right", width: "sm" },
  ];

  const scopeCols: ColumnDef[] = [
    { key: "Sprint", label: t("columns.sprint"), width: "wide" },
    { key: "Carried", label: t("columns.carried"), align: "right", width: "sm" },
    { key: "Done", label: t("columns.done"), align: "right", width: "sm" },
    { key: "Open", label: t("columns.open"), align: "right", width: "sm" },
  ];

  const agingCols: ColumnDef[] = [
    { key: "Title", label: t("columns.title"), width: "wide" },
    { key: "Project", label: t("columns.project"), width: "md" },
    { key: "Assignee", label: t("columns.assignee"), width: "md" },
    { key: "Age", label: t("columns.age"), align: "right", width: "xs" },
    { key: "Board", label: t("columns.board"), width: "md" },
    { key: "First", label: t("columns.first"), width: "md" },
    { key: "Last", label: t("columns.last"), width: "md" },
  ];

  return (
    <div className="space-y-4">
      <DataTable
        title={t("tables.byProject")}
        description={t("tables.byProjectHint")}
        rows={projectRows}
        columns={projectCols}
        rowTone={projectRowTone}
        cellTone={projectCellTone}
        className="rf-table-risk"
      />
      <DataTable
        title={t("tables.byMilestone")}
        rows={report.milestoneSummary}
        columns={milestoneCols}
        rowTone={milestoneRowTone}
      />
      <DataTable title={t("tables.scope")} rows={report.scopeSummary} columns={scopeCols} />
      <DataTable
        title={t("tables.aging")}
        description={t("tables.agingHint")}
        rows={agingRows}
        columns={agingCols}
        rowTone={agingRowTone}
        cellTone={agingCellTone}
        className="rf-table-aging"
      />
    </div>
  );
}
