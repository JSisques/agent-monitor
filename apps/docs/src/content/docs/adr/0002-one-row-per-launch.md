---
title: "ADR-0002: One row per subagent launch"
description: A row represents one child session, not one agent type.
---

- **Status:** Accepted
- **Date:** 2026-11-27

## Context

An orchestrator can launch the same agent type several times with different tasks, for example two `explore` runs and one `worker`.

## Decision

A row is one child session (one launch). Two `explore` launches produce two rows.

## Consequences

- Two runs of the same agent can be compared side by side; aggregating by type would hide that.
- Rows are labelled with the agent name and, in the detail view, the session title to tell launches apart.
