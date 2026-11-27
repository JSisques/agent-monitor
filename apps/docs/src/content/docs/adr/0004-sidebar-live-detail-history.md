---
title: "ADR-0004: Sidebar shows live children, detail shows full history"
description: The sidebar is a glanceable live view; the detail dialog is the complete record.
---

- **Status:** Accepted
- **Date:** 2026-11-27

## Context

The sidebar is about 40 columns wide and must stay readable in long sessions with many delegations. The main question while working is "what are my subagents doing right now?".

## Decision

- **Sidebar**: only running direct children of the main session, one line each: `agent · tool · time`. Finished subagents disappear. Grandchildren never appear.
- **Detail dialog** (click the sidebar title or run `/agent-monitor`): every direct child, running or finished, with nested descendants, and elapsed time, context %, tokens and cost for each.

The sidebar shows the current tool instead of tokens because "what is it doing now" was the original pain; consumption is one click away.

## Consequences

- The sidebar never fills up with noise from finished work.
- Spend of finished subagents is still visible in the detail view.
