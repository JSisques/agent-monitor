import { test } from "node:test"
import assert from "node:assert/strict"
import { buildMonitor } from "./aggregate.ts"
import type { SessionSnapshot } from "./model.ts"

const tokens = (input: number, output = 0) => ({ input, output, reasoning: 0, cacheRead: 0, cacheWrite: 0 })

const session = (overrides: Partial<SessionSnapshot> & Pick<SessionSnapshot, "id">): SessionSnapshot => ({
  agent: "explore",
  status: "idle",
  startedAt: 0,
  tokens: tokens(0),
  costUsd: 0,
  ...overrides,
})

test("one row per direct child launch, even for the same agent type", () => {
  const state = buildMonitor("root", [
    session({ id: "root", agent: "orchestrator" }),
    session({ id: "a", parentId: "root", agent: "explore" }),
    session({ id: "b", parentId: "root", agent: "explore" }),
    session({ id: "c", parentId: "root", agent: "worker" }),
  ], 0)

  assert.deepEqual(state.history.map((row) => row.sessionId), ["a", "b", "c"])
})

test("sidebar shows only running direct children; grandchildren never appear there", () => {
  const state = buildMonitor("root", [
    session({ id: "root" }),
    session({ id: "done", parentId: "root", status: "idle" }),
    session({ id: "live", parentId: "root", status: "running" }),
    session({ id: "grandchild", parentId: "live", status: "running" }),
  ], 0)

  assert.deepEqual(state.live.map((row) => row.sessionId), ["live"])
})

test("detail history keeps finished children and nests grandchildren", () => {
  const state = buildMonitor("root", [
    session({ id: "root" }),
    session({ id: "worker", parentId: "root", status: "idle" }),
    session({ id: "explore", parentId: "worker", status: "idle" }),
  ], 0)

  assert.equal(state.history.length, 1)
  assert.deepEqual(state.history[0]?.children.map((row) => row.sessionId), ["explore"])
})

test("cost and tokens include the whole subtree", () => {
  const state = buildMonitor("root", [
    session({ id: "root" }),
    session({ id: "worker", parentId: "root", costUsd: 0.1, tokens: tokens(100, 10) }),
    session({ id: "explore", parentId: "worker", costUsd: 0.3, tokens: tokens(300, 30) }),
  ], 0)

  const worker = state.history[0]!
  assert.ok(Math.abs(worker.costUsd! - 0.4) < 1e-9)
  assert.equal(worker.tokens.input, 400)
  assert.equal(worker.tokens.output, 40)
  assert.equal(worker.descendantCount, 1)
})

test("an unknown cost anywhere in the subtree marks the total as partial", () => {
  const state = buildMonitor("root", [
    session({ id: "root" }),
    session({ id: "worker", parentId: "root", costUsd: 0.1 }),
    session({ id: "explore", parentId: "worker", costUsd: undefined }),
  ], 0)

  assert.equal(state.history[0]?.costPartial, true)
})

test("elapsed time is the session's own wall clock, never summed with children", () => {
  const minute = 60_000
  const state = buildMonitor("root", [
    session({ id: "root" }),
    session({ id: "worker", parentId: "root", startedAt: 0, endedAt: 5 * minute }),
    session({ id: "explore", parentId: "worker", startedAt: 1 * minute, endedAt: 3 * minute }),
  ], 10 * minute)

  assert.equal(state.history[0]?.elapsedMs, 5 * minute)
})

test("a running session measures elapsed time up to now", () => {
  const state = buildMonitor("root", [
    session({ id: "root" }),
    session({ id: "live", parentId: "root", status: "running", startedAt: 1_000 }),
  ], 4_000)

  assert.equal(state.live[0]?.elapsedMs, 3_000)
})

test("context percentage and current tool belong to the session itself", () => {
  const state = buildMonitor("root", [
    session({ id: "root" }),
    session({ id: "worker", parentId: "root", status: "running", currentTool: "task", contextUsed: 60, contextLimit: 100 }),
    session({ id: "explore", parentId: "worker", status: "running", currentTool: "read", contextUsed: 40, contextLimit: 100 }),
  ], 0)

  const worker = state.live[0]!
  assert.equal(worker.currentTool, "task")
  assert.equal(worker.contextPercent, 60)
})

test("models are the session's own, in order of use, never merged with children", () => {
  const state = buildMonitor("root", [
    session({ id: "root" }),
    session({ id: "worker", parentId: "root", models: ["qwen3.8-27b", "gpt-oss-20b"] }),
    session({ id: "explore", parentId: "worker", models: ["claude-haiku-5-5"] }),
  ], 0)

  const worker = state.history[0]!
  assert.deepEqual(worker.models, ["qwen3.8-27b", "gpt-oss-20b"])
  assert.deepEqual(worker.children[0]?.models, ["claude-haiku-5-5"])
})

