import type { Plugin } from "@opencode/plugin/tui"
import type { SessionSnapshot, SessionSource } from "@agent-monitor/core"

type Data = Plugin.Context["data"]
type MessageInfo = ReturnType<Data["session"]["message"]["list"]>[number]
type AssistantMessage = Extract<MessageInfo, { type: "assistant" }>

const isAssistant = (message: MessageInfo): message is AssistantMessage => message.type === "assistant"

/** Tool the session is executing right now, taken from its latest assistant message. */
function currentTool(messages: readonly MessageInfo[]): string | undefined {
  const last = messages.findLast(isAssistant)
  if (!last) return undefined
  const running = last.content.findLast(
    (part) => part.type === "tool" && (part.state.status === "running" || part.state.status === "streaming"),
  )
  return running?.type === "tool" ? running.name : undefined
}

/** Tokens occupying the context window in the latest reported model call. */
function contextUsed(messages: readonly MessageInfo[]): number | undefined {
  const last = messages.findLast((message) => isAssistant(message) && message.tokens !== undefined)
  if (!last || !isAssistant(last) || !last.tokens) return undefined
  const { input, output, reasoning, cache } = last.tokens
  return input + output + reasoning + cache.read + cache.write
}

/** Distinct model ids in order of first use; falls back to the session's model before any reply. */
function modelsUsed(messages: readonly MessageInfo[], sessionModel: { id: string } | undefined): string[] {
  const models: string[] = []
  for (const message of messages) {
    if (isAssistant(message) && !models.includes(message.model.id)) models.push(message.model.id)
  }
  if (models.length === 0 && sessionModel) models.push(sessionModel.id)
  return models
}

/** Adapts OpenCode's TUI data store to the core `SessionSource` port. */
export class OpenCodeSessionSource implements SessionSource {
  private readonly requested = new Set<string>()
  private readonly data: Data

  constructor(data: Data) {
    this.data = data
  }

  snapshot(rootId: string): readonly SessionSnapshot[] {
    const ids = new Set([rootId, ...this.data.session.family(rootId)])
    const models = this.data.location.model.list() ?? []
    const snapshots: SessionSnapshot[] = []

    for (const id of ids) {
      const info = this.data.session.get(id)
      if (!info) continue
      this.ensureMessages(id)
      const messages = this.data.session.message.list(id)
      const model = info.model
        ? models.find((m) => m.providerID === info.model?.providerID && (m.id === info.model.id || m.modelID === info.model.id))
        : undefined
      const status = this.data.session.status(id)

      snapshots.push({
        id,
        parentId: info.parentID,
        agent: info.agent ?? "agent",
        title: info.title,
        status,
        startedAt: info.time.created,
        endedAt: status === "idle" ? (info.time.idle ?? info.time.updated) : undefined,
        currentTool: status === "running" ? currentTool(messages) : undefined,
        models: modelsUsed(messages, info.model),
        tokens: {
          input: info.tokens.input,
          output: info.tokens.output,
          reasoning: info.tokens.reasoning,
          cacheRead: info.tokens.cache.read,
          cacheWrite: info.tokens.cache.write,
        },
        costUsd: Number.isFinite(info.cost) ? info.cost : undefined,
        contextUsed: contextUsed(messages),
        contextLimit: model?.limit.context,
      })
    }
    return snapshots
  }

  subscribe(listener: () => void): () => void {
    return this.data.listen(() => listener())
  }

  /** Message history is loaded on demand; request it once per session. */
  private ensureMessages(id: string): void {
    if (this.requested.has(id)) return
    this.requested.add(id)
    void this.data.session.message.sync(id).catch(() => this.requested.delete(id))
  }
}
