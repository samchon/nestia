import { RandomGenerator, TestValidator } from "@nestia/e2e";

import api from "@api";

/**
 * Verifies plain text transport preserves a large string without JSON quoting.
 *
 * The actual body parser and generated client must preserve plain text rather
 * than JSON serialize it.
 *
 * 1. Execute the authored fixture inputs through the owning route.
 * 2. Assert an authored million-character text must echo byte-for-text exactly;
 *    the empty text boundary also remains an empty string.
 *
 * @evidence contracts/testing.md#behavioral-verification An authored million-character text must echo byte-for-text exactly; the empty text boundary also remains an empty string.
 * @evidence contracts/testing.md#independent-expectations The authored controller and DTO are the oracle: An authored million-character text must echo byte-for-text exactly; the empty text boundary also remains an empty string.
 * @evidence contracts/testing.md#distinguishing-cases An authored million-character text must echo byte-for-text exactly; the empty text boundary also remains an empty string.
 * @evidence contracts/testing.md#execution-ownership The plain installed SDK fixture compiles this matching test-prefixed export and its src/test/index.ts DynamicExecutor invokes it against that fixture backend.
 * @evidence contracts/e2e.md#necessary-boundary The actual body parser and generated client must preserve plain text rather than JSON serialize it.
 * @evidence contracts/e2e.md#shared-execution This case reuses the plain fixture SDK compilation, document generation and backend with its other tests. The current master runner still prepares separate fixtures independently; whole-suite batching remains an execution limitation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The plain fixture owns generated artifacts and its backend lifetime; each case supplies local inputs to echo or fixed-error endpoints, and the feature index closes its backend after the executor report. Earlier harness failures can bypass that close; this case does not claim cancellation-safe suite cleanup.
 * @evidence contracts/e2e.md#preserved-coverage No assertion was transferred to another layer; the value and failure checks named here remain in this executable case. Other fixture cases own different DTO and decorator options.
 */
export const test_api_plain_string = async (
  connection: api.IConnection,
): Promise<void> => {
  const x: string = RandomGenerator.alphabets(1_000_000);
  const y: string = await api.functional.plain.string(connection, x);
  TestValidator.equals("string", x, y);
  TestValidator.equals(
    "empty text",
    await api.functional.plain.string(connection, ""),
    "",
  );
};
