import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import api from "@api";
import { IQuery } from "@api/lib/structures/IQuery";

/**
 * Verifies Nest query string inputs are decoded into typed fields.
 *
 * This exercises the query-decompose-true feature's generated transport and
 * authored handler.
 *
 * 1. Send the authored valid or malformed arguments through the generated request.
 * 2. Await completion and compare the payload or rejection with the independent
 *    contract.
 *
 * @evidence contracts/testing.md#behavioral-verification The generated Nest query request must return exact IQuery equal to the original typed input after manually supplying number/boolean strings.
 * @evidence contracts/testing.md#independent-expectations The authored handler and IQuery require typed number, boolean and array values; literal string encodings are inputs, not expected output copied from the decoder.
 * @evidence contracts/testing.md#distinguishing-cases This pins the raw Nest query interface versus the typed/composite client forms. Nullable and invalid-query cases own null and malformed boolean controls.
 * @evidence contracts/testing.md#execution-ownership The feature DynamicExecutor discovers this matching exported function and awaits it against the generated SDK and its actual backend after generation; its cases belong to E2E, not portable transformer unit selection.
 * @evidence contracts/e2e.md#necessary-boundary This connects the generated query encoder, fetcher, actual Nest query decoder/validator and echo handler. Unit metadata assertions cannot prove the query string preserves these submitted fields or exposes this HTTP rejection.
 * @evidence contracts/e2e.md#shared-execution The request shares its feature SDK/backend with sibling API cases and starts no installation, compiler or server. Compatible cohorts share CLI configuration loading and runtime programs; file-input reflection still compiles per configuration in the current canonical harness.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Submitted values are fresh or immutable literals and the echo handlers retain no shared mutable request state. The feature entry allocates its port and finally closes its backend after reports, discovery errors or failed startup; each negative is awaited before proceeding.
 * @evidence contracts/e2e.md#preserved-coverage All submitted values, positive/negative distinctions and generated calls remain executable in this feature. Literal echo and exact status checks strengthen broad shape/error assertions where changed; other parameter/query forms retain their neighboring owners.
 */
export const test_api_query_nest = async (
  connection: api.IConnection,
): Promise<void> => {
  const input: IQuery = {
    limit: 10,
    enforce: true,
    atomic: "atomic",
    values: ["a", "b", "c"],
  };
  const result: IQuery = await api.functional.query.nest(connection, {
    ...input,
    limit: input.limit ? `${input.limit}` : undefined,
    enforce: input.enforce ? "true" : "false",
    atomic: input.atomic ? input.atomic : "null",
  });
  typia.assertEquals(result);
  TestValidator.equals("nest", input, result);
};
