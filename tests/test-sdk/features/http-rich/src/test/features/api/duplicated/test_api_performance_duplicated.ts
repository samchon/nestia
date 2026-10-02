import typia from "typia";

import api from "@api";

import { IPerformance } from "../../../../structures/duplicated/IPerformance";

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
 * @evidence contracts/testing.md#behavioral-verification The generated performance response must satisfy the original authored IPerformance shape; malformed CPU, memory or resource structure fails validation.
 * @evidence contracts/testing.md#independent-expectations The preserved IPerformance declaration supplies the independent structural expectation. Dynamic operating-system observations are intentionally not fixed values.
 * @evidence contracts/testing.md#distinguishing-cases This valid dynamic response is checked structurally; it preserves the original case and does not claim an artificially malformed performance endpoint.
 * @evidence contracts/testing.md#execution-ownership The matching file/export is discovered by the SDK shared HTTP entry. It consumes emitted client artifacts or actual HTTP responses; the case starts no compiler or application.
 * @evidence contracts/e2e.md#necessary-boundary The native producer, generated client where used, authored controller and live adapter must agree on request and response semantics. Direct rule or generator units do not establish that runtime connection.
 * @evidence contracts/e2e.md#shared-execution All 18 scenarios share one input configuration, one generated SDK, one consumer program and one application. This case adds only its original assertions to that prepared population.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Distinct scenario routes select their own authored controllers; payloads and responses are case-local. The duplicated scenario intentionally reads one immutable module value. The runner closes the application in finally.
 * @evidence contracts/e2e.md#preserved-coverage All assertions from duplicated/src/test/features/api/test_api_performance.ts survive; only imports, discoverable case identity and the explicitly authored scenario route prefix change. Controller and DTO behavior remains unchanged.
 */
export const test_api_performance_duplicated = async (
  connection: api.IConnection,
): Promise<void> => {
  const performance: IPerformance =
    await api.functional.http_rich.duplicated.performance.get(connection);
  typia.assert(performance);
};
