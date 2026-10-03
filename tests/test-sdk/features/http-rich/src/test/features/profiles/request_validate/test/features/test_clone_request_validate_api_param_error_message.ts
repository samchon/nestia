import { TestValidator } from "@nestia/e2e";
import typia, { IValidation } from "typia";

import api from "../../api";

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
 * @evidence contracts/testing.md#behavioral-verification The generated numeric path request rejects two with HTTP400, and its parsed JSON must have exactly message:string and errors:IValidation.IError[].
 * @evidence contracts/testing.md#independent-expectations The configured validate report ABI and the literal nonnumeric spelling independently require a detailed errors array rather than the default single-error body.
 * @evidence contracts/testing.md#distinguishing-cases This malformed numeric request distinguishes validate:validate report selection from default assert behavior; valid numeric input is exercised by its separate number case.
 * @evidence contracts/testing.md#execution-ownership The matching shared consumer file/export is discovered after actual installed native production, original SDK generation and one consumer compilation; direct unit entries do not execute this transport connection.
 * @evidence contracts/e2e.md#necessary-boundary The validate:validate native TypedParam report ABI and actual SDK/HTTP or WebSocket transport must agree; a direct option test cannot prove the runtime error/callback connection.
 * @evidence contracts/e2e.md#shared-execution Installation, generation preparation, consumer compilation and upgraded Express listener are shared. Only genuinely different native request validation or response serialization options have distinct producer programs; same-option inputs reuse them.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Private route and declaration identities retain original stateless/local request semantics. RPC connections keep their original finally teardown, and the shared upgraded listener belongs to runner cleanup; no earlier outcome supplies later expected values.
 * @evidence contracts/e2e.md#preserved-coverage Entire original inputs/case/helper/import populations and option configurations remain, with only private identities and artifact/source addresses rebased. Original automatic E2E generation remains disabled; every authored request assertion stays enabled.
 */
export const test_clone_request_validate_api_param_error_message = async (
  connection: api.IConnection,
): Promise<void> => {
  await TestValidator.httpError("invalid numeric path", 400, async () => {
    try {
      await api.functional.http_rich.options.request_validate.param.number(
        connection,
        "two" as any,
      );
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
