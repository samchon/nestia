import { DynamicBenchmarker } from "@nestia/benchmark";

/**
 * Verifies `DynamicBenchmarker.master()` refuses fewer simultaneous requests
 * than threads before it spawns anything.
 *
 * A servant is given a budget of `simultaneous / threads`, so fewer requests
 * than threads would leave a servant a budget of zero and its share of the
 * count unrun (#1682).
 *
 * 1. Call `master()` with `simultaneous: 2` and `threads: 4`, and a servant that
 *    does not exist.
 * 2. Assert it rejects with the message naming both numbers, without ever reaching
 *    the servant.
 *
 * @evidence contracts/testing.md#behavioral-verification It calls `DynamicBenchmarker.master()` with `simultaneous: 2` and `threads: 4` and a servant path that does not exist, and asserts the rejection names both numbers, which shows the check runs before any process is spawned.
 * @evidence contracts/testing.md#independent-expectations A servant's budget is `simultaneous / threads`, so fewer requests than threads leaves a budget of zero; the message text is compared literally.
 * @evidence contracts/testing.md#distinguishing-cases The refused combination is the negative case; the accepted combination and the real servants are run by the E2E benchmark suite.
 * @evidence contracts/testing.md#execution-ownership Unit: it runs in the shared `test-benchmark` process discovered by `DynamicExecutor`, calling the public `@nestia/benchmark` API in-process; no servant process or server is started, which the E2E `test-benchmark-e2e` suite owns.
 */
export const test_benchmark_master_arguments = async (): Promise<void> => {
  const refused: unknown = await DynamicBenchmarker.master({
    servant: "a-servant-that-does-not-exist.ts",
    count: 4,
    threads: 4,
    simultaneous: 2,
  }).then(
    () => null,
    (error: unknown) => error,
  );
  if (
    !(refused instanceof Error) ||
    !refused.message.includes(
      "simultaneous (2) must not be less than threads (4)",
    )
  )
    throw new Error(
      `DynamicBenchmarker accepted fewer simultaneous requests than threads: ${String(refused)}`,
    );
};
