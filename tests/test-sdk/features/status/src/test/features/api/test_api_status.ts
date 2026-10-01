import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import api from "@api";
import { IBbsArticle } from "@api/lib/structures/IBbsArticle";

/**
 * Verifies api status.
 *
 * @evidence contracts/testing.md#behavioral-verification Generated status metadata must be300 and the actual random response must satisfy exact IBbsArticle shape.
 * @evidence contracts/testing.md#independent-expectations The controller explicitly declares300 and handwritten IBbsArticle; no exact random field values are inferred from current output.
 * @evidence contracts/testing.md#distinguishing-cases An unconventional successful300 contrasts default status; metadata and actual decoded result are both observed.
 * @evidence contracts/testing.md#execution-ownership The feature executor discovers and awaits test_api_status after generation/emission. The simulate expression arrows return their assertion promises, so asynchronous rejection belongs to the report; zero discovery and any failed case fail the entry.
 * @evidence contracts/e2e.md#necessary-boundary Generated status metadata, fetcher and actual300 HTTP handler must connect; printing a status value alone cannot prove response decoding.
 * @evidence contracts/e2e.md#shared-execution This case reuses packed dependencies, its compatible producer and emitted runtime, and its feature backend and generated client rather than compiling per assertion.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Connections and supplied values belong to this invocation; simulate flags and header objects are local copies. Sequential cases share only their feature backend, which the entry closes in finally; copied outputs remain isolated.
 * @evidence contracts/e2e.md#preserved-coverage The test_api_status selected inputs and output/status/document constraints above remain executable after shared preparation. Source-extension now also pins both literal payloads, and HEAD pins its void result; no retained invalid control is replaced by compilation success.
 */
export const test_api_status = async (
  connection: api.IConnection,
): Promise<void> => {
  TestValidator.equals(
    "status",
    300,
    api.functional.status.random.METADATA.status!,
  );

  const article: IBbsArticle = await api.functional.status.random(connection);
  typia.assertEquals(article);
};
