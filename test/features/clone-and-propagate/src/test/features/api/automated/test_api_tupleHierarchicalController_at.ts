import type { IPropagation } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";
import type { TupleHierarchical } from "../../../../api/structures/TupleHierarchical";

export const test_api_tupleHierarchicalController_at = async (
  connection: api.IConnection,
) => {
  const output: IPropagation<{
    200: TupleHierarchical;
  }> = await api.functional.tupleHierarchicalController.at(
    connection,
    typia.random<number>(),
  );
  typia.assert(output);
};
