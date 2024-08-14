import type { IPropagation } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";
import type { IBox3D } from "../../../../api/structures/IBox3D";

export const test_api_objectSimple_at = async (connection: api.IConnection) => {
  const output: IPropagation<
    {
      200: IBox3D;
    },
    200
  > = await api.functional.objectSimple.at(connection, typia.random<number>());
  typia.assert(output);
};
