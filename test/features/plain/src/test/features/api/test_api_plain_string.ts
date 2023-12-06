import { RandomGenerator, TestValidator } from "@nestia/e2e";

import api from "@api";

export const test_api_plan_string = async (
  connection: api.IConnection,
): Promise<void> => {
  const x: string = RandomGenerator.alphabets(1_000_000);
  const y: string = await api.functional.plain.string(connection, x);
  TestValidator.equals("string")(x)(y);
};
