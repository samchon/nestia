import type { INestiaConfig } from "@nestia/sdk";
import type { Primitive, tags } from "typia";
import typia from "typia";

import api from "../../../../api";
import type { INothing } from "../../../../api/structures/INothing";
import type { ISomething } from "../../../../api/structures/ISomething";

export const test_api_pnpm_config = async (connection: api.IConnection) => {
  const output: Primitive<INestiaConfig.ISwaggerConfig> =
    await api.functional.pnpm.config(
      connection,
      typia.random<string & tags.Format<"uuid">>(),
      typia.random<Partial<INothing.IQuery>>(),
      typia.random<ISomething.IBody>(),
    );
  typia.assert(output);
};
