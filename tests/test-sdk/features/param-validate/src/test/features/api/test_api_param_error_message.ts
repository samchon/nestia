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
 */
export const test_api_param_error_message = async (
  connection: api.IConnection,
): Promise<void> => {
  await TestValidator.httpError("invalid numeric path", 400, async () => {
    try {
      await api.functional.param.number(connection, "two" as any);
    } catch (exp) {
      const message: string = (exp as Error).message;
      typia.assertEquals<{
        message: string;
        errors: IValidation.IError[];
      }>(JSON.parse(message));
      throw exp;
    }
  });
};
