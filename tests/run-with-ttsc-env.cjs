#!/usr/bin/env node

const childProcess = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const GO_EXECUTABLE = process.platform === "win32" ? "go.exe" : "go";

const appendNodeOption = (flag) => {
  const current = (process.env.NODE_OPTIONS ?? "").split(/\s+/).filter(Boolean);
  if (current.includes(flag) === false) current.push(flag);
  process.env.NODE_OPTIONS = current.join(" ");
};

const executableFromCommand = () => {
  try {
    const command =
      process.platform === "win32" ? ["where", "go"] : ["which", "go"];
    const output = childProcess
      .execFileSync(command[0], command.slice(1), { encoding: "utf8" })
      .trim()
      .split(/\r?\n/)
      .find(Boolean);
    return output && fs.existsSync(output) ? output : undefined;
  } catch {
    return undefined;
  }
};

const executableFromGoEnv = () => {
  try {
    const goroot = childProcess
      .execFileSync("go", ["env", "GOROOT"], { encoding: "utf8" })
      .trim();
    const candidate = path.join(goroot, "bin", GO_EXECUTABLE);
    return fs.existsSync(candidate) ? candidate : undefined;
  } catch {
    return undefined;
  }
};

const resolveGoBinary = () => {
  const candidates = [
    process.env.TTSC_GO_BINARY,
    process.env.GOROOT && path.join(process.env.GOROOT, "bin", GO_EXECUTABLE),
    path.join(os.homedir(), "go-sdk", "go", "bin", GO_EXECUTABLE),
    executableFromCommand(),
    executableFromGoEnv(),
  ];
  return candidates.find((candidate) => candidate && fs.existsSync(candidate));
};

const command = process.argv[2];
const args = process.argv.slice(3);
if (command === undefined) {
  console.error("Usage: node tests/run-with-ttsc-env.cjs <command> [...args]");
  process.exit(1);
}

process.env.TTSC_CACHE_DIR ??= path.join(ROOT, "node_modules", ".ttsc");
if (process.env.TTSC_GO_BINARY === undefined) {
  const goBinary = resolveGoBinary();
  if (goBinary !== undefined) process.env.TTSC_GO_BINARY = goBinary;
}

appendNodeOption("--no-experimental-strip-types");

const child = childProcess.spawn(command, args, {
  env: process.env,
  shell: process.platform === "win32",
  stdio: "inherit",
});

child.on("error", (error) => {
  console.error(error);
  process.exit(1);
});

child.on("exit", (code, signal) => {
  if (signal !== null) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
