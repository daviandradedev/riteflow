import { analyzeReport } from "@/lib/analytics/engine";
import { parseUploadFiles } from "@/lib/analytics/parse";
import { loadSampleCsvFiles } from "@/lib/samples";
import { saveSnapshotFromReport } from "@/lib/snapshots/store";
import type { SprintSnapshot } from "@/lib/snapshots/types";

export async function seedDemoSnapshot(): Promise<SprintSnapshot> {
  const files = await loadSampleCsvFiles();
  const sources = await parseUploadFiles(files);
  const report = analyzeReport(sources);
  return saveSnapshotFromReport(report, "Exemplo · sprints de demonstração");
}
