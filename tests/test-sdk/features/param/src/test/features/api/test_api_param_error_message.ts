import { TestValidator } from "@nestia/e2e";
import typia, { IValidation } from "typia";

import api from "@api";

/**
 * Verifies invalid numeric path input rejects with the configured validator
 * error body.
 *
 * Native validator failure and HTTP error conversion through the generated SDK
 * must preserve the structured payload.
 *
 * 1. Execute the authored fixture inputs through the owning route.
 * 2. Assert the authored two spelling is not numeric; the request must throw HTTP
 *    400 and its JSON message must match the configured assert or validate
 *    error shape.
 *
 * @evidence contracts/testing.md#behavioral-verification The authored two spelling is not numeric; the request must throw HTTP 400 and its JSON message must match the configured assert or validate error shape.
 * @evidence contracts/testing.md#independent-expectations The authored controller and DTO are the oracle: The authored two spelling is not numeric; the request must throw HTTP 400 and its JSON message must match the configured assert or validate error shape.
 * @evidence contracts/testing.md#distinguishing-cases The authored two spelling is not numeric; the request must throw HTTP 400 and its JSON message must match the configured assert or validate error shape.
 * @evidence contracts/testing.md#execution-ownership The param installed SDK fixture compiles this matching test-prefixed export and its src/test/index.ts DynamicExecutor invokes it against that fixture backend.
 * @evidence contracts/e2e.md#necessary-boundary Native validator failure and HTTP error conversion through the generated SDK must preserve the structured payload.
 * @evidence contracts/e2e.md#shared-execution This case reuses the param fixture SDK compilation, document generation and backend with its other tests. The current master runner still prepares separate fixtures independently; whole-suite batching remains an execution limitation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The param fixture owns generated artifacts and its backend lifetime; each case supplies local inputs to echo or fixed-error endpoints, and the feature index closes its backend after the executor report. Earlier harness failures can bypass that close; this case does not claim cancellation-safe suite cleanup.
 * @evidence contracts/e2e.md#preserved-coverage No assertion was transferred to another layer; the value and failure checks named here remain in this executable case. Other fixture cases own different DTO and decorator options.
 */
export const test_api_param_error_message = async (
  connection: api.IConnection,
): Promise<void> => {
  await TestValidator.httpError("invalid numeric path", 400, async () => {
    try {
      await api.functional.param.number(connection, "two" as any);
    } catch (exp) {
      const message: string = (exp as Error).message;
      typia.assertEquals<
        {
          message: string;
          reason: string;
        } & IValidation.IError
      >(JSON.parse(message));
      throw exp;
    }
  });
};
