import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import api from "@api";
import { IRequestDto } from "@api/lib/structures/IRequestDto";

export const test_api_request = async (
  connection: api.IConnection,
): Promise<void> => {
  const input: IRequestDto = { a: "a", b: "b" };
  const output: IRequestDto = await api.functional.request(connection, input);
  TestValidator.equals("DTO", input, output);

  const surplus: IRequestDto = await api.functional.request(connection, input);
  typia.assertEquals(surplus);
};
