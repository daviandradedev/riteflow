import type { ParsedSource } from "@/lib/analytics/engine";

export type ManualItem = {
  title: string;
  assignee: string;
  estimate: string;
  status: string;
  board: string;
  project: string;
  sprints: string;
  link: string;
  completedAt: string;
};

function formatBr(date: string) {
  if (!date) return "";
  const [year, month, day] = date.split("-");
  if (!year || !month || !day) return date;
  return `${day}-${month}-${year}`;
}

const CSV_HEADERS = [
  "title",
  "assignee",
  "estimate",
  "status",
  "board",
  "project",
  "sprints",
  "link",
  "completedAt",
] as const;

function escapeCsv(value: string) {
  if (/[",\n]/.test(value)) return `"${value.replaceAll('"', '""')}"`;
  return value;
}

export function sourceFromManualItems(
  items: ManualItem[],
  startIso: string,
  endIso: string,
): ParsedSource {
  const start = formatBr(startIso);
  const end = formatBr(endIso);
  const fileName =
    start && end ? `sprint-${start} - ${end}.csv` : "manual-sprint.csv";
  const rows = items
    .filter((item) => item.title.trim())
    .map((item) => ({
      title: item.title.trim(),
      assignee: item.assignee.trim() || "-",
      estimate: item.estimate.trim() || "-",
      status: item.status.trim() || "-",
      board: item.board.trim() || "-",
      project: item.project.trim() || "-",
      sprints: item.sprints.trim() || "-",
      link: item.link.trim() || "-",
      completedAt: item.completedAt.trim() || "-",
    }));
  if (!rows.length) throw new Error("empty");
  return { fileName, rows };
}

export function downloadManualCsv(
  items: ManualItem[],
  startIso: string,
  endIso: string,
) {
  const source = sourceFromManualItems(items, startIso, endIso);
  const lines = [
    CSV_HEADERS.join(","),
    ...source.rows.map((row) =>
      CSV_HEADERS.map((key) => escapeCsv(row[key])).join(","),
    ),
  ];
  const blob = new Blob([`${lines.join("\n")}\n`], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = source.fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}
