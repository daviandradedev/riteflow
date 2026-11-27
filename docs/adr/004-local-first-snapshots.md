# ADR 004 - Local-first snapshots

## Status

Accepted

## Context

Requiring a database before Ceremony exists blocks demos and portfolio evaluation. Hub auth already covers identity across daviandrade.dev apps.

## Decision

Persist snapshots and hypotheses in `localStorage` behind a typed repository. Generation and ceremonies work for guests. Hub login remains optional. A future cloud repository can implement the same interface without rewriting Ceremony.

## Consequences

No app-owned Postgres in v1. Clear upgrade path: swap `SnapshotRepository` implementation.
