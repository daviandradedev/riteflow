# ADR 006 - Cloud workspace behind the same repository boundary

## Status

Accepted

## Context

Local-first demos work. Portfolio and real squads need the same snapshots/hypotheses on another device without rewriting Ceremony. Hub auth already identifies the user as email.

## Decision

1. Keep `localStorage` as the primary runtime store for guests.
2. Expose a versioned `WorkspacePayload` (`snapshots` + `hypotheses`) with merge-by-id.
3. Authenticated users sync via `GET/PUT /api/workspace` into `riteflow_workspace` (JSONB per `user_id`) when `AUTH_DATABASE_URL` is present.
4. Export/import JSON remains the offline growth path and disaster recovery.
5. Board adapters (Jira/GitLab) stay out of Ceremony - they only produce `ReportPayload` → snapshot.

## Consequences

Ceremony code never talks to Postgres. Cloud is optional. Missing DB returns `503 workspace_unavailable` and the client stays local. Team/shared boards are a later layer on top of the same payload.
