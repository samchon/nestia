import typia from "typia";

import api from "@api";

import { IBbsArticle } from "../../../../structures/manual_validate/IBbsArticle";

/**
 * Verifies a valid article body reaches the server and returns an exact article
 * shape.
 *
 * The authored IBbsArticle and IStore DTOs establish the request and response
 * domains independently of SDK output.
 *
 * 1. Call the generated client against the feature backend.
 * 2. Require the request outcome described by the authored controller and DTO.
 *
 * @evidence contracts/testing.md#behavioral-verification The generated article client sends an authored valid IStore and the returned value must satisfy the exact authored IBbsArticle shape.
 * @evidence contracts/testing.md#independent-expectations The original authored IStore and IBbsArticle declarations define the input and exact result structure independently of emitted SDK output.
 * @evidence contracts/testing.md#distinguishing-cases This case owns the valid input and exact response shape for its scenario. The corresponding null-title case owns rejection of the adjacent malformed input.
 * @evidence contracts/testing.md#execution-ownership The SDK integration entry discovers this matching file/export under the shared body consumer; it executes actual generated-client or HTTP requests, not a direct unit operation.
 * @evidence contracts/e2e.md#necessary-boundary The authored controller, emitted request client where used, and live HTTP adapter must agree on transport and runtime semantics. Direct generator or native rule units cannot establish this connection.
 * @evidence contracts/e2e.md#shared-execution One http-rich producer includes all six scenarios, one generated consumer holds all cases and one backend serves them; this case starts no compiler or listener.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Scenario-specific routes select their own stateless controllers. Requests use local payloads and the runner closes the shared application in finally after discovery and request execution.
 * @evidence contracts/e2e.md#preserved-coverage This case retains the assertions from body-manual-validate/src/test/features/api/test_api_body.ts; only import locations, route prefix and case identity change to join the shared SDK and backend.
 */
export const test_api_body_manual_validate = async (
  connection: api.IConnection,
): Promise<void> => {
  const article: IBbsArticle =
    await api.functional.body_rich.manual_validate.body.store(
      connection,
      typia.random<IBbsArticle.IStore>(),
    );
  typia.assertEquals(article);
};
