import { RandomGenerator, TestValidator } from "@nestia/e2e";

import api from "../../../../api";

/**
 * Verifies large and empty plain-text bodies echo exactly.
 *
 * Large and empty bodies distinguish truncation, JSON quoting and body-absence handling without reducing the original payload size.
 *
 * 1. Execute the preserved requests or read newly generated artifacts.
 * 2. Check the original value, shape, rejection or generation assertions.
 *
 * @evidence contracts/testing.md#behavioral-verification A million-character plain text request must echo exactly and an empty string must remain empty.
 * @evidence contracts/testing.md#independent-expectations The request string itself and the empty literal establish the wire values; the authored PlainBody string handler returns its own input.
 * @evidence contracts/testing.md#distinguishing-cases Large and empty bodies distinguish truncation, JSON quoting and body-absence handling without reducing the original payload size.
 * @evidence contracts/testing.md#execution-ownership The shared installed consumer discovers this matching file/export after its public compilation. Its case consumes actual generated artifacts or live responses and creates no compiler or application.
 * @evidence contracts/e2e.md#necessary-boundary The installed producer, actual generation and emitted consumer must agree on the authored operation. Direct name/schema or option units cannot establish this generated artifact or transport connection.
 * @evidence contracts/e2e.md#shared-execution This case reuses the same installation, producer, all-generation, consumer compilation and application as the other rich scenarios. Its original assertions add no independent project preparation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Scenario-prefixed routes select stateless authored controllers. Request values and response/document reads are case-local; generation owns fresh source files, and the runner closes the actual application in finally.
 * @evidence contracts/e2e.md#preserved-coverage All valid assertions from plain/src/test/features/api/test_api_plain_string.ts remain. Only imports, case/class/route identities, generated-artifact locations and the uniquely prefixed status DTO name change; controller algorithms and payload boundaries are preserved.
 */
export const test_api_plain_string_plain = async (
  connection: api.IConnection,
): Promise<void> => {
  const x: string = RandomGenerator.alphabets(1_000_000);
  const y: string = await api.functional.http_rich.plain.plain.string(connection, x);
  TestValidator.equals("string", x, y);
  TestValidator.equals(
    "empty text",
    await api.functional.http_rich.plain.plain.string(connection, ""),
    "",
  );
};
