import { TestValidator } from "@nestia/e2e";

import api from "@api";

/**
 * Verifies text request bodies are read when the application registered
 * Express's text body parser.
 *
 * `@PlainBody()` and `@EncryptedBody()` read Express requests from the raw
 * stream, which `app.useBodyParser("text")` had already consumed, so both
 * answered 500 "stream is not readable" (#1672). They now take the string the
 * parser left on `request.body`.
 *
 * 1. Send a text/plain body and assert it echoes back.
 * 2. Send an encrypted body and assert it decrypts and echoes back.
 *
 * @evidence contracts/testing.md#behavioral-verification The plain hello echo and decrypted secret object pin both branches after Express already consumed the raw stream; encrypted parsing supplies the contrasting branch.
 * @evidence contracts/testing.md#independent-expectations The authored controller and DTO are the oracle: The plain hello echo and decrypted secret object pin both branches after Express already consumed the raw stream; encrypted parsing supplies the contrasting branch.
 * @evidence contracts/testing.md#distinguishing-cases The plain hello echo and decrypted secret object pin both branches after Express already consumed the raw stream; encrypted parsing supplies the contrasting branch.
 * @evidence contracts/testing.md#execution-ownership The plain-text-parser installed SDK fixture compiles this matching test-prefixed export and its src/test/index.ts DynamicExecutor invokes it against that fixture backend.
 * @evidence contracts/e2e.md#necessary-boundary Express parser consumption and decorator body access are a real server assembly boundary.
 * @evidence contracts/e2e.md#shared-execution This case reuses the plain-text-parser fixture SDK compilation, document generation and backend with its other tests. The current master runner still prepares separate fixtures independently; whole-suite batching remains an execution limitation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The plain-text-parser fixture owns generated artifacts and its backend lifetime; each case supplies local inputs to echo or fixed-error endpoints, and the feature index closes its backend after the executor report. Earlier harness failures can bypass that close; this case does not claim cancellation-safe suite cleanup.
 * @evidence contracts/e2e.md#preserved-coverage No assertion was transferred to another layer; the value and failure checks named here remain in this executable case. Other fixture cases own different DTO and decorator options.
 */
export const test_plain_text_parser = async (
  connection: api.IConnection,
): Promise<void> => {
  const functional = api.functional.textParser;
  TestValidator.equals(
    "plain",
    await functional.plain(connection, "hello"),
    "hello",
  );
  TestValidator.equals(
    "encrypted",
    await functional.encrypted(connection, { value: "secret" }),
    { value: "secret" },
  );
};
