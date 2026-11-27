import type { Language } from "@/lib/translations";
import type { Content, TDocumentDefinitions } from "pdfmake/interfaces";

const A4_WIDTH_PT = 595.28;
const A4_HEIGHT_PT = 841.89;
const PAGE_MARGIN_PT = 24;
const CAPTURE_WIDTH_PX = 1120;
const CAPTURE_PADDING_PX = 24;
const CAPTURE_SCALE = 2;

type BlockRange = {
  top: number;
  bottom: number;
};

function freezeChartPlot(live: Element, cloned: HTMLElement) {
  const rect = (live as HTMLElement).getBoundingClientRect();
  const height = Math.max(180, Math.round(rect.height));
  cloned.style.boxSizing = "border-box";
  cloned.style.width = "100%";
  cloned.style.height = `${height}px`;
  cloned.style.maxHeight = `${height}px`;
  cloned.style.minHeight = `${height}px`;
  cloned.style.overflow = "hidden";
  cloned.style.position = "relative";
}

function preparePrintClone(root: HTMLElement): HTMLElement {
  const clone = root.cloneNode(true) as HTMLElement;

  const livePlots = root.querySelectorAll("[data-chart-plot]");
  clone.querySelectorAll("[data-chart-plot]").forEach((node, index) => {
    const live = livePlots[index];
    if (live instanceof HTMLElement && node instanceof HTMLElement) {
      freezeChartPlot(live, node);
    }
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
    img.style.objectFit = "contain";
    img.style.objectPosition = "center";
    node.replaceWith(img);
  });

  clone.querySelectorAll("[data-export-hide]").forEach((el) => el.remove());
  clone.querySelectorAll("details").forEach((node) => {
    node.setAttribute("open", "");
  });

  return clone;
}

