import { TestValidator } from "@nestia/e2e";

import api from "../../api";

/**
 * Verifies a string path parameter survives an SDK request unchanged.
 *
 * SDK URI encoding and router parameter extraction must preserve the same
 * decoded string.
 *
 * 1. Execute the authored fixture inputs through the owning route.
 * 2. Assert the string echo controller returns the authored text rather than
 *    merely any valid string; Unicode and slash-containing strings supply
 *    encoding boundaries.
 *
 * @evidence contracts/testing.md#behavioral-verification Generated SDK URI encoding and native path extraction echo each original plain, Korean and slash-containing string exactly.
 * @evidence contracts/testing.md#independent-expectations The authored strings define decoded outputs independently of encoder output; Unicode and slash text must survive URI transport.
 * @evidence contracts/testing.md#distinguishing-cases String, Korean text and a/b cover ordinary, Unicode and encoded-separator paths; each output equals its input.
 * @evidence contracts/testing.md#execution-ownership The matching shared consumer file/export is discovered after actual installed native production, original SDK generation and one consumer compilation; direct unit entries do not execute this transport connection.
 * @evidence contracts/e2e.md#necessary-boundary The validate:validate native TypedParam report ABI and actual SDK/HTTP or WebSocket transport must agree; a direct option test cannot prove the runtime error/callback connection.
 * @evidence contracts/e2e.md#shared-execution Installation, generation preparation, consumer compilation and upgraded Express listener are shared. Only genuinely different native request validation or response serialization options have distinct producer programs; same-option inputs reuse them.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Private route and declaration identities retain original stateless/local request semantics. RPC connections keep their original finally teardown, and the shared upgraded listener belongs to runner cleanup; no earlier outcome supplies later expected values.
 * @evidence contracts/e2e.md#preserved-coverage Entire original inputs/case/helper/import populations and option configurations remain, with only private identities and artifact/source addresses rebased. Original automatic E2E generation remains disabled; every authored request assertion stays enabled.
 */
export const test_clone_request_validate_api_param_string = async (
  connection: api.IConnection,
): Promise<void> => {
  for (const input of ["string", "\uD55C\uAE00", "a/b"])
    TestValidator.equals(
      "string echo",
      await api.functional.http_rich.options.request_validate.param.string(
        connection,
        input,
      ),
      input,
    );
};
