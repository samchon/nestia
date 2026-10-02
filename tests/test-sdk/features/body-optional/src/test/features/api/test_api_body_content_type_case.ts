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
 *
 * @evidence contracts/testing.md#behavioral-verification Checks mixed-case JSON and text media types preserve payloads and application/xml is rejected with 400.
 * @evidence contracts/testing.md#independent-expectations HTTP media types are case-insensitive; the authored JSON and text endpoints accept their own media types only.
 * @evidence contracts/testing.md#distinguishing-cases Valid mixed-case JSON and TEXT/PLAIN contrast with the XML rejection while payloads remain intact.
 * @evidence contracts/testing.md#execution-ownership The exported case is discovered by the feature src/test/index.ts after start.js compiles the generated consumer; compiler and host preparation make this an E2E population.
 * @evidence contracts/e2e.md#necessary-boundary Checks mixed-case JSON and text media types preserve payloads and application/xml is rejected with 400. The assertion observes generated output or its connected consumer, rather than a committed repository arrangement.
 * @evidence contracts/e2e.md#shared-execution The feature runner shares generation and prepared artifacts with its sibling cases. Compatible programs are batched by start.js; distinct feature programs still incur separate consumer/host preparation, which is an unresolved suite consolidation limitation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity This case consumes the feature-specific generated artifacts and connection; local connector, application or temporary consumer cleanup is owned by its try/finally where created. Outer backend lifecycle belongs to the feature entry and exceptional startup cleanup remains a harness limitation.
 * @evidence contracts/e2e.md#preserved-coverage Valid mixed-case JSON and TEXT/PLAIN contrast with the XML rejection while payloads remain intact. Existing assertions remain at this executable owner; no branch is removed or claimed to be transferred to units.
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
