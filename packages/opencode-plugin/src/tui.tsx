import { Plugin } from "@opencode/plugin/tui"
import { createMemo, createSignal, For, Show, type Accessor } from "solid-js"
import {
  buildMonitor,
  formatCost,
  formatDuration,
  formatPercent,
  formatTokens,
  sidebarLine,
  type AgentRow,
  type MonitorState,
} from "@agent-monitor/core"
import { OpenCodeSessionSource } from "./adapter.ts"

const TICK_MS = 1000

const totalTokens = (row: AgentRow) =>
  row.tokens.input + row.tokens.output + row.tokens.reasoning + row.tokens.cacheRead + row.tokens.cacheWrite

export default Plugin.define({
  id: "agent-monitor.tui",
  setup(context) {
    const source = new OpenCodeSessionSource(context.data)
    const [now, setNow] = createSignal(Date.now())
    const [version, setVersion] = createSignal(0)

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
          {props.row.agent} · {props.row.status === "running" ? (props.row.currentTool ?? "thinking") : "done"}
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
            <scrollbox maxHeight={30} scrollbarOptions={{ visible: false }}>
              <box flexDirection="column" gap={1}>
                <For each={state().history}>{(row) => <DetailRow row={row} depth={0} />}</For>
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
            <text fg={base()} onMouseUp={() => openDetail(input.sessionID)}>
              <b>Agent Monitor</b>
            </text>
            <Show when={state().live.length > 0} fallback={<text fg={muted()}>No subagents running</text>}>
              <For each={state().live}>{(row) => <text fg={muted()}>{sidebarLine(row)}</text>}</For>
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
