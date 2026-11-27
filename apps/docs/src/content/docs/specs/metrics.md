---
title: Metrics
description: Definition, scope and source of every metric the monitor shows.
---

Every metric is defined per **row**, and a row is one subagent launch (one child session).

| Metric | Scope | Definition | Unknown value |
| --- | --- | --- | --- |
| Agent | own | `SessionInfo.agent` | `agent` |
| Current tool | own | Name of the last tool part in `running` or `streaming` state in the latest assistant message. Empty while the model is generating text. | shown as `thinking` |
| Elapsed time | own | Running: `now − time.created`. Idle: `time.idle − time.created` (fallback `time.updated`). Children are never added. | — |
| Context % | own | `contextUsed / model.limit.context × 100`, where `contextUsed` is input + output + reasoning + cache read + cache write of the latest assistant call. | `—` |
| Tokens | subtree | Sum of input, output, reasoning, cache read and cache write of the session and all descendants. | 0 |
| Cost | subtree | Sum of `SessionInfo.cost` (USD, as reported by OpenCode) of the session and all descendants. | `—`; `partial` if some descendants are unknown |

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
