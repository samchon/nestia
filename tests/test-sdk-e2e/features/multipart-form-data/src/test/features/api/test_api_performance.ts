import typia from "typia";

import api from "@api";
import { IPerformance } from "@api/lib/structures/IPerformance";

/**
 * Verifies the generated performance request returns the controller DTO.
 *
 * This case consumes the multipart-form-data feature's generated artifact.
 *
 * 1. Call the generated performance GET against the feature connection.
 * 2. Validate the decoded result against the handwritten IPerformance contract.
 *
 * @evidence contracts/testing.md#behavioral-verification The generated performance GET must succeed and its decoded payload must satisfy IPerformance; a misrouted request, failed response or incompatible serializer output fails.
 * @evidence contracts/testing.md#independent-expectations IPerformance is the handwritten controller response contract, independent of generated functional client code. The assertion checks its shape; CPU and memory readings are live values and are not fixed expectations.
 * @evidence contracts/testing.md#distinguishing-cases This owns the ordinary nonempty response in this feature, complementary to the void health request. It does not certify particular resource readings or every generator option.
 * @evidence contracts/testing.md#execution-ownership The feature DynamicExecutor discovers this export and provides its actual connection after SDK generation; the feature backend runs in the shared runtime program.
 * @evidence contracts/e2e.md#necessary-boundary The generated SDK, fetcher, controller and response serializer meet on an actual request. A direct DTO check cannot establish that this generated client reaches that handler and decodes its response.
 * @evidence contracts/e2e.md#shared-execution No installation, compilation or host is started by this function. It reuses sibling tests' backend and generated SDK; the packed installation and Node consumer entries are shared, while installed public ttsc compiles each member with its own metadata scope.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Reading performance does not mutate fixture data; dynamic resource counters are checked only for their DTO shape. The feature entry owns its port and closes the backend in finally after reports or discovery/startup failures.
 * @evidence contracts/e2e.md#preserved-coverage The original generated request and DTO assertion are retained; neighboring tests still own void, invalid-input and feature-specific behavior. No resource measurement is used as a performance claim.
 */
export const test_api_performance = async (
  connection: api.IConnection,
): Promise<void> => {
  const performance: IPerformance =
    await api.functional.performance.get(connection);
  typia.assert(performance);
};
