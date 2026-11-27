import type { AgentRow, MonitorState, SessionSnapshot, TokenUsage } from "./model.ts"

const ZERO_TOKENS: TokenUsage = { input: 0, output: 0, reasoning: 0, cacheRead: 0, cacheWrite: 0 }

const addTokens = (a: TokenUsage, b: TokenUsage): TokenUsage => ({
  input: a.input + b.input,
  output: a.output + b.output,
  reasoning: a.reasoning + b.reasoning,
  cacheRead: a.cacheRead + b.cacheRead,
  cacheWrite: a.cacheWrite + b.cacheWrite,
})

/**
 * Builds the monitor state for one root session.
 *
 * Aggregation rules (see ADR-0003):
 * - cost and tokens sum the whole subtree, so delegated spend never disappears;
 * - elapsed time, context percentage and current tool are the session's own,
 *   because a child's time already runs inside its parent's wall clock and
 *   context windows are per conversation.
 */
export function buildMonitor(rootId: string, sessions: readonly SessionSnapshot[], now: number): MonitorState {
  const childrenOf = new Map<string, SessionSnapshot[]>()
  for (const session of sessions) {
    if (session.parentId === undefined) continue
    const siblings = childrenOf.get(session.parentId) ?? []
    siblings.push(session)
    childrenOf.set(session.parentId, siblings)
  }

  const toRow = (session: SessionSnapshot, visited: Set<string>): AgentRow => {
    visited.add(session.id)
    const children = (childrenOf.get(session.id) ?? [])
      .filter((child) => !visited.has(child.id))
      .sort((a, b) => a.startedAt - b.startedAt)
      .map((child) => toRow(child, visited))

    let tokens = session.tokens
    let costUsd = session.costUsd
    let costPartial = session.costUsd === undefined
    let descendantCount = 0
    for (const child of children) {
      tokens = addTokens(tokens, child.tokens)
      if (child.costUsd !== undefined) costUsd = (costUsd ?? 0) + child.costUsd
      costPartial ||= child.costPartial
      descendantCount += 1 + child.descendantCount
    }

    const end = session.status === "running" ? now : (session.endedAt ?? now)
    const contextPercent =
      session.contextUsed !== undefined && session.contextLimit !== undefined && session.contextLimit > 0
        ? (session.contextUsed / session.contextLimit) * 100
        : undefined

    return {
      sessionId: session.id,
      agent: session.agent,
      title: session.title,
      status: session.status,
      currentTool: session.currentTool,
      elapsedMs: Math.max(0, end - session.startedAt),
      contextPercent,
      tokens,
      costUsd,
      costPartial,
      descendantCount,
      children,
    }
  }

  const visited = new Set<string>([rootId])
  const history = (childrenOf.get(rootId) ?? [])
    .slice()
    .sort((a, b) => a.startedAt - b.startedAt)
    .map((child) => toRow(child, visited))

  return {
    live: history.filter((row) => row.status === "running"),
    history,
  }
}

export { ZERO_TOKENS }
