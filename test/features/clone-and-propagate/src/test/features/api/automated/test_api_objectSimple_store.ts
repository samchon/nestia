import type { IPropagation } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";
import type { IBox3D } from "../../../../api/structures/IBox3D";

export const test_api_objectSimple_store = async (
  connection: api.IConnection,
) => {
  const output: IPropagation<
    {
      201: IBox3D;
    },
    201
  > = await api.functional.objectSimple.store(
    connection,
    typia.random<api.functional.objectSimple.store.Body>(),
  );
  typia.assert(output);
};
