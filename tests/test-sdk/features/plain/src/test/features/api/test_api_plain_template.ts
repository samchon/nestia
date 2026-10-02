import { TestValidator } from "@nestia/e2e";

import api from "@api";

/**
 * Verifies plain text template-literal validation accepts its valid shape and
 * rejects a malformed shape.
 *
 * Generated text transport reaches the native template validator through the
 * HTTP body parser.
 *
 * 1. Execute the authored fixture inputs through the owning route.
 * 2. Assert the authored something_123_interesting_abc_is_not_true_it? value
 *    echoes, while an unrelated text body must produce HTTP 400.
 *
 * @evidence contracts/testing.md#behavioral-verification The authored something_123_interesting_abc_is_not_true_it? value echoes, while an unrelated text body must produce HTTP 400.
 * @evidence contracts/testing.md#independent-expectations The authored controller and DTO are the oracle: The authored something_123_interesting_abc_is_not_true_it? value echoes, while an unrelated text body must produce HTTP 400.
 * @evidence contracts/testing.md#distinguishing-cases The authored something_123_interesting_abc_is_not_true_it? value echoes, while an unrelated text body must produce HTTP 400.
 * @evidence contracts/testing.md#execution-ownership The plain installed SDK fixture compiles this matching test-prefixed export and its src/test/index.ts DynamicExecutor invokes it against that fixture backend.
 * @evidence contracts/e2e.md#necessary-boundary Generated text transport reaches the native template validator through the HTTP body parser.
 * @evidence contracts/e2e.md#shared-execution This case reuses the plain fixture SDK compilation, document generation and backend with its other tests. The current master runner still prepares separate fixtures independently; whole-suite batching remains an execution limitation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The plain fixture owns generated artifacts and its backend lifetime; each case supplies local inputs to echo or fixed-error endpoints, and the feature index closes its backend after the executor report. Earlier harness failures can bypass that close; this case does not claim cancellation-safe suite cleanup.
 * @evidence contracts/e2e.md#preserved-coverage No assertion was transferred to another layer; the value and failure checks named here remain in this executable case. Other fixture cases own different DTO and decorator options.
 */
export const test_api_plain_template = async (
  connection: api.IConnection,
): Promise<void> => {
  const x = "something_123_interesting_abc_is_not_true_it?";
  const y: string = await api.functional.plain.template(connection, x);

  TestValidator.equals("template", x as string, y);
  await TestValidator.httpError("invalid template", 400, () =>
    api.functional.plain.template(connection, "invalid" as any),
  );
};
