import { TestValidator } from "@nestia/e2e";
import typia, { IValidation } from "typia";

import api from "../../api";

/**
 * Verifies a path parameter of the wrong type fails with a message a client can
 * parse, whose message is the JSON of the failure the validator reports.
 *
 * 1. Send a string where the route requires a number.
 * 2. Assert the call fails, and that its message is the JSON of the failure.
 *
 * @evidence contracts/testing.md#behavioral-verification Generated number with two must reject with an Error whose message parses as exactly message/reason plus IValidation.IError fields.
 * @evidence contracts/testing.md#independent-expectations The authored route requires number and two is explicitly invalid. The public validation-error declaration supplies the structured shape independently of current error JSON; the case does not pin every error field literal.
 * @evidence contracts/testing.md#distinguishing-cases A scalar type violation exercises parseable assertion-style error details rather than only any rejection. The validate-mode sibling requires an errors array, preserving the mode distinction.
 * @evidence contracts/testing.md#execution-ownership The common generated consumer DynamicExecutor discovers this named export after the single consumer compilation. It receives the shared connection and aggregates failures without repeating preparation.
 * @evidence contracts/e2e.md#necessary-boundary Actual native TypedParam rejection, Nest error serialization and generated HttpError message must connect; local validator error shape alone cannot certify the client-visible JSON message.
 * @evidence contracts/e2e.md#shared-execution This request shares one packed installation, one combined controller program, one generated client program and one Nest application with all rich-fixture cases. It creates no compiler project or feature backend.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Scenario routes and DTO names have explicit namespaces in the combined fixture; requests retain their authored inputs and stateless handler expectations. Connectors retain their own finally cleanup. The common entry closes the application before removing its installation.
 * @evidence contracts/e2e.md#preserved-coverage The requests, exact values, document constraints and rejected controls stated above remain in this executable owner. Transferred SDK expansion assertions retain their shared unit owner; strengthened positive tool/Observable payload controls supplement existing checks.
 */
export const test_param_api_param_error_message = async (
  connection: api.IConnection,
): Promise<void> => {
  const error: unknown = await api.functional.param.param
    .number(connection, "two" as any)
    .then(
      () => null,
      (exp: unknown) => exp,
    );
  TestValidator.predicate(
    "the invalid parameter is rejected",
    error instanceof Error,
  );
  const message: string = (error as Error).message;
  typia.assertEquals<
    {
      message: string;
      reason: string;
    } & IValidation.IError
  >(JSON.parse(message));
};
