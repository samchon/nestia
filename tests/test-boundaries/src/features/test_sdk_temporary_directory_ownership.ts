import assert from "assert/strict";
import cp from "child_process";
import fs from "fs";
import os from "os";
import path from "path";

/**
 * Verifies that SDK process cleanup releases its configuration and runtime
 * materializations while a second process continues using the same parents.
 *
 * Two actual Node consumers create sibling directories through the built SDK
 * registry. Success and failing exits each release only the exiting consumer's
 * children; explicit release and rejection of unowned paths are also
 * exercised.
 *
 * 1. Start two consumers and await their directory/marker handshakes.
 * 2. Exit one, verify its children are gone and the live consumer's remain.
 * 3. Exit the survivor and verify both shared parent directories remain.
 *
 * @evidence contracts/testing.md#behavioral-verification Two Node processes allocate configuration and runtime children under shared parents; after either consumer exits, its children disappear and the survivor's marker files remain readable. Explicit release must remove an owned child and reject parent or repeated removal.
 * @evidence contracts/testing.md#independent-expectations Ownership belongs to the process that created the unique child; an unrelated live consumer's markers and shared parents cannot be removed by another consumer's exit. Literal exit statuses distinguish normal and failing termination.
 * @evidence contracts/testing.md#distinguishing-cases Success-first/failure-last and failure-first/success-last exercise both cleanup orders; both materialization populations share each process's hook. The case does not claim JavaScript cleanup on abrupt OS termination, which can bypass hooks.
 * @evidence contracts/testing.md#execution-ownership The test-boundaries DynamicExecutor discovers this named E2E function. Its forked consumers import the real built SDK utility and rely on process exit hooks rather than invoking a simulated cleanup callback.
 * @evidence contracts/e2e.md#necessary-boundary A direct remove call cannot prove exit-hook registration, coordination of configuration/runtime cleanup or isolation between processes sharing the same project cache. SDK diagnostic cohorts retain the actual compiler/config-loader connection.
 * @evidence contracts/e2e.md#shared-execution Both termination-order cases consume the caller's single SDK build. Four short Node consumers share one worker script and test parent tree; no package installation, native build or compiler host is repeated here.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Each order has separate shared parents and mkdtemp children. IPC establishes that both consumers are live before either exits. Finally kills and awaits only these owned consumers, then removes this test's temporary root; bounded timers are always cleared.
 * @evidence contracts/e2e.md#preserved-coverage This permanent regression adds process-ownership coverage missing from the old shared-parent sweeps. Existing SDK cohorts and runtime feature batches continue exercising configuration materialization, controller compilation and their cleanup during actual generation.
 */
export const test_sdk_temporary_directory_ownership = async (
  moduleFile: string = path.resolve(
    "../../packages/sdk/lib/utils/TemporaryDirectory.js",
  ),
): Promise<void> => {
  const root: string = fs.mkdtempSync(
    path.join(os.tmpdir(), "nestia-temp-owner-"),
  );
  const worker: string = path.join(root, "worker.cjs");
  fs.writeFileSync(
    worker,
    `
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const { TemporaryDirectory } = require(process.argv[2]);
const root = process.argv[3];
const parents = [path.join(root, "config-loader"), path.join(root, "runtime")];
const children = parents.map(parent => TemporaryDirectory.create(parent, "run-"));
for (const child of children) fs.writeFileSync(path.join(child, "marker"), "live");
const transient = TemporaryDirectory.create(parents[0], "tsconfig-");
TemporaryDirectory.remove(transient);
assert.equal(fs.existsSync(transient), false);
assert.throws(() => TemporaryDirectory.remove(transient), /Unowned temporary directory/);
assert.throws(() => TemporaryDirectory.remove(parents[0]), /Unowned temporary directory/);
process.on("message", code => process.exit(code));
process.send({ children, parents });
`,
  );
  try {
    for (const codes of [
      [0, 23],
      [23, 0],
    ] as const) {
      const directory: string = fs.mkdtempSync(path.join(root, "order-"));
      const launch = () => {
        const child = cp.spawn(
          process.execPath,
          [worker, moduleFile, directory],
          {
            windowsHide: true,
            stdio: ["ignore", "ignore", "pipe", "ipc"],
          },
        );
        let diagnostics = "";
        child.stderr!.on("data", (data) => {
          diagnostics += String(data);
        });
        const exit = new Promise<number | null>((resolve, reject) => {
          child.once("error", reject);
          child.once("exit", (code) => resolve(code));
        });
        const ready = new Promise<{ children: string[]; parents: string[] }>(
          (resolve, reject) => {
            child.once("error", reject);
            child.once("message", (data) =>
              resolve(data as { children: string[]; parents: string[] }),
            );
            child.once("exit", () =>
              reject(
                new Error(`Consumer exited before handshake: ${diagnostics}`),
              ),
            );
          },
        );
        return { child, exit, ready };
      };
      const consumers = [launch(), launch()];
      const bounded = async <T>(promise: Promise<T>): Promise<T> => {
        let timer: ReturnType<typeof setTimeout> | undefined;
        try {
          return await Promise.race([
            promise,
            new Promise<T>((_, reject) => {
              timer = setTimeout(
                () => reject(new Error("SDK consumer lifecycle timed out")),
                5_000,
              );
            }),
          ]);
        } finally {
          clearTimeout(timer);
        }
      };
      try {
        const [first, second] = await bounded(
          Promise.all(consumers.map((entry) => entry.ready)),
        );
        consumers[0]!.child.send(codes[0]);
        assert.equal(await bounded(consumers[0]!.exit), codes[0]);
        for (const child of first!.children)
          assert.equal(fs.existsSync(child), false);
        for (const child of second!.children)
          assert.equal(
            fs.readFileSync(path.join(child, "marker"), "utf8"),
            "live",
          );
        consumers[1]!.child.send(codes[1]);
        assert.equal(await bounded(consumers[1]!.exit), codes[1]);
        for (const child of second!.children)
          assert.equal(fs.existsSync(child), false);
        for (const parent of first!.parents)
          assert.equal(fs.statSync(parent).isDirectory(), true);
      } finally {
        for (const { child } of consumers)
          if (child.exitCode === null && child.signalCode === null)
            child.kill();
        await bounded(Promise.allSettled(consumers.map((entry) => entry.exit)));
      }
    }
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
};
