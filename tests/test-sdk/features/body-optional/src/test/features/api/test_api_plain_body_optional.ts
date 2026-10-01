import { TestValidator } from "@nestia/e2e";

import api from "@api";

/**
 * Verifies api plain body optional through its actual consumer boundary.
 *
 * Authored request values and controller contracts supply observable
 * expectations.
 *
 * 1. Run each retained request or composition scenario.
 * 2. Assert its payload, status or rejection and release any owned host.
 *
 * @evidence contracts/testing.md#behavioral-verification Generated missing text and raw absent POST must return the literal Hello, world! default; supplied generated text must echo something and the raw status must be201.
 * @evidence contracts/testing.md#independent-expectations The authored handler explicitly returns body or Hello, world!, independently establishing missing-body and literal supplied-value expectations.
 * @evidence contracts/testing.md#distinguishing-cases Absent versus supplied generated text and raw absent body distinguish client omission from middleware handling. Content-type-case owns mixed-case text headers and incompatible JSON media type rejection.
 * @evidence contracts/testing.md#execution-ownership The matching exported function is discovered and awaited by its feature DynamicExecutor after real generation and compilation; every retained assertion rejection fails the feature report.
 * @evidence contracts/e2e.md#necessary-boundary This connects generated optional text encoding, actual Nest plain-body parsing/default handler and JSON string response decoding. A direct default expression cannot prove those transport states.
 * @evidence contracts/e2e.md#shared-execution Consumer packages and runtime compilation are shared with sibling feature cases and compatible cohorts. Separate preparation inside this case exists only for the explicitly described host boundary; native dispatch and Node processes are shared while each member keeps its own compiler programs and metadata scope.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Requests reuse the feature backend/runtime and start no build or process; immutable local text inputs carry no cross-case state and the feature entry finally closes its backend.
 * @evidence contracts/e2e.md#preserved-coverage All original meaningful requests and composition connections remain. Exact payload/default/path or diagnostic assertions strengthen previously shape-only, completion-only or generic-rejection checks; complementary sibling scenarios remain executable.
 */
export const test_api_plain_body_optional = async (
  connection: api.IConnection,
): Promise<void> => {
  TestValidator.equals(
    "empty",
    await api.functional.body.optional.plain(connection),
    "Hello, world!",
  );
  TestValidator.equals(
    "filled",
    await api.functional.body.optional.plain(connection, "something"),
    "something",
  );

  const response: Response = await fetch(
    `${connection.host}/body/optional/plain`,
    {
      method: "POST",
    },
  );
  TestValidator.equals("status", response.status, 201);
  TestValidator.equals(
    "raw empty default",
    await response.json(),
    "Hello, world!",
  );
};
