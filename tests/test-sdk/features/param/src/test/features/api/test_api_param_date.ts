import { TestValidator } from "@nestia/e2e";

import api from "@api";

/**
 * Verifies a date-formatted path value echoes and invalid date spellings fail.
 *
 * The generated client and tagged native path validator are connected by a real
 * request.
 *
 * 1. Execute the authored fixture inputs through the owning route.
 * 2. Assert a valid date string must echo exactly, while null and the
 *    delimiter-free 20140102 spelling must throw.
 *
 * @evidence contracts/testing.md#behavioral-verification A valid date string must echo exactly, while null and the delimiter-free 20140102 spelling must throw.
 * @evidence contracts/testing.md#independent-expectations The authored controller and DTO are the oracle: A valid date string must echo exactly, while null and the delimiter-free 20140102 spelling must throw.
 * @evidence contracts/testing.md#distinguishing-cases A valid date string must echo exactly, while null and the delimiter-free 20140102 spelling must throw.
 * @evidence contracts/testing.md#execution-ownership The param installed SDK fixture compiles this matching test-prefixed export and its src/test/index.ts DynamicExecutor invokes it against that fixture backend.
 * @evidence contracts/e2e.md#necessary-boundary The generated client and tagged native path validator are connected by a real request.
 * @evidence contracts/e2e.md#shared-execution This case reuses the param fixture SDK compilation, document generation and backend with its other tests. The current master runner still prepares separate fixtures independently; whole-suite batching remains an execution limitation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The param fixture owns generated artifacts and its backend lifetime; each case supplies local inputs to echo or fixed-error endpoints, and the feature index closes its backend after the executor report. Earlier harness failures can bypass that close; this case does not claim cancellation-safe suite cleanup.
 * @evidence contracts/e2e.md#preserved-coverage No assertion was transferred to another layer; the value and failure checks named here remain in this executable case. Other fixture cases own different DTO and decorator options.
 */
export const test_api_param_date = async (
  connection: api.IConnection,
): Promise<void> => {
  const date = "2024-02-29";
  const value = await api.functional.param.date(connection, date);
  TestValidator.equals("date", date, value);

  await TestValidator.error("null", () =>
    api.functional.param.date(connection, null!),
  );
  await TestValidator.error("invalid", () =>
    api.functional.param.date(connection, "20140102"),
  );
};