function buildPdfScopedStyles(): string {
  return `
[data-pdf-capture-host] {
  --background: #ffffff;
  --foreground: #18181b;
  --surface: #f8fafc;
  --surface-elevated: #ffffff;
  --border: #d8e0e8;
  --border-subtle: #e5eaf0;
  --muted: #667085;
  --accent: #1d4ed8;
  --accent-fg: #ffffff;
  --accent-soft: #eff6ff;
  --accent-border: #bfdbfe;
  --accent-text: #1d4ed8;
  color-scheme: light;
  background: #ffffff !important;
  color: #18181b !important;
  font-family: var(--font-geist-sans), system-ui, -apple-system, sans-serif;
}
[data-pdf-capture-host] section,
[data-pdf-capture-host] details,
[data-pdf-capture-host] [data-chart-card] {
  background: #ffffff !important;
  border-color: #d8e0e8 !important;
  color: #18181b !important;
}
[data-pdf-capture-host] [data-pdf-row] {
  background: #fbfcfe !important;
  border-color: #d8e0e8 !important;
}
[data-pdf-capture-host] [data-pdf-row] > div:nth-child(2) > div:first-child {
  background: #e8eef4 !important;
}
[data-pdf-capture-host] h2,
[data-pdf-capture-host] h3,
[data-pdf-capture-host] strong,
[data-pdf-capture-host] .text-foreground {
  color: #1f2937 !important;
}
[data-pdf-capture-host] .text-muted {
  color: #667085 !important;
}
[data-pdf-capture-host] .rf-project-title {
  color: #213247 !important;
}
[data-pdf-capture-host] .rf-task-link {
  color: #0369a1 !important;
}
[data-pdf-capture-host] .rf-metric-card {
  border-color: #d8e0e8 !important;
  background: linear-gradient(180deg, #ffffff 0%, #fafcff 100%) !important;
}
[data-pdf-capture-host] .rf-metric-label,
[data-pdf-capture-host] .rf-metric-hint {
  color: #667085 !important;
}
[data-pdf-capture-host] .rf-metric-value {
  color: #1f2937 !important;
}
[data-pdf-capture-host] .rf-tint-mint {
  background: linear-gradient(180deg, #f0fdfa 0%, #ccfbf1 100%) !important;
  border-color: #99f6e4 !important;
}
[data-pdf-capture-host] .rf-tint-mint .rf-metric-value {
  color: #0d9488 !important;
}
[data-pdf-capture-host] .rf-tint-danger {
  background: linear-gradient(180deg, #fff7f5 0%, #ffefea 100%) !important;
  border-color: #fdbaa4 !important;
}
[data-pdf-capture-host] .rf-tint-danger .rf-metric-value {
  color: #dc2626 !important;
}
[data-pdf-capture-host] .rf-tint-warn {
  background: linear-gradient(180deg, #fffbeb 0%, #fef3c7 100%) !important;
  border-color: #fcd34d !important;
}
[data-pdf-capture-host] .rf-tint-warn .rf-metric-value {
  color: #b45309 !important;
}
[data-pdf-capture-host] .rf-pill {
  border-color: #d8e0e8 !important;
  background: #f3f6fa !important;
  color: #344054 !important;
}
[data-pdf-capture-host] .rf-step-danger {
  border-color: #fdbaa4 !important;
  background: linear-gradient(180deg, #fff7f5 0%, #ffefea 100%) !important;
  box-shadow: inset 3px 0 0 #dc2626 !important;
}
[data-pdf-capture-host] .rf-step-warn {
  border-color: #f0d2a8 !important;
  background: #fff8ef !important;
  box-shadow: inset 3px 0 0 #ea580c !important;
}
[data-pdf-capture-host] .rf-step-danger p,
[data-pdf-capture-host] .rf-step-warn p {
  color: #213247 !important;
}
[data-pdf-capture-host] .rf-step-danger p + p,
[data-pdf-capture-host] .rf-step-warn p + p {
  color: #667085 !important;
}
[data-pdf-capture-host] .overflow-x-auto {
  overflow: visible !important;
}
[data-pdf-capture-host] .sa-table {
  table-layout: auto !important;
  width: 100% !important;
  min-width: 0 !important;
  font-size: 12px !important;
}
[data-pdf-capture-host] .sa-table .col-wide,
[data-pdf-capture-host] .sa-table .col-md,
[data-pdf-capture-host] .sa-table .col-sm,
[data-pdf-capture-host] .sa-table .col-xs {
  width: auto !important;
}
[data-pdf-capture-host] .sa-table thead th {
  background: #f8fafc !important;
  color: #344054 !important;
  border-bottom: 1px solid #e2e8f0 !important;
  white-space: normal !important;
  overflow: visible !important;
  text-overflow: clip !important;
  line-height: 1.25 !important;
  font-size: 10.5px !important;
  letter-spacing: 0.04em !important;
  padding: 8px 8px !important;
}
[data-pdf-capture-host] .rf-table-aging thead th {
  background: #fff5f5 !important;
  color: #9f1239 !important;
}
[data-pdf-capture-host] .sa-table td {
  color: #1f2937 !important;
  border-bottom: 1px solid #e5eaf0 !important;
  white-space: normal !important;
  overflow: visible !important;
  text-overflow: clip !important;
  word-break: normal !important;
  overflow-wrap: break-word;
  padding: 8px 8px !important;
  line-height: 1.35 !important;
}
[data-pdf-capture-host] .rf-table-aging td:nth-child(6),
[data-pdf-capture-host] .rf-table-aging td:nth-child(7) {
  white-space: nowrap !important;
}
[data-pdf-capture-host] .sa-table td.num,
[data-pdf-capture-host] .sa-table th.num,
[data-pdf-capture-host] .sa-table .col-xs {
  white-space: nowrap !important;
}
[data-pdf-capture-host] .sa-table tbody tr:nth-child(even):not([class*="rf-row-"]) td {
  background: #fcfdff !important;
}
[data-pdf-capture-host] .rf-row-risk td,
[data-pdf-capture-host] .rf-row-age3 td {
  background: #fee2e2 !important;
}
[data-pdf-capture-host] .rf-row-age2 td {
  background: #ffedd5 !important;
}
[data-pdf-capture-host] .rf-row-watch td,
[data-pdf-capture-host] .rf-row-age1 td {
  background: #fff7ed !important;
}
[data-pdf-capture-host] .rf-row-ok td {
  background: #f0fdfa !important;
}
[data-pdf-capture-host] .rf-row-done td {
  background: #ffffff !important;
  opacity: 0.78 !important;
}
[data-pdf-capture-host] .rf-row-risk td:first-child,
[data-pdf-capture-host] .rf-row-risk td:first-child a,
[data-pdf-capture-host] .rf-row-age3 td:first-child,
[data-pdf-capture-host] .rf-row-age3 td:first-child a {
  color: #7f1d1d !important;
  font-weight: 700 !important;
}
[data-pdf-capture-host] .rf-row-age2 td:first-child,
[data-pdf-capture-host] .rf-row-age2 td:first-child a,
[data-pdf-capture-host] .rf-row-age1 td:first-child,
[data-pdf-capture-host] .rf-row-age1 td:first-child a {
  color: #9a3412 !important;
}
[data-pdf-capture-host] .rf-cell-risk {
  color: #7f1d1d !important;
  font-weight: 800 !important;
}
[data-pdf-capture-host] .rf-cell-watch {
  color: #9a3412 !important;
  font-weight: 700 !important;
}
[data-pdf-capture-host] .rf-cell-ok {
  color: #0f766e !important;
  font-weight: 700 !important;
}
[data-pdf-capture-host] .rf-age-badge {
  white-space: nowrap !important;
}
[data-pdf-capture-host] .rf-age-3 {
  background: #b91c1c !important;
  color: #ffffff !important;
}
[data-pdf-capture-host] .rf-age-2 {
  background: #dc8872 !important;
  color: #ffffff !important;
}
[data-pdf-capture-host] .rf-age-1 {
  background: #fef3c7 !important;
  color: #7c2d12 !important;
}
[data-pdf-capture-host] [data-chart-snapshot] {
  display: block !important;
  width: 100% !important;
  height: 100% !important;
  object-fit: contain !important;
}
`;
}

