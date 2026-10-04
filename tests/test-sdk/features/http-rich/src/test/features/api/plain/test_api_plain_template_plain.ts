import { TestValidator } from "@nestia/e2e";

import api from "../../../../api";

/**
 * Verifies plain-text template validation accepts and rejects adjacent inputs.
 *
 * The original valid template and unrelated text rejection retain both
 * transformation and parser distinctions.
 *
 * 1. Execute the preserved requests or read newly generated artifacts.
 * 2. Check the original value, shape, rejection or generation assertions.
 *
 * @evidence contracts/testing.md#behavioral-verification The authored template-literal text echoes exactly and the otherwise text-valued invalid input receives HTTP400.
 * @evidence contracts/testing.md#independent-expectations The preserved PlainBody template declaration establishes the accepted text grammar; literal input equality supplies the expected response.
 * @evidence contracts/testing.md#distinguishing-cases The original valid template and unrelated text rejection retain both transformation and parser distinctions.
 * @evidence contracts/testing.md#execution-ownership The shared installed consumer discovers this matching file/export after its public compilation. Its case consumes actual generated artifacts or live responses and creates no compiler or application.
 * @evidence contracts/e2e.md#necessary-boundary The installed producer, actual generation and emitted consumer must agree on the authored operation. Direct name/schema or option units cannot establish this generated artifact or transport connection.
 * @evidence contracts/e2e.md#shared-execution This case reuses the same installation, producer, all-generation, consumer compilation and application as the other rich scenarios. Its original assertions add no independent project preparation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Scenario-prefixed routes select stateless authored controllers. Request values and response/document reads are case-local; generation owns fresh source files, and the runner closes the actual application in finally.
 * @evidence contracts/e2e.md#preserved-coverage All valid assertions from plain/src/test/features/api/test_api_plain_template.ts remain. Only imports, case/class/route identities, generated-artifact locations and the uniquely prefixed status DTO name change; controller algorithms and payload boundaries are preserved.
 */
export const test_api_plain_template_plain = async (
  connection: api.IConnection,
): Promise<void> => {
  const x = "something_123_interesting_abc_is_not_true_it?";
  const y: string = await api.functional.http_rich.plain.plain.template(
    connection,
    x,
  );

  TestValidator.equals("template", x as string, y);
  await TestValidator.httpError("invalid template", 400, () =>
    api.functional.http_rich.plain.plain.template(connection, "invalid" as any),
  );
};
