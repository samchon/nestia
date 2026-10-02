import typia from "typia";

import api from "../../../../api";
import { IPerformance } from "../../../../structures/method/IPerformance";

/**
 * Verifies the method scenario's performance response has its authored shape.
 *
 * This retains the original successful dynamic response shape check and does not claim an artificially malformed performance endpoint.
 *
 * 1. Execute the preserved requests or read newly generated artifacts.
 * 2. Check the original value, shape, rejection or generation assertions.
 *
 * @evidence contracts/testing.md#behavioral-verification The generated performance result must satisfy the preserved authored IPerformance shape for CPU, memory and resource observations.
 * @evidence contracts/testing.md#independent-expectations The authored IPerformance declaration defines the response structure; dynamic operating-system observations intentionally have no fixed values.
 * @evidence contracts/testing.md#distinguishing-cases This retains the original successful dynamic response shape check and does not claim an artificially malformed performance endpoint.
 * @evidence contracts/testing.md#execution-ownership The shared installed consumer discovers this matching file/export after its public compilation. Its case consumes actual generated artifacts or live responses and creates no compiler or application.
 * @evidence contracts/e2e.md#necessary-boundary The installed producer, actual generation and emitted consumer must agree on the authored operation. Direct name/schema or option units cannot establish this generated artifact or transport connection.
 * @evidence contracts/e2e.md#shared-execution This case reuses the same installation, producer, all-generation, consumer compilation and application as the other rich scenarios. Its original assertions add no independent project preparation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Scenario-prefixed routes select stateless authored controllers. Request values and response/document reads are case-local; generation owns fresh source files, and the runner closes the actual application in finally.
 * @evidence contracts/e2e.md#preserved-coverage All valid assertions from method/src/test/features/api/test_api_performance.ts remain. Only imports, case/class/route identities, generated-artifact locations and the uniquely prefixed status DTO name change; controller algorithms and payload boundaries are preserved.
 */
export const test_api_monitor_performance_method = async (
  connection: api.IConnection,
): Promise<void> => {
  const performance: IPerformance =
    await api.functional.http_rich.method.performance.get(connection);
  typia.assert(performance);
};
