import { TestValidator } from "@nestia/e2e";

import api from "../../../../api";

/**
 * Verifies checks omitted plain input returns Hello, world!, explicit input
 * echoes, and raw empty POST receives 201.
 *
 * The authored optional plain controller supplies the default string and Nest
 * POST defaults to status 201.
 *
 * 1. Execute the authored feature through its prepared generated artifacts.
 * 2. Assert the distinctions described below.
 *
 * @evidence contracts/testing.md#behavioral-verification The generated plain client must return the controller default on omission, echo an explicit string, and permit a raw empty POST with HTTP 201.
 * @evidence contracts/testing.md#independent-expectations The authored controller literal Hello, world! and its input echo establish the values; Nest POST defaults establish status 201.
 * @evidence contracts/testing.md#distinguishing-cases Absent and explicit plain bodies must produce different authored outcomes, with an additional raw empty-body transport control. Invalid media types belong to the content-type case.
 * @evidence contracts/testing.md#execution-ownership The SDK integration entry discovers this matching file/export under the shared body consumer; it executes actual generated-client or HTTP requests, not a direct unit operation.
 * @evidence contracts/e2e.md#necessary-boundary The authored controller, emitted request client where used, and live HTTP adapter must agree on transport and runtime semantics. Direct generator or native rule units cannot establish this connection.
 * @evidence contracts/e2e.md#shared-execution One http-rich producer includes all six scenarios, one generated consumer holds all cases and one backend serves them; this case starts no compiler or listener.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Scenario-specific routes select their own stateless controllers. Requests use local payloads and the runner closes the shared application in finally after discovery and request execution.
 * @evidence contracts/e2e.md#preserved-coverage This case retains the assertions from body-optional/src/test/features/api/test_api_plain_body_optional.ts; only import locations, route prefix and case identity change to join the shared SDK and backend.
 */
export const test_api_plain_body_optional_optional = async (
  connection: api.IConnection,
): Promise<void> => {
  TestValidator.equals(
    "empty",
    await api.functional.body_rich.optional.body.optional.plain(connection),
    "Hello, world!",
  );
  TestValidator.equals(
    "filled",
    await api.functional.body_rich.optional.body.optional.plain(
      connection,
      "something",
    ),
    "something",
  );

  const response: Response = await fetch(
    `${connection.host}/body_rich/optional/body/optional/plain`,
    {
      method: "POST",
    },
  );
  TestValidator.equals("status", response.status, 201);
};
