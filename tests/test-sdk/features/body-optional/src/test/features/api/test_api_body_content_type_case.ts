import { TestValidator } from "@nestia/e2e";

import api from "@api";

/**
 * Verifies checks mixed-case JSON and text media types preserve payloads and
 * application/xml is rejected with 400.
 *
 * HTTP media types are case-insensitive; the authored JSON and text endpoints
 * accept their own media types only.
 *
 * 1. Execute the authored feature through its prepared generated artifacts.
 * 2. Assert the distinctions described below.
 */
export const test_api_body_content_type_case = async (
  connection: api.IConnection,
): Promise<void> => {
  const json = {
    id: "7e630852-2db9-48e4-9de2-11f9d43871db",
    value: 3,
  };
  const jsonResponse: Response = await fetch(
    `${connection.host}/body/optional/json`,
    {
      method: "POST",
      headers: { "Content-Type": "Application/JSON; Charset=UTF-8" },
      body: JSON.stringify(json),
    },
  );
  TestValidator.equals("json status", jsonResponse.status, 201);
  TestValidator.equals("json body", await jsonResponse.json(), json);

  const invalidResponse: Response = await fetch(
    `${connection.host}/body/optional/json`,
    {
      method: "POST",
      headers: { "Content-Type": "application/xml" },
      body: JSON.stringify(json),
    },
  );
  TestValidator.equals("invalid status", invalidResponse.status, 400);

  const text = "case-insensitive media type";
  const textResponse: Response = await fetch(
    `${connection.host}/body/optional/plain`,
    {
      method: "POST",
      headers: { "Content-Type": "TEXT/PLAIN; Charset=UTF-8" },
      body: text,
    },
  );
  TestValidator.equals("text status", textResponse.status, 201);
  TestValidator.equals("text body", await textResponse.json(), text);
};
