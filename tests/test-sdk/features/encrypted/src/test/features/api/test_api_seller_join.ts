import typia from "typia";

import api from "@api";
import { ISeller } from "@api/lib/structures/ISeller";

/**
 * Verifies calls encrypted seller join and validates ISeller.
 *
 * The authored join fields and ISeller DTO supply the independent input and
 * output domains.
 *
 * 1. Execute the authored feature through its prepared generated artifacts.
 * 2. Assert the distinctions described below.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls encrypted seller join and validates ISeller.
 * @evidence contracts/testing.md#independent-expectations The authored join fields and ISeller DTO supply the independent input and output domains.
 * @evidence contracts/testing.md#distinguishing-cases This case owns an ordinary join payload; encrypted_long owns the million-character body boundary.
 * @evidence contracts/testing.md#execution-ownership The exported case is discovered by the feature src/test/index.ts after start.js compiles the generated consumer; compiler and host preparation make this an E2E population.
 * @evidence contracts/e2e.md#necessary-boundary Calls encrypted seller join and validates ISeller. The assertion observes generated output or its connected consumer, rather than a committed repository arrangement.
 * @evidence contracts/e2e.md#shared-execution The feature runner shares generation and prepared artifacts with its sibling cases. Compatible programs are batched by start.js; distinct feature programs still incur separate consumer/host preparation, which is an unresolved suite consolidation limitation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity This case consumes the feature-specific generated artifacts and connection; local connector, application or temporary consumer cleanup is owned by its try/finally where created. Outer backend lifecycle belongs to the feature entry and exceptional startup cleanup remains a harness limitation.
 * @evidence contracts/e2e.md#preserved-coverage This case owns an ordinary join payload; encrypted_long owns the million-character body boundary. Existing assertions remain at this executable owner; no branch is removed or claimed to be transferred to units.
 */
export async function test_api_seller_join(
  connection: api.IConnection,
): Promise<void> {
  const seller: ISeller = await api.functional.sellers.authenticate.join(
    connection,
    {
      email: "someone@someone.com",
      name: "Someone",
      mobile: "01012345678",
      company: "Some Company",
      password: "qweqwe123!",
    },
  );
  typia.assert(seller);
}
