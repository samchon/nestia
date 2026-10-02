import { TestValidator } from "@nestia/e2e";

import api from "@api";

export const test_api_query_body_content_type_case = async (
  connection: api.IConnection,
): Promise<void> => {
  const input = new URLSearchParams({
    atomic: "atomic",
    limit: "10",
    enforce: "true",
    values: "value",
  });
  const response: Response = await fetch(`${connection.host}/query/body`, {
    method: "POST",
    headers: {
      "Content-Type": "Application/X-Www-Form-Urlencoded; Charset=UTF-8",
    },
    body: input,
  });
  TestValidator.equals("status", response.status, 201);

  const output = new URLSearchParams(await response.text());
  TestValidator.equals("atomic", output.get("atomic"), input.get("atomic"));
  TestValidator.equals("limit", output.get("limit"), input.get("limit"));
  TestValidator.equals("enforce", output.get("enforce"), input.get("enforce"));
  TestValidator.equals("values", output.get("values"), input.get("values"));
};
