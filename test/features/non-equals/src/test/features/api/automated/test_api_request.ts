import typia from "typia";
import type { Primitive } from "typia";

import api from "../../../../api";
import type { IRequestDto } from "../../../../api/structures/IRequestDto";

export const test_api_request = async (connection: api.IConnection) => {
  const output: Primitive<IRequestDto> = await api.functional.request(
    connection,
    typia.random<IRequestDto>(),
  );
  typia.assert(output);
};
