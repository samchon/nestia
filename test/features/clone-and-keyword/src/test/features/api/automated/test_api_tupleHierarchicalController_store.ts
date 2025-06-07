import typia from "typia";

import api from "../../../../api";

export const test_api_tupleHierarchicalController_store = async (
  connection: api.IConnection,
) => {
  const output: [
    boolean,
    null,
    number,
    [boolean, null, [number, [boolean, string]]],
    [number, [string, boolean, [number, number, [boolean, string]][]][]],
  ] = await api.functional.tupleHierarchicalController.store(connection, {
    body: typia.random<api.functional.tupleHierarchicalController.store.Body>(),
  });
  typia.assert(output);
};
