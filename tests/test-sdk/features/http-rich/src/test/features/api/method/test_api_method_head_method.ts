import { TestValidator } from "@nestia/e2e";

import api from "../../../../api";

/**
 * Verifies the generated HEAD client returns no response body.
 *
 * This retains the original body-absence assertion; OPTIONS and ordinary method
 * connections are freshly generated cases of the same shared input.
 *
 * 1. Execute the preserved requests or read newly generated artifacts.
 * 2. Check the original value, shape, rejection or generation assertions.
 *
 * @evidence contracts/testing.md#behavioral-verification The actual generated HEAD client completes and returns undefined rather than a decoded response body.
 * @evidence contracts/testing.md#independent-expectations The authored Nest Head handler returns void, and HTTP HEAD carries no response body; the literal undefined expectation is independent of the generated declaration.
 * @evidence contracts/testing.md#distinguishing-cases This retains the original body-absence assertion; OPTIONS and ordinary method connections are freshly generated cases of the same shared input.
 * @evidence contracts/testing.md#execution-ownership The shared installed consumer discovers this matching file/export after its public compilation. Its case consumes actual generated artifacts or live responses and creates no compiler or application.
 * @evidence contracts/e2e.md#necessary-boundary The installed producer, actual generation and emitted consumer must agree on the authored operation. Direct name/schema or option units cannot establish this generated artifact or transport connection.
 * @evidence contracts/e2e.md#shared-execution This case reuses the same installation, producer, all-generation, consumer compilation and application as the other rich scenarios. Its original assertions add no independent project preparation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Scenario-prefixed routes select stateless authored controllers. Request values and response/document reads are case-local; generation owns fresh source files, and the runner closes the actual application in finally.
 * @evidence contracts/e2e.md#preserved-coverage All valid assertions from method/src/test/features/api/test_api_method_head.ts remain. Only imports, case/class/route identities, generated-artifact locations and the uniquely prefixed status DTO name change; controller algorithms and payload boundaries are preserved.
 */
export const test_api_method_head_method = async (
  connection: api.IConnection,
): Promise<void> => {
  const x = await api.functional.http_rich.method.method.head(connection);
  TestValidator.equals("HEAD has no response body", x, undefined);
};
