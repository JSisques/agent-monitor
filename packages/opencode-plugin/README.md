# opencode-agent-radar

OpenCode 2 TUI plugin that shows, for every subagent, the tool it is running, how long it has been running, its context usage, tokens and cost.

```sh
opencode plugin add opencode-agent-radar@latest
```

- **Sidebar**: one line per running subagent: `agent · tool · time`.
- **Detail**: click the **Agent Radar** title or run `/agent-radar` to see every subagent of the session, finished ones and nested subagents included.

Full documentation, metric definitions and design decisions: <https://github.com/JSisques/agent-radar>

MIT licensed. Independent community plugin, not affiliated with the OpenCode team.
