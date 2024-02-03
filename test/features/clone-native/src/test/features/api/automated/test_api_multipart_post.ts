import typia from "typia";

import api from "../../../../api";
import type { IMultipart } from "../../../../api/structures/IMultipart";

export const test_api_multipart_post = async (connection: api.IConnection) => {
  const output = await api.functional.multipart.post(
    connection,
    typia.random<IMultipart>(),
  );
  typia.assert(output);
};
