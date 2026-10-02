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
