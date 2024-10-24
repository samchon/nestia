import typia from "typia";
import type { Primitive } from "typia";

import api from "../../../../api";
import type { IHeaders } from "../../../../api/structures/IHeaders";

export const test_api_headers_emplace = async (connection: api.IConnection) => {
  const output: Primitive<IHeaders> = await api.functional.headers.emplace(
    {
      ...connection,
      headers: {
        ...connection.headers,
        ...typia.random<IHeaders>(),
      },
    },
    typia.random<string>(),
  );
  typia.assert(output);
};
