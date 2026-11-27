import Papa from "papaparse";
import type { ParsedSource } from "@/lib/analytics/engine";
import { rowsFromCsvObjects } from "@/lib/analytics/engine";

export async function parseCsvFile(file: File): Promise<ParsedSource> {
  const text = await file.text();
  const parsed = Papa.parse<Record<string, unknown>>(text, {
    header: true,
    skipEmptyLines: true,
  });
  if (parsed.errors.length && !parsed.data.length) {
    throw new Error("parse");
  }
  return rowsFromCsvObjects(parsed.data, file.name);
}

export async function parsePdfFile(file: File): Promise<ParsedSource> {
  const buffer = await file.arrayBuffer();
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();

  const doc = await pdfjs.getDocument({ data: buffer }).promise;
  const lines: string[] = [];
  for (let page = 1; page <= doc.numPages; page += 1) {
    const p = await doc.getPage(page);
    const content = await p.getTextContent();
    const text = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    lines.push(...text.split(/\n+/));
  }

  const joined = lines.join("\n");
  if (joined.includes(",") && /title|titulo/i.test(joined)) {
    const parsed = Papa.parse<Record<string, unknown>>(joined, {
      header: true,
      skipEmptyLines: true,
    });
    const source = rowsFromCsvObjects(parsed.data, file.name);
    if (source.rows.length) return source;
  }

  throw new Error("pdfWeak");
}

export async function parseUploadFiles(files: File[]): Promise<ParsedSource[]> {
  const sources: ParsedSource[] = [];
  for (const file of files) {
    const lower = file.name.toLowerCase();
    if (lower.endsWith(".csv")) {
      sources.push(await parseCsvFile(file));
    } else if (lower.endsWith(".pdf")) {
      sources.push(await parsePdfFile(file));
    } else {
      throw new Error("parse");
    }
  }
  return sources;
}
