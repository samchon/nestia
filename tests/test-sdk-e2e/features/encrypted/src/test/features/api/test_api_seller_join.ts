import typia from "typia";

import api from "@api";
import { ISeller } from "@api/lib/structures/ISeller";

/**
 * Verifies api seller join through its generated consumer.
 *
 * The authored handler and DTO establish the observable contract.
 *
 * 1. Exercise the retained generated consumer or document scenario.
 * 2. Reject mismatched values, exposed accessors or expected failures.
 *
 * @evidence contracts/testing.md#behavioral-verification The generated encrypted join request with explicit email/name/mobile/company/password must return an ISeller-valid response.
 * @evidence contracts/testing.md#independent-expectations Authored ISeller and SellerAuthenticateController define the response shape; installed typia validates it. Literal submitted fields are not compared by this case, so successful shape alone does not certify every echoed field.
 * @evidence contracts/testing.md#distinguishing-cases This retains the ordinary small accepted join input alongside the separate million-character case and forged login negatives. It does not test password persistence because the handler generates a response without an account store.
 * @evidence contracts/testing.md#execution-ownership The feature entry discovers and awaits this exported case after actual generation and consumer compilation; mismatches reject its report and zero discovery rejects the entry.
 * @evidence contracts/e2e.md#necessary-boundary Generated SDK encryption, HTTP body decryption and response decoding must interoperate against the real backend; direct random DTO validation cannot establish this flow.
 * @evidence contracts/e2e.md#shared-execution The suite installs fresh packed packages once and compatible configurations share native producer and emitted runtime programs. This case adds no independent install/compiler; distinct CLI/file-pattern owners retain their own connections.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Local inputs and isolated feature outputs prevent another feature supplying this result. Generated document reads are immutable, feature backends close in finally and the harness releases only owned copies after children finish.
 * @evidence contracts/e2e.md#preserved-coverage All existing requests, controls, generated-output reads and assertions remain. Sharing package/compiler preparation changes setup ownership, while the distinct accepted/rejected cases and their asserted limits are retained.
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
