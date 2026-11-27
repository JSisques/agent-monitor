---
title: "ADR-0006: Detail summary, separate sections and a collapsible sidebar"
description: The detail dialog gets a session summary and splits running and finished subagents; the sidebar section can be collapsed.
---

- **Status:** Accepted
- **Date:** 2026-11-27
- **Refines:** [ADR-0004](/adr/0004-sidebar-live-detail-history/)

## Context

The first live test showed a detail dialog that was too thin: one undivided list, no overview of the session as a whole. In long sessions the sidebar section also takes space that is not always wanted.

## Decision

### Detail dialog

A summary header, then two sections:

```text
5 agents · 2 running · 3 done
wall 4m 10s · agent time 8m 20s (2.0×)
612.4K tok · $0.42

In progress (2)
History (3)
```

| Summary value | Scope | Why |
| --- | --- | --- |
| Agents, running, done | every subagent at any depth | Each one is a real launch. |
| Tokens, cost | every descendant of the root, root excluded | Additive (ADR-0003). |
| Wall time | union of the direct children's intervals | "How long have I been waiting for subagents?" Gaps between sequential runs are not counted. |
| Agent time | sum of the direct children's own elapsed time | "How much agent work was done?" Like person-hours: two agents for 4 minutes are 8 minutes of work. |
| Parallelism | agent time ÷ wall time | Whether the orchestrator delegates in parallel or one at a time. |

Time uses direct children only: a grandchild's time already runs inside its parent's (ADR-0003), so counting it again would double it. Both time values are shown with distinct labels so neither is mistaken for the other.

There is no context percentage in the summary: context windows are not additive.

### Sidebar

- A `▼` / `▶` toggle collapses and expands the subagent list, as OpenCode does for its own sidebar sections.
- The title still opens the detail dialog; the toggle and the title are separate click targets.
- While collapsed, the title shows the number of running subagents: `▶ Agent Radar (2)`.
- The collapsed state is persisted with the plugin storage API and survives restarts.

## Consequences

- `MonitorState` gains `finished` and `summary`; `AgentRow` gains `startedAt` to compute intervals.
- New rules are pinned by unit tests in `packages/core`.
