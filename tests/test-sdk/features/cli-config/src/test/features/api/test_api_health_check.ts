import api from "@api";

/**
 * Verifies the generated void health request resolves without a transport or
 * status error.
 *
 * The authored health controller returns void; the generated client must
 * complete its request successfully. This smoke case does not prove validation
 * or serialization.
 *
 * 1. Call the generated client against the feature backend.
 * 2. Require the request outcome described by the authored controller and DTO.
 *
 * @evidence contracts/testing.md#behavioral-verification This case exercises api.functional.health.get; a failed transport, incorrect status, or rejected assertion propagates to DynamicExecutor.
 * @evidence contracts/testing.md#independent-expectations The authored health controller returns void; the generated client must complete its request successfully. This smoke case does not prove validation or serialization.
 * @evidence contracts/testing.md#distinguishing-cases The single successful void request owns transport availability only; feature-specific positive and rejection tests own their adjacent input distinctions.
 * @evidence contracts/testing.md#execution-ownership The feature src/test/index.ts discovers this exported test through DynamicExecutor after start.js generates its client and compiles the consumer; it is an actual HTTP E2E connection.
 * @evidence contracts/e2e.md#necessary-boundary The generated client and transformed controller communicate over HTTP, distinguishing incorrect route wiring or response decoding from direct DTO operations.
 * @evidence contracts/e2e.md#shared-execution This test reuses its feature's generation and Backend session with sibling discovered cases. start.js batches compatible feature generation; distinct feature programs and their backend lifetimes remain separate preparations.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The feature runner supplies its own backend connection and generated client; this read or isolated request retains no shared client-side state. Backend teardown belongs to the feature entry, whose exceptional-start cleanup remains a harness limitation.
 * @evidence contracts/e2e.md#preserved-coverage The existing request and structural or status checks remain in this discoverable entry; no assertion is transferred or removed. These smoke cases do not establish the full feature's option matrix.
 */
export const test_api_health_check = (
  connection: api.IConnection,
): Promise<void> => api.functional.health.get(connection);
