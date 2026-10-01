import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import api from "@api";

/**
 * Verifies a named query string is preserved.
 *
 * This exercises the query-decompose-true feature's generated transport and
 * authored handler.
 *
 * 1. Send the authored valid or malformed arguments through the generated request.
 * 2. Await completion and compare the payload or rejection with the independent
 *    contract.
 *
 * @evidence contracts/testing.md#behavioral-verification A generated individual query request must return a string equal to the authored some-value; wrong decoding or an unrelated successful response fails.
 * @evidence contracts/testing.md#independent-expectations The handwritten query handler returns its named input; the literal submitted string is the independent expectation.
 * @evidence contracts/testing.md#distinguishing-cases This owns the named scalar query positive; typed/composite/null cases own object and nullable values and invalid-query owns rejected boolean spelling.
 * @evidence contracts/testing.md#execution-ownership The feature DynamicExecutor discovers this matching exported function and awaits it against the generated SDK and its actual backend after generation; its cases belong to E2E, not portable transformer unit selection.
 * @evidence contracts/e2e.md#necessary-boundary This connects the generated query encoder, fetcher, actual Nest query decoder/validator and echo handler. Unit metadata assertions cannot prove the query string preserves these submitted fields or exposes this HTTP rejection.
 * @evidence contracts/e2e.md#shared-execution The request shares its feature SDK/backend with sibling API cases and starts no installation, compiler or server. Compatible cohorts share CLI configuration loading and runtime programs; file-input reflection still compiles per configuration in the current canonical harness.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Submitted values are fresh or immutable literals and the echo handlers retain no shared mutable request state. The feature entry allocates its port and finally closes its backend after reports, discovery errors or failed startup; each negative is awaited before proceeding.
 * @evidence contracts/e2e.md#preserved-coverage All submitted values, positive/negative distinctions and generated calls remain executable in this feature. Literal echo and exact status checks strengthen broad shape/error assertions where changed; other parameter/query forms retain their neighboring owners.
 */
export const test_api_query_individual = async (
  connection: api.IConnection,
): Promise<void> => {
  const input: string = "some-value";
  const value: string = await api.functional.query.individual(
    connection,
    "some-value",
  );
  typia.assertEquals(value);
  TestValidator.equals("individual", input, value);
};
