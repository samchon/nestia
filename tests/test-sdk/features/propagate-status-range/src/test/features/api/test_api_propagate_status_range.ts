import { TestValidator } from "@nestia/e2e";
import { IPropagation } from "@nestia/fetcher";

import api from "@api";

/**
 * Verifies a propagated SDK function with a `@TypedException` status range
 * compiles, and `IPropagation.StatusRange` spans the range it names.
 *
 * The status keys of the `IPropagation` map were all numeric literals, so the
 * "4XX" key printed as `4XX: ...`, which does not parse, and
 * `IPropagation.StatusRange` compared the range with numbers no range literal
 * matches, so every range read as 500 to 598 (#1730).
 *
 * 1. Call a route that throws 404 under a "4XX" exception.
 * 2. Assert the propagated failure and its body.
 * 3. Assert at the type level that 400 and 499 are in the 4XX range, 500 is not,
 *    and 200 and 299 are in the 2XX range.
 *
 * @evidence contracts/testing.md#behavioral-verification A declared 4XX exception returns false, 404 and missing; compile-time tuple bounds require 400 and 499, exclude 500, and retain 200 and 299 in 2XX.
 * @evidence contracts/testing.md#independent-expectations The authored controller and DTO are the oracle: A declared 4XX exception returns false, 404 and missing; compile-time tuple bounds require 400 and 499, exclude 500, and retain 200 and 299 in 2XX.
 * @evidence contracts/testing.md#distinguishing-cases A declared 4XX exception returns false, 404 and missing; compile-time tuple bounds require 400 and 499, exclude 500, and retain 200 and 299 in 2XX.
 * @evidence contracts/testing.md#execution-ownership The propagate-status-range installed SDK fixture compiles this matching test-prefixed export and its src/test/index.ts DynamicExecutor invokes it against that fixture backend.
 * @evidence contracts/e2e.md#necessary-boundary SDK ranged-status source must compile and the backend 404 must propagate without throwing.
 * @evidence contracts/e2e.md#shared-execution This case reuses the propagate-status-range fixture SDK compilation, document generation and backend with its other tests. The current master runner still prepares separate fixtures independently; whole-suite batching remains an execution limitation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The propagate-status-range fixture owns generated artifacts and its backend lifetime; each case supplies local inputs to echo or fixed-error endpoints, and the feature index closes its backend after the executor report. Earlier harness failures can bypass that close; this case does not claim cancellation-safe suite cleanup.
 * @evidence contracts/e2e.md#preserved-coverage No assertion was transferred to another layer; the value and failure checks named here remain in this executable case. Other fixture cases own different DTO and decorator options.
 */
export const test_api_propagate_status_range = async (
  connection: api.IConnection,
): Promise<void> => {
  const output = await api.functional.range.get(connection);
  TestValidator.equals("success", output.success, false);
  TestValidator.equals("status", output.status, 404);
  TestValidator.equals(
    "message",
    (output.data as { message: string }).message,
    "missing",
  );

  const bounds: Bounds = [true, true, true, true, true];
  TestValidator.equals("bounds", bounds, [true, true, true, true, true]);
};

type Bounds = [
  400 extends IPropagation.StatusRange<"4XX"> ? true : false,
  499 extends IPropagation.StatusRange<"4XX"> ? true : false,
  500 extends IPropagation.StatusRange<"4XX"> ? false : true,
  200 extends IPropagation.StatusRange<"2XX"> ? true : false,
  299 extends IPropagation.StatusRange<"2XX"> ? true : false,
];
