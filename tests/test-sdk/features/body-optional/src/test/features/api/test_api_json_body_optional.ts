import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import api from "@api";
import { IBodyOptional } from "@api/lib/structures/IBodyOptional";

/**
 * Verifies sends omitted and present typed JSON through the client and checks
 * raw empty POST status 201.
 *
 * The authored optional JSON controller permits omission; Nest POST defaults to
 * 201.
 *
 * 1. Execute the authored feature through its prepared generated artifacts.
 * 2. Assert the distinctions described below.
 *
 * @evidence contracts/testing.md#behavioral-verification Sends omitted and present typed JSON through the client and checks raw empty POST status 201.
 * @evidence contracts/testing.md#independent-expectations The authored optional JSON controller permits omission; Nest POST defaults to 201.
 * @evidence contracts/testing.md#distinguishing-cases Omitted and populated JSON calls must succeed; raw omission is an independent transport control.
 * @evidence contracts/testing.md#execution-ownership The exported case is discovered by the feature src/test/index.ts after start.js compiles the generated consumer; compiler and host preparation make this an E2E population.
 * @evidence contracts/e2e.md#necessary-boundary Sends omitted and present typed JSON through the client and checks raw empty POST status 201. The assertion observes generated output or its connected consumer, rather than a committed repository arrangement.
 * @evidence contracts/e2e.md#shared-execution The feature runner shares generation and prepared artifacts with its sibling cases. Compatible programs are batched by start.js; distinct feature programs still incur separate consumer/host preparation, which is an unresolved suite consolidation limitation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity This case consumes the feature-specific generated artifacts and connection; local connector, application or temporary consumer cleanup is owned by its try/finally where created. Outer backend lifecycle belongs to the feature entry and exceptional startup cleanup remains a harness limitation.
 * @evidence contracts/e2e.md#preserved-coverage Omitted and populated JSON calls must succeed; raw omission is an independent transport control. Existing assertions remain at this executable owner; no branch is removed or claimed to be transferred to units.
 */
export const test_api_json_body_optional = async (
  connection: api.IConnection,
): Promise<void> => {
  await api.functional.body.optional.json(connection);
  await api.functional.body.optional.json(
    connection,
    typia.random<IBodyOptional>(),
  );

  const response: Response = await fetch(
    `${connection.host}/body/optional/json`,
    {
      method: "POST",
    },
  );
  TestValidator.equals("status", response.status, 201);
};
