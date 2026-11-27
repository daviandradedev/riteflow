"use client";

import { cn } from "@/lib/utils";

export type ColumnDef = {
  key: string;
  label?: string;
  align?: "left" | "right";
  width?: "wide" | "md" | "sm" | "xs";
};

export type RowTone = "ok" | "watch" | "risk" | "done" | "age3" | "age2" | "age1";

type Props = {
  title: string;
  description?: string;
  rows: Array<Record<string, string | number>>;
  columns?: ColumnDef[];
  className?: string;
  rowTone?: (row: Record<string, string | number>) => RowTone | undefined;
  cellTone?: (
    row: Record<string, string | number>,
    key: string,
  ) => RowTone | undefined;
};

export function DataTable({
  title,
  description,
  rows,
  columns,
  className,
  rowTone,
  cellTone,
}: Props) {
  if (!rows.length) return null;
  const cols: ColumnDef[] =
    columns ??
    Object.keys(rows[0]).map((key) => ({
      key,
      align: inferAlign(key, rows[0][key]),
      width: inferWidth(key),
    }));

  return (
    <section
      className={cn(
        "rounded-[16px] border border-[#d8e0e8] bg-white p-5 dark:border-border dark:bg-surface-elevated",
        className,
      )}
    >
      <h3 className="text-base font-bold text-[#1f2937] dark:text-foreground">{title}</h3>
      {description ? (
        <p className="mt-1 max-w-3xl text-xs leading-relaxed text-[#667085] dark:text-muted">
          {description}
        </p>
      ) : null}
      <div className="mt-3 overflow-x-auto custom-scrollbar">
        <table className="sa-table min-w-[640px] sm:min-w-[760px]">
          <thead>
            <tr>
              {cols.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    col.width === "wide" && "col-wide",
                    col.width === "md" && "col-md",
                    col.width === "sm" && "col-sm",
                    col.width === "xs" && "col-xs",
                    col.align === "right" && "num",
                  )}
                >
                  {col.label ?? col.key}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const tone = rowTone?.(row);
              return (
                <tr
                  key={idx}
                  className={cn(
                    tone === "risk" && "rf-row-risk",
                    tone === "watch" && "rf-row-watch",
                    tone === "ok" && "rf-row-ok",
                    tone === "done" && "rf-row-done",
                    tone === "age3" && "rf-row-age3",
                    tone === "age2" && "rf-row-age2",
                    tone === "age1" && "rf-row-age1",
                  )}
                >
                  {cols.map((col) => {
                    const cell = cellTone?.(row, col.key);
                    const value = row[col.key];
                    const ageBadge =
                      col.key === "Age" && typeof value === "number"
                        ? value >= 3
                          ? "rf-age-3"
                          : value === 2
                            ? "rf-age-2"
                            : "rf-age-1"
                        : null;
                    return (
                      <td
                        key={col.key}
                        className={cn(
                          "text-foreground/80",
                          col.width === "wide" && "col-wide",
                          col.width === "md" && "col-md",
                          col.width === "sm" && "col-sm",
                          col.width === "xs" && "col-xs",
                          col.align === "right" && "num",
                          !ageBadge && cell === "risk" && "rf-cell-risk",
                          !ageBadge && cell === "watch" && "rf-cell-watch",
                          !ageBadge && cell === "ok" && "rf-cell-ok",
                        )}
                        title={String(value ?? "")}
                      >
                        {ageBadge ? (
                          <span className={cn("rf-age-badge", ageBadge)}>
                            {value}x
                          </span>
                        ) : (
                          formatCell(col.key, value)
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function formatCell(key: string, value: string | number | undefined) {
  if (key === "Bottleneck" && typeof value === "number") {
    return value > 0 ? String(value) : "0";
  }
  return String(value ?? "");
}

function inferAlign(key: string, value: string | number): "left" | "right" {
  if (typeof value === "number") return "right";
  if (
    /items|tasks|qa|done|open|aging|bottleneck|new|carried|age|history|early|mid|late|last|median|completions|share/i.test(
      key,
    )
  ) {
    return "right";
  }
  return "left";
}

function inferWidth(key: string): ColumnDef["width"] {
  if (/title|project|sprint|assignee/i.test(key)) return "wide";
  if (/board|first|last|median/i.test(key)) return "md";
  if (/age|qa|new|done|open/i.test(key)) return "sm";
  return "sm";
}
