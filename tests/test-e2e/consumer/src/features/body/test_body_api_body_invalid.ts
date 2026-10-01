import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import api from "../../api";
import { IBbsArticleBody } from "../../api/structures/IBbsArticleBody";

/**
 * Verifies the generated article store rejects a null title.
 *
 * This case consumes the body feature's generated artifact.
 *
 * 1. Construct otherwise valid store data and replace title with null.
 * 2. Await the generated POST and require an HTTP 400 rejection.
 *
 * @evidence contracts/testing.md#behavioral-verification An awaited generated body POST with title null must reject with HTTP 400; acceptance, another status or unrelated exception fails the HTTP-error assertion.
 * @evidence contracts/testing.md#independent-expectations The handwritten IStoreBody requires title to be a constrained string. Replacing only that field with null violates that contract independently of the generated request validator.
 * @evidence contracts/testing.md#distinguishing-cases The malformed title is the negative twin of test_api_body, which sends valid data and checks preserved content; all other fields remain valid specimens from the same handwritten DTO.
 * @evidence contracts/testing.md#execution-ownership The common generated consumer DynamicExecutor discovers this named export after the single consumer compilation. It receives the shared connection and aggregates failures without repeating preparation.
 * @evidence contracts/e2e.md#necessary-boundary The generated client and configured body validator must expose the supported HTTP rejection through the real handler connection. Unit predicates cannot prove the transported status and exception classification.
 * @evidence contracts/e2e.md#shared-execution This request shares one packed installation, one combined controller program, one generated client program and one Nest application with all rich-fixture cases. It creates no compiler project or feature backend.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Scenario routes and DTO names have explicit namespaces in the combined fixture; requests retain their authored inputs and stateless handler expectations. Connectors retain their own finally cleanup. The common entry closes the application before removing its installation.
 * @evidence contracts/e2e.md#preserved-coverage The original null-title input, generated call and exact 400 assertion remain; valid and other malformed DTO distinctions retain their executable owners.
 */
export const test_body_api_body_invalid = async (
  connection: api.IConnection,
): Promise<void> => {
  await TestValidator.httpError("invalid", 400, () =>
    api.functional.body.body.store(connection, {
      ...typia.random<IBbsArticleBody.IStoreBody>(),
      title: null!,
    }),
  );
};
