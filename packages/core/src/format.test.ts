import { test } from "node:test"
import assert from "node:assert/strict"
import { formatCost, formatDuration, formatParallelism, formatTokens, sidebarLine } from "./format.ts"

test("formatDuration uses seconds, then minutes, then hours", () => {
  assert.equal(formatDuration(900), "0s")
  assert.equal(formatDuration(42_000), "42s")
  assert.equal(formatDuration(72_000), "1m 12s")
  assert.equal(formatDuration(3_723_000), "1h 2m")
})

test("formatTokens abbreviates thousands and millions", () => {
  assert.equal(formatTokens(812), "812")
  assert.equal(formatTokens(139_400), "139.4K")
  assert.equal(formatTokens(3_700_000), "3.70M")
})

test("formatCost shows unknown, tiny and partial costs explicitly", () => {
  assert.equal(formatCost(undefined, false), "—")
  assert.equal(formatCost(0.0004, false), "<$0.001")
  assert.equal(formatCost(0.4, false), "$0.40")
  assert.equal(formatCost(0.4, true), "$0.40 partial")
})

test("sidebarLine renders agent · tool · time", () => {
  assert.equal(sidebarLine({ agent: "explore", currentTool: "read", elapsedMs: 72_000 }), "explore · read · 1m 12s")
})

test("sidebarLine says thinking when no tool is running", () => {
  assert.equal(sidebarLine({ agent: "worker", currentTool: undefined, elapsedMs: 5_000 }), "worker · thinking · 5s")
})

test("parallelism formats with one decimal and a multiplication sign", () => {
  assert.equal(formatParallelism(2), "2.0×")
  assert.equal(formatParallelism(undefined), "")
})
