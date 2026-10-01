import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import api from "@api";
import { IBbsArticle } from "@api/lib/structures/IBbsArticle";

/**
 * Verifies the generated article store rejects a null title.
 *
 * Assert, is and validate callbacks share one generated project and backend.
 *
 * 1. Construct otherwise valid store data and replace title with null.
 * 2. Await the generated POST and require an HTTP 400 rejection.
 *
 * @evidence contracts/testing.md#behavioral-verification Each awaited assert/is/validate body POST with title null must reject with HTTP 400; acceptance, another status or unrelated exception fails the HTTP-error assertion. All modes run before aggregate failure is reported.
 * @evidence contracts/testing.md#independent-expectations The handwritten IStore requires title to be a constrained string. Replacing only that field with null violates that contract independently of the generated request validator.
 * @evidence contracts/testing.md#distinguishing-cases All three explicit validator callbacks reject the malformed title, paired with each mode's valid store and copied-content assertions in test_api_body. Other fields remain valid specimens from the same handwritten DTO.
 * @evidence contracts/testing.md#execution-ownership DynamicExecutor discovers this async feature export, supplies the connection and awaits its Promise, including TestValidator.httpError rather than leaving the rejection detached.
 * @evidence contracts/e2e.md#necessary-boundary The generated client and configured body validator must expose the supported HTTP rejection through the real handler connection. Unit predicates cannot prove the transported status and exception classification.
 * @evidence contracts/e2e.md#shared-execution This negative shares the SDK and backend with the valid store and monitor cases; it adds no compilation, native host or installation. The packed installation and Node consumer processes are shared; public ttsc compiles independent member programs and reuses its native plugin cache.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The malformed input is freshly constructed and the stateless handler cannot commit it; the assertion awaits completion before subsequent cases. The feature entry owns its port and finally closes the backend on reports or discovery/startup failure.
 * @evidence contracts/e2e.md#preserved-coverage The original null-title input, generated call and exact 400 assertion remain; valid and other malformed DTO distinctions retain their executable owners.
 */
export const test_api_body_invalid = async (
  connection: api.IConnection,
): Promise<void> => {
  const errors: unknown[] = [];
  for (const [mode, store] of [
    ["assert", api.functional.body.store],
    ["is", api.functional.body.is.store_is],
    ["validate", api.functional.body.validate.store_validate],
  ] as const) {
    try {
      await TestValidator.httpError(`${mode}: invalid`, 400, () =>
        store(connection, {
          ...typia.random<IBbsArticle.IStore>(),
          title: null!,
        }),
      );
    } catch (error) {
      errors.push(
        new Error(`${mode}: invalid manual body failed`, { cause: error }),
      );
    }
  }
  if (errors.length)
    throw new AggregateError(errors, "Manual body negative cases failed");
};
