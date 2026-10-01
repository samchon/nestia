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
 * @evidence contracts/testing.md#behavioral-verification Generated range.get must expose success:false/status404/message missing, and five compile-time controls must accept400/499 in4XX, exclude500 and include200/299 in2XX.
 * @evidence contracts/testing.md#independent-expectations RangeController throws NotFoundException(missing) under TypedException4XX; decimal HTTP status families independently establish the five handwritten inclusive bounds.
 * @evidence contracts/testing.md#distinguishing-cases Runtime404 connects a status-range exception to propagation; lower/upper4XX and2XX plus adjacent500 compile controls contrast range identity. This selected set does not enumerate every range or status.
 * @evidence contracts/testing.md#execution-ownership The matching exported case is discovered and awaited by its actual feature entry after generation and consumer compilation. Type controls fail compilation and runtime assertions reject the report; empty discovery rejects the entry.
 * @evidence contracts/e2e.md#necessary-boundary Actual generated quoted range key, consumer IPropagation types and HTTP exception decoding must connect; a type-only status-range unit cannot prove the observed propagated response.
 * @evidence contracts/e2e.md#shared-execution The suite prepares one packed dependency installation and compatible producer/runtime programs. These cases reuse the feature backend and their generated artifacts; distinct parser/adaptor setup remains authored per feature rather than starting another install/compiler.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Values and generated artifacts belong to isolated copied feature trees. Extra adapter applications and connectors, where used, close in finally with listen inside ownership; the entry closes its backend and the harness removes only owned trees after consumers finish.
 * @evidence contracts/e2e.md#preserved-coverage All retained requests, raw protocol/document reads, compile controls and accepted/rejected assertions remain in this executable case and its stated sibling owners. Shared preparation does not substitute setup success for those observations.
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
