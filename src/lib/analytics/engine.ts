export type SprintItem = {
  title: string;
  assignee: string;
  estimate: number;
  status: string;
  board: string;
  project: string;
  sprints: string;
  link: string;
  completedAt: string;
  milestone: string;
  milestoneOrder: number;
  milestoneStart: Date | null;
  milestoneEnd: Date | null;
  sourceFile: string;
};

export type AnalyzedItem = SprintItem & {
  isDone: boolean;
  isQa: boolean;
  carryoverSprints: number;
  firstMilestone: string;
  lastMilestone: string;
  sprintHistoryCount: number;
  agingSprints: number;
  isBottleneck: boolean;
};

export type ReportPayload = {
  generatedAt: string;
  sourceFiles: string[];
  cards: {
    unique: number;
    done: number;
    open: number;
    projects: number;
    qa: number;
    agingOpen: number;
    agingHeavy: number;
    bottleneck: number;
  };
  charts: {
    statusLabels: string[];
    statusValues: number[];
    boardLabels: string[];
    boardValues: number[];
    scopeLabels: string[];
    scopeNew: number[];
    scopeCarried: number[];
    agingLabels: string[];
    agingValues: number[];
    projectLabels: string[];
    projectTasks: number[];
    projectQa: number[];
    projectDone: number[];
    projectOpen: number[];
    milestoneLabels: string[];
    milestoneDone: number[];
    milestoneOpen: number[];
  };
  projectSummary: Array<Record<string, string | number>>;
  milestoneSummary: Array<Record<string, string | number>>;
  scopeSummary: Array<Record<string, string | number>>;
  agingItems: Array<Record<string, string | number>>;
  contributorMix: Array<{
    person: string;
    completed: number;
    open: number;
    qa: number;
    involved: number;
    shareOfCompleted: number;
  }>;
  milestones: Array<{
    milestone: string;
    stats: Record<string, number>;
    projects: Array<{
      project: string;
      items: AnalyzedItem[];
    }>;
  }>;
  latest: AnalyzedItem[];
};

const COLUMN_ALIASES: Record<string, string[]> = {
  title: ["title", "titulo", "nome", "name"],
  assignee: ["assignee", "responsavel", "responsável", "owner"],
  estimate: ["estimate", "estimativa", "story_points", "pontos", "points"],
  status: ["status", "situacao", "situação"],
  board: ["board", "board_status", "boardstatus", "kanban", "etapa", "coluna", "coluna do board"],
  project: ["project", "projetos", "projeto", "projects"],
  sprints: ["sprints", "sprint", "milestones"],
  link: ["link", "url", "issue_url"],
  completedAt: ["completed_at", "finalizada_em", "done_at", "closed_at"],
};

const MILESTONE_RE = /(\d{2})-(\d{2})-(\d{4})\s*-\s*(\d{2})-(\d{2})-(\d{4})/;
const QA_RE = /\[\s*QA\s*\]/i;
const DONE_STATUSES = new Set([
  "finalizada",
  "finalizado",
  "done",
  "closed",
  "concluida",
  "concluída",
  "completed",
]);
const BOTTLENECK_BOARDS = new Set([
  "em revisão",
  "em revisao",
  "review",
  "in review",
  "deploy",
  "qa",
  "ready for qa",
  "ready for deploy",
  "pronto para qa",
  "pronto para deploy",
]);

function normalizeKey(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

const ALIAS_LOOKUP = new Map<string, string>();
for (const [canonical, aliases] of Object.entries(COLUMN_ALIASES)) {
  for (const alias of aliases) ALIAS_LOOKUP.set(normalizeKey(alias), canonical);
}

export function canonicalizeRow(row: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(row)) {
    const canonical = ALIAS_LOOKUP.get(normalizeKey(key));
    if (!canonical) continue;
    const text = value == null ? "" : String(value).trim();
    out[canonical] = text === "" || text === "-" ? "-" : text;
  }
  return out;
}

