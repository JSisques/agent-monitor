# Contributing to Agent Radar

Thanks for your interest in improving `opencode-agent-radar`. This guide explains how to report problems, propose changes and get a pull request merged.

## Table of contents

- [Reporting bugs](#reporting-bugs)
- [Proposing features](#proposing-features)
- [Development setup](#development-setup)
- [Project structure](#project-structure)
- [Making a change](#making-a-change)
- [Tests](#tests)
- [Documentation](#documentation)
- [Commit messages](#commit-messages)
- [Pull requests](#pull-requests)
- [Releases](#releases)

## Reporting bugs

Open an issue with:

- OpenCode version (`opencode --version`) and plugin version.
- Operating system and terminal.
- What you did, what you expected and what you saw. A screenshot of the sidebar or detail dialog helps a lot.
- For wrong numbers (time, tokens, cost, context), the agent and model involved and whether the subagent launched its own subagents.

## Proposing features

Open an issue before writing code for anything beyond a small fix. Describe the question you want the monitor to answer ("which subagent is stuck?", "where did the context go?"), not only the widget you have in mind. Every metric has to fit the scope rules in [ADR-0003](apps/docs/src/content/docs/adr/0003-aggregation-rules.md): it is either the session's own value or a subtree total, and values that cannot be added up are never summed.

## Development setup

Requirements:

- Node.js 24 or newer (tests run TypeScript through Node's built-in type stripping).
- pnpm 12 (`corepack enable` picks the version pinned in `packageManager`).
- OpenCode 2, to try the plugin in a real TUI.

```sh
git clone https://github.com/JSisques/agent-radar.git
cd agent-radar
pnpm install
pnpm check
```

| Command | What it does |
| --- | --- |
| `pnpm build` | Bundle the plugin and build the docs site |
| `pnpm typecheck` | Type-check every package |
| `pnpm test` | Run the unit tests |
| `pnpm check` | `typecheck` + `test` + `build`, exactly as CI runs it |
| `pnpm docs:dev` | Docs site with hot reload |

### Trying your build in OpenCode

1. Run `pnpm build`.
2. Add the absolute path of `packages/opencode-plugin` to `plugins` in your OpenCode `cli.json` (TUI-only plugins) or a test project's `opencode.json`.
3. Open a **new** OpenCode TUI; running instances do not reload plugins.
4. Ask an agent to delegate work and check the **Agent Radar** sidebar panel and `/agent-radar`.

## Project structure

| Path | Responsibility |
| --- | --- |
| `packages/core` | Domain model, `SessionSource` port, aggregation rules and formatting. No UI, no OpenCode imports. |
| `packages/opencode-plugin/src/adapter.ts` | Translates OpenCode data into `SessionSnapshot`s holding each session's **own** values. Never aggregates. |
| `packages/opencode-plugin/src/tui.tsx` | Sidebar slot, detail dialog and command. Renders `MonitorState`; no business rules. |
| `apps/docs` | Specs, architecture and ADRs (Astro Starlight). |

Keep rules in `core`. If a change needs a test that renders the UI to check a number, the logic is in the wrong place.

## Making a change

1. Create a branch from `main`: `feat/<slug>`, `fix/<slug>`, `docs/<slug>`, `chore/<slug>`.
2. For behavior changes, update the spec first ([metrics](apps/docs/src/content/docs/specs/metrics.md), [UI](apps/docs/src/content/docs/specs/ui.md)). For a design decision, add a new ADR; do not rewrite accepted ones, link the new one from them instead.
3. Write a failing test, make it pass, then refactor.
4. Update the README and docs that describe the behavior you changed.
5. Run `pnpm check`.

### Adding a metric

1. Specify it in `specs/metrics.md`: scope (own or subtree), source and value when unknown.
2. Add the field to `SessionSnapshot` in `packages/core/src/model.ts`.
3. Write a failing test in `packages/core/src/aggregate.test.ts`.
4. Implement it in `aggregate.ts`.
5. Fill it in `adapter.ts` and render it in `tui.tsx`.

## Tests

- Unit tests live next to the code in `packages/core/src/*.test.ts` and use `node:test`.
- Test through the public functions (`buildMonitor`, the formatters), not internal helpers.
- Every aggregation rule needs a test for its own case and for the nested-subagent case.
- Do not commit scratch files, temporary directories or tool caches.

## Documentation

- Code comments, docs, UI text and commit messages are written in English.
- Docs live in `apps/docs/src/content/docs`. Preview them with `pnpm docs:dev`.
- Example output in the README and specs must match what the code actually prints.

## Commit messages

Use [Conventional Commits](https://www.conventionalcommits.org/). release-please reads them to choose the next version and write the changelog:

| Type | Use for | Version bump while below 1.0.0 |
| --- | --- | --- |
| `feat:` | New user-visible behavior | minor |
| `fix:` | Bug fixes | patch |
| `docs:` | Documentation only | none |
| `refactor:`, `test:`, `chore:`, `ci:`, `build:` | Everything else | none |

Mark breaking changes with `!` (`feat!:`) and a `BREAKING CHANGE:` footer.

## Pull requests

- The PR title must be a Conventional Commit: it becomes the commit message, because PRs are **squash-merged**.
- Describe what changed, why, and how you tested it (commands and results, plus manual checks in OpenCode for UI changes).
- Keep PRs focused; split unrelated changes. Aim for reviewable sizes (around 400 changed lines).
- The `check` CI job must pass; `main` does not accept changes without it.
- Branches are deleted automatically after merge.

## Releases

Releases are automated and handled by maintainers:

1. release-please keeps a release PR open with the next version and changelog.
2. Merging it creates the tag and GitHub release.
3. The `publish` workflow publishes `opencode-agent-radar` to npm through trusted publishing (OIDC), with provenance.

Contributors do not need to bump versions or edit `CHANGELOG.md`.

## License

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE).
