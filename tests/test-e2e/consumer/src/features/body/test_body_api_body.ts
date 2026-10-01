import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import api from "../../api";
import { IBbsArticleBody } from "../../api/structures/IBbsArticleBody";

/**
 * Verifies the generated article store preserves request content.
 *
 * This case consumes the body feature's generated artifact.
 *
 * 1. Send an authored valid article store value through the generated body POST.
 * 2. Assert the response DTO and equality of title, body and attachment fields.
 *
 * @evidence contracts/testing.md#behavioral-verification The generated body store POST must return IBbsArticleBody and preserve title, body and files from its input, detecting a valid-looking unrelated response as well as invalid response shape.
 * @evidence contracts/testing.md#independent-expectations IBbsArticleBody.IStoreBody is the handwritten request contract; its source handler copies those three fields and adds id and created_at. Field equality is judged against the actual submitted value, while independent DTO validation checks the added fields.
 * @evidence contracts/testing.md#distinguishing-cases This owns the valid store and copied-content positive; test_body_api_body_invalid owns rejection of a null title under the same feature configuration. UUID and timestamp values vary and are validated by their DTO constraints.
 * @evidence contracts/testing.md#execution-ownership The common generated consumer DynamicExecutor discovers this named export after the single consumer compilation. It receives the shared connection and aggregates failures without repeating preparation.
 * @evidence contracts/e2e.md#necessary-boundary Request serialization, the generated client, configured manual or native body validator, handler and response serializer must agree on actual HTTP data; an isolated type check cannot prove this connection.
 * @evidence contracts/e2e.md#shared-execution This request shares one packed installation, one combined controller program, one generated client program and one Nest application with all rich-fixture cases. It creates no compiler project or feature backend.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Scenario routes and DTO names have explicit namespaces in the combined fixture; requests retain their authored inputs and stateless handler expectations. Connectors retain their own finally cleanup. The common entry closes the application before removing its installation.
 * @evidence contracts/e2e.md#preserved-coverage The former store call and assertEquals remain, strengthened by copied-field equality. The null-title negative and other feature assertions are preserved without adding another preparation.
 */
export const test_body_api_body = async (
  connection: api.IConnection,
): Promise<void> => {
  const input = typia.random<IBbsArticleBody.IStoreBody>();
  const article: IBbsArticleBody = await api.functional.body.body.store(
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
