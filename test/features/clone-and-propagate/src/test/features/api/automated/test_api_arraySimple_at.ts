import type { IPropagation } from "@nestia/fetcher";
import typia from "typia";
import type { Format } from "typia/lib/tags/Format";

import api from "../../../../api";
import type { IPerson } from "../../../../api/structures/IPerson";

export const test_api_arraySimple_at = async (connection: api.IConnection) => {
  const output: IPropagation<{
    200: IPerson;
  }> = await api.functional.arraySimple.at(
    connection,
    typia.random<string & Format<"uuid">>(),
  );
  typia.assert(output);
};
