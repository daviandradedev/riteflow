# Riteflow

A closed-loop sprint operating system that turns real board data into focused ceremonies and a ready-to-share **Sprint Wrap-up Brief**.

Live app: [riteflow.daviandrade.dev](https://riteflow.daviandrade.dev)

---

## English

### What it does

Most teams either talk in retrospectives without data or build dashboards nobody uses in meetings. Riteflow connects real board signals directly to every sprint ceremony in one guided flow:

```
Data → Report → Daily → Retro → Follow-ups → Planning → Wrap-up Brief
```

- **Import or demo data (`/evidence`):** Upload board CSV/PDF exports, type rows manually, or load a realistic 3-sprint sample pack in one click.
- **Sprint health & report (`/report`):** Get an automatic 0-100 Sprint Health Score, flow breakdown charts, bottleneck alerts, and HTML/PDF/CSV/JSON exports.
- **Standup agenda (`/daily`):** See aging and blocked items ranked by flow risk, with persisted standup notes and blocker tracking.
- **Evidence-backed retro (`/retro`):** Discuss concrete workflow signals (not opinions) and turn decisions into measurable follow-ups.
- **Follow-up tracker (`/loop`):** Track agreed actions across sprints and verify whether the target metric actually improved.
- **Capacity simulator (`/planning`):** Factor carryover and active follow-ups into the next sprint before committing new scope.
- **Compare & Wrap-up Brief (`/compare`):** Track system trends across sprints (blameless, zero people rankings) and copy or download a Markdown **Sprint Wrap-up Brief** for Slack, Notion, or Jira.

Works locally right away without login. Optional sign-in via [auth.daviandrade.dev](https://auth.daviandrade.dev) syncs workspaces across devices.

### Stack

Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · Chart.js · jsPDF · Better Auth SSO · Vitest · EN/PT · WCAG 2.2 AA

### Run locally

```bash
git clone https://github.com/daviandradedev/riteflow.git
cd riteflow
pnpm install
cp .env.example .env.local
pnpm dev
```

Open [http://localhost:3300](http://localhost:3300). Auth variables are optional for local use.

### Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start dev server on port 3300 |
| `pnpm test` | Run unit, translation parity, and health score tests |
| `pnpm lint` | Run ESLint |
| `pnpm build` | Production build |

More architecture notes: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) and [docs/adr/](docs/adr/).

---

## Português

### O que faz

Muitas equipes fazem retrospectivas sem dados ou mantêm dashboards que ninguém olha nas reuniões. O Riteflow conecta os dados reais do board a cada cerimônia da sprint em um fluxo fechado:

```
Dados → Relatório → Daily → Retrospectiva → Combinados → Planning → Fechamento
```

- **Dados ou demonstração (`/evidence`):** Importe CSV/PDF do board, preencha manualmente ou carregue 3 sprints de exemplo com um clique.
- **Saúde da sprint e relatório (`/report`):** Índice automático de Saúde da Sprint (0-100), gráficos de fluxo, alertas de gargalo e exportação em HTML, PDF, CSV e JSON.
- **Pauta da Daily (`/daily`):** Itens parados e envelhecidos priorizados por risco, com anotações e bloqueios salvos por sprint.
- **Retrospectiva com evidências (`/retro`):** Conduza a conversa com base nos números reais do fluxo e transforme decisões em combinados mensuráveis.
- **Acompanhamento de combinados (`/loop`):** Verifique na sprint seguinte se as ações combinadas realmente melhoraram a métrica alvo.
- **Simulador de capacidade (`/planning`):** Desconte o carryover e considere os combinados ativos antes de assumir novo escopo.
- **Comparação e Resumo de Fechamento (`/compare`):** Compare tendências entre sprints (sem ranking de pessoas) e copie ou baixe um **Resumo de Fechamento em Markdown** pronto para Slack, Notion ou Jira.

Funciona direto no navegador sem conta. O login opcional em [auth.daviandrade.dev](https://auth.daviandrade.dev) sincroniza o workspace entre dispositivos.

### Stack

Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · Chart.js · jsPDF · Better Auth SSO · Vitest · PT/EN · WCAG 2.2 AA

### Rodar localmente

```bash
git clone https://github.com/daviandradedev/riteflow.git
cd riteflow
pnpm install
cp .env.example .env.local
pnpm dev
```

Abra [http://localhost:3300](http://localhost:3300). As variáveis de autenticação são opcionais para uso local.

### Scripts

| Comando | Descrição |
| --- | --- |
| `pnpm dev` | Sobe o servidor local na porta 3300 |
| `pnpm test` | Roda testes unitários, paridade de traduções e saúde da sprint |
| `pnpm lint` | Roda ESLint |
| `pnpm build` | Gera o build de produção |

Mais detalhes de arquitetura em [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) e [docs/adr/](docs/adr/).
