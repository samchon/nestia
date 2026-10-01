import { TestValidator } from "@nestia/e2e";
import typia, { IValidation } from "typia";

import api from "@api";

/**
 * Verifies a path parameter of the wrong type fails with a message a client can
 * parse, whose message is the JSON of the failure the validator reports.
 *
 * 1. Send a string where the route requires a number.
 * 2. Assert the call fails, and that its message is the JSON of the failure.
 *
 * @evidence contracts/testing.md#behavioral-verification Generated number with two must reject with an Error whose message parses as exactly message plus IValidation.IError array.
 * @evidence contracts/testing.md#independent-expectations The authored numeric parameter rejects two, and public IValidation.IError supplies item shape independently of server output. This validates structured shape rather than exact message/path/value literals.
 * @evidence contracts/testing.md#distinguishing-cases Validate-mode errors array contrasts the assertion-mode singular error/reason sibling. A generic network Error lacking the parseable structured message cannot satisfy this case.
 * @evidence contracts/testing.md#execution-ownership The matching exported function is discovered and awaited by the actual feature executor after generation and compilation. Assertion failures reject its report and empty discovery rejects the entry.
 * @evidence contracts/e2e.md#necessary-boundary Actual validate-mode native parameter rejection, server JSON and generated client message must connect; in-process validate output cannot certify HTTP error wrapping.
 * @evidence contracts/e2e.md#shared-execution Fresh packed dependencies and compatible native producer/emitted runtime programs are shared. Ordinary API/document cases reuse their feature backend; parser/adapter/clone/CLI state differences retain distinct preparation scopes.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Local submitted values and separately copied outputs isolate the feature. Additional adapter listen/calls and connectors are covered by finally closure where present, the entry closes its backend, and the harness releases owned trees after child completion.
 * @evidence contracts/e2e.md#preserved-coverage The requests, exact values, document constraints and rejected controls stated above remain in this executable owner. Transferred SDK expansion assertions retain their shared unit owner; strengthened positive tool/Observable payload controls supplement existing checks.
 */
export const test_api_param_error_message = async (
  connection: api.IConnection,
): Promise<void> => {
  const error: unknown = await api.functional.param
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
  typia.assertEquals<{
    message: string;
    errors: IValidation.IError[];
  }>(JSON.parse(message));
};
