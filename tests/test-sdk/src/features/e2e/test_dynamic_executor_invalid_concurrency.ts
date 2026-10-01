import { DynamicExecutor, TestValidator } from "@nestia/e2e";
import fs from "fs";
import os from "os";
import path from "path";

/**
 * Verifies `DynamicExecutor` rejects a concurrency that is not a positive safe
 * integer before it discovers anything, in both its `assert` and its `validate`
 * forms, and accepts a positive one.
 *
 * A concurrency of zero starts no worker and would return an empty passing
 * report, and a fractional, negative, `NaN` or infinite count has no meaning as
 * a number of workers. The location handed to the rejected calls does not
 * exist, so a rejection that names the concurrency proves the check ran before
 * discovery.
 *
 * 1. Call `assert()` and `validate()` with zero, negative, fractional, `NaN` and
 *    infinite `simultaneous` and a location that does not exist.
 * 2. Assert every call rejects with the concurrency message.
 * 3. Run both forms with `simultaneous` of 1 and 2 over a real location and assert
 *    its test is discovered and run.
 *
 * @evidence contracts/testing.md#behavioral-verification It calls `DynamicExecutor.assert()` and `validate()` with each invalid concurrency and asserts the rejection names `simultaneous`, which a missing check (an empty passing report) or a check after discovery (a missing-directory error) does not produce; the accepted calls assert the fixture's function actually ran.
 * @evidence contracts/testing.md#independent-expectations A count of workers must be a positive whole number, so zero, negative, fractional, `NaN` and infinite values are refused and 1 and 2 are accepted; the fixture's returned value is authored in the test.
 * @evidence contracts/testing.md#distinguishing-cases Five invalid values on both entry points are the negative cases, and the two accepted counts over a real location are the adjacent positive cases, so a check that rejects every value or no value fails.
 * @evidence contracts/testing.md#execution-ownership Unit: it runs in the shared `test-sdk` process that `DynamicExecutor` discovers by the `test` prefix under `src/features`, and calls the `@nestia/e2e` operation directly in-process over a temporary directory it removes in finally; it installs no consumer, builds no native artifact, and starts no server.
 */
export async function test_dynamic_executor_invalid_concurrency(): Promise<void> {
  const refusals: Array<[string, number]> = [
    ["zero", 0],
    ["negative", -1],
    ["fractional", 1.5],
    ["NaN", Number.NaN],
    ["infinite", Number.POSITIVE_INFINITY],
  ];
  for (const [title, simultaneous] of refusals)
    for (const [form, executor] of [
      ["assert", DynamicExecutor.assert],
      ["validate", DynamicExecutor.validate],
    ] as const) {
      const error: unknown = await executor({
        location: "does-not-need-to-exist",
        parameters: () => [],
        prefix: "test",
        simultaneous,
      }).then(
        () => null,
        (exp: unknown) => exp,
      );
      TestValidator.predicate(
        `${form} ${title} concurrency`,
        error instanceof Error && error.message.includes("simultaneous"),
      );
    }

  const directory: string = fs.mkdtempSync(
    path.join(os.tmpdir(), "nestia-e2e-concurrency-"),
  );
  try {
    fs.writeFileSync(
      path.join(directory, "test_accepted.js"),
      `exports.test_accepted = async () => "accepted";\n`,
      "utf8",
    );
    for (const simultaneous of [1, 2])
      for (const executor of [
        DynamicExecutor.assert,
        DynamicExecutor.validate,
      ]) {
        const report: DynamicExecutor.IReport = await executor({
          location: directory,
          parameters: () => [],
          prefix: "test",
          extension: "js",
          simultaneous,
        });
        TestValidator.equals(
          `simultaneous ${simultaneous}`,
          report.executions.map((exec) => [exec.name, exec.value]),
          [["test_accepted", "accepted"]],
        );
      }
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}
