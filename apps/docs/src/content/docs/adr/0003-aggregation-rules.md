---
title: "ADR-0003: Additive metrics sum the subtree, the rest stay own"
description: Cost and tokens include descendants; time, context and current tool do not.
---

- **Status:** Accepted
- **Date:** 2026-11-27

## Context

A subagent can delegate to its own subagents. The sidebar only shows direct children of the main session (ADR-0004), so a grandchild's spend must be accounted for somewhere. Not every metric can be added up, though.

Example: a `worker` runs from 10:00 to 10:05 and costs $0.10. At 10:01 it launches an `explore` that runs until 10:03 and costs $0.30.

## Decision

| Metric | Scope | `worker` row in the example |
| --- | --- | --- |
| Cost | subtree | $0.40 (incl. 1 sub) |
| Tokens | subtree | worker + explore |
| Elapsed time | own | 5m, not 7m |
| Context % | own | worker's own window |
| Current tool | own | `task` while waiting for the explore |

- **Cost and tokens are additive**: each session spends independently, so the explore's $0.30 is extra money. If it were not added, it would not appear anywhere and the rows would not add up to the session cost.
- **Time is not additive**: the explore's 2 minutes happen *inside* the worker's 5 minutes while the worker waits. Adding them counts the same interval twice; three levels of delegation could show 15 minutes for a 5-minute task.
- **Context is not additive**: it is the window of one conversation with one model. 60% + 40% is not "100% of something".
- **Current tool is own**: a parent waiting for its child is running `task`, which is exactly what it is doing.
- If any session in the subtree has an unknown cost, the total is marked `partial` instead of silently showing a lower number.

## Consequences

- The detail view shows each grandchild with its own values, so the subtree totals can be broken down.
- The rules live in `packages/core/src/aggregate.ts` and are pinned by unit tests.
