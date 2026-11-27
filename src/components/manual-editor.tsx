"use client";

import { useRef, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/lib/contexts/language-context";
import {
  downloadManualCsv,
  sourceFromManualItems,
  type ManualItem,
} from "@/lib/analytics/manual";
import type { ParsedSource } from "@/lib/analytics/engine";

type ManualRow = ManualItem & {
  id: string;
};

function createBlankRow(id: string): ManualRow {
  return {
    id,
    title: "",
    assignee: "",
    estimate: "",
    status: "Aberta",
    board: "To Do",
    project: "",
    sprints: "",
    link: "",
    completedAt: "",
  };
}

type Props = {
  onApply: (source: ParsedSource) => void;
};

export function ManualEditor({ onApply }: Props) {
  const { t } = useLanguage();
  const nextId = useRef(2);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [items, setItems] = useState<ManualRow[]>(() => [createBlankRow("row-1")]);

  function allocateRow() {
    const id = `row-${nextId.current}`;
    nextId.current += 1;
    return createBlankRow(id);
  }

  function update(id: string, key: keyof ManualItem, value: string) {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, [key]: value } : item)),
    );
  }

  function clearFields() {
    setStart("");
    setEnd("");
    setItems([allocateRow()]);
  }

  return (
    <section className="manual-editor rounded-[1.5rem] border border-border bg-surface-elevated/85 p-4 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-foreground">{t("form.title")}</h2>
          <p className="mt-1 text-sm text-muted">{t("form.hint")}</p>
        </div>
        <button
          type="button"
          onClick={clearFields}
          className="shrink-0 text-[11px] font-semibold uppercase tracking-wider text-muted hover:text-foreground"
        >
          {t("form.clear")}
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label>
          {t("form.milestoneStart")}
          <input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        </label>
        <label>
          {t("form.milestoneEnd")}
          <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
        </label>
      </div>
      <div className="manual-editor-grid">
        {items.map((item) => (
          <div key={item.id} className="manual-editor-row">
            <label>
              {t("form.titleField")}
              <input value={item.title} onChange={(e) => update(item.id, "title", e.target.value)} />
            </label>
            <label>
              {t("form.assignee")}
              <input
                value={item.assignee}
                onChange={(e) => update(item.id, "assignee", e.target.value)}
              />
            </label>
            <label>
              {t("form.estimate")}
              <input
                value={item.estimate}
                onChange={(e) => update(item.id, "estimate", e.target.value)}
              />
            </label>
            <label>
              {t("form.status")}
              <select
                value={item.status}
                onChange={(e) => update(item.id, "status", e.target.value)}
              >
                <option value="Aberta">{t("status.open")}</option>
                <option value="Finalizada">{t("status.done")}</option>
              </select>
            </label>
            <label>
              {t("form.board")}
              <input value={item.board} onChange={(e) => update(item.id, "board", e.target.value)} />
            </label>
            <label>
              {t("form.project")}
              <input
                value={item.project}
                onChange={(e) => update(item.id, "project", e.target.value)}
              />
            </label>
            <label>
              {t("form.sprints")}
              <input
                value={item.sprints}
                onChange={(e) => update(item.id, "sprints", e.target.value)}
              />
            </label>
            <label>
              {t("form.link")}
              <input value={item.link} onChange={(e) => update(item.id, "link", e.target.value)} />
            </label>
            <label>
              {t("form.completedAt")}
              <input
                value={item.completedAt}
                onChange={(e) => update(item.id, "completedAt", e.target.value)}
              />
            </label>
            <button
              type="button"
              className="rounded-full border border-border px-3 py-2 text-xs font-bold uppercase tracking-wider text-muted hover:text-foreground disabled:opacity-50"
              onClick={() => setItems((current) => current.filter((row) => row.id !== item.id))}
              disabled={items.length === 1}
            >
              <Trash2 size={14} className="mr-1 inline" aria-hidden="true" />
              {t("form.remove")}
            </button>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-full border border-border px-4 py-2 text-xs font-bold uppercase tracking-wider text-foreground hover:bg-surface"
          onClick={() => setItems((current) => [...current, allocateRow()])}
        >
          <Plus size={14} aria-hidden="true" />
          {t("form.add")}
        </button>
        <button
          type="button"
          className="rounded-full border border-border px-4 py-2 text-xs font-bold uppercase tracking-wider text-foreground hover:bg-surface"
          onClick={() => {
            try {
              downloadManualCsv(items, start, end);
              toast.success(t("form.exported"));
            } catch {
              toast.error(t("form.exportEmpty"));
            }
          }}
        >
          {t("form.exportCsv")}
        </button>
        <button
          type="button"
          className="rounded-full bg-accent px-4 py-2 text-xs font-bold uppercase tracking-wider text-accent-fg hover:bg-accent-hover"
          onClick={() => {
            try {
              onApply(sourceFromManualItems(items, start, end));
            } catch {
              toast.error(t("form.applyEmpty"));
            }
          }}
        >
          {t("form.apply")}
        </button>
      </div>
    </section>
  );
}
