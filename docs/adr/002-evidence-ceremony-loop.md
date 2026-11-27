# ADR 002 - Evidence → Ceremony → Loop

## Status

Accepted

## Context

Splitting facilitation and analytics into two apps would recreate EasyRetro + ActionableAgile without the missing join. Combining every Scrum textbook feature would create a shallow all-in-one.

## Decision

One product with three layers:

1. Evidence produces immutable snapshots.
2. Ceremony playbooks read snapshots and structure Daily / Retro / Planning.
3. Loop stores hypotheses tied to system metrics and verifies them on later snapshots.

## Consequences

Roadmap prioritizes the join (snapshot → retro questions → hypothesis) over icebreaker templates or Monte Carlo forecasting.
