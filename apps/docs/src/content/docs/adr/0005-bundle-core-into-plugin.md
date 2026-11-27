---
title: "ADR-0005: Bundle the core package into the plugin"
description: Publish a single npm package; keep core private.
---

- **Status:** Accepted
- **Date:** 2026-11-27

## Context

The plugin depends on `@agent-radar/core` through `workspace:*`. Publishing the plugin's TypeScript sources as-is would leave users with a dependency that does not exist on npm. release-please only versions and tags; it does not publish or rewrite dependencies.

## Decision

- `@agent-radar/core` is `private` and never published.
- The plugin has a build step (`scripts/build.mjs`): esbuild bundles `src/tui.tsx` and core with `jsx: "preserve"`, then `babel-preset-solid` compiles the JSX for OpenTUI's universal renderer.
- Host-provided modules (`@opencode/plugin`, `@opentui/*`, `solid-js`) stay external.
- The published package exports `./tui` → `dist/tui.js`.

## Consequences

- Users install one package: `opencode-agent-radar`.
- The plugin needs `build` before `pack`/`publish`; the publish workflow runs it.
- Core is listed as a dev dependency of the plugin, so it never appears in the published dependency list.
