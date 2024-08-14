import type { IPropagation } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";
import type { Template } from "../../../../api/structures/Template";

export const test_api_template_at = async (connection: api.IConnection) => {
  const output: IPropagation<
    {
      200: Template;
    },
    200
  > = await api.functional.template.at(connection, typia.random<number>());
  typia.assert(output);
};
