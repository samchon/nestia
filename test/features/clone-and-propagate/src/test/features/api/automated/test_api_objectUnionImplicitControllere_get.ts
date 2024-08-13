import type { IPropagation } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";
import type { ObjectUnionImplicit } from "../../../../api/structures/ObjectUnionImplicit";

export const test_api_objectUnionImplicitControllere_get = async (
  connection: api.IConnection,
) => {
  const output: IPropagation<
    {
      200: ObjectUnionImplicit;
    },
    200
  > = await api.functional.objectUnionImplicitControllere.get(connection);
  typia.assert(output);
};
