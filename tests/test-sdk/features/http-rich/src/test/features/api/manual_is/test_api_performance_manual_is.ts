import typia from "typia";

import api from "@api";

import { IPerformance } from "../../../../structures/manual_is/IPerformance";

/**
 * Verifies the generated performance request returns the authored performance
 * shape.
 *
 * The authored IPerformance DTO defines the independent structural expectation;
 * dynamic CPU and memory values are deliberately not pinned.
 *
 * 1. Call the generated client against the feature backend.
 * 2. Require the request outcome described by the authored controller and DTO.
 *
 * @evidence contracts/testing.md#behavioral-verification The generated performance client response must satisfy the original authored IPerformance validator; a malformed runtime response fails the case.
 * @evidence contracts/testing.md#independent-expectations The preserved IPerformance declaration defines CPU, memory and resource structure independently of emitted SDK types; dynamic numeric observations are intentionally not pinned.
 * @evidence contracts/testing.md#distinguishing-cases The actual valid dynamic response is checked structurally. This case preserves the original assertion and does not claim a deliberately malformed performance endpoint.
 * @evidence contracts/testing.md#execution-ownership The SDK integration entry discovers this matching file/export under the shared body consumer; it executes actual generated-client or HTTP requests, not a direct unit operation.
 * @evidence contracts/e2e.md#necessary-boundary The authored controller, emitted request client where used, and live HTTP adapter must agree on transport and runtime semantics. Direct generator or native rule units cannot establish this connection.
 * @evidence contracts/e2e.md#shared-execution One http-rich producer includes all six scenarios, one generated consumer holds all cases and one backend serves them; this case starts no compiler or listener.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Scenario-specific routes select their own stateless controllers. Requests use local payloads and the runner closes the shared application in finally after discovery and request execution.
 * @evidence contracts/e2e.md#preserved-coverage This case retains the assertions from body-manual-is/src/test/features/api/test_api_performance.ts; only import locations, route prefix and case identity change to join the shared SDK and backend.
 */
export const test_api_performance_manual_is = async (
  connection: api.IConnection,
): Promise<void> => {
  const performance: IPerformance =
    await api.functional.body_rich.manual_is.performance.get(connection);
  typia.assert(performance);
};
