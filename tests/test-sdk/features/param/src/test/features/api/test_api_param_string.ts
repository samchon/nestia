import { TestValidator } from "@nestia/e2e";

import api from "@api";

/**
 * Verifies a string path parameter survives an SDK request unchanged.
 *
 * SDK URI encoding and router parameter extraction must preserve the same
 * decoded string.
 *
 * 1. Execute the authored fixture inputs through the owning route.
 * 2. Assert the string echo controller returns the authored text rather than
 *    merely any valid string; Unicode and slash-containing strings supply
 *    encoding boundaries.
 */
export const test_api_param_string = async (
  connection: api.IConnection,
): Promise<void> => {
  for (const input of ["string", "\uD55C\uAE00", "a/b"])
    TestValidator.equals(
      "string echo",
      await api.functional.param.string(connection, input),
      input,
    );
};