function parseEstimate(value: string): number {
  if (!value || value === "-") return 0;
  const n = Number(value.replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function parseMilestoneFromName(name: string): {
  milestone: string;
  start: Date | null;
  end: Date | null;
} {
  const match = name.match(MILESTONE_RE);
  if (!match) {
    return { milestone: name.replace(/\.[^.]+$/, ""), start: null, end: null };
  }
  const start = new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]));
  const end = new Date(Number(match[6]), Number(match[5]) - 1, Number(match[4]));
  return {
    milestone: `${match[1]}-${match[2]}-${match[3]} - ${match[4]}-${match[5]}-${match[6]}`,
    start,
    end,
  };
}

function countSprintSpans(value: string): number {
  const parts = value
    .split("|")
    .map((p) => p.trim())
    .filter((p) => p && p !== "-");
  return parts.length || 1;
}

function isDoneStatus(status: string) {
  return DONE_STATUSES.has(status.toLowerCase());
}

function isBottleneckBoard(board: string) {
  return BOTTLENECK_BOARDS.has(board.toLowerCase());
}

export type ParsedSource = {
  fileName: string;
  rows: Record<string, string>[];
};

export function rowsFromCsvObjects(
  records: Record<string, unknown>[],
  fileName: string
): ParsedSource {
  return {
    fileName,
    rows: records.map(canonicalizeRow).filter((r) => r.title && r.title !== "-"),
  };
}

export function buildItems(sources: ParsedSource[]): SprintItem[] {
  const sorted = [...sources].sort((a, b) => {
    const am = parseMilestoneFromName(a.fileName);
    const bm = parseMilestoneFromName(b.fileName);
    const at = am.start?.getTime() ?? Number.MAX_SAFE_INTEGER;
    const bt = bm.start?.getTime() ?? Number.MAX_SAFE_INTEGER;
    return at - bt || a.fileName.localeCompare(b.fileName);
  });

  const items: SprintItem[] = [];
  sorted.forEach((source, milestoneOrder) => {
    const meta = parseMilestoneFromName(source.fileName);
    const seen = new Set<string>();
    for (const row of source.rows) {
      if (!row.title) continue;
      const key = `${meta.milestone}::${row.title}`;
      if (seen.has(key)) continue;
      seen.add(key);
      items.push({
        title: row.title,
        assignee: row.assignee && row.assignee !== "-" ? row.assignee : "Unassigned",
        estimate: parseEstimate(row.estimate || "-"),
        status: row.status && row.status !== "-" ? row.status : "Unknown",
        board: row.board || "-",
        project: row.project && row.project !== "-" ? row.project : "General",
        sprints: row.sprints || "-",
        link: row.link || "-",
        completedAt: row.completedAt || "-",
        milestone: meta.milestone,
        milestoneOrder,
        milestoneStart: meta.start,
        milestoneEnd: meta.end,
        sourceFile: source.fileName,
      });
    }
  });
  return items;
}

