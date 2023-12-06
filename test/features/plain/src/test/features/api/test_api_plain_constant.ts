import { TestValidator } from "@nestia/e2e";

import api from "@api";

export const test_api_plan_constant = async (
  connection: api.IConnection,
): Promise<void> => {
  for (const x of ["A", "B", "C"] as const) {
    const y = await api.functional.plain.constant(connection, x);
    TestValidator.equals("constant")(x)(y as "A");
  }

  // TestValidator.error("wrong constant")(
  //     () => api.functional.plain.constant(connection, "D" as any),
  // );
};
