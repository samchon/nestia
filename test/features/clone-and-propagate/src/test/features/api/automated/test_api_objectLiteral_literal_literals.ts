import type { IPropagation } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";
import type { Array__type } from "../../../../api/structures/Array__type";

export const test_api_objectLiteral_literal_literals = async (
  connection: api.IConnection,
) => {
  const output: IPropagation<
    {
      200: Array__type;
    },
    200
  > = await api.functional.objectLiteral.literal.literals(connection);
  typia.assert(output);
};
