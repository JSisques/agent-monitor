---
title: Installation
description: Install opencode-agent-radar in OpenCode 2.
---

Requires **OpenCode 2**.

## With the OpenCode CLI

```sh
opencode plugin add opencode-agent-radar@latest
```

Restart OpenCode.

## With `opencode.json`

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": ["opencode-agent-radar@latest"]
}
```

## From source

```sh
git clone https://github.com/JSisques/agent-radar.git
cd agent-radar
pnpm install
pnpm build
```

Then add the absolute path of `packages/opencode-plugin` to `plugins` in your `opencode.json`.

## Usage

1. Open a session and let an agent delegate work.
2. The **Agent Radar** panel in the sidebar lists the running subagents.
3. Click the panel title, or run `/agent-radar`, to open the detail dialog. Close it with `esc`.
