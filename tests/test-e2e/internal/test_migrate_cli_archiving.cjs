const assert = require("node:assert/strict");
const cp = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

/**
 * Verifies installed migration argv parsing and plain-text file preservation.
 *
 * The bare keyword invocation also owns the plain-file formatting assertions,
 * so those assertions require no fourth CLI lifetime.
 *
 * 1. Run bare, explicit true and explicit false argv against an empty document.
 * 2. Contrast each emitted configuration and the first invocation's file bytes.
 *
 * @evidence contracts/testing.md#behavioral-verification The installed migrate executable parses three actual argument vectors and archives files; keyword values, gitignore and env lines detect the original parser and TypeScript-formatter regressions.
 * @evidence contracts/testing.md#independent-expectations Bare flags mean true, explicit booleans preserve their meaning, and template literals lib/ and API_PORT=37001 retain their spelling independently of the parser or formatter.
 * @evidence contracts/testing.md#distinguishing-cases Bare and explicit booleans distinguish string-only parsing and always-true behavior; plain-text files and emitted MyModule contrast formatting decisions.
 * @evidence contracts/testing.md#execution-ownership The common start invokes this hook before the producer compiler using the sole packed installation. No legacy workspace runner executes.
 * @evidence contracts/e2e.md#necessary-boundary Real installed CLI argv parsing and archived bytes cannot be proved by calling the generator with an options object.
 * @evidence contracts/e2e.md#shared-execution Three different argument vectors require three short executable lifetimes; plain-file assertions reuse the bare keyword invocation and all reuse the common installation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Each output owns a directory inside the caller-owned sandbox; synchronous children settle before teardown, including failure. No installation or cache is removed here.
 * @evidence contracts/e2e.md#preserved-coverage All original CLI boolean and plain-file assertions remain; only equivalent preparation is shared. Originals stay until replacement execution succeeds.
 */
const test_migrate_cli_archiving = ({ installation, sandbox }) => {
  const root = path.join(sandbox, ".migration-cli");
  fs.mkdirSync(root);
  const input = path.join(root, "swagger.json");
  fs.writeFileSync(input, JSON.stringify({
    openapi: "3.1.0", info: { title: "cli", version: "1.0.0" }, paths: {},
  }));
  const executable = installation.binary("@nestia/migrate", "nestia-migrate");
  const failures = [];
  for (const [name, flags, expected] of [
    ["bare", ["--keyword"], true],
    ["true", ["--keyword", "true"], true],
    ["false", ["--keyword", "false"], false],
  ]) {
    try {
      const output = path.join(root, name);
      const result = cp.spawnSync(process.execPath, [
        executable, "--mode", "nest", "--input", input, "--output", output,
        ...flags, "--simulate", "false", "--e2e", "false", "--package", "cli",
      ], { cwd: sandbox, encoding: "utf8", windowsHide: true });
      if (result.error) throw result.error;
      assert.equal(result.signal, null, result.stderr);
      assert.equal(result.status, 0, result.stderr || result.stdout);
      const read = (file) => fs.readFileSync(path.join(output, file), "utf8");
      assert.match(read("packages/backend/nestia.config.ts"), new RegExp("keyword:\\s*" + expected + "\\b"));
      if (name === "bare") {
        assert.equal(read("packages/api/.gitignore").split(/\r?\n/)[0], "lib/");
        assert.equal(read("packages/backend/.env.local").trim(), "API_PORT=37001");
        assert.ok(read("packages/backend/src/MyModule.ts").includes("MyModule"));
      }
      console.log(" - migrate_cli_" + name + ": passed");
    } catch (error) {
      console.error(" - migrate_cli_" + name + ": failed", error);
      failures.push(error);
    }
  }
  if (failures.length) throw new AggregateError(failures, "Migration CLI failed.");
};

module.exports = { test_migrate_cli_archiving };
