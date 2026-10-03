import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import api from "../../../../api";
import { StatusIBbsArticle } from "../../../../structures/status/StatusIBbsArticle";

/**
 * Verifies the generated SDK retains status 300 and the exact article shape.
 *
 * Swagger and actual SDK/runtime assert the same authored nondefault status
 * independently; the ordinary200/201 routes remain adjacent shared controls.
 *
 * 1. Execute the preserved requests or read newly generated artifacts.
 * 2. Check the original value, shape, rejection or generation assertions.
 *
 * @evidence contracts/testing.md#behavioral-verification The fresh SDK operation metadata status is300 and the actual response satisfies the exact authored article shape.
 * @evidence contracts/testing.md#independent-expectations The authored HttpCode(300) and article DTO define status and schema; the DTO identifier gains a unique Status prefix solely to distinguish shared-program declarations.
 * @evidence contracts/testing.md#distinguishing-cases Swagger and actual SDK/runtime assert the same authored nondefault status independently; the ordinary200/201 routes remain adjacent shared controls.
 * @evidence contracts/testing.md#execution-ownership The shared installed consumer discovers this matching file/export after its public compilation. Its case consumes actual generated artifacts or live responses and creates no compiler or application.
 * @evidence contracts/e2e.md#necessary-boundary The installed producer, actual generation and emitted consumer must agree on the authored operation. Direct name/schema or option units cannot establish this generated artifact or transport connection.
 * @evidence contracts/e2e.md#shared-execution This case reuses the same installation, producer, all-generation, consumer compilation and application as the other rich scenarios. Its original assertions add no independent project preparation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Scenario-prefixed routes select stateless authored controllers. Request values and response/document reads are case-local; generation owns fresh source files, and the runner closes the actual application in finally.
 * @evidence contracts/e2e.md#preserved-coverage All valid assertions from status/src/test/features/api/test_api_status.ts remain. Only imports, case/class/route identities, generated-artifact locations and the uniquely prefixed status DTO name change; controller algorithms and payload boundaries are preserved.
 */
export const test_api_status_status = async (
  connection: api.IConnection,
): Promise<void> => {
  TestValidator.equals(
    "status",
    300,
    api.functional.http_rich.status.status.random.METADATA.status!,
  );

  const article: StatusIBbsArticle =
    await api.functional.http_rich.status.status.random(connection);
  typia.assertEquals(article);
};
