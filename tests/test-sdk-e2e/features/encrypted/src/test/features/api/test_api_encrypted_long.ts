import { RandomGenerator } from "@nestia/e2e";
import typia from "typia";

import api from "@api";
import { ISeller } from "@api/lib/structures/ISeller";

/**
 * Verifies api encrypted long through its generated consumer.
 *
 * The authored handler and DTO establish the observable contract.
 *
 * 1. Exercise the retained generated consumer or document scenario.
 * 2. Reject mismatched values, exposed accessors or expected failures.
 *
 * @evidence contracts/testing.md#behavioral-verification A generated encrypted join call accepts a one-million-character company and returns an ISeller-valid response. This currently checks successful transport and shape, not exact company echo.
 * @evidence contracts/testing.md#independent-expectations ISeller.IJoin and the authored seller response declaration establish the submitted and returned shapes. Installed typia supplies the shape oracle; its random alphabet generator supplies size but does not certify randomness.
 * @evidence contracts/testing.md#distinguishing-cases The one-million-character field exercises large CBC/base64 and HTTP body handling beyond the small join sibling. This is one large accepted size, not a maximum-limit or malformed-body test.
 * @evidence contracts/testing.md#execution-ownership The feature entry discovers and awaits this exported case after actual generation and consumer compilation; mismatches reject its report and zero discovery rejects the entry.
 * @evidence contracts/e2e.md#necessary-boundary Actual encrypted request/response transport must carry the large payload; a direct AES unit cannot certify HTTP/parser/generated-client assembly.
 * @evidence contracts/e2e.md#shared-execution The suite installs fresh packed packages once and compatible configurations share native producer and emitted runtime programs. This case adds no independent install/compiler; distinct CLI/file-pattern owners retain their own connections.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Local inputs and isolated feature outputs prevent another feature supplying this result. Generated document reads are immutable, feature backends close in finally and the harness releases only owned copies after children finish.
 * @evidence contracts/e2e.md#preserved-coverage All existing requests, controls, generated-output reads and assertions remain. Sharing package/compiler preparation changes setup ownership, while the distinct accepted/rejected cases and their asserted limits are retained.
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
