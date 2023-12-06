import { TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";

import api from "@api";

const test = api.functional.success.get;

export const test_invalid = async (connection: IConnection) => {
  const response = await test(connection);
  if (response.status === 401)
    TestValidator.equals("response")(response.data)("INVALID_PERMISSION");
  else throw Error("unexpected response");
};
