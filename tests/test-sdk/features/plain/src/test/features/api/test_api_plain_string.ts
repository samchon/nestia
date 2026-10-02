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
