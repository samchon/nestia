import type { IPropagation } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";
import type { IBox3D } from "../../../../api/structures/IBox3D";

export const test_api_objectSimple_index = async (
  connection: api.IConnection,
) => {
  const output: IPropagation<{
    200: IBox3D[];
  }> = await api.functional.objectSimple.index(connection);
  typia.assert(output);
};
