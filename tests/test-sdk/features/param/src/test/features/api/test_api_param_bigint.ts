import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import api from "@api";

/**
 * Verifies a bigint path parameter converts to the controller number result and
 * invalid spellings fail.
 *
 * Generated path encoding and native TypedParam bigint parsing must agree
 * across an HTTP request.
 *
 * 1. Execute the authored fixture inputs through the owning route.
 * 2. Assert the controller returns Number(value), so 1n must return 1; boolean and
 *    nonnumeric string values must produce HTTP 400.
 *
 * @evidence contracts/testing.md#behavioral-verification The controller returns Number(value), so 1n must return 1; boolean and nonnumeric string values must produce HTTP 400.
 * @evidence contracts/testing.md#independent-expectations The authored controller and DTO are the oracle: The controller returns Number(value), so 1n must return 1; boolean and nonnumeric string values must produce HTTP 400.
 * @evidence contracts/testing.md#distinguishing-cases The controller returns Number(value), so 1n must return 1; boolean and nonnumeric string values must produce HTTP 400.
 * @evidence contracts/testing.md#execution-ownership The param installed SDK fixture compiles this matching test-prefixed export and its src/test/index.ts DynamicExecutor invokes it against that fixture backend.
 * @evidence contracts/e2e.md#necessary-boundary Generated path encoding and native TypedParam bigint parsing must agree across an HTTP request.
 * @evidence contracts/e2e.md#shared-execution This case reuses the param fixture SDK compilation, document generation and backend with its other tests. The current master runner still prepares separate fixtures independently; whole-suite batching remains an execution limitation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The param fixture owns generated artifacts and its backend lifetime; each case supplies local inputs to echo or fixed-error endpoints, and the feature index closes its backend after the executor report. Earlier harness failures can bypass that close; this case does not claim cancellation-safe suite cleanup.
 * @evidence contracts/e2e.md#preserved-coverage No assertion was transferred to another layer; the value and failure checks named here remain in this executable case. Other fixture cases own different DTO and decorator options.
 */
export const test_api_param_bigint = async (
  connection: api.IConnection,
): Promise<void> => {
  const value: number = await api.functional.param.bigint(
    connection,
    BigInt(1),
  );
  typia.assert(value);
  TestValidator.equals("bigint conversion", value, 1);

  await TestValidator.httpError("boolean", 400, () =>
    api.functional.param.bigint(connection, true as any),
  );
  await TestValidator.httpError("string", 400, () =>
    api.functional.param.bigint(connection, "string" as any),
  );
};
