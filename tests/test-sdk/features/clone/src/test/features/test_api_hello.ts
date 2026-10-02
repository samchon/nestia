import typia from "typia";

import api from "@api";
import { GetHelloResponseDto } from "@api/lib/structures/GetHelloResponseDto";

/**
 * Verifies calls the cloned getHello SDK and validates GetHelloResponseDto.
 *
 * The authored response DTO supplies the structural expectation.
 *
 * 1. Execute the authored feature through its prepared generated artifacts.
 * 2. Assert the distinctions described below.
 */
export const test_api_hello = async (
  connection: api.IConnection,
): Promise<void> => {
  const hello: GetHelloResponseDto = await api.functional.getHello(connection);
  typia.assert(hello);
};
