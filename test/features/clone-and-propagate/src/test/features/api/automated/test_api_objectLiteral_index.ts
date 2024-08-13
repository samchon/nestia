import type { IPropagation } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";
import type { ArrayObjectLietral } from "../../../../api/structures/ArrayObjectLietral";

export const test_api_objectLiteral_index = async (
  connection: api.IConnection,
) => {
  const output: IPropagation<
    {
      200: ArrayObjectLietral;
    },
    200
  > = await api.functional.objectLiteral.index(connection);
  typia.assert(output);
};
