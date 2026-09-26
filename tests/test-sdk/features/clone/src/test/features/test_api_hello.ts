import typia from "typia";

import api from "@api";
import { GetHelloResponseDto } from "@api/lib/structures/GetHelloResponseDto";

export const test_api_hello = async (
  connection: api.IConnection,
): Promise<void> => {
  const hello: GetHelloResponseDto = await api.functional.getHello(connection);
  typia.assert(hello);
};
