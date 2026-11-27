const STATUS_PT: Record<string, string> = {
  open: "Aberta",
  done: "Finalizada",
  closed: "Finalizada",
  completed: "Finalizada",
  aberta: "Aberta",
  aberto: "Aberta",
  finalizada: "Finalizada",
  finalizado: "Finalizada",
  concluida: "Finalizada",
  concluída: "Finalizada",
};

const STATUS_EN: Record<string, string> = {
  open: "Open",
  done: "Done",
  closed: "Done",
  completed: "Done",
  aberta: "Open",
  aberto: "Open",
  finalizada: "Done",
  finalizado: "Done",
  concluida: "Done",
  concluída: "Done",
};

const BOARD_PT: Record<string, string> = {
  "to do": "A Fazer",
  todo: "A Fazer",
  "a fazer": "A Fazer",
  "in review": "Em Revisão",
  review: "Em Revisão",
  "em revisão": "Em Revisão",
  "em revisao": "Em Revisão",
  "ready for qa": "Pronto para QA",
  "pronto para qa": "Pronto para QA",
  qa: "QA",
  deploy: "Deploy",
  "ready for deploy": "Pronto para deploy",
  "pronto para deploy": "Pronto para deploy",
  "no board": "Sem coluna",
};

const BOARD_EN: Record<string, string> = {
  "to do": "To Do",
  todo: "To Do",
  "a fazer": "To Do",
  "in review": "In Review",
  review: "In Review",
  "em revisão": "In Review",
  "em revisao": "In Review",
  "ready for qa": "Ready for QA",
  "pronto para qa": "Ready for QA",
  qa: "QA",
  deploy: "Deploy",
  "ready for deploy": "Ready for Deploy",
  "pronto para deploy": "Ready for Deploy",
  "no board": "No board",
  "sem coluna": "No board",
};

const PROJECT_PT: Record<string, string> = {
  "core platform": "Plataforma",
  insights: "Indicadores",
  reporting: "Relatórios",
  docs: "Documentação",
  general: "Geral",
  plataforma: "Plataforma",
  indicadores: "Indicadores",
  relatórios: "Relatórios",
  relatorios: "Relatórios",
  documentação: "Documentação",
  documentacao: "Documentação",
};

const PROJECT_EN: Record<string, string> = {
  "core platform": "Core Platform",
  insights: "Insights",
  reporting: "Reporting",
  docs: "Docs",
  general: "General",
  plataforma: "Core Platform",
  indicadores: "Insights",
  relatórios: "Reporting",
  relatorios: "Reporting",
  documentação: "Docs",
  documentacao: "Docs",
};

function lookup(map: Record<string, string>, value: string): string | undefined {
  if (!value || value === "-") return undefined;
  return map[value.trim().toLowerCase()];
}

export function displayStatus(value: string, language: "pt" | "en"): string {
  if (!value || value === "-") return "-";
  return lookup(language === "pt" ? STATUS_PT : STATUS_EN, value) ?? value;
}

export function displayBoard(value: string, language: "pt" | "en"): string {
  if (!value || value === "-") return "-";
  return lookup(language === "pt" ? BOARD_PT : BOARD_EN, value) ?? value;
}

export function displayProject(value: string, language: "pt" | "en"): string {
  if (!value || value === "-") return "-";
  return lookup(language === "pt" ? PROJECT_PT : PROJECT_EN, value) ?? value;
}
