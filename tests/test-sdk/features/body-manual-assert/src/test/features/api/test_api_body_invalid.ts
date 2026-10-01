import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import api from "@api";
import { IBbsArticle } from "@api/lib/structures/IBbsArticle";

/**
 * Verifies the generated article store rejects a null title.
 *
 * This case consumes the body-manual-assert feature's generated artifact.
 *
 * 1. Construct otherwise valid store data and replace title with null.
 * 2. Await the generated POST and require an HTTP 400 rejection.
 *
 * @evidence contracts/testing.md#behavioral-verification An awaited generated body POST with title null must reject with HTTP 400; acceptance, another status or unrelated exception fails the HTTP-error assertion.
 * @evidence contracts/testing.md#independent-expectations The handwritten IStore requires title to be a constrained string. Replacing only that field with null violates that contract independently of the generated request validator.
 * @evidence contracts/testing.md#distinguishing-cases The malformed title is the negative twin of test_api_body, which sends valid data and checks preserved content; all other fields remain valid specimens from the same handwritten DTO.
 * @evidence contracts/testing.md#execution-ownership DynamicExecutor discovers this async feature export, supplies the connection and awaits its Promise, including TestValidator.httpError rather than leaving the rejection detached.
 * @evidence contracts/e2e.md#necessary-boundary The generated client and configured body validator must expose the supported HTTP rejection through the real handler connection. Unit predicates cannot prove the transported status and exception classification.
 * @evidence contracts/e2e.md#shared-execution This negative shares the SDK and backend with the valid store and monitor cases; it adds no compilation, native host or installation. Cohorts share installed artifacts and native/Node processes, with independent per-member compiler programs and metadata scopes.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The malformed input is freshly constructed and the stateless handler cannot commit it; the assertion awaits completion before subsequent cases. The feature entry owns its port and finally closes the backend on reports or discovery/startup failure.
 * @evidence contracts/e2e.md#preserved-coverage The original null-title input, generated call and exact 400 assertion remain; valid and other malformed DTO distinctions retain their executable owners.
 */
export const test_api_body_invalid = async (
  connection: api.IConnection,
): Promise<void> => {
  await TestValidator.httpError("invalid", 400, () =>
    api.functional.body.store(connection, {
      ...typia.random<IBbsArticle.IStore>(),
      title: null!,
    }),
  );
};
