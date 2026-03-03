import type { IPropagation } from "@nestia/fetcher";
import typia from "typia";
import type { Format } from "typia/lib/tags/Format";

import api from "../../../../api";
import type { IBody } from "../../../../api/structures/IBody";
import type { INestiaConfig } from "../../../../api/structures/INestiaConfig";
import type { PartialIQuery } from "../../../../api/structures/PartialIQuery";

export const test_api_pnpm_config = async (connection: api.IConnection) => {
  const output: IPropagation<
    {
      201: INestiaConfig.ISwaggerConfig;
    },
    201
  > = await api.functional.pnpm.config(
    connection,
    typia.random<string & Format<"uuid">>(),
    typia.random<PartialIQuery>(),
    typia.random<IBody>(),
  );
  typia.assert(output);
};
