---
title: User interface
description: Sidebar panel, detail dialog and command.
---

## Sidebar panel

Appended to the `sidebar.content` slot of the session view.

```text
▼ Agent Monitor (3)
explore · read · 1m 12s
explore · grep · 18s
worker · task · 3m 5s
```

- `▼` / `▶` collapses or expands the list. The state is persisted and survives restarts.
- Title: `Agent Monitor`, followed by the number of running subagents when there is at least one. Clicking the title opens the detail dialog.
- One line per **running direct child** of the main session: `agent · tool · time`.
- `thinking` replaces the tool while no tool is running.
- Empty state: `No subagents running`.

## Detail dialog

Opened by clicking the sidebar title, by `/agent-monitor`, or from the command palette (`Agent monitor`). Large, centered, scrollable; closes with `esc`.

```text
Agent Monitor                                              esc

3 agents · 1 running · 2 done
wall 3m 47s · agent time 3m 47s (1.0×)
362.5K tok · $0.44

In progress (1)

worker (qwen3.8-27b) · task · Implement the login fix
3m 5s · ctx 61% · 310.2K tok · $0.40 (incl. 1 sub)
  explore (gpt-oss-20b) · done · Find callers of validateToken
  2m 0s · ctx 22% · 140.0K tok · $0.30

History (1)

explore (qwen3.8-27b → gpt-oss-20b) · done · Map the auth module
42s · ctx 18% · 52.3K tok · $0.04
```

### Summary

| Line | Contents |
| --- | --- |
| 1 | Subagents at any depth · running · done |
| 2 | `wall`: time during which at least one direct child was running · `agent time`: sum of the direct children's own time · parallelism `agent ÷ wall` |
| 3 | Tokens and cost of every subagent (root excluded) |

### Sections

- **In progress**: running direct children of the main session.
- **History**: finished direct children of the main session.
- Each section shows its count and an empty-state line (`No subagents running`, `No subagents finished yet`).
- Rows are ordered by start time; descendants are nested and indented under their parent.
- Row line 1: agent (models used, `a → b` when the session switched) · current tool (or `done`) · session title.
- Row line 2: elapsed time · context % · tokens · cost, with `(incl. N sub)` when the totals include descendants.
- Empty dialog: `No subagents launched in this session yet.`

## Command

| Trigger | Action |
| --- | --- |
| `/agent-monitor` | Open the detail dialog for the current session |
| Command palette → `Agent monitor` | Same |
| Outside a session | Toast: `Open a session to see its subagents.` |
