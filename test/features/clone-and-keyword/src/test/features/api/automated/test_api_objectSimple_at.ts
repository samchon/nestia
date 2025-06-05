import typia from "typia";

import api from "../../../../api";
import type { IBox3D } from "../../../../api/structures/IBox3D";

export const test_api_objectSimple_at = async (connection: api.IConnection) => {
  const output: IBox3D = await api.functional.objectSimple.at(connection, {
    id: typia.random<number>(),
  });
  typia.assert(output);
};
