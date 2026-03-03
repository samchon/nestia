import type { IPropagation } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";
import type { ObjectLietral } from "../../../../api/structures/ObjectLietral";

export const test_api_objectLiteral_index = async (
  connection: api.IConnection,
) => {
  const output: IPropagation<
    {
      200: ObjectLietral[];
    },
    200
  > = await api.functional.objectLiteral.index(connection);
  typia.assert(output);
};
