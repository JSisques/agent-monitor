---
title: Development
description: Work on the monorepo locally.
---

## Prerequisites

- Node.js 24 or newer (tests run TypeScript directly through Node's type stripping).
- pnpm 12 (`corepack enable` picks the version pinned in `packageManager`).

## Commands

| Command | What it does |
| --- | --- |
| `pnpm install` | Install every workspace |
| `pnpm build` | Build the plugin bundle and the docs site |
| `pnpm typecheck` | Type-check every package |
| `pnpm test` | Run unit tests (`packages/core`) |
| `pnpm check` | typecheck + test + build |
| `pnpm docs:dev` | Start the docs site with hot reload |

All of them go through Turborepo, so unchanged packages are served from cache.

## Adding a metric

1. Define it in [Specs → Metrics](/specs/metrics/): scope (own or subtree), source and unknown value.
2. Add the field to `SessionSnapshot` in `packages/core/src/model.ts`.
3. Write the failing test in `packages/core/src/aggregate.test.ts`.
4. Implement it in `aggregate.ts`.
5. Fill it in `packages/opencode-plugin/src/adapter.ts` and render it in `tui.tsx`.
