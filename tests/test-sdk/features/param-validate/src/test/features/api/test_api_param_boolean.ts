import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import api from "@api";

/**
 * Verifies boolean path conversion accepts false and the numeric 0/1 spellings
 * while rejecting other values.
 *
 * Generated path encoding and native TypedParam boolean parsing are exercised
 * together over HTTP.
 *
 * 1. Execute the authored fixture inputs through the owning route.
 * 2. Assert false and zero return false, one returns true, and two or a nonboolean
 *    string produce HTTP 400.
 *
 * @evidence contracts/testing.md#behavioral-verification False and zero return false, one returns true, and two or a nonboolean string produce HTTP 400.
 * @evidence contracts/testing.md#independent-expectations The authored controller and DTO are the oracle: False and zero return false, one returns true, and two or a nonboolean string produce HTTP 400.
 * @evidence contracts/testing.md#distinguishing-cases False and zero return false, one returns true, and two or a nonboolean string produce HTTP 400.
 * @evidence contracts/testing.md#execution-ownership The param-validate installed SDK fixture compiles this matching test-prefixed export and its src/test/index.ts DynamicExecutor invokes it against that fixture backend.
 * @evidence contracts/e2e.md#necessary-boundary Generated path encoding and native TypedParam boolean parsing are exercised together over HTTP.
 * @evidence contracts/e2e.md#shared-execution This case reuses the param-validate fixture SDK compilation, document generation and backend with its other tests. The current master runner still prepares separate fixtures independently; whole-suite batching remains an execution limitation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The param-validate fixture owns generated artifacts and its backend lifetime; each case supplies local inputs to echo or fixed-error endpoints, and the feature index closes its backend after the executor report. Earlier harness failures can bypass that close; this case does not claim cancellation-safe suite cleanup.
 * @evidence contracts/e2e.md#preserved-coverage No assertion was transferred to another layer; the value and failure checks named here remain in this executable case. Other fixture cases own different DTO and decorator options.
 */
export const test_api_param_boolean = async (
  connection: api.IConnection,
): Promise<void> => {
  const value: boolean = await api.functional.param.boolean(connection, false);
  typia.assert(value);

  TestValidator.equals(
    "false",
    false,
    await api.functional.param.boolean(connection, 0 as any),
  );
  TestValidator.equals(
    "true",
    true,
    await api.functional.param.boolean(connection, 1 as any),
  );

  await TestValidator.httpError("number", 400, () =>
    api.functional.param.boolean(connection, 2 as any),
  );
  await TestValidator.httpError("string", 400, () =>
    api.functional.param.boolean(connection, "string" as any),
  );
};
