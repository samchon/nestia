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
