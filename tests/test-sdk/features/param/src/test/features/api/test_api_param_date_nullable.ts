import { TestValidator } from "@nestia/e2e";

import api from "@api";

/**
 * Verifies a nullable date path preserves both the date and null alternatives.
 *
 * The HTTP path spelling for null must agree with nullable native validation.
 *
 * 1. Execute the authored fixture inputs through the owning route.
 * 2. Assert date equality and an explicit null result preserve the declared
 *    nullable domain; 20140102 remains invalid.
 *
 * @evidence contracts/testing.md#behavioral-verification Date equality and an explicit null result preserve the declared nullable domain; 20140102 remains invalid.
 * @evidence contracts/testing.md#independent-expectations The authored controller and DTO are the oracle: Date equality and an explicit null result preserve the declared nullable domain; 20140102 remains invalid.
 * @evidence contracts/testing.md#distinguishing-cases Date equality and an explicit null result preserve the declared nullable domain; 20140102 remains invalid.
 * @evidence contracts/testing.md#execution-ownership The param installed SDK fixture compiles this matching test-prefixed export and its src/test/index.ts DynamicExecutor invokes it against that fixture backend.
 * @evidence contracts/e2e.md#necessary-boundary The HTTP path spelling for null must agree with nullable native validation.
 * @evidence contracts/e2e.md#shared-execution This case reuses the param fixture SDK compilation, document generation and backend with its other tests. The current master runner still prepares separate fixtures independently; whole-suite batching remains an execution limitation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The param fixture owns generated artifacts and its backend lifetime; each case supplies local inputs to echo or fixed-error endpoints, and the feature index closes its backend after the executor report. Earlier harness failures can bypass that close; this case does not claim cancellation-safe suite cleanup.
 * @evidence contracts/e2e.md#preserved-coverage No assertion was transferred to another layer; the value and failure checks named here remain in this executable case. Other fixture cases own different DTO and decorator options.
 */
export const test_api_param_date_nullable = async (
  connection: api.IConnection,
): Promise<void> => {
  const date = "2024-02-29";
  const value = await api.functional.param.date_nullable(connection, date);
  TestValidator.equals("date", date, value!);

  TestValidator.equals(
    "null",
    await api.functional.param.date_nullable(connection, null),
    null,
  );

  await TestValidator.error("invalid", () =>
    api.functional.param.date_nullable(connection, "20140102"),
  );
};
