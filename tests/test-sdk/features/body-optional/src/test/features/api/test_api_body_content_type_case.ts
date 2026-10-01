import { TestValidator } from "@nestia/e2e";

import api from "@api";

/**
 * Verifies api body content type case through its actual consumer boundary.
 *
 * Authored request values and controller contracts supply observable
 * expectations.
 *
 * 1. Run each retained request or composition scenario.
 * 2. Assert its payload, status or rejection and release any owned host.
 *
 * @evidence contracts/testing.md#behavioral-verification Mixed-case JSON and text media types with charset must produce HTTP201 and exact submitted values; application/xml must produce HTTP400.
 * @evidence contracts/testing.md#independent-expectations HTTP media-type tokens are case-insensitive and charset parameters do not change the base JSON/text type. The authored typed/plain body handlers echo submitted inputs and reject XML for the JSON route.
 * @evidence contracts/testing.md#distinguishing-cases Mixed-case JSON/text positives contrast a different base type negative; optional-body siblings own absent request payloads. Exact statuses and payloads distinguish accidental acceptance from correct decoding.
 * @evidence contracts/testing.md#execution-ownership The matching exported function is discovered and awaited by its feature DynamicExecutor after real generation and compilation; every retained assertion rejection fails the feature report.
 * @evidence contracts/e2e.md#necessary-boundary This connects actual HTTP headers/body, Nest raw parser, typed/plain body decorators and response serialization. Pure string normalization cannot establish middleware forwards these requests correctly.
 * @evidence contracts/e2e.md#shared-execution Consumer packages and runtime compilation are shared with sibling feature cases and compatible cohorts. Separate preparation inside this case exists only for the explicitly described host boundary; native dispatch and Node processes are shared while each member keeps its own compiler programs and metadata scope.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity All three requests use the feature backend and generated preparation without another process/build. Inputs are local immutable values, handlers retain no request state and the feature entry finally closes the backend.
 * @evidence contracts/e2e.md#preserved-coverage All original meaningful requests and composition connections remain. Exact payload/default/path or diagnostic assertions strengthen previously shape-only, completion-only or generic-rejection checks; complementary sibling scenarios remain executable.
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
