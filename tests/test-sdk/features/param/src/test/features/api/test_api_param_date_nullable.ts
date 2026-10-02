import { TestValidator } from "@nestia/e2e";

import api from "@api";

export const test_api_param_date_nullable = async (
  connection: api.IConnection,
): Promise<void> => {
  const date = random();
  const value = await api.functional.param.date_nullable(connection, date);
  TestValidator.equals("date", date, value!);

  TestValidator.equals(
    "null",
    await api.functional.param.date_nullable(connection, null),
    null,
  );

  await TestValidator.error("invalid", () =>
    api.functional.param.date_nullable(connection, "20140102"),
  );
};

const random = () => {
  const date: Date = new Date(Math.floor(Math.random() * Date.now() * 2));
  return [
    date.getFullYear(),
    (date.getMonth() + 1).toString().padStart(2, "0"),
    date.getDate().toString().padStart(2, "0"),
  ].join("-");
};
