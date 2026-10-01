import typia from "typia";

import api from "../../api";
import { IPerformanceMultipartFormData } from "../../api/structures/IPerformanceMultipartFormData";

/**
 * Verifies the generated performance request returns the controller DTO.
 *
 * This case consumes the multipart-form-data feature's generated artifact.
 *
 * 1. Call the generated performance GET against the feature connection.
 * 2. Validate the decoded result against the handwritten
 *    IPerformanceMultipartFormData contract.
 *
 * @evidence contracts/testing.md#behavioral-verification The generated performance GET must succeed and its decoded payload must satisfy IPerformanceMultipartFormData; a misrouted request, failed response or incompatible serializer output fails.
 * @evidence contracts/testing.md#independent-expectations IPerformanceMultipartFormData is the handwritten controller response contract, independent of generated functional client code. The assertion checks its shape; CPU and memory readings are live values and are not fixed expectations.
 * @evidence contracts/testing.md#distinguishing-cases This owns the ordinary nonempty response in this feature, complementary to the void health request. It does not certify particular resource readings or every generator option.
 * @evidence contracts/testing.md#execution-ownership The common generated consumer DynamicExecutor discovers this named export after the single consumer compilation. It receives the shared connection and aggregates failures without repeating preparation.
 * @evidence contracts/e2e.md#necessary-boundary The generated SDK, fetcher, controller and response serializer meet on an actual request. A direct DTO check cannot establish that this generated client reaches that handler and decodes its response.
 * @evidence contracts/e2e.md#shared-execution This request shares one packed installation, one combined controller program, one generated client program and one Nest application with all rich-fixture cases. It creates no compiler project or feature backend.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Scenario routes and DTO names have explicit namespaces in the combined fixture; requests retain their authored inputs and stateless handler expectations. Connectors retain their own finally cleanup. The common entry closes the application before removing its installation.
 * @evidence contracts/e2e.md#preserved-coverage The original generated request and DTO assertion are retained; neighboring tests still own void, invalid-input and feature-specific behavior. No resource measurement is used as a performance claim.
 */
export const test_multipart_form_data_api_performance = async (
  connection: api.IConnection,
): Promise<void> => {
  const performance: IPerformanceMultipartFormData =
    await api.functional.multipart_form_data.performance.get(connection);
  typia.assert(performance);
};
