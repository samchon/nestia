import typia from "typia";
import type { Primitive } from "typia";

import api from "../../../../api";
import type { IToken } from "../../../../api/structures/IToken";

export const test_api_bearer = async (connection: api.IConnection) => {
  const output: Primitive<IToken> = await api.functional.bearer(connection);
  typia.assert(output);
};
