import type { AgentRow } from "./model.ts"

export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  if (hours > 0) return `${hours}h ${minutes}m`
  if (minutes > 0) return `${minutes}m ${seconds}s`
  return `${seconds}s`
}

export function formatTokens(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return String(value)
}

export function formatCost(usd: number | undefined, partial: boolean): string {
  if (usd === undefined) return "—"
  const text = usd > 0 && usd < 0.001 ? "<$0.001" : `$${usd.toFixed(2)}`
  return partial ? `${text} partial` : text
}

export function formatPercent(value: number | undefined): string {
  return value === undefined ? "—" : `${Math.round(value)}%`
}

/** The single sidebar line for a live subagent: `agent · tool · time`. */
export function sidebarLine(row: Pick<AgentRow, "agent" | "currentTool" | "elapsedMs">): string {
  return `${row.agent} · ${row.currentTool ?? "thinking"} · ${formatDuration(row.elapsedMs)}`
}
