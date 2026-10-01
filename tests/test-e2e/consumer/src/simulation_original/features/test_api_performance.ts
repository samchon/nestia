import typia from "typia";

import api from "../../api";
import { IPerformance } from "../../oracle/simulation_original/structures/IPerformance";

/**
 * Verifies the generated performance request returns the controller DTO.
 *
 * This case consumes the common generated artifact for the original simulate
 * performance route.
 *
 * 1. Call the generated performance GET against the feature connection.
 * 2. Validate the decoded result against the handwritten IPerformance contract.
 *
 * @evidence contracts/testing.md#behavioral-verification The generated performance GET must succeed and its decoded payload must satisfy IPerformance; a misrouted request, failed response or incompatible serializer output fails.
 * @evidence contracts/testing.md#independent-expectations IPerformance is the handwritten controller response contract, independent of generated functional client code. The assertion checks its shape; CPU and memory readings are live values and are not fixed expectations.
 * @evidence contracts/testing.md#distinguishing-cases This owns the ordinary nonempty response in this feature, complementary to the void health request. It does not certify particular resource readings or every generator option.
 * @evidence contracts/testing.md#execution-ownership The common simulation population discovers this export with simulate true after shared SDK generation and observes the live producer through callbacks.
 * @evidence contracts/e2e.md#necessary-boundary The generated SDK simulator and the independent authored performance DTO connect while the population owner proves the native server received no request; a DTO-only unit cannot prove that branch choice.
 * @evidence contracts/e2e.md#shared-execution No installation, compilation or host is started by this function; both adapter runs reuse the sole installation, rich producer, generated SDK and compiled consumer.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Reading performance does not mutate fixture data; dynamic resource counters are checked only for their DTO shape. The common entry owns the backend and its port and closes it after the complete report, including failure.
 * @evidence contracts/e2e.md#preserved-coverage The original generated request and DTO assertion are retained; neighboring tests still own void, invalid-input and feature-specific behavior. No resource measurement is used as a performance claim.
 */
export const test_api_performance = async (
  connection: api.IConnection,
): Promise<void> => {
  const performance: IPerformance =
    await api.functional.simulation_original.performance.get(connection);
  typia.assert(performance);
};
