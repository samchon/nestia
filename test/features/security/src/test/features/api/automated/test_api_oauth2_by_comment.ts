import typia from "typia";
import type { Primitive } from "typia";

import api from "../../../../api";
import type { IToken } from "../../../../api/structures/IToken";

export const test_api_oauth2_by_comment = async (
  connection: api.IConnection,
) => {
  const output: Primitive<IToken> =
    await api.functional.oauth2_by_comment(connection);
  typia.assert(output);
};
