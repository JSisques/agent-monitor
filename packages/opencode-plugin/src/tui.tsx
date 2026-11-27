import { Plugin } from "@opencode/plugin/tui"
import { createMemo, createSignal, For, Show, type Accessor } from "solid-js"
import {
  buildMonitor,
  formatCost,
  formatDuration,
  formatModels,
  formatParallelism,
  formatPercent,
  formatTokens,
  sidebarLine,
  type AgentRow,
  type MonitorState,
  type MonitorSummary,
} from "@agent-monitor/core"
import { OpenCodeSessionSource } from "./adapter.ts"

const TICK_MS = 1000

const totalTokens = (row: Pick<AgentRow, "tokens">) =>
  row.tokens.input + row.tokens.output + row.tokens.reasoning + row.tokens.cacheRead + row.tokens.cacheWrite

export default Plugin.define({
  id: "agent-monitor.tui",
  setup(context) {
    const source = new OpenCodeSessionSource(context.data)
    const [now, setNow] = createSignal(Date.now())
    const [version, setVersion] = createSignal(0)

    // Persisted, so the sidebar stays collapsed across restarts like OpenCode's own sections.
    const [sidebar, updateSidebar] = context.storage.store("agent-monitor.sidebar", { initial: { collapsed: false } })
    const toggleSidebar = () => {
      void updateSidebar((draft) => {
        draft.collapsed = !draft.collapsed
      })
    }

    const unsubscribe = source.subscribe(() => setVersion((value) => value + 1))
    const timer = setInterval(() => setNow(Date.now()), TICK_MS)

    const monitorFor = (sessionID: string): Accessor<MonitorState> =>
      createMemo(() => {
        version()
        const rootId = context.data.session.root(sessionID)
        return buildMonitor(rootId, source.snapshot(rootId), now())
      })

    const muted = () => context.theme.text.muted
    const base = () => context.theme.text.base

    const DetailRow = (props: { row: AgentRow; depth: number }) => (
      <box flexDirection="column" paddingLeft={props.depth * 2}>
        <text fg={base()}>
          {props.row.agent}
          {props.row.models.length > 0 ? ` (${formatModels(props.row.models)})` : ""} ·{" "}
          {props.row.status === "running" ? (props.row.currentTool ?? "thinking") : "done"}
          {props.row.title ? ` · ${props.row.title}` : ""}
        </text>
        <text fg={muted()}>
          {formatDuration(props.row.elapsedMs)} · ctx {formatPercent(props.row.contextPercent)} · {formatTokens(totalTokens(props.row))} tok ·{" "}
          {formatCost(props.row.costUsd, props.row.costPartial)}
          {props.row.descendantCount > 0 ? ` (incl. ${props.row.descendantCount} sub)` : ""}
        </text>
        <For each={props.row.children}>{(child) => <DetailRow row={child} depth={props.depth + 1} />}</For>
      </box>
    )

    const Summary = (props: { summary: MonitorSummary }) => (
      <box flexDirection="column">
        <text fg={base()}>
          {props.summary.agents} agents · {props.summary.running} running · {props.summary.done} done
        </text>
        <text fg={muted()}>
          wall {formatDuration(props.summary.wallMs)} · agent time {formatDuration(props.summary.agentMs)}
          {props.summary.parallelism === undefined ? "" : ` (${formatParallelism(props.summary.parallelism)})`}
        </text>
        <text fg={muted()}>
          {formatTokens(totalTokens(props.summary))} tok · {formatCost(props.summary.costUsd, props.summary.costPartial)}
        </text>
      </box>
    )

    const Section = (props: { title: string; rows: readonly AgentRow[]; empty: string }) => (
      <box flexDirection="column" gap={1}>
        <text fg={base()}>
          <b>{props.title}</b> ({props.rows.length})
        </text>
        <Show when={props.rows.length > 0} fallback={<text fg={muted()}>{props.empty}</text>}>
          <For each={props.rows}>{(row) => <DetailRow row={row} depth={0} />}</For>
        </Show>
      </box>
    )

    const openDetail = (sessionID: string) => {
      const state = monitorFor(sessionID)
      context.ui.dialog.show(() => (
        <box flexDirection="column" paddingLeft={2} paddingRight={2} paddingBottom={1} gap={1}>
          <box flexDirection="row" justifyContent="space-between">
            <text fg={base()}>
              <b>Agent Monitor</b>
            </text>
            <text fg={muted()} onMouseUp={() => context.ui.dialog.clear()}>
              esc
            </text>
          </box>
          <Show when={state().history.length > 0} fallback={<text fg={muted()}>No subagents launched in this session yet.</text>}>
            <Summary summary={state().summary} />
            <scrollbox maxHeight={30} scrollbarOptions={{ visible: false }}>
              <box flexDirection="column" gap={1}>
                <Section title="In progress" rows={state().live} empty="No subagents running" />
                <Section title="History" rows={state().finished} empty="No subagents finished yet" />
              </box>
            </scrollbox>
          </Show>
        </box>
      ))
      context.ui.dialog.set({ size: "large", centered: true })
    }

    context.keymap.layer(() => ({
      commands: [
        {
          id: "agent-monitor.open",
          title: "Agent monitor",
          description: "Show every subagent of the current session",
          palette: true,
          slash: { name: "agent-monitor" },
          run: () => {
            const route = context.ui.router.current()
            if (route.type !== "session") {
              context.ui.toast.show({ message: "Open a session to see its subagents.", variant: "info" })
              return
            }
            openDetail(route.sessionID)
          },
        },
      ],
    }))

    const removeSlot = context.ui.slot({
      append: "sidebar.content",
      render: (input) => {
        const state = monitorFor(input.sessionID)
        return (
          <box flexDirection="column" marginTop={1} flexShrink={0}>
            <box flexDirection="row" gap={1}>
              <text fg={muted()} onMouseUp={toggleSidebar}>
                {sidebar.collapsed ? "▶" : "▼"}
              </text>
              <text fg={base()} onMouseUp={() => openDetail(input.sessionID)}>
                <b>Agent Monitor</b>
                {state().live.length > 0 ? ` (${state().live.length})` : ""}
              </text>
            </box>
            <Show when={!sidebar.collapsed}>
              <Show when={state().live.length > 0} fallback={<text fg={muted()}>No subagents running</text>}>
                <For each={state().live}>{(row) => <text fg={muted()}>{sidebarLine(row)}</text>}</For>
              </Show>
            </Show>
          </box>
        )
      },
    })

    return () => {
      clearInterval(timer)
      unsubscribe()
      removeSlot()
    }
  },
})
