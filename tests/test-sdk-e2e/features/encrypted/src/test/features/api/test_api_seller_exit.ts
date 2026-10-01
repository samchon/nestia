import typia from "typia";

import api from "@api";
import { ISeller } from "@api/lib/structures/ISeller";

/**
 * Verifies api seller exit through its generated consumer.
 *
 * The authored handler and DTO establish the observable contract.
 *
 * 1. Exercise the retained generated consumer or document scenario.
 * 2. Reject mismatched values, exposed accessors or expected failures.
 *
 * @evidence contracts/testing.md#behavioral-verification Generated encrypted login must return an ISeller-valid payload, then the generated bodyless exit call must resolve without rejection.
 * @evidence contracts/testing.md#independent-expectations SellerAuthenticateController declares an authorized seller response and a void DELETE handler. The installed validator supplies only the seller shape oracle; this case does not inspect authorization header assignment or the exit value.
 * @evidence contracts/testing.md#distinguishing-cases Encrypted login followed by unencrypted bodyless exit pins both generated accessors in one flow. The fixture has no persistent account store, so this does not certify account deletion or subsequent login denial.
 * @evidence contracts/testing.md#execution-ownership The feature entry discovers and awaits this exported case after actual generation and consumer compilation; mismatches reject its report and zero discovery rejects the entry.
 * @evidence contracts/e2e.md#necessary-boundary Actual generated accessors and HTTP handlers must connect across the encryption/bodyless transition; an in-process declaration check cannot prove the requests succeed.
 * @evidence contracts/e2e.md#shared-execution The suite installs fresh packed packages once and compatible configurations share native producer and emitted runtime programs. This case adds no independent install/compiler; distinct CLI/file-pattern owners retain their own connections.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Local inputs and isolated feature outputs prevent another feature supplying this result. Generated document reads are immutable, feature backends close in finally and the harness releases only owned copies after children finish.
 * @evidence contracts/e2e.md#preserved-coverage All existing requests, controls, generated-output reads and assertions remain. Sharing package/compiler preparation changes setup ownership, while the distinct accepted/rejected cases and their asserted limits are retained.
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
