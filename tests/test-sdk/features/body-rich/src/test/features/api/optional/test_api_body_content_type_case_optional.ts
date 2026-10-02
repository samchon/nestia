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
 * @evidence contracts/testing.md#behavioral-verification Raw fetch requests require mixed-case JSON and text media types to preserve their payloads, and application/xml to receive HTTP 400.
 * @evidence contracts/testing.md#independent-expectations HTTP media types are case-insensitive and the authored optional JSON and plain controllers accept those respective media types; the literal status and payload expectations do not use generated output.
 * @evidence contracts/testing.md#distinguishing-cases Mixed-case JSON and text requests are positive controls; an identical JSON payload with only its media type changed to application/xml must be rejected.
 * @evidence contracts/testing.md#execution-ownership The SDK integration entry discovers this matching file/export under the shared body consumer; it executes actual generated-client or HTTP requests, not a direct unit operation.
 * @evidence contracts/e2e.md#necessary-boundary The authored controller, emitted request client where used, and live HTTP adapter must agree on transport and runtime semantics. Direct generator or native rule units cannot establish this connection.
 * @evidence contracts/e2e.md#shared-execution One body-rich producer includes all six scenarios, one generated consumer holds all cases and one backend serves them; this case starts no compiler or listener.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Scenario-specific routes select their own stateless controllers. Requests use local payloads and the runner closes the shared application in finally after discovery and request execution.
 * @evidence contracts/e2e.md#preserved-coverage This case retains the assertions from body-optional/src/test/features/api/test_api_body_content_type_case.ts; only import locations, route prefix and case identity change to join the shared SDK and backend.
 */
export const test_api_body_content_type_case_optional = async (
  connection: api.IConnection,
): Promise<void> => {
  const json = {
    id: "7e630852-2db9-48e4-9de2-11f9d43871db",
    value: 3,
  };
  const jsonResponse: Response = await fetch(
    `${connection.host}/body_rich/optional/body/optional/json`,
    {
      method: "POST",
      headers: { "Content-Type": "Application/JSON; Charset=UTF-8" },
      body: JSON.stringify(json),
    },
  );
  TestValidator.equals("json status", jsonResponse.status, 201);
  TestValidator.equals("json body", await jsonResponse.json(), json);

  const invalidResponse: Response = await fetch(
    `${connection.host}/body_rich/optional/body/optional/json`,
    {
      method: "POST",
      headers: { "Content-Type": "application/xml" },
      body: JSON.stringify(json),
    },
  );
  TestValidator.equals("invalid status", invalidResponse.status, 400);

  const text = "case-insensitive media type";
  const textResponse: Response = await fetch(
    `${connection.host}/body_rich/optional/body/optional/plain`,
    {
      method: "POST",
      headers: { "Content-Type": "TEXT/PLAIN; Charset=UTF-8" },
      body: text,
    },
  );
  TestValidator.equals("text status", textResponse.status, 201);
  TestValidator.equals("text body", await textResponse.json(), text);
};
