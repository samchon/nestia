import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import api from "@api";
import { IBodyOptional } from "@api/lib/structures/IBodyOptional";

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
