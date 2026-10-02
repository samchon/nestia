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
 * @evidence contracts/testing.md#behavioral-verification The generated void health request must resolve successfully against the scenario route; a transport or status error fails the case.
 * @evidence contracts/testing.md#independent-expectations The original authored controller returns void. The case establishes successful request completion, with no claim about validation or serialized shape.
 * @evidence contracts/testing.md#distinguishing-cases This is a minimal valid void response connection. Body shape and malformed input distinctions remain in the neighboring positive and negative body cases.
 * @evidence contracts/testing.md#execution-ownership The SDK integration entry discovers this matching file/export under the shared body consumer; it executes actual generated-client or HTTP requests, not a direct unit operation.
 * @evidence contracts/e2e.md#necessary-boundary The authored controller, emitted request client where used, and live HTTP adapter must agree on transport and runtime semantics. Direct generator or native rule units cannot establish this connection.
 * @evidence contracts/e2e.md#shared-execution One http-rich producer includes all six scenarios, one generated consumer holds all cases and one backend serves them; this case starts no compiler or listener.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Scenario-specific routes select their own stateless controllers. Requests use local payloads and the runner closes the shared application in finally after discovery and request execution.
 * @evidence contracts/e2e.md#preserved-coverage This case retains the assertions from body-manual-assert/src/test/features/api/test_api_health_check.ts; only import locations, route prefix and case identity change to join the shared SDK and backend.
 */
export const test_api_health_check_manual_assert = (
  connection: api.IConnection,
): Promise<void> =>
  api.functional.body_rich.manual_assert.health.get(connection);
