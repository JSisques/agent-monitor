---
title: Metrics
description: Definition, scope and source of every metric the monitor shows.
---

Every metric is defined per **row**, and a row is one subagent launch (one child session).

| Metric | Scope | Definition | Unknown value |
| --- | --- | --- | --- |
| Agent | own | `SessionInfo.agent` | `agent` |
| Models | own | Distinct model ids of the session's assistant messages, in order of first use; the last one is the current model. Before the first reply, `SessionInfo.model`. Shown as `a → b`. | hidden |
| Current tool | own | Name of the last tool part in `running` or `streaming` state in the latest assistant message. Empty while the model is generating text. | shown as `thinking` |
| Elapsed time | own | Running: `now − time.created`. Idle: `time.idle − time.created` (fallback `time.updated`). Children are never added. | — |
| Context % | own | `contextUsed / model.limit.context × 100`, where `contextUsed` is input + output + reasoning + cache read + cache write of the latest assistant call. | `—` |
| Tokens | subtree | Sum of input, output, reasoning, cache read and cache write of the session and all descendants. | 0 |
| Cost | subtree | Sum of `SessionInfo.cost` (USD, as reported by OpenCode) of the session and all descendants. | `—`; `partial` if some descendants are unknown |

## Session summary

Shown at the top of the detail dialog. The root session itself is excluded.

| Metric | Definition |
| --- | --- |
| Agents / running / done | Subagent sessions at any depth, split by status |
| Wall time | Length of the union of the direct children's `[start, end]` intervals (running children end at now) |
| Agent time | Sum of the direct children's own elapsed time |
| Parallelism | Agent time ÷ wall time, one decimal (`2.0×`); hidden when wall time is 0 |
| Tokens | Sum over every subagent at any depth |
| Cost | Sum over every subagent at any depth; `partial` if any is unknown |

Grandchildren are excluded from both time values because their time already runs inside their parent's.

## Formatting

| Value | Format | Examples |
| --- | --- | --- |
| Duration | `Ns`, `Nm Ns`, `Nh Nm` | `42s`, `1m 12s`, `1h 2m` |
| Tokens | plain, `K` (1 decimal), `M` (2 decimals) | `812`, `139.4K`, `3.70M` |
| Cost | `$0.00`; below $0.001 → `<$0.001` | `$0.40`, `$0.40 partial` |
| Context | rounded percentage | `62%` |

## Refresh

- Every OpenCode event triggers a recomputation.
- A one-second ticker advances elapsed time for running sessions.
