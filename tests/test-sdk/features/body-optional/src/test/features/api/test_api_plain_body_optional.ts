import { TestValidator } from "@nestia/e2e";

import api from "@api";

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
