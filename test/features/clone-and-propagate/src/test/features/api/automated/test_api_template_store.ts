import type { IPropagation } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";
import type { Template } from "../../../../api/structures/Template";

export const test_api_template_store = async (connection: api.IConnection) => {
  const output: IPropagation<
    {
      201: Template;
    },
    201
  > = await api.functional.template.store(connection, typia.random<Template>());
  typia.assert(output);
};
