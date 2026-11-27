// Bundles the plugin and the private @agent-monitor/core package into one file.
// esbuild keeps JSX untouched (`jsx: "preserve"`); babel-preset-solid then compiles
// it for OpenTUI's universal renderer, the same way OpenCode's own plugins do.
import { build } from "esbuild"
import { transformAsync } from "@babel/core"
import { mkdir, readFile, rm, writeFile } from "node:fs/promises"

await rm("dist", { recursive: true, force: true })
await mkdir("dist", { recursive: true })

await build({
  entryPoints: ["src/tui.tsx"],
  outfile: "dist/tui.jsx",
  bundle: true,
  format: "esm",
  platform: "neutral",
  target: "es2023",
  jsx: "preserve",
  // Host-provided at runtime: never bundle them.
  external: ["@opencode/plugin", "@opencode/plugin/*", "@opentui/*", "solid-js", "solid-js/*"],
  logLevel: "warning",
})

const result = await transformAsync(await readFile("dist/tui.jsx", "utf8"), {
  filename: "tui.jsx",
  babelrc: false,
  configFile: false,
  presets: [["babel-preset-solid", { generate: "universal", moduleName: "@opentui/solid" }]],
})
if (!result?.code) throw new Error("babel-preset-solid produced no output")

await writeFile("dist/tui.js", result.code + "\n")
await rm("dist/tui.jsx")
console.log("built dist/tui.js")
