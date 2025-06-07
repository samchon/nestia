import typia from "typia";

import api from "../../../../api";
import type { IBox3D } from "../../../../api/structures/IBox3D";

export const test_api_objectSimple_store = async (
  connection: api.IConnection,
) => {
  const output: IBox3D = await api.functional.objectSimple.store(connection, {
    body: typia.random<api.functional.objectSimple.store.Body>(),
  });
  typia.assert(output);
};
