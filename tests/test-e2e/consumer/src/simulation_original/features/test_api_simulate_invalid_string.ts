import { TestValidator } from "@nestia/e2e";

import api from "../../api";

/**
 * Verifies api simulate invalid string.
 *
 * The original malformed input distinguishes client-side validation from a live
 * handler rejection; the population owner verifies the producer remains
 * unused.
 *
 * 1. Call the generated request with simulate true and the original single
 *    malformed value.
 * 2. Await the original HTTP 400 assertion and the population observer checks.
 *
 * @evidence contracts/testing.md#behavioral-verification The string simulator must reject null section with400 through the returned assertion promise.
 * @evidence contracts/testing.md#independent-expectations The authored parameter/body contract requires A required string section with an independently valid UUID; the deliberate violation establishes rejection independently of simulator validation.
 * @evidence contracts/testing.md#distinguishing-cases null section isolates this invalid-input category while other supplied fields are valid. Sibling cases retain other categories and the entry rejects any server-used marker.
 * @evidence contracts/testing.md#execution-ownership The shared simulation population executor discovers and awaits test_api_simulate_invalid_string after generation/emission. The simulate expression arrows return their assertion promises, so asynchronous rejection belongs to the report; zero discovery and any failed case fail the entry.
 * @evidence contracts/e2e.md#necessary-boundary Actual generated simulator validation references and compiled consumer arguments must connect. The entry supplies simulate:true and verifies no handler-use marker, so ordinary server rejection cannot substitute for this client-side result.
 * @evidence contracts/e2e.md#shared-execution This case reuses the sole packed installation, rich producer, generated SDK and compiled consumer for each existing adapter lifetime; it starts no compiler or host.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The population owner supplies a simulator-local connection and observes the actual original producer Global through backend callbacks, not a consumer state copy. Each invalid assertion returns its promise; otherwise valid random inputs are not reused as an output oracle, and the common entry closes the shared backend after all consumers settle.
 * @evidence contracts/e2e.md#preserved-coverage The test_api_simulate_invalid_string selected inputs and output/status/document constraints above remain executable after shared preparation. Source-extension now also pins both literal payloads, and HEAD pins its void result; no retained invalid control is replaced by compilation success.
 */
export const test_api_simulate_invalid_string = (
  connection: api.IConnection,
): Promise<void> =>
  TestValidator.httpError("invalid string", 400, () =>
    api.functional.simulation_original.bbs.articles.at(
      connection,
      null!,
      uuid(),
    ),
  );

const uuid = (): string =>
  "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
