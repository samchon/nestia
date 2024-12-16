import typia from "typia";

import api from "@api";

export const test_api_param_string = async (
  connection: api.IConnection,
): Promise<void> => {
  const value: string = await api.functional.param.string(connection, "string");
  typia.assert(value);
};
