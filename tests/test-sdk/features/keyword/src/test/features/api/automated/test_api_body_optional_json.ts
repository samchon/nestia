import typia from "typia";
import type { Primitive } from "typia";

import api from "../../../../api";
import type { IBodyOptional } from "../../../../api/structures/IBodyOptional";

export const test_api_body_optional_json = async (
  connection: api.IConnection,
) => {
  const output: Primitive<IBodyOptional> =
    await api.functional.body.optional.json(connection, {
      body: typia.random<IBodyOptional | undefined>(),
    });
  typia.assert(output);
};
