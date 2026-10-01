import { TestValidator } from "@nestia/e2e";

import api from "@api";

/**
 * Verifies the generated health request resolves to an empty response.
 *
 * This case consumes the websocket-clone feature's generated artifact.
 *
 * 1. Call the generated health GET against the feature connection.
 * 2. Assert the resolved payload is undefined rather than accepting arbitrary
 *    successful response data.
 *
 * @evidence contracts/testing.md#behavioral-verification The generated health GET must resolve successfully with undefined; a wrong route, failed status, or nonempty decoded payload fails this case.
 * @evidence contracts/testing.md#independent-expectations The handwritten HealthController.get has a void response. Undefined is the independent SDK contract for that empty response, not a snapshot of generated code.
 * @evidence contracts/testing.md#distinguishing-cases This owns the successful void response in this feature; body and performance cases own nonempty payloads, while dedicated diagnostic features own invalid routes. It does not independently assert every configuration option.
 * @evidence contracts/testing.md#execution-ownership DynamicExecutor discovers this exported test in the feature test entry; the SDK harness supplies its actual connection after generation and starts the feature backend in the runtime program.
 * @evidence contracts/e2e.md#necessary-boundary This consumes the generated request through the fetcher and actual health handler. Direct type or source assertions cannot prove empty-response transport and decoding in this generated artifact.
 * @evidence contracts/e2e.md#shared-execution The case adds no installation, compilation or server startup of its own; it shares its feature backend and generated SDK with sibling API tests. Cohorts share native dispatch and Node processes, while each configuration retains an independent producer/runtime program and metadata collection.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The request is read-only. Feature runtime entries allocate their own ports and close the backend in finally on normal reports, discovery errors and failed startup.
 * @evidence contracts/e2e.md#preserved-coverage The original health request remains executable and now asserts the void payload explicitly. Other feature-specific configuration assertions and nonempty responses stay with their existing owners.
 */
export const test_api_health_check = async (
  connection: api.IConnection,
): Promise<void> => {
  const result = await api.functional.health.get(connection);
  TestValidator.equals("empty response", result, undefined);
};
