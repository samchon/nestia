import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import api from "../../../../api";
import { IBodyOptional } from "../../../../structures/optional/IBodyOptional";

/**
 * Verifies sends omitted and present typed JSON through the client and checks
 * raw empty POST status 201.
 *
 * The authored optional JSON controller permits omission; Nest POST defaults to
 * 201.
 *
 * 1. Execute the authored feature through its prepared generated artifacts.
 * 2. Assert the distinctions described below.
 *
 * @evidence contracts/testing.md#behavioral-verification The generated optional JSON client accepts both omitted and authored typed payloads; a raw empty POST also must return HTTP 201.
 * @evidence contracts/testing.md#independent-expectations The original controller declares an optional body and Nest POST defaults to HTTP 201. This case retains the original request acceptance assertions without inventing a response equality check.
 * @evidence contracts/testing.md#distinguishing-cases Omitted generated-client input, present valid DTO input and an empty raw POST distinguish optional parameter and transport behavior. Media-type rejection belongs to the adjacent content-type case.
 * @evidence contracts/testing.md#execution-ownership The SDK integration entry discovers this matching file/export under the shared body consumer; it executes actual generated-client or HTTP requests, not a direct unit operation.
 * @evidence contracts/e2e.md#necessary-boundary The authored controller, emitted request client where used, and live HTTP adapter must agree on transport and runtime semantics. Direct generator or native rule units cannot establish this connection.
 * @evidence contracts/e2e.md#shared-execution One http-rich producer includes all six scenarios, one generated consumer holds all cases and one backend serves them; this case starts no compiler or listener.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Scenario-specific routes select their own stateless controllers. Requests use local payloads and the runner closes the shared application in finally after discovery and request execution.
 * @evidence contracts/e2e.md#preserved-coverage This case retains the assertions from body-optional/src/test/features/api/test_api_json_body_optional.ts; only import locations, route prefix and case identity change to join the shared SDK and backend.
 */
export const test_api_json_body_optional_optional = async (
  connection: api.IConnection,
): Promise<void> => {
  await api.functional.body_rich.optional.body.optional.json(connection);
  await api.functional.body_rich.optional.body.optional.json(
    connection,
    typia.random<IBodyOptional>(),
  );

  const response: Response = await fetch(
    `${connection.host}/body_rich/optional/body/optional/json`,
    {
      method: "POST",
    },
  );
  TestValidator.equals("status", response.status, 201);
};
