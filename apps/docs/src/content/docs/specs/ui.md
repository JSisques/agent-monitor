---
title: User interface
description: Sidebar panel, detail dialog and command.
---

## Sidebar panel

Appended to the `sidebar.content` slot of the session view.

```text
Agent Monitor
explore · read · 1m 12s
explore · grep · 18s
worker · task · 3m 5s
```

- Title: `Agent Monitor`. Clicking it opens the detail dialog.
- One line per **running direct child** of the main session: `agent · tool · time`.
- `thinking` replaces the tool while no tool is running.
- Empty state: `No subagents running`.

## Detail dialog

Opened by clicking the sidebar title, by `/agent-monitor`, or from the command palette (`Agent monitor`). Large, centered, scrollable; closes with `esc`.

```text
Agent Monitor                                              esc

explore · done · Map the auth module
42s · ctx 18% · 52.3K tok · $0.04

worker · task · Implement the login fix
3m 5s · ctx 61% · 310.2K tok · $0.40 (incl. 1 sub)
  explore · done · Find callers of validateToken
  2m 0s · ctx 22% · 140.0K tok · $0.30
```

- Lists every direct child of the main session, running or finished, ordered by start time.
- Descendants are nested and indented under their parent.
- First line: agent · current tool (or `done`) · session title.
- Second line: elapsed time · context % · tokens · cost, with `(incl. N sub)` when the totals include descendants.
- Empty state: `No subagents launched in this session yet.`

## Command

| Trigger | Action |
| --- | --- |
| `/agent-monitor` | Open the detail dialog for the current session |
| Command palette → `Agent monitor` | Same |
| Outside a session | Toast: `Open a session to see its subagents.` |
