import typia from "typia";

import api from "../../../../api";
import type { Template } from "../../../../api/structures/Template";

export const test_api_template_store = async (connection: api.IConnection) => {
  const output: Template = await api.functional.template.store(connection, {
    body: typia.random<api.functional.template.store.Body>(),
  });
  typia.assert(output);
};