function collectKeepBlocks(host: HTMLElement, scale: number): BlockRange[] {
  const hostRect = host.getBoundingClientRect();
  const selector = [
    "[data-chart-card]",
    "[data-pdf-block]",
    "[data-pdf-row]",
    ".rf-metric-card",
    "section",
    "details > summary",
    "tbody > tr",
    "ul > li",
  ].join(",");

  const blocks: BlockRange[] = [];

  host.querySelectorAll<HTMLElement>(selector).forEach((el) => {
    const rect = el.getBoundingClientRect();
    if (rect.height < 4) return;
    blocks.push({
      top: Math.max(0, (rect.top - hostRect.top) * scale),
      bottom: Math.max(0, (rect.bottom - hostRect.top) * scale),
    });
  });

  host.querySelectorAll<HTMLElement>("h3, h4, thead").forEach((el) => {
    const rect = el.getBoundingClientRect();
    if (rect.height < 4) return;
    const siblingRow =
      el.tagName === "H4" || el.tagName === "H3"
        ? el.nextElementSibling?.querySelector<HTMLElement>("tbody > tr")
        : null;
    const gluedBottom = siblingRow
      ? siblingRow.getBoundingClientRect().bottom
      : rect.bottom + 140;
    blocks.push({
      top: Math.max(0, (rect.top - hostRect.top) * scale),
      bottom: Math.max(0, (gluedBottom - hostRect.top) * scale),
    });
  });

  return blocks;
}

export function computeSmartPageCuts(
  totalHeight: number,
  pageHeight: number,
  blocks: BlockRange[],
  scale = CAPTURE_SCALE,
): Array<{ start: number; end: number }> {
  const cuts: Array<{ start: number; end: number }> = [];
  const minFillHeight = pageHeight * 0.2;
  const maxAtomicHeight = pageHeight * 0.94;
  const gapPx = 4 * scale;
  let rendered = 0;

  while (rendered < totalHeight) {
    const remaining = totalHeight - rendered;
    if (remaining <= pageHeight) {
      if (remaining > 8 || cuts.length === 0) {
        cuts.push({ start: rendered, end: totalHeight });
      }
      break;
    }

    const idealEnd = rendered + pageHeight;
    let cutY = idealEnd;

    const straddling = blocks
      .filter((block) => {
        const height = block.bottom - block.top;
        return (
          height <= maxAtomicHeight &&
          block.top < idealEnd &&
          block.bottom > idealEnd &&
          block.top - gapPx >= rendered + minFillHeight
        );
      })
      .sort((a, b) => a.top - b.top);

    if (straddling.length > 0) {
      cutY = Math.floor(straddling[0]!.top - gapPx);
    }

    const safeEnd = Math.max(rendered + 1, Math.min(totalHeight, Math.floor(cutY)));
    cuts.push({ start: rendered, end: safeEnd });
    rendered = safeEnd;
  }

  return cuts;
}

function sliceCanvasPages(
  canvas: HTMLCanvasElement,
  pageWidthPt: number,
  pageHeightPt: number,
  blocks: BlockRange[],
) {
  const usableWidth = pageWidthPt - PAGE_MARGIN_PT * 2;
  const usableHeight = pageHeightPt - PAGE_MARGIN_PT * 2;
  const pageCanvasHeight = (usableHeight * canvas.width) / usableWidth;
  const cuts = computeSmartPageCuts(canvas.height, pageCanvasHeight, blocks, CAPTURE_SCALE);
  const pages: Array<{ image: string; heightPt: number }> = [];

  for (const cut of cuts) {
    const sliceHeight = Math.max(1, Math.floor(cut.end - cut.start));
    const slice = document.createElement("canvas");
    slice.width = canvas.width;
    slice.height = sliceHeight;
    const ctx = slice.getContext("2d");
    if (!ctx) throw new Error("Could not create PDF canvas slice");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, slice.width, slice.height);
    ctx.drawImage(
      canvas,
      0,
      Math.floor(cut.start),
      canvas.width,
      sliceHeight,
      0,
      0,
      canvas.width,
      sliceHeight,
    );
    const heightPt = (sliceHeight * usableWidth) / canvas.width;
    pages.push({
      image: slice.toDataURL("image/jpeg", 0.94),
      heightPt: Math.min(usableHeight, heightPt),
    });
  }

  return { pages, imageWidthPt: usableWidth };
}

