import type { IPropagation } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";

export const test_api_tupleHierarchicalController_store = async (
  connection: api.IConnection,
) => {
  const output: IPropagation<
    {
      201: [
        boolean,
        null,
        number,
        [boolean, null, [number, [boolean, string]]],
        [number, [string, boolean, [number, number, [boolean, string]][]][]],
      ];
    },
    201
  > = await api.functional.tupleHierarchicalController.store(
    connection,
    typia.random<
      [
        boolean,
        null,
        number,
        [boolean, null, [number, [boolean, string]]],
        [number, [string, boolean, [number, number, [boolean, string]][]][]],
      ]
    >(),
  );
  typia.assert(output);
};
