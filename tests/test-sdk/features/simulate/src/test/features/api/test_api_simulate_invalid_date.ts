import { TestValidator } from "@nestia/e2e";

import api from "@api";

/**
 * Verifies api simulate invalid date.
 *
 * @evidence contracts/testing.md#behavioral-verification The date simulator must reject not-a-date with400 through the returned assertion promise.
 * @evidence contracts/testing.md#independent-expectations The authored parameter/body contract requires The explicitly tagged date parameter with general section; the deliberate violation establishes rejection independently of simulator validation.
 * @evidence contracts/testing.md#distinguishing-cases not-a-date isolates this invalid-input category while other supplied fields are valid. Sibling cases retain other categories and the entry rejects any server-used marker.
 * @evidence contracts/testing.md#execution-ownership The feature executor discovers and awaits test_api_simulate_invalid_date after generation/emission. The simulate expression arrows return their assertion promises, so asynchronous rejection belongs to the report; zero discovery and any failed case fail the entry.
 * @evidence contracts/e2e.md#necessary-boundary Actual generated simulator validation references and compiled consumer arguments must connect. The entry supplies simulate:true and verifies no handler-use marker, so ordinary server rejection cannot substitute for this client-side result.
 * @evidence contracts/e2e.md#shared-execution This case reuses packed dependencies, its compatible producer and emitted runtime, and the feature simulator artifacts rather than compiling per assertion.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The entry supplies a simulator-local connection and its marker belongs to this feature. Each invalid assertion returns its promise; otherwise valid random inputs are not reused as an output oracle, and the entry closes the negative-control backend.
 * @evidence contracts/e2e.md#preserved-coverage The test_api_simulate_invalid_date selected inputs and output/status/document constraints above remain executable after shared preparation. Source-extension now also pins both literal payloads, and HEAD pins its void result; no retained invalid control is replaced by compilation success.
 */
export const test_api_simulate_invalid_date = (
  connection: api.IConnection,
): Promise<void> =>
  TestValidator.httpError("invalid date", 400, () =>
    api.functional.bbs.articles.first(connection, "general", "not-a-date"),
  );
