import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import api from "@api";
import { IBbsArticle } from "@api/lib/structures/IBbsArticle";

/**
 * Verifies the generated article store preserves request content.
 *
 * This case consumes the body feature's generated artifact.
 *
 * 1. Send an authored valid article store value through the generated body POST.
 * 2. Assert the response DTO and equality of title, body and attachment fields.
 *
 * @evidence contracts/testing.md#behavioral-verification The generated body store POST must return IBbsArticle and preserve title, body and files from its input, detecting a valid-looking unrelated response as well as invalid response shape.
 * @evidence contracts/testing.md#independent-expectations IBbsArticle.IStore is the handwritten request contract; its source handler copies those three fields and adds id and created_at. Field equality is judged against the actual submitted value, while independent DTO validation checks the added fields.
 * @evidence contracts/testing.md#distinguishing-cases This owns the valid store and copied-content positive; test_api_body_invalid owns rejection of a null title under the same feature configuration. UUID and timestamp values vary and are validated by their DTO constraints.
 * @evidence contracts/testing.md#execution-ownership The feature DynamicExecutor discovers this async export and supplies a real connection; the generated SDK and native validators have been prepared before its backend begins serving requests.
 * @evidence contracts/e2e.md#necessary-boundary Request serialization, the generated client, configured manual or native body validator, handler and response serializer must agree on actual HTTP data; an isolated type check cannot prove this connection.
 * @evidence contracts/e2e.md#shared-execution The request reuses the feature backend and generated SDK with the invalid-body and monitor cases. It launches no host or compiler; cohort installation/native dispatch/Node processes are shared, while each member retains its own compiler programs and metadata scope.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity A fresh random valid DTO is sent to a stateless fixture handler; response-only id/time fields are not reused as later inputs. The feature entry owns backend and port cleanup in finally after reports or discovery/startup failures.
 * @evidence contracts/e2e.md#preserved-coverage The former store call and assertEquals remain, strengthened by copied-field equality. The null-title negative and other feature assertions are preserved without adding another preparation.
 */
export const test_api_body = async (
  connection: api.IConnection,
): Promise<void> => {
  const input = typia.random<IBbsArticle.IStore>();
  const article: IBbsArticle = await api.functional.body.store(
    connection,
    input,
  );
  typia.assertEquals(article);
  TestValidator.equals("stored content", input, {
    title: article.title,
    body: article.body,
    files: article.files,
  });
};
