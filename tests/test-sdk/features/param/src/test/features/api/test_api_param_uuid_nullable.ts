import { TestValidator } from "@nestia/e2e";
import { v4 } from "uuid";

import api from "@api";

/**
 * Verifies a nullable UUID path accepts a UUID and null but rejects malformed
 * text.
 *
 * The SDK null spelling must reach the nullable tagged native parameter as
 * null.
 *
 * 1. Execute the authored fixture inputs through the owning route.
 * 2. Assert the authored UUID echoes, null returns null, and 12345678 is rejected.
 *
 * @evidence contracts/testing.md#behavioral-verification The authored UUID echoes, null returns null, and 12345678 is rejected.
 * @evidence contracts/testing.md#independent-expectations The authored controller and DTO are the oracle: The authored UUID echoes, null returns null, and 12345678 is rejected.
 * @evidence contracts/testing.md#distinguishing-cases The authored UUID echoes, null returns null, and 12345678 is rejected.
 * @evidence contracts/testing.md#execution-ownership The param installed SDK fixture compiles this matching test-prefixed export and its src/test/index.ts DynamicExecutor invokes it against that fixture backend.
 * @evidence contracts/e2e.md#necessary-boundary The SDK null spelling must reach the nullable tagged native parameter as null.
 * @evidence contracts/e2e.md#shared-execution This case reuses the param fixture SDK compilation, document generation and backend with its other tests. The current master runner still prepares separate fixtures independently; whole-suite batching remains an execution limitation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The param fixture owns generated artifacts and its backend lifetime; each case supplies local inputs to echo or fixed-error endpoints, and the feature index closes its backend after the executor report. Earlier harness failures can bypass that close; this case does not claim cancellation-safe suite cleanup.
 * @evidence contracts/e2e.md#preserved-coverage No assertion was transferred to another layer; the value and failure checks named here remain in this executable case. Other fixture cases own different DTO and decorator options.
 */
export const test_api_param_uuid_nullable = async (
  connection: api.IConnection,
): Promise<void> => {
  const uuid = v4();
  const value = await api.functional.param.uuid_nullable(connection, uuid);
  TestValidator.equals("uuid", uuid, value);

  TestValidator.equals(
    "null",
    await api.functional.param.uuid_nullable(connection, null),
    null,
  );

  await TestValidator.error("invalid", () =>
    api.functional.param.uuid_nullable(connection, "12345678"),
  );
};
