import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import api from "@api";
import { IQuery } from "@api/lib/structures/IQuery";

/**
 * Verifies composite query arguments are combined without loss.
 *
 * This exercises the query feature's generated transport and authored handler.
 *
 * 1. Send the authored valid or malformed arguments through the generated request.
 * 2. Await completion and compare the payload or rejection with the independent
 *    contract.
 *
 * @evidence contracts/testing.md#behavioral-verification The generated composite query request must return exact IQuery equal to its object fields plus the separately supplied atomic string.
 * @evidence contracts/testing.md#independent-expectations The handwritten handler combines the independent atomic argument and query object; the submitted values determine the expected object.
 * @evidence contracts/testing.md#distinguishing-cases This owns composite scalar/object assembly with a two-element array; typed/null and malformed enforce cases supply other query distinctions.
 * @evidence contracts/testing.md#execution-ownership The feature DynamicExecutor discovers this matching exported function and awaits it against the generated SDK and its actual backend after generation; its cases belong to E2E, not portable transformer unit selection.
 * @evidence contracts/e2e.md#necessary-boundary This connects the generated query encoder, fetcher, actual Nest query decoder/validator and echo handler. Unit metadata assertions cannot prove the query string preserves these submitted fields or exposes this HTTP rejection.
 * @evidence contracts/e2e.md#shared-execution The request shares its feature SDK/backend with sibling API cases and starts no installation, compiler or server. Compatible cohorts share CLI configuration loading and runtime programs; file-input reflection still compiles per configuration in the current canonical harness.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Submitted values are fresh or immutable literals and the echo handlers retain no shared mutable request state. The feature entry allocates its port and finally closes its backend after reports, discovery errors or failed startup; each negative is awaited before proceeding.
 * @evidence contracts/e2e.md#preserved-coverage All submitted values, positive/negative distinctions and generated calls remain executable in this feature. Literal echo and exact status checks strengthen broad shape/error assertions where changed; other parameter/query forms retain their neighboring owners.
 */
export const test_api_query_composite = async (
  connection: api.IConnection,
): Promise<void> => {
  const atomic: string = "atomic";
  const input: Omit<IQuery, "atomic"> = {
    limit: 10,
    enforce: true,
    values: ["value-1", "value-2"],
  };
  const result: IQuery = await api.functional.query.composite(
    connection,
    atomic,
    input,
  );
  typia.assertEquals(result);
  TestValidator.equals("composite", result, { ...input, atomic });
};
