import { TestValidator } from "@nestia/e2e";

import api from "@api";

/**
 * Verifies URL-encoded bodies accept mixed-case media types with a charset
 * parameter.
 *
 * The raw HTTP header reaches decorator media-type normalization without
 * generated metadata hiding its case.
 *
 * 1. Execute the authored fixture inputs through the owning route.
 * 2. Assert application/X-Www-Form-Urlencoded; Charset=UTF-8 must return 201 and
 *    preserve every authored field in the response query text.
 */
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
