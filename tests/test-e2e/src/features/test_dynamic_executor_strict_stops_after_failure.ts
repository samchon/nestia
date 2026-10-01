import { DynamicExecutor, TestValidator } from "@nestia/e2e";
import fs from "fs";
import os from "os";
import path from "path";

/**
 * Verifies strict `DynamicExecutor` stops dispatching and settles in-flight
 * tests before it rejects, while loose mode still runs everything.
 *
 * A rejected strict run used to leave the other workers draining the queue in
 * the background, so tests kept running after the caller had seen the failure
 * and might close the server they used.
 *
 * 1. Discover a failing, a slow and a later test with two workers in strict mode.
 * 2. Assert the run rejects with the first failure only after the slow test ended
 *    and that the later test never ran, even after waiting.
 * 3. Run the same files in loose mode and with one worker as controls.
 *
 * @evidence contracts/testing.md#behavioral-verification The strict run must reject with the failing test's message, record the slow test as finished at rejection time and never run the third test; each of these is a different observable of the removed background draining.
 * @evidence contracts/testing.md#independent-expectations The expected log follows from the authored delays: the slow test is already running when the first fails, and the third is only queued behind them.
 * @evidence contracts/testing.md#distinguishing-cases Strict with two workers is the case, loose mode runs all three and reports one error as the positive twin, and strict with one worker is the boundary where nothing is in flight.
 * @evidence contracts/testing.md#execution-ownership Unit: it runs in the shared test-e2e process and calls the @nestia/e2e operation in-process over a temporary directory removed in finally; it starts no server or consumer.
 */
export async function test_dynamic_executor_strict_stops_after_failure(): Promise<void> {
  const directory: string = fs.mkdtempSync(
    path.join(os.tmpdir(), "nestia-e2e-strict-"),
  );
  const key: string = "__nestia_strict_stop_log__";
  const log = (): string[] => ((globalThis as any)[key] ??= []);
  try {
    const write = (name: string, body: string): void =>
      fs.writeFileSync(path.join(directory, name), body, "utf8");
    const push = (name: string): string =>
      `(globalThis.${key} ??= []).push("${name}");`;
    write(
      "test_a.js",
      `exports.test_a = async () => { throw new Error("a failed"); };\n`,
    );
    write(
      "test_b.js",
      `exports.test_b = async () => { await new Promise((r) => setTimeout(r, 200)); ${push("b")} };\n`,
    );
    write("test_c.js", `exports.test_c = async () => { ${push("c")} };\n`);
    const run = (
      executor: typeof DynamicExecutor.assert,
      simultaneous: number,
    ) =>
      executor({
        location: directory,
        parameters: () => [],
        prefix: "test",
        extension: "js",
        simultaneous,
      });

    (globalThis as any)[key] = [];
    const error: unknown = await run(DynamicExecutor.assert, 2).then(
      () => null,
      (exp: unknown) => exp,
    );
    TestValidator.predicate(
      "strict rejects with the first failure",
      error instanceof Error && error.message === "a failed",
    );
    TestValidator.equals("in-flight test finished before rejection", log(), [
      "b",
    ]);
    await new Promise((resolve) => setTimeout(resolve, 300));
    TestValidator.equals("nothing runs after the rejection", log(), ["b"]);

    (globalThis as any)[key] = [];
    const report: DynamicExecutor.IReport = await run(
      DynamicExecutor.validate,
      2,
    );
    TestValidator.equals(
      "loose mode runs everything",
      [
        report.executions.length,
        report.executions.filter((e) => e.error).length,
      ],
      [3, 1],
    );
    TestValidator.equals("loose log", [...log()].sort(), ["b", "c"]);

    (globalThis as any)[key] = [];
    await run(DynamicExecutor.assert, 1).then(
      () => null,
      () => null,
    );
    TestValidator.equals("one worker stops at the failure", log(), []);
  } finally {
    delete (globalThis as any)[key];
    fs.rmSync(directory, { recursive: true, force: true });
  }
}
