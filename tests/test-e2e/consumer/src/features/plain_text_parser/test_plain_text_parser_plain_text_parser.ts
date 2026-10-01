import { TestValidator } from "@nestia/e2e";

import api from "../../api";

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
 * @evidence contracts/testing.md#behavioral-verification Generated plain hello and encrypted secret requests must echo exact string/object payloads under the authored Express text parser.
 * @evidence contracts/testing.md#independent-expectations Explicit submitted hello/secret and authored echo handlers supply independent expectations; the backend deliberately consumes the text stream before decorators see request.body.
 * @evidence contracts/testing.md#distinguishing-cases Plain text and encrypted JSON encoded as text contrast the two decorator body readers against a preconsumed stream. This pins valid parser reuse, not malformed or every content-type case.
 * @evidence contracts/testing.md#execution-ownership The common generated consumer DynamicExecutor discovers this named export after the single consumer compilation. It receives the shared connection and aggregates failures without repeating preparation.
 * @evidence contracts/e2e.md#necessary-boundary Actual Express parser/decorator stream ownership and generated encrypted/plain clients must connect; testing an unconsumed local stream cannot certify this setup.
 * @evidence contracts/e2e.md#shared-execution This request shares one packed installation, one combined controller program, one generated client program and one Nest application with all rich-fixture cases. It creates no compiler project or feature backend.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Scenario routes and DTO names have explicit namespaces in the combined fixture; requests retain their authored inputs and stateless handler expectations. Connectors retain their own finally cleanup. The common entry closes the application before removing its installation.
 * @evidence contracts/e2e.md#preserved-coverage All retained requests, raw protocol/document reads, compile controls and accepted/rejected assertions remain in this executable case and its stated sibling owners. Shared preparation does not substitute setup success for those observations.
 */
export const test_plain_text_parser_plain_text_parser = async (
  connection: api.IConnection,
): Promise<void> => {
  const functional = api.functional.plain_text_parser.textParser;
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
