import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import api from "@api";
import { IBbsArticle } from "@api/lib/structures/IBbsArticle";

/**
 * Verifies the generated article store preserves request content.
 *
 * Assert, is and validate callbacks share one generated project and backend.
 *
 * 1. Send an authored valid article store value through the generated body POST.
 * 2. Assert the response DTO and equality of title, body and attachment fields.
 *
 * @evidence contracts/testing.md#behavioral-verification Each generated assert/is/validate store POST must return IBbsArticle and preserve title, body and files from its input, detecting a valid-looking unrelated response as well as invalid response shape. Every mode runs even after an earlier mode fails.
 * @evidence contracts/testing.md#independent-expectations IBbsArticle.IStore is the handwritten request contract; its source handler copies those three fields and adds id and created_at. Field equality is judged against the actual submitted value, while independent DTO validation checks the added fields.
 * @evidence contracts/testing.md#distinguishing-cases All three manually supplied validator variants retain their valid store and copied-content positives; test_api_body_invalid owns null-title rejection for all three. UUID and timestamp values vary and are validated by their DTO constraints.
 * @evidence contracts/testing.md#execution-ownership The feature DynamicExecutor discovers this async export and supplies a real connection; the generated SDK and native validators have been prepared before its backend begins serving requests.
 * @evidence contracts/e2e.md#necessary-boundary Request serialization, the generated client, configured manual or native body validator, handler and response serializer must agree on actual HTTP data; an isolated type check cannot prove this connection.
 * @evidence contracts/e2e.md#shared-execution Three explicit callbacks use the same DTO identity, compiler configuration, producer/runtime programs, generated SDK and backend. One shared packed installation and public ttsc preparation serves all three modes plus invalid-body and monitor cases.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity A fresh random valid DTO is sent to a stateless fixture handler; response-only id/time fields are not reused as later inputs. The feature entry owns backend and port cleanup in finally after reports or discovery/startup failures.
 * @evidence contracts/e2e.md#preserved-coverage Former body-manual-assert/is/validate valid store calls, DTO assertions and copied-field equality execute once per retained mode here. Their identical health/performance controls remain once in this backend and their null-title negatives run in test_api_body_invalid.
 */
export const test_api_body = async (
  connection: api.IConnection,
): Promise<void> => {
  const errors: unknown[] = [];
  for (const [mode, store] of [
    ["assert", api.functional.body.store],
    ["is", api.functional.body.is.store_is],
    ["validate", api.functional.body.validate.store_validate],
  ] as const) {
    try {
      const input = typia.random<IBbsArticle.IStore>();
      const article: IBbsArticle = await store(connection, input);
      typia.assertEquals(article);
      TestValidator.equals(`${mode}: stored content`, input, {
        title: article.title,
        body: article.body,
        files: article.files,
      });
    } catch (error) {
      errors.push(
        new Error(`${mode}: valid manual body failed`, { cause: error }),
      );
    }
  }
  if (errors.length)
    throw new AggregateError(errors, "Manual body positive cases failed");
};
