import type { IPropagation } from "@nestia/fetcher";
import typia from "typia";
import type { Primitive } from "typia";

import api from "../../../../api";
import type { IAliasBase } from "../../../../api/structures/IAliasBase";

export const test_api_alias_get = async (connection: api.IConnection) => {
  const output: IPropagation<
    {
      200: Primitive<IAliasBase>;
    },
    200
  > = await api.functional.alias.get(connection);
  typia.assert(output);
};
