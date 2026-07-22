import { TestValidator } from "@nestia/e2e";

import api from "@api";

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
  TestValidator.equals("text body", await textResponse.text(), text);
};
