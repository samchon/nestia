import { TestValidator } from "@nestia/e2e";

import api from "../../../../api";

/**
 * Verifies permitted plain-text literals echo and an invalid literal is
 * rejected.
 *
 * Every permitted literal is preserved, with the one-axis out-of-domain D
 * negative retained.
 *
 * 1. Execute the preserved requests or read newly generated artifacts.
 * 2. Check the original value, shape, rejection or generation assertions.
 *
 * @evidence contracts/testing.md#behavioral-verification Each authored A/B/C literal echoes exactly and the adjacent D literal receives HTTP400.
 * @evidence contracts/testing.md#independent-expectations The authored A/B/C union and actual echo handler establish the accepted domain and response values; D lies outside that union.
 * @evidence contracts/testing.md#distinguishing-cases Every permitted literal is preserved, with the one-axis out-of-domain D negative retained.
 * @evidence contracts/testing.md#execution-ownership The shared installed consumer discovers this matching file/export after its public compilation. Its case consumes actual generated artifacts or live responses and creates no compiler or application.
 * @evidence contracts/e2e.md#necessary-boundary The installed producer, actual generation and emitted consumer must agree on the authored operation. Direct name/schema or option units cannot establish this generated artifact or transport connection.
 * @evidence contracts/e2e.md#shared-execution This case reuses the same installation, producer, all-generation, consumer compilation and application as the other rich scenarios. Its original assertions add no independent project preparation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Scenario-prefixed routes select stateless authored controllers. Request values and response/document reads are case-local; generation owns fresh source files, and the runner closes the actual application in finally.
 * @evidence contracts/e2e.md#preserved-coverage All valid assertions from plain/src/test/features/api/test_api_plain_constant.ts remain. Only imports, case/class/route identities, generated-artifact locations and the uniquely prefixed status DTO name change; controller algorithms and payload boundaries are preserved.
 */
export const test_api_plain_constant_plain = async (
  connection: api.IConnection,
): Promise<void> => {
  for (const x of ["A", "B", "C"] as const) {
    const y = await api.functional.http_rich.plain.plain.constant(
      connection,
      x,
    );
    TestValidator.equals<string>("constant", x, y);
  }
  await TestValidator.httpError("invalid literal", 400, () =>
    api.functional.http_rich.plain.plain.constant(connection, "D" as any),
  );
};
