const cp = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

// Resolve the generated package's data against its own location, so invoking
// the build from another directory cannot redirect deletion or generation.
const { nestia } = require("./package.json");
const root = path.resolve(__dirname, nestia.root);
const output = path.resolve(__dirname, nestia.output);
fs.rmSync(path.join(output, "functional"), { recursive: true, force: true });

const args = ["nestia", "sdk"];
if (process.platform !== "win32")
  cp.execFileSync("npx", args, { cwd: root, stdio: "inherit" });
else {
  // Node cannot start a .cmd shim directly. The npm installation beside the
  // shim provides the same entry point without interpreting a shell string.
  const directory = (process.env.PATH ?? "")
    .split(path.delimiter)
    .find((entry) => fs.existsSync(path.join(entry, "npx.cmd")));
  const cli = directory === undefined ? undefined : [
    path.join(directory, "node_modules/npm/bin/npx-cli.js"),
    path.resolve(directory, "../npm/bin/npx-cli.js"),
  ].find((entry) => fs.existsSync(entry));
  if (cli === undefined)
    throw new Error("Unable to locate npx's JavaScript entry point beside npx.cmd on PATH.");
  cp.execFileSync(process.execPath, [cli, ...args], { cwd: root, stdio: "inherit" });
}
