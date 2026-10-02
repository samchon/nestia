import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import api from "@api";
import { IBodyOptional } from "@api/lib/structures/IBodyOptional";

/**
 * Verifies sends omitted and present typed JSON through the client and checks
 * raw empty POST status 201.
 *
 * The authored optional JSON controller permits omission; Nest POST defaults to
 * 201.
 *
 * 1. Execute the authored feature through its prepared generated artifacts.
 * 2. Assert the distinctions described below.
 */
export const test_api_json_body_optional = async (
  connection: api.IConnection,
): Promise<void> => {
  await api.functional.body.optional.json(connection);
  await api.functional.body.optional.json(
    connection,
    typia.random<IBodyOptional>(),
  );

  const response: Response = await fetch(
    `${connection.host}/body/optional/json`,
    {
      method: "POST",
    },
  );
  TestValidator.equals("status", response.status, 201);
};
