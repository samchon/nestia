import typia from "typia";

import api from "@api";
import { ISeller } from "@api/lib/structures/ISeller";

/**
 * Verifies logs in, validates ISeller and awaits the encrypted exit route.
 *
 * The authored login returns ISeller and exit returns void.
 *
 * 1. Execute the authored feature through its prepared generated artifacts.
 * 2. Assert the distinctions described below.
 *
 * @evidence contracts/testing.md#behavioral-verification Logs in, validates ISeller and awaits the encrypted exit route.
 * @evidence contracts/testing.md#independent-expectations The authored login returns ISeller and exit returns void.
 * @evidence contracts/testing.md#distinguishing-cases Valid login followed by exit checks the connected sequence; it does not assert persistent authentication state.
 * @evidence contracts/testing.md#execution-ownership The exported case is discovered by the feature src/test/index.ts after start.js compiles the generated consumer; compiler and host preparation make this an E2E population.
 * @evidence contracts/e2e.md#necessary-boundary Logs in, validates ISeller and awaits the encrypted exit route. The assertion observes generated output or its connected consumer, rather than a committed repository arrangement.
 * @evidence contracts/e2e.md#shared-execution The feature runner shares generation and prepared artifacts with its sibling cases. Compatible programs are batched by start.js; distinct feature programs still incur separate consumer/host preparation, which is an unresolved suite consolidation limitation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity This case consumes the feature-specific generated artifacts and connection; local connector, application or temporary consumer cleanup is owned by its try/finally where created. Outer backend lifecycle belongs to the feature entry and exceptional startup cleanup remains a harness limitation.
 * @evidence contracts/e2e.md#preserved-coverage Valid login followed by exit checks the connected sequence; it does not assert persistent authentication state. Existing assertions remain at this executable owner; no branch is removed or claimed to be transferred to units.
 */
export async function test_api_seller_exit(
  connection: api.IConnection,
): Promise<void> {
  const seller: ISeller = await api.functional.sellers.authenticate.login(
    connection,
    {
      email: "someone@someone.com",
      password: "qweqwe123!",
    },
  );
  typia.assert(seller);

  await api.functional.sellers.authenticate.exit(connection);
}
