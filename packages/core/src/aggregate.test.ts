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