test("models default to an empty list when unknown", () => {
  const state = buildMonitor("root", [session({ id: "root" }), session({ id: "a", parentId: "root" })], 0)

  assert.deepEqual(state.history[0]?.models, [])
})

test("context percentage is undefined without a known limit", () => {
  const state = buildMonitor("root", [
    session({ id: "root" }),
    session({ id: "a", parentId: "root", contextUsed: 60 }),
  ], 0)

  assert.equal(state.history[0]?.contextPercent, undefined)
})

test("rows are ordered by start time", () => {
  const state = buildMonitor("root", [
    session({ id: "root" }),
    session({ id: "late", parentId: "root", startedAt: 20 }),
    session({ id: "early", parentId: "root", startedAt: 10 }),
  ], 0)

  assert.deepEqual(state.history.map((row) => row.sessionId), ["early", "late"])
})

test("finished direct children form the history section; running ones stay out of it", () => {
  const state = buildMonitor("root", [
    session({ id: "root" }),
    session({ id: "done", parentId: "root", status: "idle", startedAt: 1 }),
    session({ id: "live", parentId: "root", status: "running", startedAt: 2 }),
  ], 10)

  assert.deepEqual(state.finished.map((row) => row.sessionId), ["done"])
  assert.deepEqual(state.live.map((row) => row.sessionId), ["live"])
})

test("summary counts every subagent launch at any depth, excluding the root", () => {
  const state = buildMonitor("root", [
    session({ id: "root", status: "running" }),
    session({ id: "worker", parentId: "root", status: "running" }),
    session({ id: "explore", parentId: "worker", status: "idle" }),
    session({ id: "other", parentId: "root", status: "idle" }),
  ], 0)

  assert.equal(state.summary.agents, 3)
  assert.equal(state.summary.running, 1)
  assert.equal(state.summary.done, 2)
})

test("summary tokens and cost include every descendant but not the root", () => {
  const state = buildMonitor("root", [
    session({ id: "root", costUsd: 9, tokens: tokens(9000) }),
    session({ id: "worker", parentId: "root", costUsd: 0.1, tokens: tokens(100) }),
    session({ id: "explore", parentId: "worker", costUsd: 0.3, tokens: tokens(300) }),
  ], 0)

  assert.ok(Math.abs(state.summary.costUsd! - 0.4) < 1e-9)
  assert.equal(state.summary.costPartial, false)
  assert.equal(state.summary.tokens.input, 400)
})

test("summary agent time sums direct children; wall time is their union on the clock", () => {
  const minute = 60_000
  const state = buildMonitor("root", [
    session({ id: "root" }),
    session({ id: "a", parentId: "root", startedAt: 0, endedAt: 4 * minute }),
    session({ id: "b", parentId: "root", startedAt: 0, endedAt: 4 * minute }),
  ], 10 * minute)

  assert.equal(state.summary.agentMs, 8 * minute)
  assert.equal(state.summary.wallMs, 4 * minute)
  assert.equal(state.summary.parallelism, 2)
})

test("summary time never counts a grandchild, whose time already runs inside its parent", () => {
  const minute = 60_000
  const state = buildMonitor("root", [
    session({ id: "root" }),
    session({ id: "worker", parentId: "root", startedAt: 0, endedAt: 5 * minute }),
    session({ id: "explore", parentId: "worker", startedAt: 1 * minute, endedAt: 3 * minute }),
  ], 10 * minute)

  assert.equal(state.summary.agentMs, 5 * minute)
  assert.equal(state.summary.wallMs, 5 * minute)
})

test("summary wall time skips gaps between sequential children", () => {
  const minute = 60_000
  const state = buildMonitor("root", [
    session({ id: "root" }),
    session({ id: "a", parentId: "root", startedAt: 0, endedAt: 2 * minute }),
    session({ id: "b", parentId: "root", startedAt: 5 * minute, endedAt: 6 * minute }),
  ], 10 * minute)

  assert.equal(state.summary.wallMs, 3 * minute)
  assert.equal(state.summary.agentMs, 3 * minute)
})

test("summary of a session without subagents is empty and has no parallelism", () => {
  const state = buildMonitor("root", [session({ id: "root" })], 0)

  assert.equal(state.summary.agents, 0)
  assert.equal(state.summary.wallMs, 0)
  assert.equal(state.summary.parallelism, undefined)
  assert.equal(state.summary.costUsd, undefined)
})
