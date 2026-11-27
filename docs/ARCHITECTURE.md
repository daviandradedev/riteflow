# Riteflow architecture

**Riteflow** is an evidence-first operating system for Scrum ceremonies.

Tagline: *Scrum ceremonies that start from board evidence - not from opinions.*

## Product spine

```
Evidence → Ceremony → Loop
```

| Layer | Job | Non-goal |
|-------|-----|----------|
| **Evidence** | Turn board exports / manual rows into immutable sprint snapshots and exports (HTML/PDF) | Performance scoreboard |
| **Ceremony** | Run Daily, Retro, and Planning playbooks fed by the latest snapshot | Sticky-only retro clones |
| **Loop** | Capture hypotheses with target system metrics and verify them on the next snapshot | Individual ranking |

## Why this is different

Most tools pick one corner: facilitation (EasyRetro), flow analytics (ActionableAgile), or async standup (Geekbot). Riteflow closes the missing loop: **signal → facilitated decision → measurable hypothesis → next signal**.

## Senior design decisions

See `docs/adr/` for the full record. Summary:

1. **One product, three modules** - not three apps. The differentiator is the join.
2. **Blameless metrics policy** - system signals only across time (aging, bottleneck share, carryover, new vs carried). No cross-sprint person leaderboards.
3. **Board-agnostic Evidence** - CSV/PDF/manual first; live Jira/GitLab APIs are a later adapter behind the same snapshot schema.
4. **Local-first snapshots** - browser storage works without login; hub auth unlocks shared identity later, not report generation.
5. **Ceremony consumes snapshots** - playbooks never invent KPIs; they only narrate stored signals.
6. **Hypotheses are first-class** - every Retro action names a metric key and a direction; Compare/Loop evaluate it.
7. **International product surface** - English source, `en`/`pt` UI, WCAG 2.2 AA, hub SSO - the same contract as other daviandrade.dev apps.

## Module map

| Route | Module |
|-------|--------|
| `/` | Product home |
| `/evidence` | Import or enter sprint data |
| `/report` | Sprint health report, charts, and snapshot archive |
| `/daily` | Persisted standup agenda from aging and blocked items |
| `/retro` | Evidence-backed retrospective and follow-up creation |
| `/loop` | Follow-up tracker verified against the next sprint |
| `/planning` | Capacity simulator and carryover guardrails |
| `/compare` | Cross-sprint system trends and Sprint Wrap-up Brief export |

## Data contracts

- `ReportPayload` - analyzed sprint view (health score, charts, cards, detail).
- `SprintSnapshot` - immutable Evidence record (`id`, `createdAt`, `label`, `sourceFiles`, `metrics`, `payload`).
- `Hypothesis` - `{ id, metric, direction, baseline, targetNote, status, snapshotId }`.

## Growth path

1. **Guest local-first** - snapshots, ceremony notes, and follow-ups in `localStorage`.
2. **Workspace JSON & Wrap-up Brief** - export/import workspace backups and copy/download Markdown stakeholder briefs.
3. **Hub sync** - `GET/PUT /api/workspace` merges into `riteflow_workspace` when auth DB is configured (ADR 006).
4. **Board adapters** - future Jira/GitLab importers emit the same `ReportPayload`.
5. **Shared team boards** - collaborative layer on top of the workspace payload while Ceremony playbooks stay unchanged.
