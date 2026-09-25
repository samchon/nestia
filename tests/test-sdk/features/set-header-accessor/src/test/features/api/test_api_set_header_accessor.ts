import { TestValidator } from "@nestia/e2e";

import api from "@api";

/**
 * Verifies `@setHeader` reads a response key that is no identifier and names
 * the header by the source's last key when the target is omitted.
 *
 * The SDK wrote the source path as raw identifier text, so `x-token` compiled
 * as `output.x - token`, and an omitted target wrote the dotted path into the
 * headers, `connection.headers.access.token` (#1729).
 *
 * 1. Call the route whose response key is `x-token`; the header is set.
 * 2. Call the route whose source is `access.token` with no target; the `token`
 *    header is set.
 */
export const test_api_set_header_accessor = async (
  connection: api.IConnection,
): Promise<void> => {
  const hyphen: api.IConnection = { ...connection };
  await api.functional.auth.hyphen(hyphen);
  TestValidator.equals("hyphen", hyphen.headers?.["x-token"], "a");

  const dotted: api.IConnection = { ...connection };
  await api.functional.auth.dotted(dotted);
  TestValidator.equals("dotted", dotted.headers?.token, "b");
};
