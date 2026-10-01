import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import api from "@api";
import { IBodyOptional } from "@api/lib/structures/IBodyOptional";

/**
 * Verifies api json body optional through its actual consumer boundary.
 *
 * Authored request values and controller contracts supply observable
 * expectations.
 *
 * 1. Run each retained request or composition scenario.
 * 2. Assert its payload, status or rejection and release any owned host.
 *
 * @evidence contracts/testing.md#behavioral-verification Generated absent JSON input and raw absent POST must return HTTP201/default value one in a valid UUID-bearing DTO, while supplied generated input must echo exactly.
 * @evidence contracts/testing.md#independent-expectations The authored BodyOptionalController returns its input or an independently specified default value one with UUID; the authored DTO supplies the format validator and submitted fields supply the echo oracle.
 * @evidence contracts/testing.md#distinguishing-cases Missing generated input, supplied DTO and raw POST without a body distinguish client omission from server empty-body handling. Media-type rejection belongs to content-type-case; this does not independently certify typia random generation.
 * @evidence contracts/testing.md#execution-ownership The matching exported function is discovered and awaited by its feature DynamicExecutor after real generation and compilation; every retained assertion rejection fails the feature report.
 * @evidence contracts/e2e.md#necessary-boundary This connects generated optional request encoding, actual Nest body middleware/validator/default handler and response decoding, with raw HTTP as an adjacent input path.
 * @evidence contracts/e2e.md#shared-execution Consumer packages and runtime compilation are shared with sibling feature cases and compatible cohorts. Separate preparation inside this case exists only for the explicitly described host boundary; the packed installation and Node consumer processes are shared, while public ttsc compiles each member with its own metadata scope.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Requests share the feature SDK/backend/runtime; no per-request compiler/server is started. Submitted/default values belong to this call and the feature entry finally closes its isolated backend.
 * @evidence contracts/e2e.md#preserved-coverage All original meaningful requests and composition connections remain. Exact payload/default/path or diagnostic assertions strengthen previously shape-only, completion-only or generic-rejection checks; complementary sibling scenarios remain executable.
 */
export const test_api_json_body_optional = async (
  connection: api.IConnection,
): Promise<void> => {
  const empty = typia.assert<IBodyOptional>(
    await api.functional.body.optional.json(connection),
  );
  TestValidator.equals("empty default", empty.value, 1);
  const input = typia.random<IBodyOptional>();
  TestValidator.equals(
    "filled echo",
    await api.functional.body.optional.json(connection, input),
    input,
  );

  const response: Response = await fetch(
    `${connection.host}/body/optional/json`,
    {
      method: "POST",
    },
  );
  TestValidator.equals("status", response.status, 201);
  const raw = typia.assert<IBodyOptional>(await response.json());
  TestValidator.equals("raw empty default", raw.value, 1);
};
