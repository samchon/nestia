import { RandomGenerator } from "@nestia/e2e";
import typia from "typia";

import api from "@api";
import { ISeller } from "@api/lib/structures/ISeller";

/**
 * Verifies sends a million-character company field through encrypted join and
 * validates ISeller.
 *
 * The authored ISeller contract permits a string company and defines the
 * expected decrypted response shape.
 *
 * 1. Execute the authored feature through its prepared generated artifacts.
 * 2. Assert the distinctions described below.
 *
 * @evidence contracts/testing.md#behavioral-verification Sends a million-character company field through encrypted join and validates ISeller.
 * @evidence contracts/testing.md#independent-expectations The authored ISeller contract permits a string company and defines the expected decrypted response shape.
 * @evidence contracts/testing.md#distinguishing-cases The long body probes encrypted payload length; ordinary encrypted join owns the small payload control.
 * @evidence contracts/testing.md#execution-ownership The exported case is discovered by the feature src/test/index.ts after start.js compiles the generated consumer; compiler and host preparation make this an E2E population.
 * @evidence contracts/e2e.md#necessary-boundary Sends a million-character company field through encrypted join and validates ISeller. The assertion observes generated output or its connected consumer, rather than a committed repository arrangement.
 * @evidence contracts/e2e.md#shared-execution The feature runner shares generation and prepared artifacts with its sibling cases. Compatible programs are batched by start.js; distinct feature programs still incur separate consumer/host preparation, which is an unresolved suite consolidation limitation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity This case consumes the feature-specific generated artifacts and connection; local connector, application or temporary consumer cleanup is owned by its try/finally where created. Outer backend lifecycle belongs to the feature entry and exceptional startup cleanup remains a harness limitation.
 * @evidence contracts/e2e.md#preserved-coverage The long body probes encrypted payload length; ordinary encrypted join owns the small payload control. Existing assertions remain at this executable owner; no branch is removed or claimed to be transferred to units.
 */
export const test_api_encrypted_long = async (
  connection: api.IConnection,
): Promise<void> => {
  const seller: ISeller = await api.functional.sellers.authenticate.join(
    connection,
    {
      email: "someone@someone.com",
      name: "Someone",
      mobile: "01012345678",
      company: RandomGenerator.alphabets(1_000_000),
      password: "qweqwe123!",
    },
  );
  typia.assert(seller);
};
