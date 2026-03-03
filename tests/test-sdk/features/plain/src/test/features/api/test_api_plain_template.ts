import { TestValidator } from "@nestia/e2e";

import api from "@api";

export const test_api_plan_template = async (
  connection: api.IConnection,
): Promise<void> => {
  const x = "something_123_interesting_abc_is_not_true_it?";
  const y: string = await api.functional.plain.template(connection, x);

  TestValidator.equals("template", x as string, y);
};
