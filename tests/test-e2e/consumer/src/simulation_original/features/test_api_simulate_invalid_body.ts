import { TestValidator } from "@nestia/e2e";
import typia, { Primitive } from "typia";

import api from "../../api";
import type { IBbsArticle } from "../../oracle/simulation_original/structures/IBbsArticle";

/**
 * Verifies api simulate invalid body.
 *
 * The original malformed input distinguishes client-side validation from a live
 * handler rejection; the population owner verifies the producer remains
 * unused.
 *
 * 1. Call the generated request with simulate true and the original single
 *    malformed value.
 * 2. Await the original HTTP 400 assertion and the population observer checks.
 *
 * @evidence contracts/testing.md#behavioral-verification The body simulator must reject numeric title3 with400 through the returned assertion promise.
 * @evidence contracts/testing.md#independent-expectations The authored parameter/body contract requires String title inside an otherwise valid generated store DTO; the deliberate violation establishes rejection independently of simulator validation.
 * @evidence contracts/testing.md#distinguishing-cases numeric title3 isolates this invalid-input category while other supplied fields are valid. Sibling cases retain other categories and the entry rejects any server-used marker.
 * @evidence contracts/testing.md#execution-ownership The shared simulation population executor discovers and awaits test_api_simulate_invalid_body after generation/emission. The simulate expression arrows return their assertion promises, so asynchronous rejection belongs to the report; zero discovery and any failed case fail the entry.
 * @evidence contracts/e2e.md#necessary-boundary Actual generated simulator validation references and compiled consumer arguments must connect. The entry supplies simulate:true and verifies no handler-use marker, so ordinary server rejection cannot substitute for this client-side result.
 * @evidence contracts/e2e.md#shared-execution This case reuses the sole packed installation, rich producer, generated SDK and compiled consumer for each existing adapter lifetime; it starts no compiler or host.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The population owner supplies a simulator-local connection and observes the actual original producer Global through backend callbacks, not a consumer state copy. Each invalid assertion returns its promise; otherwise valid random inputs are not reused as an output oracle, and the common entry closes the shared backend after all consumers settle.
 * @evidence contracts/e2e.md#preserved-coverage The test_api_simulate_invalid_body selected inputs and output/status/document constraints above remain executable after shared preparation. Source-extension now also pins both literal payloads, and HEAD pins its void result; no retained invalid control is replaced by compilation success.
 */
export const test_api_simulate_invalid_body = (
  connection: api.IConnection,
): Promise<void> =>
  TestValidator.httpError("invalid body", 400, () =>
    api.functional.simulation_original.bbs.articles.store(
      connection,
      typia.random<Primitive<string>>(),
      {
        ...typia.random<Primitive<IBbsArticle.IStore>>(),
        title: 3 as any as string,
      },
    ),
  );
