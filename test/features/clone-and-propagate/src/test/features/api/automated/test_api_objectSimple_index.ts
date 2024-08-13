import type { IPropagation } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";
import type { ArrayIBox3D } from "../../../../api/structures/ArrayIBox3D";

export const test_api_objectSimple_index = async (
  connection: api.IConnection,
) => {
  const output: IPropagation<
    {
      200: ArrayIBox3D;
    },
    200
  > = await api.functional.objectSimple.index(connection);
  typia.assert(output);
};
