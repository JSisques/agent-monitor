---
title: "ADR-0001: Monorepo with pnpm workspaces and Turborepo"
description: Split documentation, domain logic and presentation into separate workspaces orchestrated by Turborepo.
---

- **Status:** Accepted
- **Date:** 2026-11-27

## Context

The project needs a documentation site (ADRs, specs, guides) and an OpenCode TUI plugin. The aggregation rules (what is summed, what is not) are the most error-prone part and have no UI dependency.

## Decision

Use a pnpm workspaces monorepo orchestrated by Turborepo:

- `apps/docs`: Astro + Starlight documentation site.
- `packages/core`: UI-free domain model, port and aggregation rules.
- `packages/opencode-plugin`: OpenCode TUI plugin (adapter + rendering).

Turborepo runs `build`, `typecheck` and `test` across workspaces with dependency ordering and caching.

## Consequences

- Aggregation rules are unit-tested with plain fixtures, without OpenTUI or a running OpenCode.
- One `pnpm check` runs every check in every workspace.
- Turborepo is an extra dev dependency compared with plain `pnpm -r`.
