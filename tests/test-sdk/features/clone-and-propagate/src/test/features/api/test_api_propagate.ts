import { IPropagation } from "@nestia/fetcher";
import typia from "typia";

import api from "@api";
import { IUser } from "@api/lib/structures/IUser";

/**
 * Verifies calls getUserProfile and validates its propagated 202 or 404
 * response structure.
 *
 * The authored controller and IPropagation union establish permitted status and
 * payload combinations.
 *
 * 1. Execute the authored feature through its prepared generated artifacts.
 * 2. Assert the distinctions described below.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls getUserProfile and validates its propagated 202 or 404 response structure.
 * @evidence contracts/testing.md#independent-expectations The authored controller and IPropagation union establish permitted status and payload combinations.
 * @evidence contracts/testing.md#distinguishing-cases The selected admin request owns a structurally valid propagated response; it does not force both status branches.
 * @evidence contracts/testing.md#execution-ownership The exported case is discovered by the feature src/test/index.ts after start.js compiles the generated consumer; compiler and host preparation make this an E2E population.
 * @evidence contracts/e2e.md#necessary-boundary Calls getUserProfile and validates its propagated 202 or 404 response structure. The assertion observes generated output or its connected consumer, rather than a committed repository arrangement.
 * @evidence contracts/e2e.md#shared-execution The feature runner shares generation and prepared artifacts with its sibling cases. Compatible programs are batched by start.js; distinct feature programs still incur separate consumer/host preparation, which is an unresolved suite consolidation limitation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity This case consumes the feature-specific generated artifacts and connection; local connector, application or temporary consumer cleanup is owned by its try/finally where created. Outer backend lifecycle belongs to the feature entry and exceptional startup cleanup remains a harness limitation.
 * @evidence contracts/e2e.md#preserved-coverage The selected admin request owns a structurally valid propagated response; it does not force both status branches. Existing assertions remain at this executable owner; no branch is removed or claimed to be transferred to units.
 */
export const test_api_propagate = async (
  connection: api.IConnection,
): Promise<void> => {
  const output: IPropagation<
    {
      202: IUser;
      404: "404 Not Found";
    },
    202
  > = await api.functional.users.user.getUserProfile(connection, "something", {
    user_type: "admin",
  });
  typia.assert(output);
};
