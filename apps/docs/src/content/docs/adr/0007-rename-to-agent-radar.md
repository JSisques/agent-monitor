---
title: "ADR-0007: Rename the project to Agent Radar"
description: The original npm name was taken; the plugin becomes opencode-agent-radar and the repository agent-radar.
---

- **Status:** Accepted
- **Date:** 2026-11-27

## Context

The project was first called `opencode-agent-monitor`. Before the first release we found that this name already belongs to an unrelated npm package (`tenondecrpc/opencode-agent-monitor`, published in April 2026). Publishing under it is impossible, and keeping the name for the repository and the UI would send users to someone else's package.

## Decision

Rename the whole project identity to **Agent Radar**: the published plugin is `opencode-agent-radar` and the repository is `agent-radar`.

| Before | After |
| --- | --- |
| npm package `opencode-agent-monitor` | `opencode-agent-radar` |
| GitHub repository `JSisques/agent-monitor` | `JSisques/agent-radar` |
| Internal package `@agent-monitor/core` | `@agent-radar/core` |
| UI title `Agent Monitor` | `Agent Radar` |
| Command `/agent-monitor`, palette `Agent monitor` | `/agent-radar`, `Agent radar` |
| Plugin id `agent-monitor.tui` | `agent-radar.tui` |

Nothing had been published yet, so the rename breaks no installation.

Earlier ADRs were updated to the new names; their decisions are unchanged.

## Consequences

- Every new package name is checked against the npm registry before it is adopted.
- The collapsed state of the sidebar uses a new storage key and starts expanded once after the rename.
