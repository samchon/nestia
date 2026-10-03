import { TestValidator } from "@nestia/e2e";
import { IPropagation } from "@nestia/fetcher";

import api from "../../api";

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
 * @evidence contracts/testing.md#behavioral-verification The original 404 response must propagate success:false and exact missing text, while five type bounds cover 400/499 inside4XX,500 outside4XX and200/299 inside2XX.
 * @evidence contracts/testing.md#independent-expectations The controller throws an authored NotFoundException with missing text. The public 4XX and 2XX ranges establish the literal 404 response and five compile-time membership bounds independently of generated SDK source.
 * @evidence contracts/testing.md#distinguishing-cases The original 404 response must propagate success:false and exact missing text, while five type bounds cover 400/499 inside4XX,500 outside4XX and200/299 inside2XX.
 * @evidence contracts/testing.md#execution-ownership The matching case is discovered by DynamicExecutor in the shared compiled profile consumer; its original type assertions are compiled by the same consumer program.
 * @evidence contracts/e2e.md#necessary-boundary Native typed-exception metadata, installed propagated SDK source and actual404 transport must agree on range status and failure data; quoted range keys and public StatusRange bounds must compile.
 * @evidence contracts/e2e.md#shared-execution The original distinct generation options retain their public profile graph, while installation, producer compilation, consumer compilation and actual listener are shared. No automated E2E generation is added.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Private controller and route identities isolate this stateless handler. The supplied connection performs actual HTTP rather than simulation, so the propagated failure comes from its thrown404.
 * @evidence contracts/e2e.md#preserved-coverage Every original call, literal assertion and compile-time type expression remains unchanged apart from names, imports and accessors. Original wrappers own no additional behavioral assertions.
 */
export const test_clone_propagate_status_range = async (
  connection: api.IConnection,
): Promise<void> => {
  const output =
    await api.functional.http_rich.options.propagate_only.range.get(connection);
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
