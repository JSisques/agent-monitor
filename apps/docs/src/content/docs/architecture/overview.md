---
title: Overview
description: How the core package, the OpenCode adapter and the TUI fit together.
---

The project follows a ports-and-adapters (hexagonal) layout. The domain rules know nothing about OpenCode or the terminal.

```text
          OpenCode TUI host
                 │  context.data (sessions, messages, events)
                 ▼
┌──────────────────────────────────────────┐
│ packages/opencode-plugin                 │
│                                          │
│  adapter.ts  OpenCodeSessionSource       │  driven adapter: host data → SessionSnapshot[]
│  tui.tsx     sidebar slot, dialog,       │  driving adapter: renders MonitorState
│              /agent-radar command      │
└──────────────┬───────────────────────────┘
               │ SessionSource port
               ▼
┌──────────────────────────────────────────┐
│ packages/core  (private, bundled)        │
│                                          │
│  model.ts      SessionSnapshot, AgentRow │
│  ports.ts      SessionSource             │
│  aggregate.ts  buildMonitor()            │  all aggregation rules live here
│  format.ts     durations, tokens, cost   │
└──────────────────────────────────────────┘
```

## Data flow

1. The adapter subscribes to every OpenCode event (`context.data.listen`) and bumps a version signal.
2. A one-second ticker updates `now`, so running timers advance without new events.
3. For the session being viewed, the plugin resolves its root (`data.session.root`) and its family (`data.session.family`).
4. The adapter converts every session in the family into a `SessionSnapshot` holding only that session's **own** values.
5. `buildMonitor(rootId, snapshots, now)` builds the tree, applies the aggregation rules and returns `{ live, history }`.
6. The sidebar renders `live`; the detail dialog renders `history`.

## Where each value comes from

| Snapshot field | OpenCode source |
| --- | --- |
| `parentId`, `agent`, `title` | `SessionInfo.parentID`, `.agent`, `.title` |
| `status` | `data.session.status(id)` (`running` / `idle`) |
| `startedAt`, `endedAt` | `SessionInfo.time.created`, `.time.idle` (fallback `.time.updated`) |
| `tokens`, `costUsd` | `SessionInfo.tokens`, `SessionInfo.cost` |
| `models` | distinct `model.id` of the assistant messages in order; before the first reply, `SessionInfo.model.id` |
| `currentTool` | last assistant message, last tool part in `running` or `streaming` state |
| `contextUsed` | last assistant message with `tokens`: input + output + reasoning + cache read + cache write |
| `contextLimit` | the session model's `limit.context` from `data.location.model.list()` |

## Why the core is bundled

`@agent-radar/core` is private. The plugin build inlines it into `dist/tui.js`, so users install a single package. See [ADR-0005](/adr/0005-bundle-core-into-plugin/).
