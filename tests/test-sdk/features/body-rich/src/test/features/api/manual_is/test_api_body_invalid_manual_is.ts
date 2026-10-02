import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import api from "@api";

import { IBbsArticle } from "../../../../structures/manual_is/IBbsArticle";

/**
 * Verifies a null article title is rejected through the generated client.
 *
 * IStore requires a string title and Nest request validation reports malformed
 * typed JSON as HTTP 400; no expected value comes from the emitted
 * implementation.
 *
 * 1. Call the generated client against the feature backend.
 * 2. Require the request outcome described by the authored controller and DTO.
 *
 * @evidence contracts/testing.md#behavioral-verification The generated article client sends a null title to the scenario controller; HTTP 400 must be observed rather than a success or an unrelated transport failure.
 * @evidence contracts/testing.md#independent-expectations The original authored IStore requires a string title; Nest validation rejects that malformed typed body with HTTP 400.
 * @evidence contracts/testing.md#distinguishing-cases This case changes only the title of an otherwise valid authored IStore to null. The matching positive body case verifies the valid request and exact response shape.
 * @evidence contracts/testing.md#execution-ownership The SDK integration entry discovers this matching file/export under the shared body consumer; it executes actual generated-client or HTTP requests, not a direct unit operation.
 * @evidence contracts/e2e.md#necessary-boundary The authored controller, emitted request client where used, and live HTTP adapter must agree on transport and runtime semantics. Direct generator or native rule units cannot establish this connection.
 * @evidence contracts/e2e.md#shared-execution One body-rich producer includes all six scenarios, one generated consumer holds all cases and one backend serves them; this case starts no compiler or listener.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Scenario-specific routes select their own stateless controllers. Requests use local payloads and the runner closes the shared application in finally after discovery and request execution.
 * @evidence contracts/e2e.md#preserved-coverage This case retains the assertions from body-manual-is/src/test/features/api/test_api_body_invalid.ts; only import locations, route prefix and case identity change to join the shared SDK and backend.
 */
export const test_api_body_invalid_manual_is = async (
  connection: api.IConnection,
): Promise<void> => {
  await TestValidator.httpError("invalid", 400, () =>
    api.functional.body_rich.manual_is.body.store(connection, {
      ...typia.random<IBbsArticle.IStore>(),
      title: null!,
    }),
  );
};
