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
