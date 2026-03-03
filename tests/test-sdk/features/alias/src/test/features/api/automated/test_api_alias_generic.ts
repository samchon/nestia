import type { IGeneric } from "@api/lib/structures/IGeneric";
import type { IPropagation } from "@nestia/fetcher";
import typia from "typia";
import type { Primitive } from "typia";

import api from "../../../../api";

export const test_api_alias_generic = async (connection: api.IConnection) => {
  const output: IPropagation<
    {
      200: Primitive<IGeneric>;
    },
    200
  > = await api.functional.alias.generic(connection);
  typia.assert(output);
};
