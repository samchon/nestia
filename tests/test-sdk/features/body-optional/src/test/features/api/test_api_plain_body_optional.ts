import { TestValidator } from "@nestia/e2e";

import api from "@api";

/**
 * Verifies checks omitted plain input returns Hello, world!, explicit input
 * echoes, and raw empty POST receives 201.
 *
 * The authored optional plain controller supplies the default string and Nest
 * POST defaults to status 201.
 *
 * 1. Execute the authored feature through its prepared generated artifacts.
 * 2. Assert the distinctions described below.
 */
export const test_api_plain_body_optional = async (
  connection: api.IConnection,
): Promise<void> => {
  TestValidator.equals(
    "empty",
    await api.functional.body.optional.plain(connection),
    "Hello, world!",
  );
  TestValidator.equals(
    "filled",
    await api.functional.body.optional.plain(connection, "something"),
    "something",
  );

  const response: Response = await fetch(
    `${connection.host}/body/optional/plain`,
    {
      method: "POST",
    },
  );
  TestValidator.equals("status", response.status, 201);
};
