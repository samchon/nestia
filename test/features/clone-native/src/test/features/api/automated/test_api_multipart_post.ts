import typia from "typia";

import api from "../../../../api";

export const test_api_multipart_post = async (connection: api.IConnection) => {
  const output: void = await api.functional.multipart.post(
    connection,
    typia.random<api.functional.multipart.post.Body>(),
  );
  typia.assert(output);
};
