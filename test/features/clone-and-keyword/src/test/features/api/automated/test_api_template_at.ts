import typia from "typia";

import api from "../../../../api";
import type { Template } from "../../../../api/structures/Template";

export const test_api_template_at = async (connection: api.IConnection) => {
  const output: Template = await api.functional.template.at(connection, {
    id: typia.random<number>(),
  });
  typia.assert(output);
};
