import typia from "typia";

import api from "@api";
import { ISeller } from "@api/lib/structures/ISeller";

/**
 * Verifies api seller login through its generated consumer.
 *
 * The authored handler and DTO establish the observable contract.
 *
 * 1. Exercise the retained generated consumer or document scenario.
 * 2. Reject mismatched values, exposed accessors or expected failures.
 *
 * @evidence contracts/testing.md#behavioral-verification The generated encrypted login request with explicit credentials must return an ISeller-valid response.
 * @evidence contracts/testing.md#independent-expectations The authored login handler declares the authorized seller shape and echoes email while generating other fields; installed typia supplies the shape oracle. This case does not independently check email or assigned connection headers.
 * @evidence contracts/testing.md#distinguishing-cases Ordinary valid login complements the independent forged-ciphertext rejection case. This fixture accepts structurally valid credentials and does not model real authentication or wrong-password denial.
 * @evidence contracts/testing.md#execution-ownership The feature entry discovers and awaits this exported case after actual generation and consumer compilation; mismatches reject its report and zero discovery rejects the entry.
 * @evidence contracts/e2e.md#necessary-boundary Actual generated client and encrypted HTTP request/response handlers connect the wire contract; portable encryption or shape units alone do not certify it.
 * @evidence contracts/e2e.md#shared-execution The suite installs fresh packed packages once and compatible configurations share native producer and emitted runtime programs. This case adds no independent install/compiler; distinct CLI/file-pattern owners retain their own connections.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Local inputs and isolated feature outputs prevent another feature supplying this result. Generated document reads are immutable, feature backends close in finally and the harness releases only owned copies after children finish.
 * @evidence contracts/e2e.md#preserved-coverage All existing requests, controls, generated-output reads and assertions remain. Sharing package/compiler preparation changes setup ownership, while the distinct accepted/rejected cases and their asserted limits are retained.
 */
export async function test_api_seller_login(
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
}
