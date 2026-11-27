# ADR 005 - Hub auth optional for Evidence

## Status

Accepted

## Context

Other daviandrade.dev apps use the auth hub for identity. Blocking report generation behind login would hurt demos and contradict “visitor can explore”.

## Decision

Evidence and local Ceremony work without session. Hub SSO (`auth.daviandrade.dev`) provides Entrar / account handoff. Persistence stays local-first until a cloud repository exists.

## Consequences

`getAuth()` may return null without env. UI never requires login to analyze CSV or run a playbook on a local snapshot.
