import assert from "node:assert/strict";

import { DynamicBenchmarker } from "../../../../../packages/benchmark/lib";

/**
 * Verifies a worker budget with fewer simultaneous requests than threads is
 * rejected before any servant process is launched.
 *
 * A zero-budget servant would leave its share of invocations incomplete. The
 * invalid input is portable master validation, so it needs no HTTP host.
 *
 * 1. Request four threads with only two simultaneous invocation slots.
 * 2. Require the precise master validation error with a nonexistent servant.
 *
 * @evidence contracts/testing.md#behavioral-verification The actual built master rejects simultaneous2/threads4 with its specific budget error. A nonexistent servant ensures successful process startup cannot supply the expected rejection.
 * @evidence contracts/testing.md#independent-expectations Every requested thread needs at least one simultaneous slot; the authored2/4 input violates that public constraint. The literal message names both values independently of process-launch failures.
 * @evidence contracts/testing.md#distinguishing-cases This preserves the original invalid budget observation before workers. Positive uneven30/3/4 budgeting and multi-event6/2/2 progress remain with the real integration connection.
 * @evidence contracts/testing.md#execution-ownership The benchmark unit runner discovers this matching function and calls built master validation directly. Rejection precedes any process, application or HTTP operation; no native compiler is used by this unit entry.
 */
export const test_benchmark_invalid_concurrency = async (): Promise<void> => {
  await assert.rejects(
    DynamicBenchmarker.master({
      servant: `${__dirname}/does-not-exist-servant.js`,
      count: 4,
      threads: 4,
      simultaneous: 2,
    }),
    (error: unknown) =>
      error instanceof Error &&
      error.message.includes(
        "simultaneous (2) must not be less than threads (4)",
      ),
  );
};