export function analyzeReport(sources: ParsedSource[]): ReportPayload {
  const raw = buildItems(sources);
  if (!raw.length) {
    throw new Error("empty");
  }

  const titleStats = new Map<
    string,
    { carry: number; first: string; last: string; history: number }
  >();

  const ordered = [...raw].sort(
    (a, b) => a.milestoneOrder - b.milestoneOrder || a.title.localeCompare(b.title)
  );

  for (const item of ordered) {
    const prev = titleStats.get(item.title);
    const history = Math.max(countSprintSpans(item.sprints), prev?.history ?? 1);
    if (!prev) {
      titleStats.set(item.title, {
        carry: 1,
        first: item.milestone,
        last: item.milestone,
        history,
      });
    } else {
      titleStats.set(item.title, {
        carry: prev.carry + (prev.last === item.milestone ? 0 : 1),
        first: prev.first,
        last: item.milestone,
        history: Math.max(history, prev.history),
      });
    }
  }

  const milestonesByTitle = new Map<string, string[]>();
  for (const item of ordered) {
    const list = milestonesByTitle.get(item.title) ?? [];
    if (!list.includes(item.milestone)) list.push(item.milestone);
    milestonesByTitle.set(item.title, list);
  }

  const analyzed: AnalyzedItem[] = ordered.map((item) => {
    const milestones = milestonesByTitle.get(item.title) ?? [item.milestone];
    const history = Math.max(countSprintSpans(item.sprints), milestones.length);
    const aging = Math.max(milestones.length, history);
    return {
      ...item,
      isDone: isDoneStatus(item.status),
      isQa: QA_RE.test(item.title),
      carryoverSprints: milestones.length,
      firstMilestone: milestones[0],
      lastMilestone: milestones[milestones.length - 1],
      sprintHistoryCount: history,
      agingSprints: aging,
      isBottleneck: isBottleneckBoard(item.board),
    };
  });

  const latestMap = new Map<string, AnalyzedItem>();
  for (const item of analyzed) {
    const prev = latestMap.get(item.title);
    if (!prev || item.milestoneOrder >= prev.milestoneOrder) {
      latestMap.set(item.title, item);
    }
  }
  const latest = [...latestMap.values()];

  const openLatest = latest.filter((i) => !i.isDone);
  const agingOpen = openLatest.filter((i) => i.agingSprints > 1 || i.isBottleneck);
  const agingHeavy = openLatest.filter((i) => i.agingSprints >= 3);
  const bottleneck = openLatest.filter((i) => i.isBottleneck);

  const statusCounts = new Map<string, number>();
  for (const item of latest) {
    statusCounts.set(item.status, (statusCounts.get(item.status) ?? 0) + 1);
  }

  const boardCounts = new Map<string, number>();
  for (const item of openLatest) {
    const board = item.board === "-" ? "No board" : item.board;
    boardCounts.set(board, (boardCounts.get(board) ?? 0) + 1);
  }

  const projectMap = new Map<string, AnalyzedItem[]>();
  for (const item of latest) {
    const list = projectMap.get(item.project) ?? [];
    list.push(item);
    projectMap.set(item.project, list);
  }

  const projectSummary = [...projectMap.entries()]
    .map(([project, group]) => {
      const tasks = group.filter((i) => !i.isQa).length;
      const qa = group.filter((i) => i.isQa).length;
      return {
        Project: project,
        Items: group.length,
        Tasks: tasks,
        QA: qa,
        "QA / Task": tasks ? Number((qa / tasks).toFixed(2)) : 0,
        Done: group.filter((i) => i.isDone).length,
        Open: group.filter((i) => !i.isDone).length,
        Aging: group.filter((i) => !i.isDone && i.agingSprints > 1).length,
        Bottleneck: group.filter((i) => !i.isDone && i.isBottleneck).length,
      };
    })
    .sort((a, b) => Number(b.Items) - Number(a.Items));

  const milestoneOrder = [...new Set(analyzed.map((i) => i.milestone))].sort((a, b) => {
    const ao = analyzed.find((i) => i.milestone === a)?.milestoneOrder ?? 0;
    const bo = analyzed.find((i) => i.milestone === b)?.milestoneOrder ?? 0;
    return ao - bo;
  });

  const seenTitles = new Set<string>();
  const scopeSummary = milestoneOrder.map((milestone) => {
    const group = analyzed.filter((i) => i.milestone === milestone);
    const titles = new Set(group.map((i) => i.title));
    let novos = 0;
    let herdados = 0;
    for (const title of titles) {
      if (seenTitles.has(title)) herdados += 1;
      else novos += 1;
    }
    for (const title of titles) seenTitles.add(title);
    return {
      Sprint: milestone,
      New: novos,
      Carried: herdados,
      Done: group.filter((i) => i.isDone).length,
      Open: group.filter((i) => !i.isDone).length,
    };
  });

  const milestoneSummary = milestoneOrder.map((milestone) => {
    const group = analyzed.filter((i) => i.milestone === milestone);
    const scope = scopeSummary.find((s) => s.Sprint === milestone)!;
    return {
      Sprint: milestone,
      Items: group.length,
      Carried: scope.Carried,
      Tasks: group.filter((i) => !i.isQa).length,
      QA: group.filter((i) => i.isQa).length,
      Done: group.filter((i) => i.isDone).length,
      Open: group.filter((i) => !i.isDone).length,
      "History >1": group.filter((i) => i.agingSprints > 1).length,
    };
  });

  const agingBuckets = {
    "1": openLatest.filter((i) => i.agingSprints <= 1).length,
    "2": openLatest.filter((i) => i.agingSprints === 2).length,
    "3": openLatest.filter((i) => i.agingSprints === 3).length,
    "4+": openLatest.filter((i) => i.agingSprints >= 4).length,
  };

  const agingItems = agingOpen
    .sort((a, b) => b.agingSprints - a.agingSprints || a.project.localeCompare(b.project))
    .map((i) => ({
      Title: i.title,
      Project: i.project,
      Assignee: i.assignee,
      Age: i.agingSprints,
      Board: i.board,
      Bottleneck: i.isBottleneck ? 1 : 0,
      First: i.firstMilestone,
      Last: i.lastMilestone,
    }));

  const totalCompleted = latest.filter((i) => i.isDone).length || 1;
  const people = new Map<string, AnalyzedItem[]>();
  for (const item of latest) {
    const list = people.get(item.assignee) ?? [];
    list.push(item);
    people.set(item.assignee, list);
  }
  const contributorMix = [...people.entries()]
    .map(([person, group]) => {
      const completed = group.filter((i) => i.isDone).length;
      const open = group.filter((i) => !i.isDone).length;
      const qa = group.filter((i) => i.isQa).length;
      return {
        person,
        completed,
        open,
        qa,
        involved: group.length,
        shareOfCompleted: Math.round((completed / totalCompleted) * 1000) / 10,
      };
    })
    .sort((a, b) => a.person.localeCompare(b.person, undefined, { sensitivity: "base" }));

  const milestones = [...milestoneOrder].reverse().map((milestone) => {
    const group = analyzed.filter((i) => i.milestone === milestone);
    const byProject = new Map<string, AnalyzedItem[]>();
    for (const item of group) {
      const list = byProject.get(item.project) ?? [];
      list.push(item);
      byProject.set(item.project, list);
    }
    const projects = [...byProject.entries()]
      .map(([project, items]) => ({
        project,
        items: items.sort(
          (a, b) =>
            b.agingSprints - a.agingSprints ||
            Number(a.isDone) - Number(b.isDone) ||
            a.title.localeCompare(b.title),
        ),
        open: items.filter((i) => !i.isDone).length,
      }))
      .sort((a, b) => b.open - a.open || b.items.length - a.items.length)
      .map(({ project, items }) => ({ project, items }));

    return {
      milestone,
      stats: {
        items: group.length,
        tasks: group.filter((i) => !i.isQa).length,
        qa: group.filter((i) => i.isQa).length,
        done: group.filter((i) => i.isDone).length,
        open: group.filter((i) => !i.isDone).length,
        aging: group.filter((i) => !i.isDone && i.agingSprints > 1).length,
        bottleneck: group.filter((i) => !i.isDone && i.isBottleneck).length,
      },
      projects,
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    sourceFiles: sources.map((s) => s.fileName),
    cards: {
      unique: latest.length,
      done: latest.filter((i) => i.isDone).length,
      open: openLatest.length,
      projects: projectMap.size,
      qa: latest.filter((i) => i.isQa).length,
      agingOpen: agingOpen.length,
      agingHeavy: agingHeavy.length,
      bottleneck: bottleneck.length,
    },
    charts: {
      statusLabels: [...statusCounts.keys()],
      statusValues: [...statusCounts.values()],
      boardLabels: [...boardCounts.keys()],
      boardValues: [...boardCounts.values()],
      scopeLabels: scopeSummary.map((s) => String(s.Sprint)),
      scopeNew: scopeSummary.map((s) => Number(s.New)),
      scopeCarried: scopeSummary.map((s) => Number(s.Carried)),
      agingLabels: ["1", "2", "3", "4plus"],
      agingValues: [agingBuckets["1"], agingBuckets["2"], agingBuckets["3"], agingBuckets["4+"]],
      projectLabels: projectSummary.map((p) => String(p.Project)),
      projectTasks: projectSummary.map((p) => Number(p.Tasks)),
      projectQa: projectSummary.map((p) => Number(p.QA)),
      projectDone: projectSummary.map((p) => Number(p.Done)),
      projectOpen: projectSummary.map((p) => Number(p.Open)),
      milestoneLabels: milestoneSummary.map((m) => String(m.Sprint)),
      milestoneDone: milestoneSummary.map((m) => Number(m.Done)),
      milestoneOpen: milestoneSummary.map((m) => Number(m.Open)),
    },
    projectSummary,
    milestoneSummary,
    scopeSummary,
    agingItems,
    contributorMix,
    milestones,
    latest,
  };
}
