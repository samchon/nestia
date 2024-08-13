import typia from "typia";

import api from "../../../../api";

export const test_api_body_store = async (connection: api.IConnection) => {
  const output: void = await api.functional.body.store(
    connection,
    typia.random<{
      title: string;
      body: string;
    }>(),
  );
  typia.assert(output);
};
