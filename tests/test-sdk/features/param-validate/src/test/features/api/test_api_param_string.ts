import { TestValidator } from "@nestia/e2e";

import api from "@api";

/**
 * Verifies a string path parameter survives an SDK request unchanged.
 *
 * SDK URI encoding and router parameter extraction must preserve the same
 * decoded string.
 *
 * 1. Execute the authored fixture inputs through the owning route.
 * 2. Assert the string echo controller returns the authored text rather than
 *    merely any valid string; Unicode and slash-containing strings supply
 *    encoding boundaries.
 *
 * @evidence contracts/testing.md#behavioral-verification The string echo controller returns the authored text rather than merely any valid string; Unicode and slash-containing strings supply encoding boundaries.
 * @evidence contracts/testing.md#independent-expectations The authored controller and DTO are the oracle: The string echo controller returns the authored text rather than merely any valid string; Unicode and slash-containing strings supply encoding boundaries.
 * @evidence contracts/testing.md#distinguishing-cases The string echo controller returns the authored text rather than merely any valid string; Unicode and slash-containing strings supply encoding boundaries.
 * @evidence contracts/testing.md#execution-ownership The param-validate installed SDK fixture compiles this matching test-prefixed export and its src/test/index.ts DynamicExecutor invokes it against that fixture backend.
 * @evidence contracts/e2e.md#necessary-boundary SDK URI encoding and router parameter extraction must preserve the same decoded string.
 * @evidence contracts/e2e.md#shared-execution This case reuses the param-validate fixture SDK compilation, document generation and backend with its other tests. The current master runner still prepares separate fixtures independently; whole-suite batching remains an execution limitation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The param-validate fixture owns generated artifacts and its backend lifetime; each case supplies local inputs to echo or fixed-error endpoints, and the feature index closes its backend after the executor report. Earlier harness failures can bypass that close; this case does not claim cancellation-safe suite cleanup.
 * @evidence contracts/e2e.md#preserved-coverage No assertion was transferred to another layer; the value and failure checks named here remain in this executable case. Other fixture cases own different DTO and decorator options.
 */
export const test_api_param_string = async (
  connection: api.IConnection,
): Promise<void> => {
  for (const input of ["string", "\uD55C\uAE00", "a/b"])
    TestValidator.equals(
      "string echo",
      await api.functional.param.string(connection, input),
      input,
    );
};