async function captureReportCanvas(root: HTMLElement) {
  const { domToCanvas } = await import("modern-screenshot");

  const previousOpen = new Map<HTMLDetailsElement, boolean>();
  root.querySelectorAll("details").forEach((node) => {
    if (node instanceof HTMLDetailsElement) {
      previousOpen.set(node, node.open);
      node.open = true;
    }
  });

  const styleEl = document.createElement("style");
  styleEl.setAttribute("data-pdf-capture-style", "");
  styleEl.textContent = buildPdfScopedStyles();
  document.head.appendChild(styleEl);

  const host = document.createElement("div");
  host.setAttribute("data-pdf-capture-host", "");
  host.style.cssText = [
    "position:fixed",
    "left:-10000px",
    "top:0",
    `width:${CAPTURE_WIDTH_PX}px`,
    `padding:${CAPTURE_PADDING_PX}px`,
    "background:#ffffff",
    "color:#18181b",
    "box-sizing:border-box",
    "z-index:-1",
    "pointer-events:none",
  ].join(";");

  const clone = preparePrintClone(root);
  clone.style.width = "100%";
  clone.style.maxWidth = "100%";
  host.appendChild(clone);
  document.body.appendChild(host);

  try {
    const images = Array.from(host.querySelectorAll("img"));
    await Promise.all(
      images.map(
        (img) =>
          img.complete ||
          new Promise<void>((resolve) => {
            img.addEventListener("load", () => resolve(), { once: true });
            img.addEventListener("error", () => resolve(), { once: true });
          }),
      ),
    );

    await new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve(null))),
    );

    const blocks = collectKeepBlocks(host, CAPTURE_SCALE);
    const canvas = await domToCanvas(host, {
      scale: CAPTURE_SCALE,
      width: CAPTURE_WIDTH_PX,
      backgroundColor: "#ffffff",
      style: {
        backgroundColor: "#ffffff",
        color: "#18181b",
      },
    });

    return { canvas, blocks };
  } finally {
    host.remove();
    styleEl.remove();
    previousOpen.forEach((wasOpen, node) => {
      node.open = wasOpen;
    });
  }
}

export async function exportPdfFromDom(root: HTMLElement, language: Language) {
  const { canvas, blocks } = await captureReportCanvas(root);
  const { pages, imageWidthPt } = sliceCanvasPages(canvas, A4_WIDTH_PT, A4_HEIGHT_PT, blocks);
  if (!pages.length) throw new Error("PDF capture produced no pages");

  const pdfMakeMod = await import("pdfmake/build/pdfmake");
  const fontsMod = await import("pdfmake/build/vfs_fonts");
  const pdfMake = (pdfMakeMod.default ?? pdfMakeMod) as {
    addVirtualFileSystem: (fonts: unknown) => void;
    createPdf: (doc: TDocumentDefinitions) => { download: (name?: string) => void };
  };
  const fonts = fontsMod.default ?? fontsMod;
  pdfMake.addVirtualFileSystem(fonts);

  const content: Content[] = pages.map((page, index) => ({
    image: page.image,
    width: imageWidthPt,
    height: page.heightPt,
    alignment: "center",
    ...(index < pages.length - 1 ? { pageBreak: "after" as const } : {}),
  }));

  const docDefinition: TDocumentDefinitions = {
    pageSize: "A4",
    pageOrientation: "portrait",
    pageMargins: [PAGE_MARGIN_PT, PAGE_MARGIN_PT, PAGE_MARGIN_PT, PAGE_MARGIN_PT],
    info: {
      title: language === "en" ? "Sprint report" : "Relatório da sprint",
      creator: "Riteflow",
    },
    content,
    defaultStyle: { font: "Roboto" },
  };

  const fileName = language === "en" ? "Sprint_Report.pdf" : "Relatorio_Sprint.pdf";
  pdfMake.createPdf(docDefinition).download(fileName);
}
