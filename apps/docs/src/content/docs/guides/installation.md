---
title: Installation
description: Install opencode-agent-monitor in OpenCode 2.
---

Requires **OpenCode 2**.

## With the OpenCode CLI

```sh
opencode plugin add opencode-agent-monitor@latest
```

Restart OpenCode.

## With `opencode.json`

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": ["opencode-agent-monitor@latest"]
}
```

## From source

```sh
git clone https://github.com/JSisques/agent-monitor.git
cd agent-monitor
pnpm install
pnpm build
```

Then add the absolute path of `packages/opencode-plugin` to `plugins` in your `opencode.json`.

## Usage

1. Open a session and let an agent delegate work.
2. The **Agent Monitor** panel in the sidebar lists the running subagents.
3. Click the panel title, or run `/agent-monitor`, to open the detail dialog. Close it with `esc`.
