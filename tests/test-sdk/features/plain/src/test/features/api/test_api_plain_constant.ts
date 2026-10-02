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
 * 2. Assert A, B and C echo exactly and D must fail with HTTP 400, distinguishing
 *    literal validation from unrestricted text acceptance.
 */
export const test_api_plain_constant = async (
  connection: api.IConnection,
): Promise<void> => {
  for (const x of ["A", "B", "C"] as const) {
    const y = await api.functional.plain.constant(connection, x);
    TestValidator.equals<string>("constant", x, y);
  }
  await TestValidator.httpError("invalid literal", 400, () =>
    api.functional.plain.constant(connection, "D" as any),
  );
};
