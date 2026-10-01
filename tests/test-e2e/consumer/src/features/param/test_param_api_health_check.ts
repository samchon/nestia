import { TestValidator } from "@nestia/e2e";

import api from "../../api";

/**
 * Verifies the generated health request resolves to an empty response.
 *
 * This case consumes the param feature's generated artifact.
 *
 * 1. Call the generated health GET against the feature connection.
 * 2. Assert the resolved payload is undefined rather than accepting arbitrary
 *    successful response data.
 *
 * @evidence contracts/testing.md#behavioral-verification The generated health GET must resolve successfully with undefined; a wrong route, failed status, or nonempty decoded payload fails this case.
 * @evidence contracts/testing.md#independent-expectations The handwritten HealthController.get has a void response. Undefined is the independent SDK contract for that empty response, not a snapshot of generated code.
 * @evidence contracts/testing.md#distinguishing-cases This owns the successful void response in this feature; body and performance cases own nonempty payloads, while dedicated diagnostic features own invalid routes. It does not independently assert every configuration option.
 * @evidence contracts/testing.md#execution-ownership The common generated consumer DynamicExecutor discovers this named export after the single consumer compilation. It receives the shared connection and aggregates failures without repeating preparation.
 * @evidence contracts/e2e.md#necessary-boundary This consumes the generated request through the fetcher and actual health handler. Direct type or source assertions cannot prove empty-response transport and decoding in this generated artifact.
 * @evidence contracts/e2e.md#shared-execution This request shares one packed installation, one combined controller program, one generated client program and one Nest application with all rich-fixture cases. It creates no compiler project or feature backend.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Scenario routes and DTO names have explicit namespaces in the combined fixture; requests retain their authored inputs and stateless handler expectations. Connectors retain their own finally cleanup. The common entry closes the application before removing its installation.
 * @evidence contracts/e2e.md#preserved-coverage The original health request remains executable and now asserts the void payload explicitly. Other feature-specific configuration assertions and nonempty responses stay with their existing owners.
 */
export const test_param_api_health_check = async (
  connection: api.IConnection,
): Promise<void> => {
  const result = await api.functional.param.health.get(connection);
  TestValidator.equals("empty response", result, undefined);
};
