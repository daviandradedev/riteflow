export const SAMPLE_CSV_FILES = [
  {
    path: "/samples/sprint-15-04-2026 - 29-04-2026.csv",
    fileName: "sprint-15-04-2026 - 29-04-2026.csv",
  },
  {
    path: "/samples/sprint-29-04-2026 - 13-05-2026.csv",
    fileName: "sprint-29-04-2026 - 13-05-2026.csv",
  },
  {
    path: "/samples/sprint-13-05-2026 - 27-05-2026.csv",
    fileName: "sprint-13-05-2026 - 27-05-2026.csv",
  },
] as const;

export async function loadSampleCsvFiles(): Promise<File[]> {
  const files: File[] = [];
  for (const sample of SAMPLE_CSV_FILES) {
    const res = await fetch(sample.path);
    if (!res.ok) {
      throw new Error(`Failed to load sample: ${sample.fileName}`);
    }
    const blob = await res.blob();
    files.push(new File([blob], sample.fileName, { type: "text/csv" }));
  }
  return files;
}
