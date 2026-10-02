import { TestValidator } from "@nestia/e2e";

import api from "@api";

/**
 * Verifies plain text literal bodies preserve every permitted literal and
 * reject an out-of-domain literal.
 *
 * PlainBody literal validation and the generated plain-text client must agree
 * over HTTP.
 *
 * 1. Execute the authored fixture inputs through the owning route.
 * 2. Assert a, B and C echo exactly and D must fail with HTTP 400, distinguishing
 *    literal validation from unrestricted text acceptance.
 *
 * @evidence contracts/testing.md#behavioral-verification A, B and C echo exactly and D must fail with HTTP 400, distinguishing literal validation from unrestricted text acceptance.
 * @evidence contracts/testing.md#independent-expectations The authored controller and DTO are the oracle: A, B and C echo exactly and D must fail with HTTP 400, distinguishing literal validation from unrestricted text acceptance.
 * @evidence contracts/testing.md#distinguishing-cases A, B and C echo exactly and D must fail with HTTP 400, distinguishing literal validation from unrestricted text acceptance.
 * @evidence contracts/testing.md#execution-ownership The plain installed SDK fixture compiles this matching test-prefixed export and its src/test/index.ts DynamicExecutor invokes it against that fixture backend.
 * @evidence contracts/e2e.md#necessary-boundary PlainBody literal validation and the generated plain-text client must agree over HTTP.
 * @evidence contracts/e2e.md#shared-execution This case reuses the plain fixture SDK compilation, document generation and backend with its other tests. The current master runner still prepares separate fixtures independently; whole-suite batching remains an execution limitation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The plain fixture owns generated artifacts and its backend lifetime; each case supplies local inputs to echo or fixed-error endpoints, and the feature index closes its backend after the executor report. Earlier harness failures can bypass that close; this case does not claim cancellation-safe suite cleanup.
 * @evidence contracts/e2e.md#preserved-coverage No assertion was transferred to another layer; the value and failure checks named here remain in this executable case. Other fixture cases own different DTO and decorator options.
 */
export const test_api_plain_constant = async (
  connection: api.IConnection,
): Promise<void> => {
  for (const x of ["A", "B", "C"] as const) {
    const y = await api.functional.plain.constant(connection, x);
    TestValidator.equals("constant", x, y);
  }
  await TestValidator.httpError("invalid literal", 400, () =>
    api.functional.plain.constant(connection, "D" as any),
  );
};
