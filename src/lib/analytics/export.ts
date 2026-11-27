import type { ReportPayload } from "@/lib/analytics/engine";
import { downloadBlob } from "@/lib/utils";

function CSVEscape(value: string) {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function tableToCsv(rows: Array<Record<string, string | number>>): string {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  return [
    headers.map(CSVEscape).join(","),
    ...rows.map((row) => headers.map((h) => CSVEscape(String(row[h] ?? ""))).join(",")),
  ].join("\n");
}

export function exportJson(report: ReportPayload) {
  downloadBlob(
    new Blob([JSON.stringify(report, null, 2)], { type: "application/json" }),
    "sprint-report.json"
  );
}

export function exportCsv(report: ReportPayload) {
  const blocks: string[] = [];

  blocks.push("# cards");
  blocks.push("key,value");
  for (const [k, v] of Object.entries(report.cards)) {
    blocks.push(`${CSVEscape(k)},${CSVEscape(String(v))}`);
  }

  blocks.push("", "# contributor_mix");
  blocks.push(
    tableToCsv(
      report.contributorMix.map((r) => ({
        Person: r.person,
        Completed: r.completed,
        Open: r.open,
        QA: r.qa,
        Involved: r.involved,
        "Share of completed %": r.shareOfCompleted,
      }))
    )
  );

  const sections: Array<[string, Array<Record<string, string | number>>]> = [
    ["project_summary", report.projectSummary],
    ["milestone_summary", report.milestoneSummary],
    ["scope_summary", report.scopeSummary],
    ["aging_items", report.agingItems],
  ];
  for (const [name, rows] of sections) {
    blocks.push("", `# ${name}`);
    blocks.push(tableToCsv(rows));
  }

  blocks.push("", "# detail_items");
  const detailRows = report.milestones.flatMap((ms) =>
    ms.projects.flatMap((project) =>
      project.items.map((item) => ({
        Sprint: ms.milestone,
        Project: project.project,
        Title: item.title,
        Assignee: item.assignee,
        Status: item.status,
        Board: item.board,
        Age: item.agingSprints,
        QA: item.isQa ? "yes" : "no",
        Estimate: item.estimate,
        Link: item.link,
        CompletedAt: item.completedAt,
      }))
    )
  );
  blocks.push(tableToCsv(detailRows));

  downloadBlob(
    new Blob([blocks.join("\n")], { type: "text/csv;charset=utf-8" }),
    "sprint-report.csv"
  );
}

function collectPageCss(): string {
  let css = "";
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      for (const rule of Array.from(sheet.cssRules || [])) {
        css += `${rule.cssText}\n`;
      }
    } catch {
      continue;
    }
  }
  return css;
}

function collectCssVariables(from: Element): string {
  const computed = getComputedStyle(from);
  const chunks: string[] = [];
  for (let i = 0; i < computed.length; i += 1) {
    const prop = computed.item(i);
    if (!prop.startsWith("--")) continue;
    chunks.push(`${prop}:${computed.getPropertyValue(prop)};`);
  }
  return chunks.join("");
}

function freezeChartPlot(live: Element, cloned: HTMLElement) {
  const rect = (live as HTMLElement).getBoundingClientRect();
  const height = Math.max(1, Math.round(rect.height));
  cloned.style.boxSizing = "border-box";
  cloned.style.width = "100%";
  cloned.style.height = `${height}px`;
  cloned.style.maxHeight = `${height}px`;
  cloned.style.minHeight = `${height}px`;
  cloned.style.overflow = "hidden";
  cloned.style.position = "relative";
}

function prepareClone(root: HTMLElement): HTMLElement {
  const clone = root.cloneNode(true) as HTMLElement;

  clone.querySelectorAll("[data-export-hide]").forEach((el) => el.remove());

  clone.querySelectorAll("details").forEach((node) => {
    node.setAttribute("open", "");
  });

  const livePlots = root.querySelectorAll("[data-chart-plot]");
  clone.querySelectorAll("[data-chart-plot]").forEach((node, index) => {
    const live = livePlots[index];
    if (live instanceof HTMLElement && node instanceof HTMLElement) {
      freezeChartPlot(live, node);
    }
  });

  const liveCards = root.querySelectorAll("[data-chart-card]");
  clone.querySelectorAll("[data-chart-card]").forEach((node, index) => {
    const live = liveCards[index];
    if (!(live instanceof HTMLElement) || !(node instanceof HTMLElement)) return;
    const computed = getComputedStyle(live);
    node.style.background = computed.backgroundColor;
    node.style.border = computed.border;
    node.style.borderRadius = computed.borderRadius;
    node.style.padding = computed.padding;
  });

  const liveCanvases = root.querySelectorAll("canvas");
  clone.querySelectorAll("canvas").forEach((node, index) => {
    const live = liveCanvases[index];
    if (!(live instanceof HTMLCanvasElement)) {
      node.remove();
      return;
    }

    const img = document.createElement("img");
    img.src = live.toDataURL("image/png");
    img.alt = "chart";
    img.setAttribute("data-chart-snapshot", "");
    img.style.display = "block";
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.maxWidth = "100%";
    img.style.maxHeight = "100%";
    img.style.objectFit = "contain";
    img.style.objectPosition = "center";
    node.replaceWith(img);
  });

  return clone;
}

export function exportHtmlFromDom(root: HTMLElement, title = "Sprint Analytics Report") {
  const clone = prepareClone(root);
  const css = collectPageCss();
  const rootRect = root.getBoundingClientRect();
  const shellWidth = Math.max(1, Math.round(rootRect.width));
  const cssVars = collectCssVariables(document.documentElement);

  const html = `<!DOCTYPE html>
<html lang="${document.documentElement.lang || "en"}" class="${document.documentElement.className}">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title.replace(/</g, "&lt;")}</title>
<style>
${css}
:root {${cssVars}}
html, body {
  margin: 0;
  background: var(--background, #fff);
  color: var(--foreground, #18181b);
}
body {
  padding: 24px 16px 48px;
}
.sa-export-shell {
  box-sizing: border-box;
  width: 100%;
  max-width: min(80rem, ${shellWidth}px);
  margin: 0 auto;
}
[data-chart-plot] {
  overflow: hidden !important;
}
[data-chart-snapshot] {
  display: block !important;
  width: 100% !important;
  height: 100% !important;
  max-width: 100% !important;
  max-height: 100% !important;
  object-fit: contain !important;
  object-position: center !important;
}
</style>
</head>
<body class="${document.body.className}">
<div class="sa-export-shell">
${clone.outerHTML}
</div>
</body>
</html>`;

  downloadBlob(new Blob([html], { type: "text/html;charset=utf-8" }), "sprint-report.html");
}

export { exportPdfFromDom } from "@/lib/analytics/export-pdf";
