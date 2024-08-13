import type { IPropagation } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";
import type { ArrayTemplate } from "../../../../api/structures/ArrayTemplate";

export const test_api_template_index = async (connection: api.IConnection) => {
  const output: IPropagation<
    {
      200: ArrayTemplate;
    },
    200
  > = await api.functional.template.index(connection);
  typia.assert(output);
};
