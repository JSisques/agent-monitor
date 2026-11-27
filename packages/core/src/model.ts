/** Token counters reported for one session, excluding its children. */
export interface TokenUsage {
  readonly input: number
  readonly output: number
  readonly reasoning: number
  readonly cacheRead: number
  readonly cacheWrite: number
}

export type SessionStatus = "running" | "idle"

/**
 * Host-agnostic view of one session. Every value is the session's OWN value:
 * aggregation over children happens in `buildMonitor`, never in adapters.
 */
export interface SessionSnapshot {
  readonly id: string
  readonly parentId?: string
  readonly agent: string
  readonly title?: string
  readonly status: SessionStatus
  /** Epoch ms when the session was created. */
  readonly startedAt: number
  /** Epoch ms when the session last went idle; undefined while it has never finished. */
  readonly endedAt?: number
  /** Name of the tool the session is executing right now, if any. */
  readonly currentTool?: string
  readonly tokens: TokenUsage
  /** Cost in USD; undefined when the host could not price it. */
  readonly costUsd: number | undefined
  /** Tokens occupying the context window in the latest model call. */
  readonly contextUsed?: number
  /** Context window size of the session's model. */
  readonly contextLimit?: number
}

/** One subagent launch as shown by the monitor. */
export interface AgentRow {
  readonly sessionId: string
  readonly agent: string
  readonly title?: string
  readonly status: SessionStatus
  /** Epoch ms when the session was created. */
  readonly startedAt: number
  /** Own: the tool this session is running now. */
  readonly currentTool?: string
  /** Own: wall-clock time of this session. Children run inside it, so they are never added. */
  readonly elapsedMs: number
  /** Own: percentage of this session's context window, 0-100. */
  readonly contextPercent?: number
  /** Subtree: this session plus every descendant. */
  readonly tokens: TokenUsage
  /** Subtree: this session plus every descendant; undefined when nothing is priced. */
  readonly costUsd: number | undefined
  /** True when at least one session in the subtree has an unknown cost. */
  readonly costPartial: boolean
  /** Number of descendants folded into the subtree totals. */
  readonly descendantCount: number
  /** Direct children of this session, for the detail view. */
  readonly children: readonly AgentRow[]
}

/** Totals over every subagent of the root session, shown at the top of the detail view. */
export interface MonitorSummary {
  /** Subagent launches at any depth, root excluded. */
  readonly agents: number
  readonly running: number
  readonly done: number
  /**
   * Wall-clock time during which at least one direct child was running (union of their intervals).
   * Grandchildren are ignored: their time already runs inside their parent's.
   */
  readonly wallMs: number
  /** Sum of the direct children's own elapsed time: the amount of agent work, not a duration. */
  readonly agentMs: number
  /** `agentMs / wallMs`; undefined when nothing has run yet. */
  readonly parallelism: number | undefined
  /** Every descendant of the root, root excluded. */
  readonly tokens: TokenUsage
  readonly costUsd: number | undefined
  readonly costPartial: boolean
}

export interface MonitorState {
  /** Running direct children of the root session: the sidebar and the "In progress" section. */
  readonly live: readonly AgentRow[]
  /** Finished direct children of the root session: the "History" section. */
  readonly finished: readonly AgentRow[]
  /** Every direct child of the root session, finished or not, with nested descendants. */
  readonly history: readonly AgentRow[]
  readonly summary: MonitorSummary
}
